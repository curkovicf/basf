/** Orderings the catalogue search accepts. `relevance` needs a search term. */
export const PRODUCT_SORTS = ['relevance', 'name', 'newest', 'oldest', 'rating'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];
