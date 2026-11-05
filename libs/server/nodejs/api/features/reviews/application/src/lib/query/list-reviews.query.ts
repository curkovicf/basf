import type { ReviewPageCriteria } from '@pf/server-nodejs-api-features-reviews-domain';

export class ListReviewsQuery {
  constructor(
    public readonly sku: string,
    public readonly criteria: ReviewPageCriteria,
  ) {}
}
