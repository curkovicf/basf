import { Injectable } from '@nestjs/common';
import { PrismaService } from '@pf/server-nodejs-api-shared-infrastructure';
import type {
  IReviewRepository,
  NewReview,
  RatingTotals,
  Review,
  ReviewPageCriteria,
} from '@pf/server-nodejs-api-features-reviews-domain';

const REVIEW_FIELDS = {
  id: true,
  authorName: true,
  rating: true,
  comment: true,
  createdAt: true,
} as const;

@Injectable()
export class PrismaReviewRepository implements IReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(productId: number, criteria: ReviewPageCriteria): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: { productId },
      select: REVIEW_FIELDS,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (criteria.page - 1) * criteria.pageSize,
      take: criteria.pageSize,
    });
  }

  count(productId: number): Promise<number> {
    return this.prisma.review.count({ where: { productId } });
  }

  add(productId: number, review: NewReview): Promise<{ review: Review; totals: RatingTotals }> {
    return this.prisma.$transaction(async (tx) => {
      const stored = await tx.review.create({
        data: { ...review, productId },
        select: REVIEW_FIELDS,
      });
      // One statement, relative to the current row: concurrent reviews queue on the
      // row lock and each sees the other's totals, so no update can be lost.
      const [totals] = await tx.$queryRaw<{ rating_count: number; rating_avg: number }[]>`
        UPDATE products SET
          rating_count = rating_count + 1,
          rating_sum = rating_sum + ${review.rating},
          rating_avg = (rating_sum + ${review.rating})::float8 / (rating_count + 1)
        WHERE id = ${productId}
        RETURNING rating_count, rating_avg`;
      return {
        review: stored,
        totals: { ratingCount: totals.rating_count, ratingAvg: totals.rating_avg },
      };
    });
  }
}
