export class CatalogImportDI {
  /** Writes `products` and `import_runs` under the import lock. */
  public static readonly CatalogImportStore: unique symbol = Symbol('CatalogImportStore');
}
