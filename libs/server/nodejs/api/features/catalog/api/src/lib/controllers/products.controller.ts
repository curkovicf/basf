import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { ProductDto, ProductPageDto } from '@pf/shared-types';
import {
  GetProductQuery,
  SearchProductsQuery,
} from '@pf/server-nodejs-api-features-catalog-application';
import { ProductQueryDto } from '../dtos/product-query.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  search(@Query() query: ProductQueryDto): Promise<ProductPageDto> {
    return this.queryBus.execute(new SearchProductsQuery(query));
  }

  @Get(':sku')
  findOne(@Param('sku') sku: string): Promise<ProductDto> {
    return this.queryBus.execute(new GetProductQuery(sku));
  }
}
