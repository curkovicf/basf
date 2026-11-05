import {
  ICatalogImportStore,
  ICatalogImportUnitOfWork,
  ImportAbortedError,
  ImportRunRecord,
  NormalizedProduct,
} from '@pf/server-nodejs-api-features-catalog-import-domain';
import { CatalogImportService } from './catalog-import.service';

const HEADER =
  'sku,name,chemical_name,function,application_area,region,certifications,status,launch_year,description';
const row = (sku: string, status = 'Active') =>
  `${sku},Name ${sku},Lecithin,Emulsifier,Personal Care,EMEA,,${status},2020,A description.`;
const csv = (...skus: string[]) => [HEADER, ...skus.map((sku) => row(sku))].join('\n') + '\n';

/** An in-memory store that remembers what the use case asked it to write. */
const build = (listed: number) => {
  const upserted: NormalizedProduct[][] = [];
  const delistCalls: string[][] = [];
  const runs: ImportRunRecord[] = [];
  const uow: ICatalogImportUnitOfWork = {
    countListed: async () => listed,
    upsertProducts: async (products) => {
      upserted.push(products);
      return { inserted: products.length, updated: 0, relisted: 0 };
    },
    delistMissing: async (present) => {
      delistCalls.push(present);
      return Math.max(0, listed - present.length);
    },
    recordRun: async (run) => {
      runs.push(run);
    },
  };
  const store: ICatalogImportStore = {
    runExclusively: (work) => work(uow),
    recordRun: async (run) => {
      runs.push(run);
    },
  };
  return { service: new CatalogImportService(store), upserted, delistCalls, runs };
};

describe('CatalogImportService', () => {
  it('writes the plan, delists what is missing and records a successful run', async () => {
    const { service, upserted, delistCalls, runs } = build(3);

    const { summary } = await service.import(csv('P-1', 'P-2'), { source: 'test' });

    expect(upserted[0].map((p) => p.sku)).toEqual(['P-1', 'P-2']);
    expect(delistCalls).toEqual([['P-1', 'P-2']]);
    expect(summary).toMatchObject({ rowsRead: 2, inserted: 2, unchanged: 0, delisted: 1 });
    expect(runs).toEqual([expect.objectContaining({ status: 'SUCCEEDED', summary })]);
  });

  it('keeps a rejected row’s SKU listed, since the PIM still has it', async () => {
    const { service, delistCalls } = build(2);
    const content = [HEADER, row('P-1'), row('P-2', 'Banana')].join('\n');

    const { summary } = await service.import(content, { source: 'test' });

    expect(summary).toMatchObject({ rejected: 1, delisted: 0 });
    expect(delistCalls[0]).toEqual(['P-1', 'P-2']);
  });

  it('refuses a truncated export, writes nothing, and records the failure', async () => {
    const { service, upserted, runs } = build(10);

    await expect(service.import(csv('P-1'), { source: 'test' })).rejects.toThrow(
      ImportAbortedError,
    );

    expect(upserted).toEqual([]);
    expect(runs).toEqual([
      expect.objectContaining({
        status: 'FAILED',
        issues: [{ message: expect.stringContaining('truncated') }],
      }),
    ]);
  });

  it('accepts a real reduction with force', async () => {
    const { service } = build(10);

    const { summary } = await service.import(csv('P-1'), { source: 'test', force: true });

    expect(summary.delisted).toBe(9);
  });

  it('records a structurally broken file as a failed run', async () => {
    const { service, runs } = build(0);

    await expect(service.import('foo,bar\n1,2\n', { source: 'test' })).rejects.toThrow(
      /missing columns/,
    );
    expect(runs[0]).toMatchObject({ status: 'FAILED' });
  });
});
