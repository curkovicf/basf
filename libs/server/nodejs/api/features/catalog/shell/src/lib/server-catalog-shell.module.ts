import { Module } from '@nestjs/common';
import { ServerCatalogApiModule } from '@pf/server-nodejs-api-features-catalog-api';
import { ServerCatalogApplicationModule } from '@pf/server-nodejs-api-features-catalog-application';
import { ServerCatalogInfrastructureModule } from '@pf/server-nodejs-api-features-catalog-infrastructure';

/** Aggregates the catalogue feature: searching, product detail and freshness. */
@Module({
  imports: [
    ServerCatalogInfrastructureModule,
    ServerCatalogApplicationModule,
    ServerCatalogApiModule,
  ],
})
export class ServerCatalogShellModule {}
