/** How fresh the catalogue is: the end of the last successful import, as an ISO timestamp. */
export interface CatalogStatusDto {
  lastImportAt: string | null;
}
