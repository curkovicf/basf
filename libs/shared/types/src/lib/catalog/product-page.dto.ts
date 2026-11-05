import type { ProductDto } from './product.dto';
import type { ProductSort } from './product-sort';
import type { ProductStatus } from './product-status';

export interface FacetValueDto {
  value: string;
  count: number;
}

/** Each facet lists the values the user could switch to, with the count of matches each would give. */
export interface ProductFacetsDto {
  function: FacetValueDto[];
  applicationArea: FacetValueDto[];
  region: FacetValueDto[];
  certification: FacetValueDto[];
  status: FacetValueDto[];
}

/** Query parameters of `GET /api/products`. Every array may also be sent as a single value. */
export interface ProductSearchRequest {
  q?: string;
  function?: string[];
  applicationArea?: string[];
  region?: string[];
  certification?: string[];
  /** Omitted means "what can be bought": active and phase-out products. */
  status?: ProductStatus[];
  /** Omitted means relevance when searching and name otherwise. */
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface ProductPageDto {
  items: ProductDto[];
  total: number;
  page: number;
  pageSize: number;
  /** The ordering actually applied, after defaults. */
  sort: ProductSort;
  facets: ProductFacetsDto;
}
