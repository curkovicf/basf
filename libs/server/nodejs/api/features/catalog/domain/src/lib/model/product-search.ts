import type { ProductSort, ProductStatus } from '@pf/shared-types';

/** Filter groups a facet can be computed "without", so it shows what the user could switch to. */
export type FilterGroup = 'function' | 'applicationArea' | 'region' | 'status';

/** What the user asked for, already validated and normalised by the inbound layer. */
export interface ProductSearchCriteria {
  q?: string;
  function?: string[];
  applicationArea?: string[];
  region?: string[];
  /** Certifications narrow (AND): "vegan and halal". The other groups widen (OR). */
  certification?: string[];
  /** Omitted means {@link DEFAULT_STATUSES}: what can be bought. */
  status?: ProductStatus[];
  sort?: ProductSort;
  page: number;
  pageSize: number;
}

export const DEFAULT_STATUSES: ProductStatus[] = ['ACTIVE', 'PHASE_OUT'];

export const GLOBAL_REGION = 'Global';

export function effectiveStatuses(criteria: ProductSearchCriteria): ProductStatus[] {
  return criteria.status?.length ? criteria.status : DEFAULT_STATUSES;
}

/**
 * A product marked "Global" is sold in every region, so asking for EMEA must include it.
 * The inverse does not hold: asking for Global means global products only.
 */
export function expandRegions(regions: string[]): string[] {
  return [...new Set([...regions, GLOBAL_REGION])];
}

/** Relevance needs a search term; without one the catalogue is alphabetical. */
export function resolveSort(criteria: Pick<ProductSearchCriteria, 'q' | 'sort'>): ProductSort {
  if (criteria.sort === 'relevance' && !criteria.q) return 'name';
  return criteria.sort ?? (criteria.q ? 'relevance' : 'name');
}
