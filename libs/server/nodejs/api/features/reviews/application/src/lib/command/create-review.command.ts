import type { NewReview } from '@pf/server-nodejs-api-features-reviews-domain';

export class CreateReviewCommand {
  constructor(
    public readonly sku: string,
    public readonly review: NewReview,
  ) {}
}
