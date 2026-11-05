/** How fresh the catalogue is. Written by the import, read by customers and monitoring. */
export interface ICatalogStatusRepository {
  /** End of the last successful import, or null before the first one. */
  lastImportAt(): Promise<Date | null>;
}
