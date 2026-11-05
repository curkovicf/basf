import { Injectable } from '@nestjs/common';
import { PrismaService } from '@pf/server-nodejs-api-shared-infrastructure';
import type { HealthCheck } from '@pf/server-nodejs-api-features-health-domain';

/** `SELECT 1` through the app's own client, so it fails when the app itself can't reach Postgres. */
@Injectable()
export class PostgresHealthCheck implements HealthCheck {
  readonly name = 'postgres';

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
