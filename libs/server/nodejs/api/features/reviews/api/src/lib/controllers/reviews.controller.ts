import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { CreatedReviewDto, ReviewPageDto } from '@pf/shared-types';
import {
  CreateReviewCommand,
  ListReviewsQuery,
} from '@pf/server-nodejs-api-features-reviews-application';
import { CreateReviewDto, ReviewPageQueryDto } from '../dtos/review.dtos';

@Controller('products/:sku/reviews')
export class ReviewsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  list(@Param('sku') sku: string, @Query() query: ReviewPageQueryDto): Promise<ReviewPageDto> {
    return this.queryBus.execute(new ListReviewsQuery(sku, query));
  }

  /** The only public write path, and unauthenticated, so the only one that is throttled. */
  @Post()
  @UseGuards(ThrottlerGuard)
  create(@Param('sku') sku: string, @Body() dto: CreateReviewDto): Promise<CreatedReviewDto> {
    return this.commandBus.execute(new CreateReviewCommand(sku, dto));
  }
}
