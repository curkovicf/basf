import { Module } from '@nestjs/common';
import { ServerReviewsApiModule } from '@pf/server-nodejs-api-features-reviews-api';
import { ServerReviewsApplicationModule } from '@pf/server-nodejs-api-features-reviews-application';
import { ServerReviewsInfrastructureModule } from '@pf/server-nodejs-api-features-reviews-infrastructure';

/** Aggregates the reviews feature: reading reviews and the one public write flow. */
@Module({
  imports: [
    ServerReviewsInfrastructureModule,
    ServerReviewsApplicationModule,
    ServerReviewsApiModule,
  ],
})
export class ServerReviewsShellModule {}
