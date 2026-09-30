import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'android/',
      'ios/',
      '.expo/',
      'dist/',
      '**/build/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.ts', '**/*.mts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-console': 'warn',
    },
  },
  {
    files: [
      '*.config.{js,mjs,cjs,mts}',
      'metro.config.js',
      'vitest.config.mts',
    ],
    languageOptions: { globals: { ...globals.node } },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    // The bridge loads `expo` lazily: a static import pulls in `react-native`,
    // which Node cannot load, so every test reaching this file would fail.
    files: ['modules/prisma-audio/src/**/*.ts'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
