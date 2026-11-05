import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

if (existsSync('.env')) process.loadEnvFile('.env');

const infrastructure = 'libs/server/nodejs/api/shared/infrastructure';

// `prisma generate` runs at image build time, when no database exists yet, so
// DATABASE_URL may legitimately be absent. Commands that need it fail on their own.
export default defineConfig({
  schema: `${infrastructure}/src/lib/prisma/schema.prisma`,
  migrations: { path: `${infrastructure}/src/lib/prisma/migrations` },
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
