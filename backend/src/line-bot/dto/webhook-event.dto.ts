// LINE Webhook Event Types
// Reference: https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects

export interface WebhookRequestBody {
  destination: string;
  events: WebhookEvent[];
}

export type WebhookEvent =
  | MessageEvent
  | JoinEvent
  | LeaveEvent
  | MemberJoinedEvent
  | MemberLeftEvent
  | FollowEvent
  | UnfollowEvent
  | PostbackEvent;

// Base event structure
interface BaseEvent {
  type: string;
  mode: 'active' | 'standby';
  timestamp: number;
  source: EventSource;
  webhookEventId: string;
  deliveryContext: {
    isRedelivery: boolean;
  };
  replyToken?: string;
}

// Source types
export type EventSource = UserSource | GroupSource | RoomSource;

interface UserSource {
  type: 'user';
  userId: string;
}

interface GroupSource {
  type: 'group';
  groupId: string;
  userId?: string; // May be absent for some events
}

interface RoomSource {
  type: 'room';
  roomId: string;
  userId?: string;
}

// Message event
export interface MessageEvent extends BaseEvent {
  type: 'message';
  message: MessageObject;
}

interface MessageObject {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker';
  text?: string;
}

// Bot joins a group
export interface JoinEvent extends BaseEvent {
  type: 'join';
}

// Bot leaves a group (kicked or group disbanded)
export interface LeaveEvent extends BaseEvent {
  type: 'leave';
}

// User(s) join a group where Bot is present
export interface MemberJoinedEvent extends BaseEvent {
  type: 'memberJoined';
  joined: {
    members: Array<{ type: 'user'; userId: string }>;
  };
}

// User(s) leave a group where Bot is present
export interface MemberLeftEvent extends BaseEvent {
  type: 'memberLeft';
  left: {
    members: Array<{ type: 'user'; userId: string }>;
  };
}

// User follows the Bot
export interface FollowEvent extends BaseEvent {
  type: 'follow';
}

// User unfollows/blocks the Bot
export interface UnfollowEvent extends BaseEvent {
  type: 'unfollow';
}

// Postback event (button clicks)
export interface PostbackEvent extends BaseEvent {
  type: 'postback';
  postback: {
    data: string;
    params?: {
      date?: string;
      time?: string;
      datetime?: string;
    };
  };
}
