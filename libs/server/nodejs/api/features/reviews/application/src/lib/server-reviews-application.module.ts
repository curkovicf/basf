import { Module } from '@nestjs/common';
import { CreateReviewHandler } from './handler/create-review.handler';
import { ListReviewsHandler } from './handler/list-reviews.handler';

@Module({
  providers: [ListReviewsHandler, CreateReviewHandler],
})
export class ServerReviewsApplicationModule {}
