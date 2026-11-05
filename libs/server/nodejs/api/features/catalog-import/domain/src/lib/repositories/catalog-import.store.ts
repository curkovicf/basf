import type { ImportRunRecord } from '../model/import-run';
import type { NormalizedProduct } from '../model/normalize-row';

export interface UpsertCounts {
  inserted: number;
  updated: number;
  relisted: number;
}

/** The writes of one import, all inside the same transaction. */
export interface ICatalogImportUnitOfWork {
  /** Products currently for sale, for the shrink guard. */
  countListed(): Promise<number>;
  /**
   * Upserts by SKU and only ever writes PIM-owned columns, which is what keeps reviews
   * and rating totals intact. A row whose data did not change is not touched.
   */
  upsertProducts(products: NormalizedProduct[]): Promise<UpsertCounts>;
  /** Marks listed products absent from `presentSkus` as delisted; returns how many. */
  delistMissing(presentSkus: string[]): Promise<number>;
  recordRun(run: ImportRunRecord): Promise<void>;
}

export interface ICatalogImportStore {
  /**
   * Runs `work` in one transaction that holds the import lock, so customers see either
   * the old catalogue or the new one. Throws ImportAbortedError if another import is running.
   */
  runExclusively<T>(work: (uow: ICatalogImportUnitOfWork) => Promise<T>): Promise<T>;
  /**
   * Writes outside any transaction, so that a failed run leaves a trace. Must not throw:
   * if the database itself is the problem, the caller needs the original error.
   */
  recordRun(run: ImportRunRecord): Promise<void>;
}
