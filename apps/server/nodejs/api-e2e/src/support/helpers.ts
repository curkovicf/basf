import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { CatalogImportService } from '@pf/server-nodejs-api-features-catalog-import-application';
import { PrismaCatalogImportStore } from '@pf/server-nodejs-api-features-catalog-import-infrastructure';
import { PrismaClient, PrismaService } from '@pf/server-nodejs-api-shared-infrastructure';

const HEADER =
  'sku,name,chemical_name,function,application_area,region,certifications,status,launch_year,description';

export interface RowOverrides {
  sku: string;
  name?: string;
  chemical?: string;
  fn?: string;
  area?: string;
  region?: string;
  certs?: string;
  status?: string;
  year?: string;
  description?: string;
}

export function csv(...rows: RowOverrides[]): string {
  const lines = rows.map((r) =>
    [
      r.sku,
      r.name ?? `Name ${r.sku}`,
      r.chemical ?? 'Lecithin',
      r.fn ?? 'Emulsifier',
      r.area ?? 'Personal Care',
      r.region ?? 'EMEA',
      r.certs ?? '',
      r.status ?? 'Active',
      r.year ?? '2020',
      r.description ?? 'A description.',
    ].join(','),
  );
  return [HEADER, ...lines].join('\n') + '\n';
}

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRaw`TRUNCATE reviews, products, import_runs RESTART IDENTITY`;
}

/** The real import use case on the real store, without booting the CLI. */
export function importer(prisma: PrismaClient): CatalogImportService {
  return new CatalogImportService(new PrismaCatalogImportStore(prisma as PrismaService));
}

/**
 * Boots the real app through the same shell and configuration as main.ts. The shell is
 * imported here, not at the top: `ApiSharedInfrastructureModule.forRoot()` reads the
 * environment when the module is evaluated, and a test may set variables first.
 */
export async function createTestApp(): Promise<NestExpressApplication> {
  const { ServerShellModule, configureApp } = await import('@pf/server-nodejs-api-shell');
  const moduleRef = await Test.createTestingModule({ imports: [ServerShellModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app);
  await app.init();
  return app;
}
