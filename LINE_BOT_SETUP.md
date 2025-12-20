# LINE Bot 群組管理功能設定指南

本文件說明如何設定 LINE Bot 以追蹤群組成員並發送投票提醒。

## 功能概述

1. **群組成員追蹤**：Bot 加入群組後會自動偵測並記錄成員
2. **成員活動偵測**：透過訊息、加入/離開事件追蹤成員
3. **OAuth 關聯**：當使用者透過 LINE OAuth 登入後，自動關聯其群組成員身份
4. **投票提醒**：活動擁有者可以透過 Bot 在群組中標註未投票的成員
5. **@Mention 查詢活動**：當群組成員 @Synqer 時，Bot 會顯示該群組所有進行中的活動
6. **LIFF 整合**：使用者點擊 Flex Message 按鈕後，會在 LINE 內開啟網頁並自動登入

## 重要概念：兩個 Channel

LINE Messaging API 和 LINE Login 是**兩個完全不同的 Channel**，有不同的用途：

| Channel 類型 | 用途 |
|-------------|------|
| **LINE Messaging API** | 機器人通訊專用：收私訊、收群組訊息、Webhook 事件、回訊息、Push/Reply、標人、Rich Menu 等 |
| **LINE Login** | 使用者身分認證專用（OAuth）：使用者登入、取得 email、OAuth userId、OpenID Token、綁定網站帳號 |

## 環境變數設定

### 後端 Backend `.env`

```env
# ========== LINE BOT (Messaging API Channel) ==========
LINE_BOT_CHANNEL_ID=your_messaging_api_channel_id
LINE_BOT_CHANNEL_SECRET=your_messaging_api_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token

# ========== LINE LOGIN (Login Channel) ==========
LINE_LOGIN_CHANNEL_ID=your_login_channel_id
LINE_LOGIN_CHANNEL_SECRET=your_login_channel_secret
LINE_LOGIN_REDIRECT_URI=https://your-domain.com/auth/line/callback

# ========== LINE LIFF ==========
# LIFF URL 用於 Flex Message 中的連結
# 格式：https://liff.line.me/你的LIFF_ID
LINE_LIFF_URL=https://liff.line.me/1234567890-xxxxxxxx

# ========== 其他 ==========
WEB_ORIGIN=http://localhost:3000
```

### 前端 Frontend `.env.local`

```env
# API 端點
NEXT_PUBLIC_API=http://localhost:3001

# LINE LIFF ID（從 LINE Developers Console 取得）
# 格式：1234567890-xxxxxxxx
NEXT_PUBLIC_LINE_LIFF_ID=1234567890-xxxxxxxx
```

## LINE Developers Console 設定

### 1. 建立 LINE Login Channel（用於 OAuth 登入）

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 選擇你的 Provider
3. 建立新的 Channel，選擇 **LINE Login**
4. 記錄 **Channel ID** 和 **Channel Secret**
5. 在 **LINE Login** 頁籤設定 **Callback URL**

### 2. 建立 Messaging API Channel（用於 Bot）

1. 在同一個 Provider 下建立新的 Channel，選擇 **Messaging API**
2. 記錄 **Channel ID** 和 **Channel Secret**
3. 在 **Messaging API** 頁籤：
   - 取得 **Channel access token (long-lived)**
   - 設定 **Webhook URL** 為 `https://your-domain.com/line-bot/webhook`
   - 開啟 **Use webhook**
   - 關閉 **Auto-reply messages** 和 **Greeting messages**

### 3. 建立 LIFF App（用於 LINE 內開啟網頁）

LIFF (LINE Front-end Framework) 讓使用者可以在 LINE App 內開啟網頁，並自動取得使用者身份。

1. 在 **LINE Login Channel** 中，點選 **LIFF** 頁籤
2. 點擊 **Add** 新增一個 LIFF App
3. 設定以下項目：
   - **LIFF app name**：Synqer（或你的應用名稱）
   - **Size**：選擇 `Full`（全螢幕）
   - **Endpoint URL**：你的前端網址，例如 `https://your-frontend-domain.com`
   - **Scope**：勾選 `profile` 和 `openid`
   - **Bot link feature**：選擇 `Off` 或依需求設定
4. 新增後，記錄 **LIFF ID**（格式：`1234567890-xxxxxxxx`）
5. 將 LIFF ID 設定到環境變數

**重要**：LIFF 是建立在 LINE Login Channel 之下，不是 Messaging API Channel。

### 4. Bot 權限設定

在 LINE Official Account Manager 設定：
- **允許 Bot 加入群組**
- **取得群組成員資訊**（可能需要通過 LINE 審核）

## 資料庫遷移

運行以下命令更新資料庫 schema：

```bash
cd backend
npx prisma migrate dev --name add-line-bot-models
```

