export interface Review {
  id: number;
  authorName: string;
  /** 1-5. Enforced by the API's validation and by a CHECK constraint in the database. */
  rating: number;
  /** Verbatim user text; escaping is the renderer's job. */
  comment: string;
  createdAt: Date;
}

export type NewReview = Pick<Review, 'authorName' | 'rating' | 'comment'>;

/** The product's rating totals after a review was added. */
export interface RatingTotals {
  ratingCount: number;
  ratingAvg: number;
}

export interface ReviewPageCriteria {
  page: number;
  pageSize: number;
}
