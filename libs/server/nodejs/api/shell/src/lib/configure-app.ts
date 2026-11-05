import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { EnvironmentVariables } from '@pf/server-nodejs-api-shared-infrastructure';

export const GLOBAL_PREFIX = 'api';

/** Shared by the app's `main.ts` and the integration tests, so tests exercise the real pipeline. */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get(ConfigService);
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.use(helmet());
  // Without this, every client behind the reverse proxy shares one rate limit bucket.
  app.set('trust proxy', config.get<number>(EnvironmentVariables.TRUST_PROXY, 0));
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
  );
}
