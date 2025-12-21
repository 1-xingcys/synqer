import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  LineApiService,
  LineMessage,
  LineGroupService,
  FlexMessageService,
  EventInfo,
} from './services';
import {
  EventStatusService,
  EventStatus,
} from '../events/services/event-status.service';
import {
  WebhookEvent,
  MessageEvent,
  JoinEvent,
  LeaveEvent,
  MemberJoinedEvent,
  MemberLeftEvent,
} from './dto/webhook-event.dto';

/**
 * LINE Bot 主服務
 * 負責 Webhook 事件處理與業務邏輯整合
 */
@Injectable()
export class LineBotService implements OnModuleInit {
  private readonly logger = new Logger(LineBotService.name);
  private botUserId: string | null = null;

  constructor(
    private prisma: PrismaService,
    private lineApi: LineApiService,
    private lineGroup: LineGroupService,
    private flexMessage: FlexMessageService,
    private eventStatusService: EventStatusService,
  ) {}

  async onModuleInit() {
    // 檢查環境變數是否已設定
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      this.logger.warn(
        'LINE_CHANNEL_ACCESS_TOKEN not set, skipping bot initialization',
      );
      return;
    }

    // 初始化時取得 Bot 自己的 userId
    try {
      const botInfo = await this.lineApi.getBotInfo();
      if (botInfo) {
        this.botUserId = botInfo.userId;
        this.logger.log(`Bot initialized with userId: ${this.botUserId}`);
      }
    } catch {
      this.logger.warn(
        'Failed to get bot userId on init, will try again later',
      );
    }
  }

  // ============ Webhook 簽章驗證 ============

  verifySignature(body: string, signature: string): boolean {
    return this.lineApi.verifySignature(body, signature);
  }

  // ============ Webhook 事件處理 ============

  async handleWebhookEvents(events: WebhookEvent[]): Promise<void> {
    for (const event of events) {
      try {
        await this.handleEvent(event);
      } catch (error) {
        this.logger.error(`Error handling event: ${event.type}`, error);
      }
    }
  }

  private async handleEvent(event: WebhookEvent): Promise<void> {
    switch (event.type) {
      case 'join':
        await this.handleBotJoinGroup(event);
        break;
      case 'leave':
        await this.handleBotLeaveGroup(event);
        break;
      case 'memberJoined':
        await this.handleMemberJoined(event);
        break;
      case 'memberLeft':
        await this.handleMemberLeft(event);
        break;
      case 'message':
        await this.handleMessage(event);
        break;
      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleBotJoinGroup(event: JoinEvent): Promise<void> {
    if (event.source.type !== 'group') return;
    const groupId = event.source.groupId;
    this.logger.log(`Bot joined group: ${groupId}`);
    await this.lineGroup.upsertGroup(groupId, true);
  }

  private async handleBotLeaveGroup(event: LeaveEvent): Promise<void> {
    if (event.source.type !== 'group') return;
    const groupId = event.source.groupId;
    this.logger.log(`Bot left group: ${groupId}`);
    await this.lineGroup.deactivateGroup(groupId);
  }

  private async handleMemberJoined(event: MemberJoinedEvent): Promise<void> {
    if (event.source.type !== 'group') return;
    const groupId = event.source.groupId;
    const members = event.joined.members;

    this.logger.log(`${members.length} member(s) joined group: ${groupId}`);

    const group = await this.lineGroup.ensureGroupExists(groupId);
    for (const member of members) {
      await this.lineGroup.upsertMember(group.id, member.userId, true);
    }
  }

  private async handleMemberLeft(event: MemberLeftEvent): Promise<void> {
    if (event.source.type !== 'group') return;
    const groupId = event.source.groupId;
    const members = event.left.members;

    this.logger.log(`${members.length} member(s) left group: ${groupId}`);

    const group = await this.prisma.lineGroup.findUnique({
      where: { lineGroupId: groupId },
    });

    if (group) {
      await this.lineGroup.deactivateMembers(
        group.id,
        members.map((m) => m.userId),
      );
    }
  }

  private async handleMessage(event: MessageEvent): Promise<void> {
    // 只處理群組訊息 (1:M)
    if (event.source.type !== 'group') return;
    const groupId = event.source.groupId;
    const userId = event.source.userId;
    if (!userId) return;

    const group = await this.lineGroup.ensureGroupExists(groupId);
    await this.lineGroup.upsertMember(group.id, userId, true);

    // 檢查是否有 @mention Bot
    if (event.message.type === 'text' && event.message.mention) {
      const isBotMentioned = await this.checkBotMentioned(
        event.message.mention,
      );
      if (isBotMentioned) {
        this.logger.log(`Bot mentioned in group: ${groupId}`);
        await this.handleBotMention(groupId, group.id);
      }
    }
  }

  /**
   * 檢查 Bot 是否被 @mention
   */
  private async checkBotMentioned(mention: {
    mentionees: Array<{ type: string; userId?: string }>;
  }): Promise<boolean> {
    // 確保有 Bot userId
    if (!this.botUserId) {
      const botInfo = await this.lineApi.getBotInfo();
      if (botInfo) {
        this.botUserId = botInfo.userId;
      } else {
        return false;
      }
    }

    // 檢查是否有人 mention Bot
    return mention.mentionees.some(
      (m) => m.type === 'user' && m.userId === this.botUserId,
    );
  }

  /**
   * 處理 Bot 被 @mention 的情況
   * 查詢群組中尚未結束的活動，並發送 Flex Message
   */
  private async handleBotMention(
    lineGroupId: string,
    lineGroupDbId: string,
  ): Promise<void> {
    // 查詢這個群組中尚未結束的活動
    const activeEvents = await this.getActiveGroupEvents(lineGroupDbId);

    if (activeEvents.length === 0) {
      // 沒有活動，發送提示訊息
      await this.lineApi.pushMessage(
        lineGroupId,
        '目前這個群組沒有進行中的活動喔！',
      );
      return;
    }

    this.logger.log(
      `Found ${activeEvents.length} active events for group ${lineGroupId}`,
    );

    // 為每個活動準備訊息
    const messages: LineMessage[] = [];
    const votingEventsWithUnvoted: Array<{
      event: EventInfo;
      unvotedMembers: Array<{ lineUserId: string; displayName: string | null }>;
    }> = [];

    for (const event of activeEvents) {
      // 建構 Flex Message
      const flexMsg = this.flexMessage.buildEventFlexMessage(event);
      messages.push(flexMsg);

      // 如果是投票中的活動，檢查是否有人還沒投票
      if (event.status === EventStatus.VOTING) {
        const unvotedMembers = await this.getUnvotedGroupMembers(
          event.id,
          lineGroupDbId,
        );
        if (unvotedMembers.length > 0) {
          votingEventsWithUnvoted.push({ event, unvotedMembers });
        }
      }
    }

    // 發送所有 Flex Messages
    // 注意：LINE 一次最多發 5 則，但我們的 pushMessages 會自動分批
    await this.lineApi.pushMessages(lineGroupId, messages);

    // 對於有未投票成員的 Voting 活動，發送提醒訊息
    for (const { event, unvotedMembers } of votingEventsWithUnvoted) {
      const reminderMsg = this.flexMessage.buildVoteReminderMessage(
        event.title || '未命名活動',
        unvotedMembers,
      );
      await this.lineApi.pushMessages(lineGroupId, [reminderMsg]);
    }
  }

  /**
   * 查詢群組中尚未結束（非 COMPLETED）的活動
   */
  private async getActiveGroupEvents(
    lineGroupDbId: string,
  ): Promise<EventInfo[]> {
    const events = await this.prisma.event.findMany({
      where: {
        lineGroupId: lineGroupDbId,
      },
      include: {
        expectedParticipants: {
          select: {
            id: true,
            hasVoted: true,
          },
        },
        votes: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const result: EventInfo[] = [];

    for (const event of events) {
      const status = this.eventStatusService.computeEventStatus({
        votingDeadline: event.votingDeadline,
        confirmedStartTime: event.confirmedStartTime,
        confirmedEndTime: event.confirmedEndTime,
      });

      // 排除已結束的活動
      if (status === EventStatus.COMPLETED) {
        continue;
      }

      // 取得 Host 資訊
      const host = await this.getEventHostInfo(event.ownerId);

      // 計算投票統計
      const totalExpected = event.expectedParticipants.length;
      const votedUserIds = new Set(event.votes.map((v) => v.userId));
      const totalVoted =
        event.expectedParticipants.filter((p) => p.hasVoted).length ||
        votedUserIds.size;
      const votingPercentage =
        totalExpected > 0 ? (totalVoted / totalExpected) * 100 : 0;

      result.push({
        id: event.id,
        title: event.title,
        description: event.description,
        status,
        votingDeadline: event.votingDeadline,
        confirmedStartTime: event.confirmedStartTime,
        confirmedEndTime: event.confirmedEndTime,
        host,
        votingStats: {
          totalExpected,
          totalVoted,
          votingPercentage,
        },
      });
    }

    return result;
  }

  /**
   * 取得活動主辦人資訊
   */
  private async getEventHostInfo(
    ownerId: string | null,
  ): Promise<{ displayName: string; pictureUrl?: string | null }> {
    if (!ownerId) {
      return { displayName: '未知主辦人' };
    }

    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: {
        displayName: true,
        avatarUrl: true,
      },
    });

    if (!owner) {
      return { displayName: '未知主辦人' };
    }

    return {
      displayName: owner.displayName || '未命名使用者',
      pictureUrl: owner.avatarUrl,
    };
  }

  /**
   * 取得群組中尚未投票的成員
   */
  private async getUnvotedGroupMembers(
    eventId: string,
    lineGroupDbId: string,
  ): Promise<Array<{ lineUserId: string; displayName: string | null }>> {
    // 取得活動的預期參與者中還沒投票的人
    const unvotedParticipants =
      await this.prisma.eventExpectedParticipant.findMany({
        where: {
          eventId,
          hasVoted: false,
          lineUserId: { not: null },
        },
        select: {
          lineUserId: true,
        },
      });

    if (unvotedParticipants.length === 0) {
      return [];
    }

    const lineUserIds = unvotedParticipants
      .map((p) => p.lineUserId)
      .filter((id): id is string => id !== null);

    // 取得這些 LINE 使用者在群組中的資訊
    const members = await this.prisma.lineGroupMember.findMany({
      where: {
        lineGroupId: lineGroupDbId,
        lineUserId: { in: lineUserIds },
        isActive: true,
      },
      select: {
        lineUserId: true,
        displayName: true,
      },
    });

    return members;
  }

  // ============ 群組查詢（供 Controller 使用）============

  async getActiveGroups() {
    return this.lineGroup.getActiveGroups();
  }

  async getGroupMembers(lineGroupDbId: string) {
    return this.lineGroup.getGroupMembers(lineGroupDbId);
  }

  async getGroupByLineGroupId(lineGroupId: string) {
    return this.lineGroup.getGroupByLineGroupId(lineGroupId);
  }

  // ============ 提醒功能 ============

  async sendVoteReminder(
    eventId: string,
    lineGroupDbId: string,
    unvotedLineUserIds: string[],
  ): Promise<void> {
    const group = await this.prisma.lineGroup.findUnique({
      where: { id: lineGroupDbId },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    const unvotedMembers = await this.prisma.lineGroupMember.findMany({
      where: {
        lineGroupId: lineGroupDbId,
        lineUserId: { in: unvotedLineUserIds },
        isActive: true,
      },
    });

    if (unvotedMembers.length === 0) return;

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // 使用 buildVoteReminderMessage 建構帶有真正 mention 的訊息
    const reminderMsg = this.flexMessage.buildVoteReminderMessage(
      event.title || '未命名活動',
      unvotedMembers.map((m) => ({
        lineUserId: m.lineUserId,
        displayName: m.displayName,
      })),
    );

    await this.lineApi.pushMessages(group.lineGroupId, [reminderMsg]);

    await this.prisma.eventExpectedParticipant.updateMany({
      where: {
        eventId,
        lineUserId: { in: unvotedLineUserIds },
      },
      data: { reminderSentAt: new Date() },
    });
  }

  // ============ OAuth 關聯 ============

  async linkUserToGroupMembers(userId: string, lineUserId: string) {
    return this.lineGroup.linkUserToMembers(userId, lineUserId);
  }
}
