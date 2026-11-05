const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  // Most libraries declare a test target before they have any test. Exit 0
  // rather than 1 so `nx run-many -t test` stays usable as a CI gate; a
  // project that does have tests still fails on a failing test.
  passWithNoTests: true,
  // NestJS 12 ships ESM only. Transform those packages to CommonJS for Jest.
  transformIgnorePatterns: ['node_modules/(?!@nestjs/)'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    '^.+\\.js$': [
      '@swc/jest',
      {
        jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' },
        module: { type: 'commonjs' },
      },
    ],
  },
};
