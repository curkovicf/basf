import type { ProductSearchCriteria } from '@pf/server-nodejs-api-features-catalog-domain';

export class SearchProductsQuery {
  constructor(public readonly criteria: ProductSearchCriteria) {}
}
