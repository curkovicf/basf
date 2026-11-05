import { NestFactory } from '@nestjs/core';
import { CatalogImportCli } from '@pf/server-nodejs-api-features-catalog-import-api';
import { CatalogImportModule } from './app/catalog-import.module';

/**
 * One-shot process: imports a PIM export and exits. Run nightly after each export, and
 * by Compose before the API starts. Usage: main.js [path/to/products.csv] [--force]
 */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(CatalogImportModule, {
    logger: ['error', 'warn'],
  });
  try {
    process.exitCode = await app.get(CatalogImportCli).run(process.argv.slice(2));
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error('Import failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
