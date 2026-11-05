const { createCjsPreset } = require('jest-preset-angular/presets');

module.exports = {
  displayName: 'web-finder-features-catalog-ui',
  preset: '../../../../../../jest.preset.js',
  ...createCjsPreset({ tsconfig: '<rootDir>/tsconfig.spec.json' }),
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../../../../../coverage/libs/web/finder/features/catalog/ui',
};
