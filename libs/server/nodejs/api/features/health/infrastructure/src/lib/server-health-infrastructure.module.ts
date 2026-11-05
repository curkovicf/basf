import { Global, Module } from '@nestjs/common';
import { HealthCheck, HealthDI } from '@pf/server-nodejs-api-features-health-domain';
import { PostgresHealthCheck } from './postgres.health-check';

/** Binds `HealthDI.HealthChecks`: the API works only while Postgres answers. */
@Global()
@Module({
  providers: [
    PostgresHealthCheck,
    {
      provide: HealthDI.HealthChecks,
      inject: [PostgresHealthCheck],
      useFactory: (...checks: HealthCheck[]): HealthCheck[] => checks,
    },
  ],
  exports: [HealthDI.HealthChecks],
})
export class ServerHealthInfrastructureModule {}
