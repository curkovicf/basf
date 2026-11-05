import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaService } from '@pf/server-nodejs-api-shared-infrastructure';
import {
  ICatalogImportStore,
  ICatalogImportUnitOfWork,
  ImportAbortedError,
  ImportRunRecord,
  NormalizedProduct,
  UpsertCounts,
} from '@pf/server-nodejs-api-features-catalog-import-domain';

const BATCH_SIZE = 1000;
/** Arbitrary but fixed key: only one import may run at a time. */
const IMPORT_LOCK_KEY = 727001;
const TRANSACTION = { timeout: 5 * 60 * 1000, maxWait: 10 * 1000 };

@Injectable()
export class PrismaCatalogImportStore implements ICatalogImportStore {
  private readonly logger = new Logger(PrismaCatalogImportStore.name);

  constructor(private readonly prisma: PrismaService) {}

  runExclusively<T>(work: (uow: ICatalogImportUnitOfWork) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const [{ locked }] = await tx.$queryRaw<{ locked: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(${IMPORT_LOCK_KEY}::bigint) AS locked`;
      if (!locked) throw new ImportAbortedError('another import is already running');
      return work(new PrismaImportUnitOfWork(tx));
    }, TRANSACTION);
  }

  async recordRun(run: ImportRunRecord): Promise<void> {
    try {
      await createImportRun(this.prisma, run);
    } catch (error) {
      this.logger.error(`Could not record the failed import: ${String(error)}`);
    }
  }
}

function createImportRun(client: Prisma.TransactionClient, run: ImportRunRecord) {
  return client.importRun.create({
    data: {
      source: run.source,
      status: run.status,
      startedAt: run.startedAt,
      summary: run.summary as Prisma.InputJsonValue,
      issues: run.issues as unknown as Prisma.InputJsonValue,
    },
  });
}

class PrismaImportUnitOfWork implements ICatalogImportUnitOfWork {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  countListed(): Promise<number> {
    return this.tx.product.count({ where: { delistedAt: null } });
  }

  async upsertProducts(products: NormalizedProduct[]): Promise<UpsertCounts> {
    const totals: UpsertCounts = { inserted: 0, updated: 0, relisted: 0 };
    for (let start = 0; start < products.length; start += BATCH_SIZE) {
      const batch = products.slice(start, start + BATCH_SIZE);
      const [counts] = await this.tx.$queryRaw<UpsertCounts[]>`
        WITH incoming AS (
          SELECT * FROM jsonb_to_recordset(${JSON.stringify(batch)}::jsonb) AS x(
            sku text, name text, "chemicalName" text, function text, "applicationArea" text,
            region text, certifications text[], status text, "launchYear" int,
            description text, "searchText" text
          )
        ),
        previously_delisted AS (
          SELECT sku FROM products
          WHERE delisted_at IS NOT NULL AND sku IN (SELECT sku FROM incoming)
        ),
        written AS (
          INSERT INTO products AS p (
            sku, name, chemical_name, function, application_area, region,
            certifications, status, launch_year, description, search_text
          )
          SELECT sku, name, "chemicalName", function, "applicationArea", region,
                 certifications, status::"ProductStatus", "launchYear", description, "searchText"
          FROM incoming
          ON CONFLICT (sku) DO UPDATE SET
            name = EXCLUDED.name,
            chemical_name = EXCLUDED.chemical_name,
            function = EXCLUDED.function,
            application_area = EXCLUDED.application_area,
            region = EXCLUDED.region,
            certifications = EXCLUDED.certifications,
            status = EXCLUDED.status,
            launch_year = EXCLUDED.launch_year,
            description = EXCLUDED.description,
            search_text = EXCLUDED.search_text,
            delisted_at = NULL,
            updated_at = now()
          WHERE (p.name, p.chemical_name, p.function, p.application_area, p.region,
                 p.certifications, p.status, p.launch_year, p.description, p.search_text,
                 p.delisted_at)
            IS DISTINCT FROM
                (EXCLUDED.name, EXCLUDED.chemical_name, EXCLUDED.function,
                 EXCLUDED.application_area, EXCLUDED.region, EXCLUDED.certifications,
                 EXCLUDED.status, EXCLUDED.launch_year, EXCLUDED.description,
                 EXCLUDED.search_text, NULL::timestamp)
          RETURNING (xmax = 0) AS was_insert
        )
        SELECT
          count(*) FILTER (WHERE was_insert)::int AS inserted,
          count(*) FILTER (WHERE NOT was_insert)::int AS updated,
          (SELECT count(*)::int FROM previously_delisted) AS relisted
        FROM written`;
      totals.inserted += counts.inserted;
      totals.updated += counts.updated;
      totals.relisted += counts.relisted;
    }
    return totals;
  }

  delistMissing(presentSkus: string[]): Promise<number> {
    return this.tx.$executeRaw`
      UPDATE products SET delisted_at = now(), updated_at = now()
      WHERE delisted_at IS NULL AND NOT (sku = ANY(${presentSkus}::text[]))`;
  }

  async recordRun(run: ImportRunRecord): Promise<void> {
    await createImportRun(this.tx, run);
  }
}
