import { Global, Module } from '@nestjs/common';
import { ReviewsDI } from '@pf/server-nodejs-api-features-reviews-domain';
import { PrismaReviewProductRepository } from './database/prisma-review-product.repository';
import { PrismaReviewRepository } from './database/prisma-review.repository';

@Global()
@Module({
  providers: [
    { provide: ReviewsDI.ReviewRepository, useClass: PrismaReviewRepository },
    { provide: ReviewsDI.ReviewProductRepository, useClass: PrismaReviewProductRepository },
  ],
  exports: [ReviewsDI.ReviewRepository, ReviewsDI.ReviewProductRepository],
})
export class ServerReviewsInfrastructureModule {}
