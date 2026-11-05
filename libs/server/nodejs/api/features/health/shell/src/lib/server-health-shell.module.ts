import { Module } from '@nestjs/common';
import { ServerHealthApiModule } from '@pf/server-nodejs-api-features-health-api';
import { ServerHealthInfrastructureModule } from '@pf/server-nodejs-api-features-health-infrastructure';

/** Aggregates the health feature. */
@Module({
  imports: [ServerHealthInfrastructureModule, ServerHealthApiModule],
})
export class ServerHealthShellModule {}
