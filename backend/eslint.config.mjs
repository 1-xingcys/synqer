// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import nestjsTyped from '@darraghor/eslint-plugin-nestjs-typed';

export default tseslint.config(
  {
    // Ignore the ESLint config itself and test files
    ignores: ['eslint.config.mjs', '**/*.spec.ts', '**/*.e2e-spec.ts'],
  },
  // Base recommended ESLint rules
  eslint.configs.recommended,
  // Recommended type-checked rules from typescript-eslint
  ...tseslint.configs.recommendedTypeChecked,
  // Prettier formatting integration
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        // Node.js globals
        ...globals.node,
        // Jest globals
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        // Enable the project service for type-aware linting
        projectService: true,
        // Root directory used to resolve tsconfig
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      // NestJS type-checking plugin
      '@darraghor/nestjs-typed': nestjsTyped.plugin,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn', // warn on the any type
      '@typescript-eslint/no-floating-promises': 'warn', // warn on unhandled promises
      '@typescript-eslint/no-unsafe-argument': 'warn', // warn on unsafe argument types
      "prettier/prettier": "warn", // warn on Prettier formatting issues

      // NestJS-specific rules
      '@darraghor/nestjs-typed/injectable-should-be-provided': 'error', // injectables must be provided
      '@darraghor/nestjs-typed/controllers-should-supply-api-tags': 'off', // controllers should supply API tags
      '@darraghor/nestjs-typed/api-method-should-specify-api-response': 'off', // API methods should specify a response
      '@darraghor/nestjs-typed/validated-non-primitive-property-needs-type-decorator': 'warn', // validated non-primitive properties need a type decorator
    },
  },
);
