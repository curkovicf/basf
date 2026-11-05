import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import pg from 'pg';

/** A dedicated database on the same server, so tests can never touch development data. */
function resolveTestDatabaseUrl(): URL {
  if (process.env['TEST_DATABASE_URL']) return new URL(process.env['TEST_DATABASE_URL']);
  if (existsSync('.env')) process.loadEnvFile('.env');
  const url = new URL(
    process.env['DATABASE_URL'] ?? 'postgresql://finder:finder@localhost:5544/product_finder',
  );
  url.pathname = '/product_finder_test';
  return url;
}

export default async function globalSetup(): Promise<void> {
  const url = resolveTestDatabaseUrl();
  process.env['TEST_DATABASE_URL'] = url.toString();

  const database = url.pathname.slice(1);
  const admin = new URL(url);
  admin.pathname = '/postgres';
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      database,
    ]);
    if (!rowCount) await client.query(`CREATE DATABASE "${database}"`);
  } finally {
    await client.end();
  }

  // The real migrations, so that the tests also prove they work on an empty database.
  // Runs from the workspace root, where prisma.config.ts is.
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: 'pipe',
  });
}
