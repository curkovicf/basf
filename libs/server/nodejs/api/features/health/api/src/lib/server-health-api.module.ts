import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/** HTTP boundary for the liveness probe. */
@Module({
  controllers: [HealthController],
})
export class ServerHealthApiModule {}
