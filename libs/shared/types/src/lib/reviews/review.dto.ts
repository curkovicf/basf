import type { RatingSummaryDto } from '../catalog/product.dto';

/** Bounds on a review, enforced by the API and mirrored by the form. */
export const REVIEW_LIMITS = {
  authorName: { min: 2, max: 80 },
  comment: { min: 10, max: 2000 },
  rating: { min: 1, max: 5 },
  pageSize: 50,
  defaultPageSize: 10,
} as const;

export interface ReviewDto {
  id: number;
  authorName: string;
  rating: number;
  /** Verbatim user text. Rendering it as text, never as markup, is the client's job. */
  comment: string;
  /** ISO timestamp. */
  createdAt: string;
}

export interface ReviewPageDto {
  items: ReviewDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateReviewRequest {
  authorName: string;
  rating: number;
  comment: string;
}

/** The stored review plus the product's new rating, so the client can update both at once. */
export interface CreatedReviewDto {
  review: ReviewDto;
  rating: RatingSummaryDto;
}
