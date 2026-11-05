import type { FacetValue } from '../model/facets';
import type { Product } from '../model/product';
import type { ProductSearchCriteria } from '../model/product-search';

/** Per-column match counts, before the domain's facet rules (region expansion, kept selections) apply. */
export interface ProductFacetCounts {
  function: FacetValue[];
  applicationArea: FacetValue[];
  region: FacetValue[];
  certification: FacetValue[];
  /** Counted by effective status: delisted products count as DISCONTINUED. */
  status: FacetValue[];
}

/** Reads `products`. Searching, filtering and sorting happen in the store, never in memory. */
export interface IProductRepository {
  /** One page of matches, in the criteria's order. */
  search(criteria: ProductSearchCriteria): Promise<Product[]>;
  count(criteria: ProductSearchCriteria): Promise<number>;
  /**
   * Counts for each filter group computed without that group's own selection, so the
   * facet shows what the user could switch to. Certifications are the exception: they
   * narrow (AND), so their counts reflect the current selection.
   */
  facetCounts(criteria: ProductSearchCriteria): Promise<ProductFacetCounts>;
  /** Every region in the catalogue, listed or not. */
  regions(): Promise<string[]>;
  /** Case-insensitive on the SKU, so hand-typed links work. Delisted products are found too. */
  findBySku(sku: string): Promise<Product | null>;
}
