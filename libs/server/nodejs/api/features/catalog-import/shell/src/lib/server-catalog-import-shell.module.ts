import { Module } from '@nestjs/common';
import { ServerCatalogImportApiModule } from '@pf/server-nodejs-api-features-catalog-import-api';
import { ServerCatalogImportApplicationModule } from '@pf/server-nodejs-api-features-catalog-import-application';
import { ServerCatalogImportInfrastructureModule } from '@pf/server-nodejs-api-features-catalog-import-infrastructure';

/**
 * Aggregates the nightly import. Composed by the `catalog-import` app only: the API
 * never imports, so a broken export can never take the API down with it.
 */
@Module({
  imports: [
    ServerCatalogImportInfrastructureModule,
    ServerCatalogImportApplicationModule,
    ServerCatalogImportApiModule,
  ],
  exports: [ServerCatalogImportApiModule],
})
export class ServerCatalogImportShellModule {}
