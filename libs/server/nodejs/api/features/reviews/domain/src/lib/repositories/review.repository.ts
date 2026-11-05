import type { NewReview, RatingTotals, Review, ReviewPageCriteria } from '../model/review';

/** Reads and writes `reviews`, and keeps the product's rating totals in step. */
export interface IReviewRepository {
  /** Newest first. */
  list(productId: number, criteria: ReviewPageCriteria): Promise<Review[]>;
  count(productId: number): Promise<number>;
  /**
   * Stores the review and updates the product's totals in one transaction, so that
   * concurrent reviews can never lose an update and sorting by rating stays exact.
   */
  add(productId: number, review: NewReview): Promise<{ review: Review; totals: RatingTotals }>;
}
