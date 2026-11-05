import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import angularEslint from 'angular-eslint';
import nx from '@nx/eslint-plugin';

const WEB = ['libs/web/**/*.ts', 'apps/web/**/*.ts'];
const WEB_TEMPLATES = ['libs/web/**/*.html', 'apps/web/**/*.html'];
const SERVER = ['libs/server/**/*.ts', 'apps/server/**/*.ts'];

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],

  // Build output and generated code
  {
    ignores: ['**/dist', '**/coverage', '**/prisma/generated/**'],
  },

  {
    files: ['**/*.ts', '**/*.js', '**/*.mjs', '**/*.cjs', '**/*.cts'],
    plugins: { prettier },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // `const { key: _key, ...rest } = obj` drops a key; a leading underscore
      // marks a binding as deliberately unused.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // ── Platform isolation ───────────────────────────────────────────
            // NestJS must not import Angular; Angular must not import NestJS.
            // Both may import libs/shared (no platform tag).
            {
              sourceTag: 'platform:server',
              notDependOnLibsWithTags: ['platform:web'],
            },
            {
              sourceTag: 'platform:web',
              notDependOnLibsWithTags: ['platform:server'],
            },

            // ── Shared leaves ────────────────────────────────────────────────
            // types: the leaf of the graph. Wire DTOs and enums only.
            {
              sourceTag: 'type:types',
              notDependOnLibsWithTags: [
                'type:util',
                'type:ui',
                'type:data-access',
                'type:feature',
                'type:shell',
                'type:app',
                'type:domain',
                'type:application',
                'type:infrastructure',
                'type:api',
              ],
            },
            // util: pure helpers — types only, no framework layers
            {
              sourceTag: 'type:util',
              notDependOnLibsWithTags: [
                'type:ui',
                'type:data-access',
                'type:feature',
                'type:shell',
                'type:app',
              ],
            },

            // ── Web layers (Angular) ─────────────────────────────────────────
            // ui: presentational only — inputs and outputs, no HTTP
            {
              sourceTag: 'type:ui',
              notDependOnLibsWithTags: [
                'type:data-access',
                'type:feature',
                'type:shell',
                'type:app',
              ],
            },
            // data-access: HTTP only — no components
            {
              sourceTag: 'type:data-access',
              notDependOnLibsWithTags: ['type:ui', 'type:feature', 'type:shell', 'type:app'],
            },
            // feature: smart pages — no app bootstrap
            {
              sourceTag: 'type:feature',
              notDependOnLibsWithTags: ['type:app'],
            },

            // ── Server layers (Clean Architecture, NestJS only) ──────────────
            // domain: innermost — ports, models, pure rules. No knowledge of outer layers.
            {
              sourceTag: 'type:domain',
              notDependOnLibsWithTags: [
                'type:api',
                'type:application',
                'type:infrastructure',
                'type:shell',
              ],
            },
            // application: use cases — no HTTP boundary, no infra implementations
            {
              sourceTag: 'type:application',
              notDependOnLibsWithTags: ['type:api', 'type:infrastructure', 'type:shell'],
            },
            // api (controllers, CLI runners): the inbound boundary — delegates to
            // application, never to infrastructure. type:domain is intentionally not
            // forbidden: api → application → domain is the expected flow and Nx checks
            // transitively.
            {
              sourceTag: 'type:api',
              notDependOnLibsWithTags: ['type:infrastructure', 'type:shell'],
            },
            // infrastructure: implementations of domain ports — no api or application
            {
              sourceTag: 'type:infrastructure',
              notDependOnLibsWithTags: ['type:api', 'type:application', 'type:shell'],
            },
            // shell: wires a feature's layers into one module — no app bootstrap
            {
              sourceTag: 'type:shell',
              notDependOnLibsWithTags: ['type:app'],
            },
            // app: bootstrap entry point — no restrictions
            {
              sourceTag: 'type:app',
              notDependOnLibsWithTags: [],
            },
            // e2e: boots the real app in-process against Postgres, so it may reach
            // the shell and infrastructure. Never web code.
            {
              sourceTag: 'type:e2e',
              notDependOnLibsWithTags: ['platform:web'],
            },
          ],
        },
      ],
    },
  },

  // Forbid NestJS packages in Angular code
  {
    files: WEB,
    rules: {
      'no-restricted-imports': ['error', { patterns: ['@nestjs/*'] }],
    },
  },

  // Forbid Angular packages in NestJS code
  {
    files: SERVER,
    rules: {
      'no-restricted-imports': ['error', { patterns: ['@angular/*', 'primeng/*'] }],
    },
  },

  // Angular TypeScript rules — Angular paths only
  ...angularEslint.configs.tsRecommended.map((config) => ({ ...config, files: WEB })),
  {
    files: WEB,
    processor: angularEslint.processInlineTemplates,
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'pf', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'pf', style: 'camelCase' },
      ],
      // Components are named without the `Component` suffix (Angular 20+ style guide).
      '@angular-eslint/component-class-suffix': 'off',
    },
  },

  // Angular template (HTML) rules
  ...angularEslint.configs.templateRecommended.map((config) => ({
    ...config,
    files: WEB_TEMPLATES,
  })),
  {
    files: WEB_TEMPLATES,
    plugins: { prettier },
    rules: {
      'prettier/prettier': ['error', { parser: 'angular' }],
    },
  },

  // Prettier last to disable conflicting rules
  prettierConfig,
];
