import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { CreateReviewRequest, REVIEW_LIMITS } from '@pf/shared-types';

const Trim = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

export class CreateReviewDto implements CreateReviewRequest {
  @Trim()
  @IsString()
  @MinLength(REVIEW_LIMITS.authorName.min)
  @MaxLength(REVIEW_LIMITS.authorName.max)
  authorName!: string;

  @IsInt()
  @Min(REVIEW_LIMITS.rating.min)
  @Max(REVIEW_LIMITS.rating.max)
  rating!: number;

  @Trim()
  @IsString()
  @MinLength(REVIEW_LIMITS.comment.min)
  @MaxLength(REVIEW_LIMITS.comment.max)
  comment!: string;
}

export class ReviewPageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(REVIEW_LIMITS.pageSize)
  pageSize: number = REVIEW_LIMITS.defaultPageSize;
}
