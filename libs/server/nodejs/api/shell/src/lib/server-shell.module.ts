import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ServerCatalogShellModule } from '@pf/server-nodejs-api-features-catalog-shell';
import { ServerHealthShellModule } from '@pf/server-nodejs-api-features-health-shell';
import { ServerReviewsShellModule } from '@pf/server-nodejs-api-features-reviews-shell';
import { ApiSharedInfrastructureModule } from '@pf/server-nodejs-api-shared-infrastructure';

/**
 * Everything the API does, composed from feature shells. The import is deliberately
 * not here: it runs as its own process (`catalog-import`) sharing the same libraries.
 */
@Module({
  imports: [
    CqrsModule.forRoot(),
    ApiSharedInfrastructureModule.forRoot(),
    ServerCatalogShellModule,
    ServerReviewsShellModule,
    ServerHealthShellModule,
  ],
})
export class ServerShellModule {}
