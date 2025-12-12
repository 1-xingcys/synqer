import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

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
   * 推送訊息到群組
   */
  async pushMessage(to: string, message: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/bot/message/push`,
        {
          to,
          messages: [{ type: 'text', text: message }],
        },
        {
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      this.logger.error(`Failed to push message to: ${to}`, error);
      throw error;
    }
  }

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    };
  }
}

