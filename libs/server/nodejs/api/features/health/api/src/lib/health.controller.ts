import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import {
  HealthCheck,
  HealthDI,
  HealthReport,
  runHealthChecks,
} from '@pf/server-nodejs-api-features-health-domain';

/**
 * Health probe used by the container healthcheck: `GET /api/health`.
 * 200 while every dependency answers; 503 with the failing check's reason otherwise.
 */
@Controller('health')
export class HealthController {
  constructor(@Inject(HealthDI.HealthChecks) private readonly checks: HealthCheck[]) {}

  @Get()
  async check(): Promise<HealthReport> {
    const report = await runHealthChecks(this.checks);
    if (report.status !== 'ok') throw new ServiceUnavailableException(report);
    return report;
  }
}
