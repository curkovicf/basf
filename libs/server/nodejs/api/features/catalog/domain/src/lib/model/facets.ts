import type { FacetValueDto } from '@pf/shared-types';
import { GLOBAL_REGION } from './product-search';

export type FacetValue = FacetValueDto;

const byValue = (a: FacetValue, b: FacetValue) => a.value.localeCompare(b.value);

/**
 * Selected values stay listed even at zero matches: otherwise a user could not see,
 * or remove, a filter that another filter has made empty.
 */
export function withSelected(rows: FacetValue[], selected: string[] = []): FacetValue[] {
  const known = new Set(rows.map((row) => row.value));
  const missing = selected
    .filter((value) => !known.has(value))
    .map((value) => ({ value, count: 0 }));
  return [...rows, ...missing].sort(byValue);
}

/**
 * Region counts must promise what the filter delivers, which includes global products.
 * A global product also makes a region relevant when nothing else matches there, which
 * is why the full region list is needed and not only the regions found in the results.
 */
export function regionFacet(
  rows: FacetValue[],
  allRegions: string[],
  selected: string[] = [],
): FacetValue[] {
  const counts = new Map(rows.map((row) => [row.value, row.count]));
  const globalCount = counts.get(GLOBAL_REGION) ?? 0;
  const regions = new Set([...allRegions, ...selected]);

  return [...regions]
    .map((value) => ({
      value,
      count: (counts.get(value) ?? 0) + (value === GLOBAL_REGION ? 0 : globalCount),
    }))
    .filter((facet) => facet.count > 0 || selected.includes(facet.value))
    .sort(byValue);
}
