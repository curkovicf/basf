import { Module } from '@nestjs/common';
import { GetCatalogStatusHandler } from './handler/get-catalog-status.handler';
import { GetProductHandler } from './handler/get-product.handler';
import { SearchProductsHandler } from './handler/search-products.handler';

@Module({
  providers: [SearchProductsHandler, GetProductHandler, GetCatalogStatusHandler],
})
export class ServerCatalogApplicationModule {}
