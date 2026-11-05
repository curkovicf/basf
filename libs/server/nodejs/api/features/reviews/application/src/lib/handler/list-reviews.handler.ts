import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ReviewPageDto } from '@pf/shared-types';
import {
  IReviewProductRepository,
  IReviewRepository,
  ReviewsDI,
} from '@pf/server-nodejs-api-features-reviews-domain';
import { toReviewDto } from '../mapper/review.mapper';
import { ListReviewsQuery } from '../query/list-reviews.query';
import { requireProduct } from './require-product';

@QueryHandler(ListReviewsQuery)
export class ListReviewsHandler implements IQueryHandler<ListReviewsQuery, ReviewPageDto> {
  constructor(
    @Inject(ReviewsDI.ReviewRepository) private readonly reviews: IReviewRepository,
    @Inject(ReviewsDI.ReviewProductRepository) private readonly products: IReviewProductRepository,
  ) {}

  async execute({ sku, criteria }: ListReviewsQuery): Promise<ReviewPageDto> {
    const product = await requireProduct(this.products, sku);
    const [items, total] = await Promise.all([
      this.reviews.list(product.id, criteria),
      this.reviews.count(product.id),
    ]);

    return {
      items: items.map(toReviewDto),
      total,
      page: criteria.page,
      pageSize: criteria.pageSize,
    };
  }
}
