import { Module } from '@nestjs/common';
import { CatalogImportService } from './catalog-import.service';

@Module({
  providers: [CatalogImportService],
  exports: [CatalogImportService],
})
export class ServerCatalogImportApplicationModule {}
