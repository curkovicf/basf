/**
 * Integration tests: the real Nest app, the real migrations, a real Postgres. They use a
 * separate `product_finder_test` database (see support/global-setup.ts), so development
 * data is safe. Excluded from the inferred `test` target; run with `nx e2e api-e2e`.
 */
module.exports = {
  displayName: 'api-e2e',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'html'],
  testMatch: ['<rootDir>/src/**/*.int-spec.ts'],
  globalSetup: '<rootDir>/src/support/global-setup.ts',
  setupFiles: ['<rootDir>/src/support/test-env.ts'],
  coverageDirectory: '../../../../coverage/apps/server/nodejs/api-e2e',
};
