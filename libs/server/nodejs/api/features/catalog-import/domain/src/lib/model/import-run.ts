import type { ImportIssue } from './plan-import';

export interface ImportSummary {
  rowsRead: number;
  inserted: number;
  updated: number;
  unchanged: number;
  delisted: number;
  relisted: number;
  rejected: number;
  warnings: number;
}

export interface ImportResult {
  summary: ImportSummary;
  issues: ImportIssue[];
}

export interface ImportOptions {
  /** Where the export came from, for the audit trail. */
  source: string;
  /** Skips the shrink guard, for when the catalogue really did shrink. */
  force?: boolean;
}

/** One row of the audit trail. A failed run records why under `issues`. */
export interface ImportRunRecord {
  source: string;
  status: 'SUCCEEDED' | 'FAILED';
  startedAt: Date;
  summary: ImportSummary | Record<string, never>;
  issues: ImportIssue[] | { message: string }[];
}

/** The run was refused before anything was written. */
export class ImportAbortedError extends Error {}

/** An export smaller than this share of the live catalogue is treated as broken. */
export const MIN_EXPORT_RATIO = 0.5;

/**
 * A wrong header, a cut-off row or an empty file abort the run before this. This is
 * the last guard: an export that would remove most of the catalogue is almost always
 * a truncated file, so it is refused unless the caller insists.
 */
export function assertExportLooksComplete(
  incoming: number,
  listed: number,
  options: Pick<ImportOptions, 'force'>,
): void {
  if (incoming === 0) {
    throw new ImportAbortedError('the export contains no valid products');
  }
  if (options.force) return;
  if (incoming < listed * MIN_EXPORT_RATIO) {
    throw new ImportAbortedError(
      `the export has ${incoming} products but ${listed} are listed; ` +
        'this looks like a truncated file. Re-run with --force if it is intentional.',
    );
  }
}
