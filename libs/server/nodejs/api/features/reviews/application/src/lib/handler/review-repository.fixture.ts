import {
  IReviewProductRepository,
  IReviewRepository,
  NewReview,
  ReviewedProduct,
} from '@pf/server-nodejs-api-features-reviews-domain';

/** In-memory stand-ins for the review ports, shared by the handler specs. */

export const review: NewReview = { authorName: 'Ana K.', rating: 4, comment: 'Stable emulsions.' };

export const products = (product: ReviewedProduct | null): IReviewProductRepository => ({
  findBySku: async () => product,
});

export const reviewRepository = () => {
  const added: { productId: number; review: NewReview }[] = [];
  const reviews: IReviewRepository = {
    list: async () => [],
    count: async () => 0,
    add: async (productId, newReview) => {
      added.push({ productId, review: newReview });
      return {
        review: { id: 1, ...newReview, createdAt: new Date('2026-01-01T00:00:00Z') },
        totals: { ratingCount: 3, ratingAvg: 4.3333 },
      };
    },
  };

  return { reviews, added };
};
