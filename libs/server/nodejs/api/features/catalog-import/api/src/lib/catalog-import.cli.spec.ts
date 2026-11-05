import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CatalogImportService } from '@pf/server-nodejs-api-features-catalog-import-application';
import { CatalogImportCli } from './catalog-import.cli';

const summary = {
  rowsRead: 1,
  inserted: 1,
  updated: 0,
  unchanged: 0,
  delisted: 0,
  relisted: 0,
  rejected: 0,
  warnings: 0,
};

describe('CatalogImportCli', () => {
  let calls: { csv: string; options: { source: string; force?: boolean } }[];
  let cli: CatalogImportCli;
  let dir: string;

  beforeEach(async () => {
    calls = [];
    const importer = {
      import: async (csv: string, options: { source: string; force?: boolean }) => {
        calls.push({ csv, options });
        return { summary, issues: [] };
      },
    } as unknown as CatalogImportService;
    cli = new CatalogImportCli(importer);
    dir = await mkdtemp(join(tmpdir(), 'catalog-import-'));
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('reads the given file and passes --force through', async () => {
    const file = join(dir, 'export.csv');
    await writeFile(file, 'sku\nP-1\n');

    const code = await cli.run([file, '--force']);

    expect(code).toBe(0);
    expect(calls).toEqual([{ csv: 'sku\nP-1\n', options: { source: file, force: true } }]);
  });

  it('exits non-zero when the file cannot be read, without importing', async () => {
    const code = await cli.run([join(dir, 'missing.csv')]);

    expect(code).toBe(1);
    expect(calls).toEqual([]);
  });
});
