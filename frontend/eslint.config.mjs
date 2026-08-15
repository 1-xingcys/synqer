// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactPlugin from 'eslint-plugin-react';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default tseslint.config(
  {
    // Directories and files that should not be linted
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'next-env.d.ts',
      'node_modules/**',
      'eslint.config.mjs',
      'jest.config.cjs',
      'postcss.config.mjs',
      'tailwind.config.ts',
      'generated/openapi.ts',
    ],
  },
  // Base recommended ESLint rules
  eslint.configs.recommended,
  // Recommended type-checked rules from typescript-eslint
  ...tseslint.configs.recommendedTypeChecked,
  // Next.js recommended rules
  ...nextVitals,
  ...nextTs,
  // Prettier formatting integration
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        // Node.js globals
        ...globals.node,
        // Browser globals
        ...globals.browser,
      },
      parserOptions: {
        // Enable the project service for type-aware linting
        projectService: true,
        // Root directory used to resolve tsconfig
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn', // warn on the any type
      '@typescript-eslint/no-floating-promises': 'warn', // warn on unhandled promises
      '@typescript-eslint/no-unsafe-argument': 'warn', // warn on unsafe argument types
      '@typescript-eslint/no-unsafe-assignment': 'warn', // warn on unsafe assignments
      '@typescript-eslint/no-unsafe-member-access': 'warn', // warn on unsafe member access
      '@typescript-eslint/no-unsafe-call': 'warn', // warn on unsafe function calls
      '@typescript-eslint/no-unsafe-return': 'warn', // warn on unsafe return values
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_', // ignore arguments prefixed with _
          varsIgnorePattern: '^_', // ignore variables prefixed with _
        },
      ],
      'prettier/prettier': 'warn', // warn on Prettier formatting issues

      // React / Next.js rules
      'react/react-in-jsx-scope': 'off', // Next.js does not require importing React
      'react/prop-types': 'off', // not needed since we use TypeScript
      'react-hooks/rules-of-hooks': 'error', // enforce the rules of hooks
      'react-hooks/exhaustive-deps': 'warn', // warn on incomplete hook dependencies

      // Tailwind CSS rules
      '@next/next/no-html-link-for-pages': 'off', // we use the next-intl Link

      // Time handling: date-fns formats and reads a Date's LOCAL fields, which
      // silently shifts this app's naive wall-clock values (candidate days,
      // votingDeadline, slot axisDate) by the viewer's UTC offset. Everything
      // date-related goes through lib/time/, which is
      // explicit about the zone they read in. react-day-picker still uses
      // date-fns internally; that is its business, not ours.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'date-fns',
              message:
                'date-fns reads local fields. Use lib/time/ (wallClock and zone for instants, calendarDay for calendar days) instead.',
            },
          ],
          patterns: ['date-fns/*'],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
  },
);
