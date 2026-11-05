import { Module } from '@nestjs/common';
import { CatalogController } from './controllers/catalog.controller';
import { ProductsController } from './controllers/products.controller';

/** HTTP boundary of the catalogue: `/products` and `/catalog`. */
@Module({
  controllers: [ProductsController, CatalogController],
})
export class ServerCatalogApiModule {}
