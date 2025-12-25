// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import nestjsTyped from '@darraghor/eslint-plugin-nestjs-typed';

export default tseslint.config(
  {
    // 忽略 eslint 配置檔案本身和測試檔案
    ignores: ['eslint.config.mjs', '**/*.spec.ts', '**/*.e2e-spec.ts'],
  },
  // 使用 ESLint 推薦的基本規則
  eslint.configs.recommended,
  // 使用 TypeScript ESLint 推薦的型別檢查規則
  ...tseslint.configs.recommendedTypeChecked,
  // 整合 Prettier 格式化規則
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        // 加入 Node.js 全域變數
        ...globals.node,
        // 加入 Jest 測試框架全域變數
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        // 啟用專案服務以進行型別檢查
        projectService: true,
        // 設定 tsconfig 的根目錄
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      // 載入 NestJS 型別檢查插件
      '@darraghor/nestjs-typed': nestjsTyped.plugin,
    },
    rules: {
      // TypeScript 相關規則
      '@typescript-eslint/no-explicit-any': 'warn', // 警告使用 any 型別
      '@typescript-eslint/no-floating-promises': 'warn', // 警告未處理的 Promise
      '@typescript-eslint/no-unsafe-argument': 'warn', // 警告不安全的參數型別
      "prettier/prettier": "warn", // 警告 Prettier 格式問題

      // NestJS 專屬規則
      '@darraghor/nestjs-typed/injectable-should-be-provided': 'error', // 可注入的類別必須被提供
      '@darraghor/nestjs-typed/controllers-should-supply-api-tags': 'off', // 控制器應提供 API 標籤
      '@darraghor/nestjs-typed/api-method-should-specify-api-response': 'off', // API 方法應指定回應
      '@darraghor/nestjs-typed/validated-non-primitive-property-needs-type-decorator': 'warn', // 驗證的非原始屬性需要型別裝飾器
    },
  },
);
