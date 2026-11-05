import { Inject, Injectable } from '@nestjs/common';
import {
  CatalogImportDI,
  ICatalogImportStore,
  ImportIssue,
  ImportOptions,
  ImportResult,
  ImportSummary,
  assertExportLooksComplete,
  planImport,
} from '@pf/server-nodejs-api-features-catalog-import-domain';
import { parseExport } from './parse-export';

const MAX_STORED_ISSUES = 500;

/**
 * The nightly import, as one use case: parse, plan, guard, write, record. The whole
 * run is one transaction, so customers see either the old catalogue or the new one,
 * and a failure is recorded outside it so that it leaves a trace.
 */
@Injectable()
export class CatalogImportService {
  constructor(
    @Inject(CatalogImportDI.CatalogImportStore) private readonly store: ICatalogImportStore,
  ) {}

  async import(csv: string, options: ImportOptions): Promise<ImportResult> {
    const startedAt = new Date();
    try {
      const plan = planImport(parseExport(csv));
      const summary = await this.store.runExclusively(async (uow) => {
        const listed = await uow.countListed();
        // Rejected SKUs are still in the PIM; we just could not read their row tonight.
        const incoming = plan.products.length + plan.rejectedSkus.length;
        assertExportLooksComplete(incoming, listed, options);

        const written = await uow.upsertProducts(plan.products);
        const delisted = await uow.delistMissing([
          ...plan.products.map((product) => product.sku),
          ...plan.rejectedSkus,
        ]);
        const result: ImportSummary = {
          rowsRead: plan.rowsRead,
          ...written,
          unchanged: plan.products.length - written.inserted - written.updated,
          delisted,
          ...countIssues(plan.issues),
        };
        await uow.recordRun({
          source: options.source,
          status: 'SUCCEEDED',
          startedAt,
          summary: result,
          issues: plan.issues.slice(0, MAX_STORED_ISSUES),
        });
        return result;
      });
      return { summary, issues: plan.issues };
    } catch (error) {
      await this.store.recordRun({
        source: options.source,
        status: 'FAILED',
        startedAt,
        summary: {},
        issues: [{ message: error instanceof Error ? error.message : String(error) }],
      });
      throw error;
    }
  }
}

function countIssues(issues: ImportIssue[]): Pick<ImportSummary, 'rejected' | 'warnings'> {
  return {
    rejected: issues.filter((issue) => issue.severity === 'rejected').length,
    warnings: issues.filter((issue) => issue.severity === 'warning').length,
  };
}
