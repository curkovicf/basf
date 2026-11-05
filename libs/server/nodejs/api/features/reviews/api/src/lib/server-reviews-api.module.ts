import { Module } from '@nestjs/common';
import { ReviewsController } from './controllers/reviews.controller';

/** HTTP boundary of reviews: `/products/:sku/reviews`. */
@Module({
  controllers: [ReviewsController],
})
export class ServerReviewsApiModule {}
