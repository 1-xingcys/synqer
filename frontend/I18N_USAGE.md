# i18n 多語系使用說明

## 專案結構

```
frontend/
├── app/
│   ├── [locale]/           # 語言動態路由
│   │   ├── layout.tsx      # 包含 NextIntlClientProvider 的佈局
│   │   ├── page.tsx        # 首頁（使用 t() 翻譯）
│   │   └── example.tsx     # 使用範例
│   └── layout.tsx          # 根佈局（重定向到預設語言）
├── i18n/
│   ├── request.ts          # i18n 請求配置
│   └── routing.ts          # 路由配置（支援語言：zh-TW, zh-CN, en）
├── messages/               # 翻譯檔案
│   ├── zh-TW.json          # 繁體中文（預設）
│   ├── zh-CN.json          # 簡體中文
│   └── en.json             # 英文
└── middleware.ts           # 處理語言路由的中介層
```

## 使用方式

### 1. 在 Server Component 中使用

```tsx
import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations("home");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </div>
  );
}
```

### 2. 在 Client Component 中使用

```tsx
"use client";

import { useTranslations } from "next-intl";

export default function ClientComponent() {
  const t = useTranslations("common");

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p>{t("hello")}</p>
    </div>
  );
}
```

### 3. 語言切換

使用 `Link` 組件來切換語言：

```tsx
import { Link } from '@/i18n/routing';

<Link href="/" locale="zh-TW">繁體中文</Link>
<Link href="/" locale="zh-CN">简体中文</Link>
<Link href="/" locale="en">English</Link>
```

### 4. 新增翻譯內容

在 `messages/zh-TW.json`、`messages/zh-CN.json` 和 `messages/en.json` 中新增：

```json
{
  "yourNamespace": {
    "yourKey": "您的翻譯內容"
  }
}
```

然後在組件中使用：

```tsx
const t = useTranslations("yourNamespace");
return <p>{t("yourKey")}</p>;
```

## URL 結構

- `/` → 自動重定向到 `/zh-TW`（預設語言）
- `/zh-TW` → 繁體中文版本
- `/zh-CN` → 簡體中文版本
- `/en` → 英文版本

## 程式化導航

```tsx
"use client";

import { useRouter } from "@/i18n/routing";

export default function Component() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/about"); // 會自動保持當前語言
  };

  return <button onClick={handleClick}>Go to About</button>;
}
```

## 取得當前語言

```tsx
import { useLocale } from "next-intl";

export default function Component() {
  const locale = useLocale();

  return <p>Current language: {locale}</p>;
}
```

## 修改預設語言

在 `i18n/routing.ts` 中修改：

```typescript
export const routing = defineRouting({
  locales: ["en", "zh-TW", "zh-CN"],
  defaultLocale: "zh-TW", // 修改這裡
});
```

## 新增更多語言

1. 在 `i18n/routing.ts` 的 `locales` 陣列中新增語言代碼
2. 在 `messages/` 目錄下建立對應的 JSON 檔案（例如：`ja.json`）
3. 在 `middleware.ts` 的 `matcher` 中新增語言代碼

## 運行專案

```bash
npm run dev
```

訪問 http://localhost:3000 會自動重定向到 http://localhost:3000/zh-TW
