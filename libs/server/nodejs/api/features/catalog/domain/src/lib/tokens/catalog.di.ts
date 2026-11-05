export class CatalogDI {
  /** Reads `products`. */
  public static readonly ProductRepository: unique symbol = Symbol('ProductRepository');
  /** Reads `import_runs` for the catalogue's freshness. */
  public static readonly CatalogStatusRepository: unique symbol = Symbol('CatalogStatusRepository');
}
