import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { Injectable } from '@nestjs/common';
import { CatalogImportService } from '@pf/server-nodejs-api-features-catalog-import-application';

const DEFAULT_EXPORT = 'data/products.csv';

/**
 * The import's inbound boundary: the command line is to this one-shot process what
 * HTTP is to the API. It decodes arguments, reads the file and reports; everything an
 * import means lives in {@link CatalogImportService}.
 *
 * Usage: catalog-import [path/to/products.csv] [--force]
 */
@Injectable()
export class CatalogImportCli {
  constructor(private readonly importer: CatalogImportService) {}

  /** Resolves to the process exit code. */
  async run(argv: string[]): Promise<number> {
    const { values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: { force: { type: 'boolean', default: false } },
    });
    const path = resolve(positionals[0] ?? DEFAULT_EXPORT);

    try {
      const csv = await readFile(path, 'utf8');
      const { summary, issues } = await this.importer.import(csv, {
        source: path,
        force: values.force,
      });
      for (const issue of issues) {
        console.warn(
          `line ${issue.line} ${issue.sku ?? '(no sku)'}: ${issue.severity}: ${issue.message}`,
        );
      }
      console.log('Import finished', summary);
      return 0;
    } catch (error) {
      console.error('Import failed:', error instanceof Error ? error.message : error);
      return 1;
    }
  }
}
