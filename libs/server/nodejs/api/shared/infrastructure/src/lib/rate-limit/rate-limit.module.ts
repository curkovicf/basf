import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EnvironmentVariables } from '../config/environment.constant';

const ONE_MINUTE_MS = 60_000;

/**
 * One bucket per client IP. Only the review write path opts in (`@UseGuards(ThrottlerGuard)`);
 * reads are never throttled. ThrottlerModule is global, so the guard resolves anywhere.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: ONE_MINUTE_MS,
          limit: config.get<number>(EnvironmentVariables.REVIEW_RATE_LIMIT, 5),
        },
      ],
    }),
  ],
})
export class RateLimitModule {}