## API 端點

### Webhook（LINE Platform 呼叫）

```
POST /line-bot/webhook
```

LINE Platform 會將以下事件發送到此端點：
- `join`：Bot 加入群組
- `leave`：Bot 離開群組
- `memberJoined`：成員加入群組
- `memberLeft`：成員離開群組
- `message`：群組內訊息（用於偵測成員）

### 取得群組列表

```
GET /line-bot/groups
Authorization: Session Cookie
```

回傳所有 Bot 所在的活躍群組。

### 取得群組成員

```
GET /line-bot/groups/:groupId/members
Authorization: Session Cookie
```

回傳指定群組的所有活躍成員。

### 發送提醒

```
POST /line-bot/groups/:groupId/remind
Authorization: Session Cookie
Content-Type: application/json

{
  "eventId": "event_id",
  "lineUserIds": ["user_id_1", "user_id_2"]
}
```

### 活動相關

```
# 建立活動時綁定 LINE 群組和預期參與者
POST /events
{
  "title": "活動名稱",
  "startDate": "2025-01-01",
  "endDate": "2025-01-02",
  "startTime": "09:00",
  "endTime": "18:00",
  "lineGroupId": "line_group_db_id",
  "expectedLineUserIds": ["line_user_id_1", "line_user_id_2"]
}

# 取得未投票的預期參與者
GET /events/:eventId/unvoted

# 發送投票提醒
POST /events/:eventId/remind
{
  "lineUserIds": ["line_user_id_1", "line_user_id_2"]
}
```

## 資料模型

### LineGroup

| 欄位 | 說明 |
|------|------|
| id | 資料庫 ID |
| lineGroupId | LINE 群組 ID |
| groupName | 群組名稱 |
| isActive | Bot 是否仍在群組中 |
| botJoinedAt | Bot 加入時間 |

### LineGroupMember

| 欄位 | 說明 |
|------|------|
| id | 資料庫 ID |
| lineGroupId | 所屬群組 ID |
| lineUserId | LINE 使用者 ID |
| displayName | 顯示名稱 |
| pictureUrl | 頭像 URL |
| isActive | 是否仍在群組中 |
| userId | 關聯的系統使用者 ID（OAuth 後） |

### EventExpectedParticipant

| 欄位 | 說明 |
|------|------|
| id | 資料庫 ID |
| eventId | 活動 ID |
| lineUserId | LINE 使用者 ID |
| userId | 關聯的系統使用者 ID |
| hasVoted | 是否已投票 |
| reminderSentAt | 最後提醒時間 |

## 限制說明

由於 LINE API 限制，Bot **無法主動取得群組中所有成員的資訊**。成員資訊只能透過以下方式取得：

1. **訊息事件**：當成員在群組發言時
2. **加入事件**：當成員加入群組時
3. **離開事件**：當成員離開群組時

因此，群組成員列表可能不完整，需要隨時間累積。當使用者透過 LINE OAuth 登入後，系統會自動將其與群組成員記錄關聯。

## @Mention 活動查詢功能

當群組成員在群組中 @Synqer（標註 Bot）時，Bot 會：

1. **查詢該群組所有進行中的活動**（非 COMPLETED 狀態）
2. **為每個活動發送 Flex Message**，包含：
   - 主辦人資訊（displayName + pictureUrl）
   - 活動標題與描述
   - 狀態標籤（投票中/投票截止/時間已定）
   - 時間資訊（依狀態顯示不同內容）
   - 投票進度（僅限 VOTING 狀態）
   - 操作按鈕（透過 LIFF 開啟對應頁面）
3. **對於投票中的活動**，如果有人還沒投票，會額外發送提醒訊息

### Flex Message 按鈕連結

| 狀態 | 按鈕文字 | 連結頁面 |
|------|---------|---------|
| VOTING | 前往投票 | `/joined/[eventId]` |
| VOTING_ENDED | 投票結果 | `/joined/[eventId]/results` |
| CONFIRMED | 查看活動 | `/joined/[eventId]` |

### LIFF 自動登入流程

1. 使用者點擊 Flex Message 按鈕
2. LINE App 開啟 LIFF 網頁
3. 前端自動取得 LIFF Access Token
4. 前端將 Access Token 送到後端 `/auth/liff/login`
5. 後端驗證 Token 並建立 Session
6. 使用者自動登入，可直接操作

## 測試

1. 將 Bot 加入測試群組
2. 確認 Webhook 收到 `join` 事件
3. 在群組中發言，確認成員被記錄
4. 建立活動並指定預期參與者
5. 測試提醒功能
6. 在群組中 @Synqer，確認 Bot 回覆活動列表
7. 點擊 Flex Message 按鈕，確認 LIFF 自動登入正常

