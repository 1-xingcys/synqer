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
    // 忽略不需要檢查的目錄和檔案
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
    ],
  },
  // 使用 ESLint 推薦的基本規則
  eslint.configs.recommended,
  // 使用 TypeScript ESLint 推薦的型別檢查規則
  ...tseslint.configs.recommendedTypeChecked,
  // Next.js 推薦規則
  ...nextVitals,
  ...nextTs,
  // 整合 Prettier 格式化規則
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        // 加入 Node.js 全域變數
        ...globals.node,
        // 加入瀏覽器全域變數
        ...globals.browser,
      },
      parserOptions: {
        // 啟用專案服務以進行型別檢查
        projectService: true,
        // 設定 tsconfig 的根目錄
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // TypeScript 相關規則
      '@typescript-eslint/no-explicit-any': 'warn', // 警告使用 any 型別
      '@typescript-eslint/no-floating-promises': 'warn', // 警告未處理的 Promise
      '@typescript-eslint/no-unsafe-argument': 'warn', // 警告不安全的參數型別
      '@typescript-eslint/no-unsafe-assignment': 'warn', // 警告不安全的賦值
      '@typescript-eslint/no-unsafe-member-access': 'warn', // 警告不安全的成員存取
      '@typescript-eslint/no-unsafe-call': 'warn', // 警告不安全的函數呼叫
      '@typescript-eslint/no-unsafe-return': 'warn', // 警告不安全的返回值
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_', // 忽略以 _ 開頭的參數
          varsIgnorePattern: '^_', // 忽略以 _ 開頭的變數
        },
      ],
      'prettier/prettier': 'warn', // 警告 Prettier 格式問題

      // React/Next.js 相關規則
      'react/react-in-jsx-scope': 'off', // Next.js 不需要手動引入 React
      'react/prop-types': 'off', // 使用 TypeScript 所以不需要 prop-types
      'react-hooks/rules-of-hooks': 'error', // 強制 Hook 使用規則
      'react-hooks/exhaustive-deps': 'warn', // 警告 Hook 依賴項問題

      // Tailwind CSS 相關規則
      '@next/next/no-html-link-for-pages': 'off', // 使用 next-intl 的 Link
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
