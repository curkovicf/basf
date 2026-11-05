import { Global, Module } from '@nestjs/common';
import { CatalogImportDI } from '@pf/server-nodejs-api-features-catalog-import-domain';
import { PrismaCatalogImportStore } from './database/prisma-catalog-import.store';

@Global()
@Module({
  providers: [{ provide: CatalogImportDI.CatalogImportStore, useClass: PrismaCatalogImportStore }],
  exports: [CatalogImportDI.CatalogImportStore],
})
export class ServerCatalogImportInfrastructureModule {}
