// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactPlugin from 'eslint-plugin-react';
import globals from 'globals';
import jupyterPlugin from '@jupyter/eslint-plugin';
import * as jsoncParser from 'jsonc-eslint-parser';

export default defineConfig([
  {
    ignores: [
      'node_modules/**',
      '**/build/**',
      '**/lib/**',
      '**/node_modules/**',
      '**/mock_packages/**',
      '**/static/**',
      '**/typings/**',
      '**/schemas/**',
      '**/themes/**',
      'coverage/**',
      '**/*.map.js',
      '**/*.bundle.js',
      '.idea/**',
      '.history/**',
      '.vscode/**',
      'docs/_build/**',
      'app/extensions/**',
      '**/*.js',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  reactPlugin.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      jupyter: jupyterPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2015,
        ...globals.commonjs,
        ...globals.node,
      },
      parserOptions: {
        project: 'tsconfig.eslint.json',
      },
    },
    rules: {
      'jupyter/command-described-by': 'error',
      'jupyter/command-id-convention': 'error',
      'jupyter/no-schema-enum': 'error',
      'jupyter/plugin-id-convention': 'error',
      'jupyter/plugin-activation-args': 'error',
      'jupyter/plugin-description': 'error',
      'jupyter/token-format': 'error',
      'jupyter/no-translation-concatenation': 'error',
      'jupyter/no-untranslated-string': 'error',
      'jupyter/require-soft-assertions-before-snapshots': 'error',
      'jupyter/incorrect-translator-usage': 'error',
      'jupyter/no-dynamic-translation': 'error',
      'jupyter/prefer-lazy-imports': [
        'error',
        {
          // JupyterLite packages and the in-browser services stack are always
          // loaded at startup.
          ignoreImports: ['@jupyterlite/*', 'localforage', 'mock-socket'],
        },
      ],
      'jupyter/prefer-signal-this-arg': 'error',
      'jupyter/require-disposable-ownership': 'error',
      'jupyter/require-disposable-transfer': 'error',
      'jupyter/require-signal-cleanup': 'error',
      'jupyter/require-signal-this-arg': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: true,
          },
        },
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'prefer-arrow-callback': 'error',
      curly: ['error', 'all'],
      eqeqeq: 'error',
    },
  },
  {
    files: ['**/schema/*.json'],
    languageOptions: { parser: jsoncParser },
    plugins: { jupyter: jupyterPlugin },
    rules: {
      'jupyter/no-schema-enum': 'error',
    },
  },
  {
    files: ['ui-tests/test/**/*.{ts,tsx}'],
    plugins: { jupyter: jupyterPlugin },
    rules: {
      'jupyter/galata-prefer-context-menu-helper': 'error',
      'jupyter/galata-prefer-menu-helper': 'error',
      'jupyter/galata-prefer-sidebar-activity-helper': 'error',
      'jupyter/no-untranslated-string': 'off',
    },
  },
  {
    // These tests use plain Playwright on purpose (Galata's page fixture waits
    // for the app to load), so the `page.menu` helper is not available.
    files: ['ui-tests/test/page.spec.ts'],
    rules: {
      'jupyter/galata-prefer-menu-helper': 'off',
    },
  },
  eslintPluginPrettierRecommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/quotes': [
        'error',
        'single',
        { avoidEscape: true, allowTemplateLiterals: 'never' },
      ],
    },
  },
]);
