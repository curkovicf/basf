import { ParamMap, Params } from '@angular/router';
import { CATALOG_LIMITS, PRODUCT_SORTS, PRODUCT_STATUSES, ProductSort } from '@pf/shared-types';

/** Query parameters as the API accepts them. */
export type CatalogApiParams = Record<string, string | number | string[]>;

/** The whole search state. It lives in the URL, which is what makes any view shareable. */
export interface CatalogQuery {
  q: string;
  function: string[];
  applicationArea: string[];
  region: string[];
  certification: string[];
  status: string[];
  sort: CatalogSort | null;
  page: number;
}

export const FILTER_GROUPS = [
  'function',
  'applicationArea',
  'region',
  'certification',
  'status',
] as const;
export type FilterGroup = (typeof FILTER_GROUPS)[number];

export const CATALOG_SORTS = PRODUCT_SORTS;
export type CatalogSort = ProductSort;

const STATUSES: readonly string[] = PRODUCT_STATUSES;

export const PAGE_SIZE = CATALOG_LIMITS.defaultPageSize;

export const EMPTY_QUERY: CatalogQuery = {
  q: '',
  function: [],
  applicationArea: [],
  region: [],
  certification: [],
  status: [],
  sort: null,
  page: 1,
};

/**
 * URLs arrive from outside (old links, chat apps that mangle them, hand edits), so bad
 * values degrade to defaults instead of producing an error page.
 */
export function parseCatalogQuery(params: ParamMap): CatalogQuery {
  const page = Number(params.get('page'));
  const sort = params.get('sort') as CatalogSort | null;
  return {
    q: (params.get('q') ?? '').trim().slice(0, CATALOG_LIMITS.query),
    function: params.getAll('function').filter(Boolean),
    applicationArea: params.getAll('applicationArea').filter(Boolean),
    region: params.getAll('region').filter(Boolean),
    certification: params.getAll('certification').filter(Boolean),
    status: params.getAll('status').filter((status) => STATUSES.includes(status)),
    sort: sort && CATALOG_SORTS.includes(sort) ? sort : null,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

/** Router params for a query. Defaults map to null, which removes them, to keep links short. */
export function toRouteParams(query: CatalogQuery): Params {
  const params: Params = {
    q: query.q || null,
    sort: query.sort,
    page: query.page > 1 ? query.page : null,
  };
  for (const group of FILTER_GROUPS) {
    params[group] = query[group].length > 0 ? query[group] : null;
  }
  return params;
}

export function toApiParams(query: CatalogQuery): CatalogApiParams {
  const params: CatalogApiParams = { page: query.page, pageSize: PAGE_SIZE };
  if (query.q) params['q'] = query.q;
  if (query.sort) params['sort'] = query.sort;
  for (const group of FILTER_GROUPS) {
    if (query[group].length > 0) params[group] = query[group];
  }
  return params;
}

/** Changing what is being searched for always returns to the first page. */
export function toggleFilter(query: CatalogQuery, group: FilterGroup, value: string): CatalogQuery {
  const selected = query[group];
  return {
    ...query,
    [group]: selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value],
    page: 1,
  };
}

export function activeFilterCount(query: CatalogQuery): number {
  return FILTER_GROUPS.reduce((total, group) => total + query[group].length, 0);
}
