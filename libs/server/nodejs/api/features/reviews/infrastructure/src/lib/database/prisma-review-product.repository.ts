import { Injectable } from '@nestjs/common';
import { PrismaService } from '@pf/server-nodejs-api-shared-infrastructure';
import type {
  IReviewProductRepository,
  ReviewedProduct,
} from '@pf/server-nodejs-api-features-reviews-domain';

@Injectable()
export class PrismaReviewProductRepository implements IReviewProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySku(sku: string): Promise<ReviewedProduct | null> {
    return this.prisma.product.findUnique({
      where: { sku: sku.toUpperCase() },
      select: { id: true, sku: true, status: true, delistedAt: true },
    });
  }
}
