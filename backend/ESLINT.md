# ESLint 配置文件

本文件詳細說明 backend 專案的 ESLint 配置、規則設定、調整方式，以及如何執行 lint 檢查。

---

## 目錄

1. [當前配置概覽](#當前配置概覽)
2. [已安裝的套件](#已安裝的套件)
3. [配置檔案結構](#配置檔案結構)
4. [目前啟用的規則](#目前啟用的規則)
5. [如何調整規則](#如何調整規則)
6. [可用的規則集](#可用的規則集)
7. [如何手動執行 Lint](#如何手動執行-lint)
8. [Git Hooks 整合](#git-hooks-整合)
9. [常見問題與解決方案](#常見問題與解決方案)

---

## 當前配置概覽

本專案使用 **ESLint 9.39.0**（最新的 Flat Config 格式），搭配以下主要配置：

- **基礎配置**：ESLint 推薦規則
- **TypeScript 配置**：typescript-eslint 的類型檢查推薦規則
- **NestJS 專用規則**：@darraghor/eslint-plugin-nestjs-typed
- **程式碼格式化**：Prettier 整合（但目前已停用）
- **執行環境**：Node.js + Jest
- **Git Hooks**：使用 husky + lint-staged 自動檢查提交的程式碼

### 配置檔案位置

- 主配置檔：[eslint.config.mjs](eslint.config.mjs)
- TypeScript 配置：[tsconfig.json](tsconfig.json)
- Package 腳本：[package.json](package.json#L15)

---

## 已安裝的套件

以下是專案中與 ESLint 相關的套件：

```json
{
  "@darraghor/eslint-plugin-nestjs-typed": "^6.9.3", // NestJS 專用規則
  "@eslint/eslintrc": "^3.3.1",      // 舊版配置檔支援（向後兼容）
  "@eslint/js": "^9.39.0",           // ESLint 官方推薦規則
  "eslint": "^9.39.0",               // ESLint 核心
  "eslint-config-prettier": "^10.1.8",  // Prettier 與 ESLint 整合配置
  "eslint-plugin-prettier": "^5.5.4",   // Prettier 作為 ESLint 規則
  "typescript-eslint": "^8.46.2",    // TypeScript ESLint 支援
  "globals": "^16.0.0",              // 全域變數定義
  "prettier": "^3.4.2",              // 程式碼格式化工具
  "husky": "^9.1.7",                 // Git hooks 管理工具
  "lint-staged": "^16.2.6"           // 針對 staged 檔案執行 linter
}
```

---

## 配置檔案結構

### eslint.config.mjs 詳解

```javascript
// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // 1. 忽略檔案配置
  {
    ignores: ['eslint.config.mjs'],  // 忽略 ESLint 配置檔本身
  },

  // 2. 套用 ESLint 推薦規則
  eslint.configs.recommended,

  // 3. 套用 TypeScript 推薦規則（含類型檢查）
  ...tseslint.configs.recommendedTypeChecked,

  // 4. 套用 Prettier 推薦配置
  eslintPluginPrettierRecommended,

  // 5. 語言與環境配置
  {
    languageOptions: {
      globals: {
        ...globals.node,    // Node.js 全域變數（如 process, __dirname）
        ...globals.jest,    // Jest 測試框架全域變數（如 describe, it, expect）
      },
      sourceType: 'commonjs',  // 模組系統類型
      parserOptions: {
        projectService: true,           // 使用 TypeScript Project Service
        tsconfigRootDir: import.meta.dirname,  // tsconfig.json 根目錄
      },
    },
  },

  // 6. 自訂規則覆寫
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',      // 允許使用 any 類型
      '@typescript-eslint/no-floating-promises': 'warn', // Promise 未處理警告
      '@typescript-eslint/no-unsafe-argument': 'warn',  // 不安全參數警告
      'prettier/prettier': 'off',                       // 停用 Prettier 規則
    },
  },
);
```

### 配置層級說明

1. **ignores**: 指定不需要 lint 的檔案
2. **推薦規則集**: 套用業界最佳實踐
3. **語言設定**: 定義執行環境與解析器
4. **自訂規則**: 根據專案需求調整

---

## 目前啟用的規則

### 規則嚴重等級

- `'off'` 或 `0`: 關閉規則
- `'warn'` 或 `1`: 警告（不會導致退出碼錯誤）
- `'error'` 或 `2`: 錯誤（會導致退出碼錯誤）

### 當前自訂規則

| 規則名稱 | 等級 | 說明 | 原因 |
|---------|------|------|------|
| `@typescript-eslint/no-explicit-any` | warn | 允許使用 `any` 類型 | 提供開發彈性 |
| `@typescript-eslint/no-floating-promises` | warn | 未處理的 Promise | 避免遺漏錯誤處理 |
| `@typescript-eslint/no-unsafe-argument` | warn | 傳遞不安全類型的參數 | 提醒潛在類型問題 |
| `prettier/prettier` | off | Prettier 格式檢查 | 已透過獨立腳本處理 |

### 繼承的重要規則（來自推薦配置）

以下是繼承自 `eslint:recommended` 和 `typescript-eslint/recommended-type-checked` 的重要規則：

**基礎 JavaScript 規則**：
- `no-unused-vars`: 禁止未使用的變數
- `no-undef`: 禁止未定義的變數
- `no-console`: 警告 console 語句（通常在推薦配置中是 off）
- `no-debugger`: 禁止 debugger 語句

**TypeScript 規則**：
- `@typescript-eslint/no-unused-vars`: TypeScript 版本的未使用變數檢查
- `@typescript-eslint/no-explicit-any`: 禁止 any 類型（已覆寫為 off）
- `@typescript-eslint/ban-ts-comment`: 限制 @ts-ignore 等註解
- `@typescript-eslint/no-misused-promises`: 檢查 Promise 誤用

---

## 如何調整規則

### 方法 1：修改 eslint.config.mjs

在配置檔的 `rules` 物件中新增或修改規則：

```javascript
{
  rules: {
    // 新增規則
    'no-console': 'warn',  // 警告使用 console
    '@typescript-eslint/explicit-function-return-type': 'error',  // 強制函數返回類型

    // 修改現有規則
    '@typescript-eslint/no-floating-promises': 'error',  // 改為錯誤等級

    // 帶參數的規則
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I']
      }
    ],
  },
}
```

### 方法 2：針對特定檔案調整

在 `eslint.config.mjs` 中新增檔案特定配置：

```javascript
export default tseslint.config(
  // ... 現有配置 ...

  // 針對測試檔案的特殊規則
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',  // 測試中允許 any
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },

  // 針對特定目錄
  {
    files: ['src/migrations/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
);
```

### 方法 3：在程式碼中暫時停用

```typescript
// 停用整個檔案的規則
/* eslint-disable @typescript-eslint/no-explicit-any */

// 停用單行
const data: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

// 停用下一行
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = {};

// 停用區塊
/* eslint-disable @typescript-eslint/no-explicit-any */
const data: any = {};
const moreData: any = {};
/* eslint-enable @typescript-eslint/no-explicit-any */
```

---

## 可用的規則集

### 1. ESLint 核心規則

官方文件：https://eslint.org/docs/latest/rules/

**常用推薦規則**：

```javascript
{
  rules: {
    // 程式碼品質
    'no-console': 'warn',              // 禁止 console
    'no-debugger': 'error',            // 禁止 debugger
    'no-alert': 'warn',                // 禁止 alert
    'no-var': 'error',                 // 禁止使用 var
    'prefer-const': 'error',           // 優先使用 const
    'prefer-arrow-callback': 'warn',   // 優先使用箭頭函數

    // 最佳實踐
    'eqeqeq': ['error', 'always'],     // 強制使用 === 和 !==
    'curly': ['error', 'all'],         // 強制大括號風格
    'no-eval': 'error',                // 禁止 eval()
    'no-implied-eval': 'error',        // 禁止隱式 eval

    // 程式碼風格
    'semi': ['error', 'always'],       // 強制分號
    'quotes': ['error', 'single'],     // 強制單引號
    'indent': ['error', 2],            // 縮排 2 空格
  },
}
```

### 2. TypeScript ESLint 規則

官方文件：https://typescript-eslint.io/rules/

**類型安全規則**：

```javascript
{
  rules: {
    // 類型檢查
    '@typescript-eslint/no-explicit-any': 'error',          // 禁止 any
    '@typescript-eslint/explicit-function-return-type': 'warn',  // 函數返回類型
    '@typescript-eslint/explicit-module-boundary-types': 'warn', // 模組邊界類型
    '@typescript-eslint/no-unsafe-assignment': 'error',     // 禁止不安全賦值
    '@typescript-eslint/no-unsafe-call': 'error',           // 禁止不安全呼叫
    '@typescript-eslint/no-unsafe-member-access': 'error',  // 禁止不安全成員存取

    // Promise 處理
    '@typescript-eslint/no-floating-promises': 'error',     // 強制處理 Promise
    '@typescript-eslint/no-misused-promises': 'error',      // 禁止誤用 Promise
    '@typescript-eslint/await-thenable': 'error',           // 只 await Thenable

    // 程式碼品質
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',                              // 忽略 _ 開頭參數
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/prefer-nullish-coalescing': 'warn', // 優先使用 ??
    '@typescript-eslint/prefer-optional-chain': 'warn',     // 優先使用 ?.

    // 命名規範
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
      },
      {
        selector: 'class',
        format: ['PascalCase'],
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
      },
    ],
  },
}
```

### 3. 預設配置集

可以直接使用的配置集：

```javascript
import tseslint from 'typescript-eslint';

// TypeScript 推薦配置（不含類型檢查）
...tseslint.configs.recommended,

// TypeScript 推薦配置（含類型檢查）- 目前使用
...tseslint.configs.recommendedTypeChecked,

// TypeScript 嚴格配置
...tseslint.configs.strict,

// TypeScript 嚴格配置（含類型檢查）
...tseslint.configs.strictTypeChecked,

// TypeScript 風格配置
...tseslint.configs.stylistic,

// TypeScript 風格配置（含類型檢查）
...tseslint.configs.stylisticTypeChecked,
```

### 4. NestJS 專用規則（已安裝）

本專案已安裝並啟用 NestJS 專用規則：

```bash
npm install --save-dev @darraghor/eslint-plugin-nestjs-typed
```

目前在 [eslint.config.mjs](eslint.config.mjs#L38-L42) 中已啟用以下規則：

```javascript
{
  plugins: {
    '@darraghor/nestjs-typed': nestjsTyped.plugin,
  },
  rules: {
    '@darraghor/nestjs-typed/injectable-should-be-provided': 'error',
    '@darraghor/nestjs-typed/controllers-should-supply-api-tags': 'warn',
    '@darraghor/nestjs-typed/api-method-should-specify-api-response': 'warn',
    '@darraghor/nestjs-typed/validated-non-primitive-property-needs-type-decorator': 'warn',
  },
}
```

**可用的 NestJS 規則**：
- `all-properties-have-explicit-defined` - 所有屬性都明確定義
- `api-property-matches-property-optionality` - API 屬性符合屬性可選性
- `injectable-should-be-provided` - Injectable 應該被提供（已啟用）
- `no-duplicate-decorators` - 禁止重複裝飾器
- `provided-injected-should-match-factory-parameters` - 提供的注入應符合工廠參數
- `controllers-should-supply-api-tags` - 控制器應提供 API 標籤（已啟用）
- `api-method-should-specify-api-response` - API 方法應指定回應（已啟用）
- `api-method-should-specify-api-operation` - API 方法應指定操作
- `api-enum-property-best-practices` - API 枚舉屬性最佳實踐
- `api-property-returning-array-should-set-array` - 返回陣列的 API 屬性應設置陣列
- `should-specify-forbid-unknown-values` - 應指定禁止未知值
- `param-decorator-name-matches-route-param` - 參數裝飾器名稱匹配路由參數
- `validated-non-primitive-property-needs-type-decorator` - 驗證的非原始屬性需要類型裝飾器（已啟用）
- `validate-nested-of-array-should-set-each` - 陣列的嵌套驗證應設置 each
- `all-properties-are-whitelisted` - 所有屬性都在白名單中
- `api-methods-should-be-guarded` - API 方法應該有守衛
- `sort-module-metadata-arrays` - 排序模組元數據陣列

---

## 如何手動執行 Lint

### 基本指令

在 [package.json](package.json#L15) 中已定義以下腳本：

```json
{
  "scripts": {
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix"
  }
}
```

### 執行方式

#### 1. 執行 Lint 並自動修復

```bash
npm run lint
```

這會：
- 檢查 `src/`, `apps/`, `libs/`, `test/` 目錄下的所有 `.ts` 檔案
- 自動修復可修復的問題
- 顯示無法自動修復的問題

#### 2. 只檢查不修復

```bash
npx eslint "{src,apps,libs,test}/**/*.ts"
```

#### 3. 檢查特定檔案

```bash
npx eslint src/app.controller.ts
```

#### 4. 檢查特定目錄

```bash
npx eslint src/
```

#### 5. 使用不同輸出格式

```bash
# JSON 格式
npx eslint "{src,apps,libs,test}/**/*.ts" --format json

# Compact 格式（簡潔輸出）
npx eslint "{src,apps,libs,test}/**/*.ts" --format compact

# 輸出到檔案
npx eslint "{src,apps,libs,test}/**/*.ts" --format json -o eslint-report.json
```

#### 6. 檢查但忽略警告

```bash
npx eslint "{src,apps,libs,test}/**/*.ts" --quiet
```

只顯示錯誤（error），隱藏警告（warn）。

#### 7. 除錯模式

```bash
npx eslint "{src,apps,libs,test}/**/*.ts" --debug
```

顯示詳細的除錯資訊。

---

## Git Hooks 整合

本專案已整合 **husky** 和 **lint-staged**，確保只有符合 lint 規則的程式碼才能成功提交。

### 已安裝的套件

```bash
npm install --save-dev husky lint-staged
```

### 配置說明

#### 1. Git Hooks 設定

在專案根目錄的 [.husky/pre-commit](../.husky/pre-commit) 檔案：

```bash
cd backend && npx lint-staged
```

這個 hook 會在每次執行 `git commit` 前自動執行。

#### 2. lint-staged 配置

在 [package.json](package.json#L75-L80) 中的配置：

```json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

**說明**：
- `"*.ts"`: 只處理 staged 的 TypeScript 檔案
- `"eslint --fix"`: 自動修復可修復的 lint 錯誤
- `"prettier --write"`: 自動格式化程式碼

### 工作流程

當你執行 `git commit` 時：

1. **觸發 pre-commit hook**
   ```
   → husky 偵測到 commit 動作
   → 執行 .husky/pre-commit 腳本
   ```

2. **執行 lint-staged**
   ```
   → 找出所有 staged 的 .ts 檔案
   → 對每個檔案執行 eslint --fix
   → 對每個檔案執行 prettier --write
   ```

3. **檢查結果**
   - ✅ **如果沒有錯誤**：commit 成功，自動應用修復
   - ❌ **如果有錯誤**：commit 失敗，需要手動修正

### 實際範例

#### 成功的 commit

```bash
$ git add src/app.service.ts
$ git commit -m "feat: add new service"

[STARTED] Backing up original state...
[COMPLETED] Backed up original state in git stash
[STARTED] Running tasks for staged files...
[STARTED] *.ts — 1 file
[STARTED] eslint --fix
[COMPLETED] eslint --fix
[STARTED] prettier --write
[COMPLETED] prettier --write
[COMPLETED] *.ts — 1 file
[COMPLETED] Running tasks for staged files...

✔ All tasks completed successfully!
[restart-app abc1234] feat: add new service
 1 file changed, 10 insertions(+)
```

#### 失敗的 commit（有 lint 錯誤）

```bash
$ git add src/bad-code.ts
$ git commit -m "feat: add code with errors"

[STARTED] Running tasks for staged files...
[STARTED] *.ts — 1 file
[STARTED] eslint --fix
[FAILED] eslint --fix [FAILED]

✖ eslint --fix:

/Users/1-xing/Documents/noInvite/backend/src/bad-code.ts
  3:27  warning  Unexpected any. Specify a different type       @typescript-eslint/no-explicit-any
  5:3   error    Async method has no 'await' expression         @typescript-eslint/require-await
  7:5   warning  Promises must be awaited                       @typescript-eslint/no-floating-promises

✖ 3 problems (1 error, 2 warnings)

husky - pre-commit script failed (code 1)
```

這時你需要：
1. 查看錯誤訊息
2. 手動修正程式碼
3. 重新 add 和 commit

### Git Hooks 設定位置

由於專案是 monorepo 結構（backend 在子目錄），Git hooks 配置在根目錄：

```
noInvite/
├── .git/                    # Git 倉庫
├── .husky/                  # Git hooks（已設定）
│   └── pre-commit          # 執行 lint-staged
└── backend/                # backend 專案
    ├── package.json        # 包含 lint-staged 配置
    └── eslint.config.mjs   # ESLint 配置
```

### 手動執行 lint-staged

如果想在不 commit 的情況下測試 lint-staged：

```bash
cd backend
npx lint-staged
```

### 暫時跳過 Git Hooks（不建議）

緊急情況下可以跳過 pre-commit hook：

```bash
git commit --no-verify -m "emergency fix"
```

⚠️ **警告**：這會跳過所有檢查，請謹慎使用！

### 整合至 CI/CD

在 CI 環境中，建議使用：

```bash
# 不要自動修復，只檢查
npx eslint "{src,apps,libs,test}/**/*.ts" --max-warnings 0
```

`--max-warnings 0` 確保任何警告都會導致 CI 失敗。

### 疑難排解

#### Q: Git hook 沒有執行？

檢查 git config：

```bash
git config core.hooksPath
# 應該顯示: .husky
```

如果不是，執行：

```bash
git config core.hooksPath .husky
```

#### Q: lint-staged 找不到檔案？

確認你在正確的目錄：

```bash
# 錯誤：在根目錄執行
cd /Users/1-xing/Documents/noInvite
npx lint-staged  # ❌ 找不到配置

# 正確：在 backend 目錄執行
cd /Users/1-xing/Documents/noInvite/backend
npx lint-staged  # ✅ 正確
```

或從根目錄提交時，hook 會自動 `cd backend`。

---

## 常見問題與解決方案

### Q1: ESLint 報錯但 TypeScript 編譯通過

**原因**：ESLint 的類型檢查規則比 TypeScript 編譯器更嚴格。

**解決方案**：
1. 修正程式碼以符合規則
2. 或調整規則嚴重等級為 `warn`
3. 或在特定情況下停用規則

### Q2: 出現 "Parsing error: Cannot read file 'tsconfig.json'"

**原因**：ESLint 找不到 TypeScript 配置檔。

**解決方案**：

確認 [eslint.config.mjs](eslint.config.mjs#L22-L24) 中的 `parserOptions` 設定正確：

```javascript
parserOptions: {
  projectService: true,
  tsconfigRootDir: import.meta.dirname,
}
```

### Q3: 某些檔案被忽略了

**檢查方法**：

```bash
npx eslint --debug-files src/your-file.ts
```

**解決方案**：

檢查 [eslint.config.mjs](eslint.config.mjs#L9) 的 `ignores` 設定。

### Q4: Prettier 和 ESLint 衝突

**現況**：專案已將 `prettier/prettier` 規則設為 `off`，使用獨立的 Prettier 腳本。

**建議做法**：

分別執行格式化和 lint：

```bash
# 先格式化
npm run format

# 再 lint
npm run lint
```

### Q5: 效能問題（lint 很慢）

**優化方案**：

1. **使用快取**：

```bash
npx eslint "{src,apps,libs,test}/**/*.ts" --cache
```

2. **只檢查已修改的檔案**：

```bash
git diff --name-only --diff-filter=ACMR | grep '\.ts$' | xargs npx eslint
```

3. **並行執行（實驗性）**：

安裝 `eslint-parallel`：

```bash
npm install --save-dev eslint-parallel
```

使用：

```bash
npx eslint-parallel "{src,apps,libs,test}/**/*.ts"
```

### Q6: 如何暫時停用所有規則

**不建議，但緊急情況可用**：

```typescript
/* eslint-disable */
// 程式碼
/* eslint-enable */
```

### Q7: VS Code 整合

安裝 ESLint 擴充功能，並在 `.vscode/settings.json` 中設定：

```json
{
  "eslint.validate": [
    "javascript",
    "typescript"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## 進階配置範例

### 完整嚴格配置範例

如果想要更嚴格的檢查：

```javascript
export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // 嚴格模式
      'no-console': 'warn',
      'no-debugger': 'error',

      // TypeScript 嚴格規則
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',

      // 程式碼風格
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['I'],
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
      ],

      // Prettier
      'prettier/prettier': 'error',
    },
  },
  // 測試檔案特殊規則
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
    },
  },
);
```

---

## 參考資源

- **ESLint 官方文件**：https://eslint.org/docs/latest/
- **TypeScript ESLint**：https://typescript-eslint.io/
- **ESLint 規則列表**：https://eslint.org/docs/latest/rules/
- **TypeScript ESLint 規則**：https://typescript-eslint.io/rules/
- **Flat Config 遷移指南**：https://eslint.org/docs/latest/use/configure/migration-guide
- **NestJS 官方文件**：https://docs.nestjs.com/

---

## 總結

本專案採用現代化的 ESLint 9 Flat Config 格式，搭配 TypeScript 類型檢查規則，提供平衡的程式碼品質保證。透過本文件，您可以：

1. ✅ 了解當前的 lint 配置
2. ✅ 知道如何調整和自訂規則
3. ✅ 掌握可用的規則選項
4. ✅ 熟悉執行 lint 的各種方式

建議定期執行 `npm run lint` 保持程式碼品質，並根據團隊需求調整規則配置。
