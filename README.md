# Web Programming Final Group 13 - Synqer

## Demo 影片連結

[影片連結]

## 服務描述

Synqer 是一個整合 LINE Bot 與 Google 日曆的活動預約與管理系統，旨在打造比 When2meet 更好用的多人約時間解決方案。使用者可以透過 LINE 帳號直接登入，快速發起活動並邀請好友。系統能夠整合參與者的空閒時間，並在時間確認後自動將行程同步至所有參與者的 Google 日曆，實現無縫的行程協調體驗。相較於 When2meet，Synqer 提供更直覺的操作介面、LINE 生態系整合、自動日曆同步等進階功能，大幅提升多人協調效率。

## Deployed 連結

https://synqer.club

## 使用/操作方式

### 伺服器端

- 管理 LINE Messaging API Webhook 與 LIFF 設定。
- 設定 Google Cloud Console OAuth 2.0 認證資訊。
- 維護後端 API 服務與 Prisma/postgreSQL 資料庫。
- 監控伺服器日誌與使用者連線狀態。

### 使用者端

- 加入 Synqer LINE 官方帳號。
- 點擊圖文選單開啟 LIFF 頁面。
- 建立活動：輸入活動資訊並選擇多個候選時段。
- 分享邀請：將活動訊息傳送給 LINE 好友或群組。
- 填寫時間：受邀者點擊訊息進入頁面，勾選方便參加的時間。
- 確認活動：發起人根據大家的回覆決定最終時段。
- 自動同步：系統自動在參與者的 Google 日曆建立活動提醒。

## 其他說明

- 系統支援繁體中文與英文多語系切換。
- 提供符合系統設定的深色與淺色模式 UI 介面。
- 使用 LIFF 讓使用者不需離開 LINE 即可完成所有操作。

## 使用與參考之框架/模組/原始碼

- NestJS (Backend Framework)
- Next.js (Frontend Framework)
- Prisma (ORM)
- Tailwind CSS (CSS Framework)

## 使用之第三方套件、框架、程式碼

- @line/liff: LINE 前端框架整合
- @nestjs/platform-express: 底層通訊框架
- Google Calendar API: 日曆同步功能
- Radix UI: 前端無障礙元件
- Lucide React: 圖示集
- Axios: API 請求處理

## 專題製作心得

B10705009 - 邱一新

B11902173 - 陳順霙

---

## 如何在 localhost 安裝與測試之詳細步驟

### 基本需求

- Node.js (建議 v18 以上)
- Docker (用於執行 Nginx 代理)
- ngrok (用於本地測試 Webhook)
- npm 或 yarn 封裝管理工具

### 安裝步驟

0. 環境變數設定

   請先建立前後端環境變數檔，並依專案需求填入對應的金鑰與網址。

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

   - `backend/.env`：填入資料庫連線、LINE Login/Bot、Google OAuth、JWT/Session 等設定。
   - `frontend/.env.local`：設定前端呼叫的 API 位址與 LIFF ID。

1. 後端設定與啟動

   ```bash
   cd backend
   npm install
   ```

   ```bash
   npx prisma generate
   npx prisma migrate dev
   npm run start:dev
   ```

2. 前端設定與啟動

   ```bash
   cd ../frontend
   npm install
   ```

   ```bash
   npm run dev
   ```

3. 執行 Nginx 腳本

   ```bash
   cd ..
   ./run-nginx.sh
   ```

   此腳本會使用 Docker 啟動 Nginx，監聽本地 8088 端口，並將請求轉發至前端 (3000) 與後端 (8080)。

4. 使用 ngrok 暴露服務

   ```bash
   ngrok http 8088
   ```

   取得 ngrok 的 https 網址，此網址將作為 LINE Bot Webhook 與 Google OAuth 的 Redirect URI 基礎。

### 測試方式

- 將 ngrok 產生的 https 網址填入 LINE Developers Console 的 Webhook URL 欄位。
- 在 Google Cloud Console 設定 Authorized redirect URIs 為 ngrok 網址對應的路徑。
- 透過 LINE 加入機器人好友並點擊選單進行功能測試。

## 每位組員之負責項目

- 組員 A: [負責項目詳述]
- 組員 B: [負責項目詳述]
