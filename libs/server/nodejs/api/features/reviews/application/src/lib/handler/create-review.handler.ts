import { ConflictException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { CreatedReviewDto } from '@pf/shared-types';
import { acceptsReviews, ratingSummary } from '@pf/server-nodejs-api-features-catalog-domain';
import {
  IReviewProductRepository,
  IReviewRepository,
  ReviewsDI,
} from '@pf/server-nodejs-api-features-reviews-domain';
import { CreateReviewCommand } from '../command/create-review.command';
import { toReviewDto } from '../mapper/review.mapper';
import { requireProduct } from './require-product';

@CommandHandler(CreateReviewCommand)
export class CreateReviewHandler implements ICommandHandler<CreateReviewCommand, CreatedReviewDto> {
  constructor(
    @Inject(ReviewsDI.ReviewRepository) private readonly reviews: IReviewRepository,
    @Inject(ReviewsDI.ReviewProductRepository) private readonly products: IReviewProductRepository,
  ) {}

  async execute({ sku, review }: CreateReviewCommand): Promise<CreatedReviewDto> {
    const product = await requireProduct(this.products, sku);
    if (!acceptsReviews(product)) {
      throw new ConflictException('Reviews are closed for discontinued products');
    }

    const added = await this.reviews.add(product.id, review);

    return {
      review: toReviewDto(added.review),
      rating: ratingSummary(added.totals.ratingCount, added.totals.ratingAvg),
    };
  }
}
