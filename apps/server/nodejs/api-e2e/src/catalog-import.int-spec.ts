import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ImportAbortedError } from '@pf/server-nodejs-api-features-catalog-import-domain';

import { PrismaClient, createPrismaClient } from '@pf/server-nodejs-api-shared-infrastructure';
import { csv, importer, resetDatabase } from './support/helpers';

describe('catalog import', () => {
  let prisma: PrismaClient;
  const run = (content: string, force = false) =>
    importer(prisma).import(content, { source: 'test', force });

  beforeAll(() => {
    prisma = createPrismaClient();
  });
  beforeEach(() => resetDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  describe('with the real PIM export', () => {
    const realExport = readFileSync(resolve('data/products.csv'), 'utf8');

    it('loads an empty database and cleans the known data problems', async () => {
      const { summary } = await run(realExport);

      // 202 rows, minus 2 duplicate SKUs, minus 1 row without a name.
      expect(summary).toMatchObject({ rowsRead: 202, inserted: 199, rejected: 1 });
      expect(await prisma.product.count()).toBe(199);

      const bySku = (sku: string) => prisma.product.findUniqueOrThrow({ where: { sku } });
      expect((await bySku('P-10008')).status).toBe('ACTIVE'); // "active"
      expect((await bySku('P-10042')).status).toBe('PHASE_OUT'); // "Phase out"
      expect((await bySku('P-10016')).region).toBe('EMEA'); // " EMEA "
      expect((await bySku('P-10059')).name).toBe('Puraxin SF 120'); // "  Puraxin SF 120 "
      expect((await bySku('P-10105')).launchYear).toBeNull(); // "n/a"
      expect((await bySku('P-10151')).status).toBe('DISCONTINUED'); // conflicting duplicate
      expect(await prisma.product.findUnique({ where: { sku: 'P-10119' } })).toBeNull();
    });

    it('changes nothing when run a second time', async () => {
      await run(realExport);
      const before = await prisma.product.findMany({ orderBy: { sku: 'asc' } });

      const { summary } = await run(realExport);

      expect(summary).toMatchObject({ inserted: 0, updated: 0, unchanged: 199, delisted: 0 });
      expect(await prisma.product.findMany({ orderBy: { sku: 'asc' } })).toEqual(before);
    });
  });

  it('keeps reviews and rating totals when a product is updated', async () => {
    await run(csv({ sku: 'P-1', name: 'Old name' }));
    const product = await prisma.product.findUniqueOrThrow({ where: { sku: 'P-1' } });
    await prisma.review.create({
      data: { productId: product.id, authorName: 'Ana', rating: 4, comment: 'Works well for us.' },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { ratingCount: 1, ratingSum: 4, ratingAvg: 4 },
    });

    const { summary } = await run(csv({ sku: 'P-1', name: 'New name' }));

    expect(summary).toMatchObject({ updated: 1 });
    const after = await prisma.product.findUniqueOrThrow({ where: { sku: 'P-1' } });
    expect(after).toMatchObject({ id: product.id, name: 'New name', ratingCount: 1, ratingAvg: 4 });
    expect(await prisma.review.count({ where: { productId: product.id } })).toBe(1);
  });

  it('delists products missing from the export, keeps them, and relists them on return', async () => {
    await run(csv({ sku: 'P-1' }, { sku: 'P-2' }));

    const removed = await run(csv({ sku: 'P-1' }));
    expect(removed.summary.delisted).toBe(1);
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { sku: 'P-2' } })).delistedAt,
    ).toBeInstanceOf(Date);

    const back = await run(csv({ sku: 'P-1' }, { sku: 'P-2' }));
    expect(back.summary).toMatchObject({ relisted: 1, delisted: 0 });
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { sku: 'P-2' } })).delistedAt,
    ).toBeNull();
  });

  it('does not delist a product just because its row was unreadable tonight', async () => {
    await run(csv({ sku: 'P-1' }, { sku: 'P-2', name: 'Good name' }));

    const { summary } = await run(csv({ sku: 'P-1' }, { sku: 'P-2', status: 'Banana' }));

    expect(summary).toMatchObject({ rejected: 1, delisted: 0 });
    expect(await prisma.product.findUniqueOrThrow({ where: { sku: 'P-2' } })).toMatchObject({
      name: 'Good name',
      delistedAt: null,
    });
  });

  describe('protection against broken exports', () => {
    const fourProducts = csv({ sku: 'P-1' }, { sku: 'P-2' }, { sku: 'P-3' }, { sku: 'P-4' });

    it('refuses an export that would wipe out most of the catalogue, and records why', async () => {
      await run(fourProducts);

      await expect(run(csv({ sku: 'P-1' }))).rejects.toThrow(ImportAbortedError);

      expect(await prisma.product.count({ where: { delistedAt: null } })).toBe(4);
      const last = await prisma.importRun.findFirstOrThrow({ orderBy: { id: 'desc' } });
      expect(last.status).toBe('FAILED');
    });

    it('allows a real catalogue reduction with force', async () => {
      await run(fourProducts);
      const { summary } = await run(csv({ sku: 'P-1' }), true);
      expect(summary.delisted).toBe(3);
    });

    it.each([
      ['a header-only file', csv()],
      ['an empty file', ''],
      ['a file with wrong columns', 'foo,bar\n1,2\n'],
      ['a file cut off mid-row', fourProducts + 'P-5,Half a ro'],
    ])('leaves the catalogue untouched for %s', async (_label, content) => {
      await run(fourProducts);
      const before = await prisma.product.findMany({ orderBy: { sku: 'asc' } });

      await expect(run(content)).rejects.toThrow();

      expect(await prisma.product.findMany({ orderBy: { sku: 'asc' } })).toEqual(before);
    });
  });
});
