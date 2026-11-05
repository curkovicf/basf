import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { environmentValidationSchema } from './config/environment.validation';
import { PrismaModule } from './prisma/prisma.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';

/**
 * `forRoot()` reads and validates the environment. It is a method rather than the
 * decorator's `imports` so that importing this package (as every spec of a feature
 * does) does not validate `process.env` on load.
 */
@Module({})
export class ApiSharedInfrastructureModule {
  static forRoot(): DynamicModule {
    return {
      module: ApiSharedInfrastructureModule,
      imports: [
        ConfigModule.forRoot({
          // Local development convenience: in containers the variables come from Compose.
          envFilePath: '.env',
          isGlobal: true,
          validationSchema: environmentValidationSchema,
        }),
        PrismaModule,
        RateLimitModule,
      ],
    };
  }
}
