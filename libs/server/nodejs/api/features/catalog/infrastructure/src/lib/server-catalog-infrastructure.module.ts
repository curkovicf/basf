import { Global, Module } from '@nestjs/common';
import { CatalogDI } from '@pf/server-nodejs-api-features-catalog-domain';
import { PrismaCatalogStatusRepository } from './database/prisma-catalog-status.repository';
import { PrismaProductRepository } from './database/prisma-product.repository';

/**
 * Global so the application-layer handlers can resolve the repository tokens without
 * the application module importing infrastructure.
 */
@Global()
@Module({
  providers: [
    { provide: CatalogDI.ProductRepository, useClass: PrismaProductRepository },
    { provide: CatalogDI.CatalogStatusRepository, useClass: PrismaCatalogStatusRepository },
  ],
  exports: [CatalogDI.ProductRepository, CatalogDI.CatalogStatusRepository],
})
export class ServerCatalogInfrastructureModule {}
