import type { ReviewDto } from '@pf/shared-types';
import type { Review } from '@pf/server-nodejs-api-features-reviews-domain';

export function toReviewDto(review: Review): ReviewDto {
  return {
    id: review.id,
    authorName: review.authorName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}
