import { NotFoundException } from '@nestjs/common';
import { ListReviewsQuery } from '../query/list-reviews.query';
import { ListReviewsHandler } from './list-reviews.handler';
import { products, reviewRepository } from './review-repository.fixture';

describe('ListReviewsHandler', () => {
  it('answers 404 for an unknown product', async () => {
    const { reviews } = reviewRepository();

    await expect(
      new ListReviewsHandler(reviews, products(null)).execute(
        new ListReviewsQuery('NOPE', { page: 1, pageSize: 10 }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('echoes paging for a known product', async () => {
    const { reviews } = reviewRepository();

    const page = await new ListReviewsHandler(
      reviews,
      products({ id: 7, sku: 'P-1', status: 'ACTIVE', delistedAt: null }),
    ).execute(new ListReviewsQuery('P-1', { page: 2, pageSize: 10 }));

    expect(page).toEqual({ items: [], total: 0, page: 2, pageSize: 10 });
  });
});
