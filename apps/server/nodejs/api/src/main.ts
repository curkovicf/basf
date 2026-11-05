import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { GLOBAL_PREFIX, configureApp } from '@pf/server-nodejs-api-shell';
import { EnvironmentVariables } from '@pf/server-nodejs-api-shared-infrastructure';
import { AppModule } from './app/app.module';

/** Only bootstraps. All behaviour lives in libs/server/nodejs/api, composed by ServerShellModule. */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);
  app.enableShutdownHooks();

  const port = app.get(ConfigService).get<number>(EnvironmentVariables.API_PORT, 3100);
  await app.listen(port);
  Logger.log(`Product Finder API is running on http://localhost:${port}/${GLOBAL_PREFIX}`);
}

bootstrap();
