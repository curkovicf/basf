/** Bounds on a catalogue search request, enforced by the API and respected by the web app. */
export const CATALOG_LIMITS = {
  /** Characters in the free-text search. */
  query: 100,
  /** Values per filter group. */
  filterValues: 50,
  pageSize: 100,
  defaultPageSize: 20,
} as const;
