import { Module } from '@nestjs/common';
import { ServerCatalogImportApplicationModule } from '@pf/server-nodejs-api-features-catalog-import-application';
import { CatalogImportCli } from './catalog-import.cli';

/** Inbound boundary of the import: the command line. */
@Module({
  imports: [ServerCatalogImportApplicationModule],
  providers: [CatalogImportCli],
  exports: [CatalogImportCli],
})
export class ServerCatalogImportApiModule {}
