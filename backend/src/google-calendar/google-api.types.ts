/**
 * Google API 相關型別定義
 * 這些型別對應 Google OAuth 和 Calendar API 的回應格式
 */

/**
 * PKCE (Proof Key for Code Exchange) 資料
 * 用於 OAuth 2.0 授權流程的安全性增強
 */
export interface PKCEData {
  codeVerifier: string;
  codeChallenge: string;
  redirect?: string;
}

/**
 * Google OAuth Token 回應
 * @see https://developers.google.com/identity/protocols/oauth2/web-server#exchange-authorization-code
 */
export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

/**
 * Google ID Token 的 payload
 * @see https://developers.google.com/identity/protocols/oauth2/openid-connect#an-id-tokens-payload
 */
export interface GoogleIdTokenPayload {
  aud: string; // Audience (client ID)
  iss: string; // Issuer (accounts.google.com)
  exp: number; // Expiration time
  sub: string; // Subject (Google account ID)
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * Google Calendar 事件
 * @see https://developers.google.com/calendar/api/v3/reference/events
 */
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string; // RFC3339 格式，用於有時間的事件
    date?: string; // YYYY-MM-DD 格式，用於全天事件
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status: string; // 'confirmed' | 'tentative' | 'cancelled'
}

/**
 * Google Calendar Events List API 回應
 * @see https://developers.google.com/calendar/api/v3/reference/events/list
 */
export interface GoogleCalendarEventsResponse {
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
}

/**
 * Google Calendar Calendar API 回應
 * @see https://developers.google.com/calendar/api/v3/reference/calendars/get
 */
export interface GoogleCalendarCalenderResponse {
  timeZone: string;
}

/**
 * 格式化後的 Calendar 事件（應用程式內部使用）
 */
export interface CalendarEventDto {
  id: string;
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
}

/**
 * Google Calendar 連結狀態
 */
export interface CalendarConnectionStatus {
  connected: boolean;
  googleEmail?: string;
  connectedAt?: Date;
}

/**
 * Calendar 衝突檢查結果
 */
export interface CalendarConflictResult {
  calendarEvents: CalendarEventDto[];
  conflictingSlotIds: string[];
}
