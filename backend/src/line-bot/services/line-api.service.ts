import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { FlexMessage } from './flex-message.service';

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LineGroupSummary {
  groupId: string;
  groupName: string;
  pictureUrl?: string;
}

/**
 * LINE 訊息類型
 */
export interface TextMessage {
  type: 'text';
  text: string;
}

/**
 * LINE Text Message with mention substitution
 * @see https://developers.line.biz/en/reference/messaging-api/#text-message
 */
export interface TextMessageV2 {
  type: 'textV2';
  text: string;
  substitution?: {
    [key: string]: {
      type: 'mention';
      mentionee: {
        type: 'user';
        userId: string;
      };
    };
  };
}

export type LineMessage = TextMessage | TextMessageV2 | FlexMessage;

/**
 * LINE Messaging API 呼叫服務
 * 負責所有與 LINE Platform 的 HTTP 通訊
 */
@Injectable()
export class LineApiService {
  private readonly logger = new Logger(LineApiService.name);
  private readonly baseUrl = 'https://api.line.me/v2';

  /**
   * 驗證 LINE Webhook 簽章
   */
  verifySignature(body: string, signature: string): boolean {
    const channelSecret = process.env.LINE_BOT_CHANNEL_SECRET!;
    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');
    return hash === signature;
  }

  /**
   * 取得群組資訊
   */
  async getGroupSummary(groupId: string): Promise<LineGroupSummary | null> {
    try {
      const response = await axios.get<LineGroupSummary>(
        `${this.baseUrl}/bot/group/${groupId}/summary`,
        { headers: this.getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get group summary: ${groupId}`, error);
      return null;
    }
  }

  /**
   * 取得群組成員的 Profile
   */
  async getGroupMemberProfile(
    groupId: string,
    userId: string,
  ): Promise<LineProfile | null> {
    try {
      const response = await axios.get<LineProfile>(
        `${this.baseUrl}/bot/group/${groupId}/member/${userId}`,
        { headers: this.getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get member profile: ${userId}`, error);
      return null;
    }
  }

  /**
   * 推送文字訊息到群組（保持向後兼容）
   */
  async pushMessage(to: string, message: string): Promise<void> {
    await this.pushMessages(to, [{ type: 'text', text: message }]);
  }

  /**
   * 推送多個訊息到群組（支援 Flex Message）
   * LINE API 限制單次最多 5 則訊息
   */
  async pushMessages(to: string, messages: LineMessage[]): Promise<void> {
    if (messages.length === 0) return;

    // LINE 限制單次最多 5 則訊息，需分批發送
    const chunkSize = 5;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      try {
        await axios.post(
          `${this.baseUrl}/bot/message/push`,
          {
            to,
            messages: chunk,
          },
          {
            headers: {
              ...this.getAuthHeaders(),
              'Content-Type': 'application/json',
            },
          },
        );
      } catch (error) {
        this.logger.error(`Failed to push messages to: ${to}`, error);
        throw error;
      }
    }
  }

  /**
   * 取得 Bot 自己的資訊
   */
  async getBotInfo(): Promise<{
    userId: string;
    displayName: string;
    pictureUrl?: string;
  } | null> {
    try {
      const response = await axios.get<{
        userId: string;
        basicId: string;
        displayName: string;
        pictureUrl?: string;
        chatMode: string;
        markAsReadMode: string;
      }>(`${this.baseUrl}/bot/info`, { headers: this.getAuthHeaders() });
      return {
        userId: response.data.userId,
        displayName: response.data.displayName,
        pictureUrl: response.data.pictureUrl,
      };
    } catch (error) {
      this.logger.error('Failed to get bot info', error);
      return null;
    }
  }

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    };
  }
}
