#!/usr/bin/env node
/**
 * Scaffolds an Nx library in this workspace's shape and registers its import alias.
 *
 *   node scripts/generate-library.mjs <path-under-libs> --tags=a,b [--type=node|angular]
 *
 * Example:
 *   node scripts/generate-library.mjs libs/server/nodejs/api/features/catalog/domain \
 *     --tags=platform:server,type:domain
 *
 * - The project name and the import alias (@pf/<name>) derive from the path.
 * - Tags must exist in eslint.config.mjs; they drive @nx/enforce-module-boundaries.
 * - `--type=angular` (the default under libs/web) writes a Jest setup for Angular.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCOPE = '@pf';

const flag = (name) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const destArg = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!destArg) {
  console.error(
    'Usage: node scripts/generate-library.mjs <path-under-libs> --tags=a,b [--type=node|angular]',
  );
  process.exit(1);
}

const destPath = destArg.replace(/^\/|\/$/g, '');
if (!destPath.startsWith('libs/')) {
  console.error('Libraries live under libs/.');
  process.exit(1);
}
const name = destPath
  .replace(/^libs\//, '')
  .split('/')
  .join('-');
const importPath = `${SCOPE}/${name}`;
const type = flag('type') ?? (destPath.startsWith('libs/web/') ? 'angular' : 'node');
const tags = (flag('tags') ?? '').split(',').filter(Boolean);

const eslintSource = readFileSync(resolve(root, 'eslint.config.mjs'), 'utf8');
const knownTags = new Set(
  [...eslintSource.matchAll(/['"]((?:platform|type|domain):[a-z-]+)['"]/g)].map((m) => m[1]),
);
const unknown = tags.filter((t) => !knownTags.has(t));
if (unknown.length) {
  console.error(`Unknown tags (not in eslint.config.mjs): ${unknown.join(', ')}`);
  process.exit(1);
}

const dir = resolve(root, destPath);
if (existsSync(dir)) {
  console.error(`${destPath} already exists.`);
  process.exit(1);
}
const up = relative(dir, root).split('\\').join('/');

const write = (file, content) => {
  const target = resolve(dir, file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content.endsWith('\n') ? content : `${content}\n`);
};

const json = (value) => JSON.stringify(value, null, 2);

write(
  'project.json',
  json({
    name,
    $schema: `${up}/node_modules/nx/schemas/project-schema.json`,
    sourceRoot: `${destPath}/src`,
    projectType: 'library',
    ...(type === 'angular' ? { prefix: 'pf' } : {}),
    tags,
    '// targets': `to see all targets run: nx show project ${name} --web`,
    targets: {},
  }),
);

write(
  'eslint.config.mjs',
  `import baseConfig from '${up}/eslint.config.mjs';\n\nexport default [...baseConfig];\n`,
);

write('src/index.ts', '');

if (type === 'node') {
  write(
    'tsconfig.json',
    json({
      extends: `${up}/tsconfig.base.json`,
      compilerOptions: {
        module: 'commonjs',
        forceConsistentCasingInFileNames: true,
        strict: true,
        importHelpers: true,
        noImplicitOverride: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noPropertyAccessFromIndexSignature: true,
        ignoreDeprecations: '6.0',
      },
      files: [],
      include: [],
      references: [{ path: './tsconfig.lib.json' }, { path: './tsconfig.spec.json' }],
    }),
  );
  write(
    'tsconfig.lib.json',
    json({
      extends: './tsconfig.json',
      compilerOptions: { outDir: `${up}/dist/out-tsc`, declaration: true, types: ['node'] },
      include: ['src/**/*.ts'],
      exclude: ['jest.config.ts', 'jest.config.cts', 'src/**/*.spec.ts', 'src/**/*.test.ts'],
    }),
  );
  write(
    'tsconfig.spec.json',
    json({
      extends: './tsconfig.json',
      compilerOptions: {
        outDir: `${up}/dist/out-tsc`,
        module: 'commonjs',
        moduleResolution: 'bundler',
        types: ['jest', 'node'],
      },
      include: [
        'jest.config.ts',
        'jest.config.cts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.d.ts',
      ],
    }),
  );
  write(
    'jest.config.cts',
    `module.exports = {
  displayName: '${name}',
  preset: '${up}/jest.preset.js',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '${up}/coverage/${destPath}',
};
`,
  );
} else {
  write(
    'tsconfig.json',
    json({
      extends: `${up}/tsconfig.base.json`,
      compilerOptions: {
        isolatedModules: true,
        target: 'es2022',
        moduleResolution: 'bundler',
        strict: true,
        noImplicitOverride: true,
        noPropertyAccessFromIndexSignature: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        emitDecoratorMetadata: false,
        module: 'preserve',
        ignoreDeprecations: '6.0',
      },
      angularCompilerOptions: {
        enableI18nLegacyMessageIdFormat: false,
        strictInjectionParameters: true,
        strictInputAccessModifiers: true,
        strictTemplates: true,
      },
      files: [],
      include: [],
      references: [{ path: './tsconfig.lib.json' }, { path: './tsconfig.spec.json' }],
    }),
  );
  write(
    'tsconfig.lib.json',
    json({
      extends: './tsconfig.json',
      compilerOptions: {
        outDir: `${up}/dist/out-tsc`,
        declaration: true,
        declarationMap: true,
        inlineSources: true,
        types: [],
      },
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/test-setup.ts', 'jest.config.cts'],
    }),
  );
  write(
    'tsconfig.spec.json',
    json({
      extends: './tsconfig.json',
      compilerOptions: {
        outDir: `${up}/dist/out-tsc`,
        module: 'commonjs',
        moduleResolution: 'node10',
        esModuleInterop: true,
        types: ['jest', 'node'],
      },
      include: ['jest.config.cts', 'src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/*.d.ts'],
      files: ['src/test-setup.ts'],
    }),
  );
  write(
    'jest.config.cts',
    `const { createCjsPreset } = require('jest-preset-angular/presets');

module.exports = {
  displayName: '${name}',
  preset: '${up}/jest.preset.js',
  ...createCjsPreset({ tsconfig: '<rootDir>/tsconfig.spec.json' }),
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '${up}/coverage/${destPath}',
};
`,
  );
  write(
    'src/test-setup.ts',
    `import { setupAngularJest } from '@pf/web-finder-shared-testing';

setupAngularJest();
`,
  );
}

// Register the import alias.
const basePath = resolve(root, 'tsconfig.base.json');
const base = JSON.parse(readFileSync(basePath, 'utf8'));
base.compilerOptions.paths ??= {};
base.compilerOptions.paths[importPath] = [`${destPath}/src/index.ts`];
base.compilerOptions.paths = Object.fromEntries(
  Object.entries(base.compilerOptions.paths).sort(([a], [b]) => a.localeCompare(b)),
);
writeFileSync(basePath, `${JSON.stringify(base, null, 2)}\n`);

console.log(`✔ ${name} at ${destPath} (${importPath}) tags: ${tags.join(', ') || 'none'}`);
