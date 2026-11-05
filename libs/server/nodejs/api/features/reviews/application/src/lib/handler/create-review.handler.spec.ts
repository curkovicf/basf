import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateReviewCommand } from '../command/create-review.command';
import { CreateReviewHandler } from './create-review.handler';
import { products, review, reviewRepository } from './review-repository.fixture';

describe('CreateReviewHandler', () => {
  it('stores the review and returns the rounded new rating', async () => {
    const { reviews, added } = reviewRepository();
    const handler = new CreateReviewHandler(
      reviews,
      products({ id: 7, sku: 'P-1', status: 'ACTIVE', delistedAt: null }),
    );

    const result = await handler.execute(new CreateReviewCommand('p-1', review));

    expect(added).toEqual([{ productId: 7, review }]);
    expect(result.review).toMatchObject({ id: 1, createdAt: '2026-01-01T00:00:00.000Z' });
    expect(result.rating).toEqual({ average: 4.3, count: 3 });
  });

  it('closes reviews on a discontinued product, including one that left the export', async () => {
    const { reviews, added } = reviewRepository();
    const delisted = products({ id: 7, sku: 'P-1', status: 'ACTIVE', delistedAt: new Date() });

    await expect(
      new CreateReviewHandler(reviews, delisted).execute(new CreateReviewCommand('P-1', review)),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(added).toEqual([]);
  });

  it('answers 404 for an unknown product', async () => {
    const { reviews } = reviewRepository();

    await expect(
      new CreateReviewHandler(reviews, products(null)).execute(
        new CreateReviewCommand('NOPE', review),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
