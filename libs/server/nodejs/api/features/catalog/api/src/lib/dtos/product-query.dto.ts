import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CATALOG_LIMITS,
  PRODUCT_SORTS,
  PRODUCT_STATUSES,
  ProductSearchRequest,
  ProductSort,
  ProductStatus,
} from '@pf/shared-types';

/** `?a=1` arrives as a string and `?a=1&a=2` as an array; handlers should only see arrays. */
const ToStringArray = () =>
  Transform(({ value }: { value: unknown }) => {
    if (value === undefined) return undefined;
    const values = Array.isArray(value) ? value : [value];
    return values.map((item) => (typeof item === 'string' ? item.trim() : item)).filter(Boolean);
  });

export class ProductQueryDto implements ProductSearchRequest {
  @IsOptional()
  @IsString()
  @MaxLength(CATALOG_LIMITS.query)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  q?: string;

  @IsOptional()
  @ToStringArray()
  @IsArray()
  @ArrayMaxSize(CATALOG_LIMITS.filterValues)
  @IsString({ each: true })
  function?: string[];

  @IsOptional()
  @ToStringArray()
  @IsArray()
  @ArrayMaxSize(CATALOG_LIMITS.filterValues)
  @IsString({ each: true })
  applicationArea?: string[];

  @IsOptional()
  @ToStringArray()
  @IsArray()
  @ArrayMaxSize(CATALOG_LIMITS.filterValues)
  @IsString({ each: true })
  region?: string[];

  @IsOptional()
  @ToStringArray()
  @IsArray()
  @ArrayMaxSize(CATALOG_LIMITS.filterValues)
  @IsString({ each: true })
  certification?: string[];

  /** Omitted means "what can be bought": active and phase-out products. */
  @IsOptional()
  @ToStringArray()
  @IsArray()
  @IsIn(PRODUCT_STATUSES, { each: true })
  status?: ProductStatus[];

  /** Omitted means relevance when searching and name otherwise. */
  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort?: ProductSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CATALOG_LIMITS.pageSize)
  pageSize: number = CATALOG_LIMITS.defaultPageSize;
}
