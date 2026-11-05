import { Module } from '@nestjs/common';
import { ServerCatalogImportShellModule } from '@pf/server-nodejs-api-features-catalog-import-shell';
import { ApiSharedInfrastructureModule } from '@pf/server-nodejs-api-shared-infrastructure';

@Module({
  imports: [ApiSharedInfrastructureModule.forRoot(), ServerCatalogImportShellModule],
})
export class CatalogImportModule {}
