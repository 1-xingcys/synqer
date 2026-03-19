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
} from '../events/shared/services/event-status.service';
import { ConfirmedTimeService } from '../events/shared/services/confirmed-time.service';
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
    private confirmedTimeService: ConfirmedTimeService,
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
    this.logger.debug(
      `Active events: ${JSON.stringify(activeEvents, null, 2)}`,
    );

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
    this.logger.debug(`Querying events for lineGroupDbId: "${lineGroupDbId}"`);

    const events = await this.prisma.event.findMany({
      where: {
        lineGroupId: lineGroupDbId,
        isDeleted: false,
      },
      include: {
        expectedParticipants: {
          where: { isRemoved: false },
          select: {
            id: true,
            userId: true,
            hasVoted: true,
          },
        },
        votes: {
          select: {
            userId: true,
          },
        },
        confirmedTimeSlots: {
          include: {
            slot: {
              select: {
                id: true,
                date: true,
                startMinute: true,
                endMinute: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    this.logger.debug(`Events: ${JSON.stringify(events, null, 2)}`);

    const result: EventInfo[] = [];

    for (const event of events) {
      // 合併成時間範圍（使用原始資料結構）
      const confirmedSelections = this.confirmedTimeService.mergeToSelections(
        event.confirmedTimeSlots,
      );

      // 建構確認時段資訊（用於 EventInfo 和狀態計算）
      const confirmedTimeSlots = event.confirmedTimeSlots.map((cts) => ({
        slotId: cts.slotId,
        date: cts.slot.date,
        startMinute: cts.slot.startMinute,
        endMinute: cts.slot.endMinute,
      }));

      const status = this.eventStatusService.computeEventStatus({
        eventType: event.type,
        votingDeadline: event.votingDeadline,
        confirmedTimeSlots,
      });

      // 排除已結束的活動
      if (status === EventStatus.COMPLETED) {
        continue;
      }

      // 取得 Host 資訊
      const host = await this.getEventHostInfo(event.ownerId);

      // 取得未被移除的預期參與者的 userId 集合
      const activeParticipantUserIds = new Set<string>(
        event.expectedParticipants
          .filter((ep) => ep.userId)
          .map((ep) => ep.userId as string),
      );

      // 過濾 votes，只保留未被移除的預期參與者的投票
      const filteredVotes = event.votes.filter((v) =>
        activeParticipantUserIds.has(v.userId),
      );

      // 計算投票統計
      const totalExpected = event.expectedParticipants.length;
      const votedUserIds = new Set(filteredVotes.map((v) => v.userId));
      const totalVoted =
        event.expectedParticipants.filter(
          (p) => p.userId && votedUserIds.has(p.userId),
        ).length || votedUserIds.size;
      const votingPercentage =
        totalExpected > 0 ? (totalVoted / totalExpected) * 100 : 0;

      result.push({
        id: event.id,
        type: event.type,
        title: event.title,
        description: event.description,
        status,
        votingDeadline: event.votingDeadline,
        confirmedTimeSlots,
        confirmedSelections,
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

  async getGroupsForUser(userId: string) {
    return this.lineGroup.getGroupsForUser(userId);
  }

  async getGroupMembersForUser(userId: string, lineGroupDbId: string) {
    return this.lineGroup.getGroupMembersForUser(userId, lineGroupDbId);
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
      select: { id: true, title: true, isDeleted: true },
    });

    if (!event || event.isDeleted) {
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

  // ============ 發送活動通知到群組 ============

  /**
   * 發送單一活動的 Flex Message 到綁定的 LINE 群組
   * @param eventId - 活動 ID
   * @param userId - 發送者的使用者 ID（用於驗證權限）
   */
  async sendEventNotificationToGroup(
    eventId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    // 取得活動資訊
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        lineGroup: true,
        expectedParticipants: {
          where: { isRemoved: false },
          select: {
            id: true,
            userId: true,
            hasVoted: true,
          },
        },
        votes: {
          select: {
            userId: true,
          },
        },
        confirmedTimeSlots: {
          include: {
            slot: {
              select: {
                id: true,
                date: true,
                startMinute: true,
                endMinute: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    if (event.isDeleted) {
      return { success: false, error: 'Event has been deleted' };
    }

    // 驗證發送者是活動擁有者
    if (event.ownerId !== userId) {
      return { success: false, error: 'Not authorized to send notification' };
    }

    // 檢查是否有綁定 LINE 群組
    if (!event.lineGroup) {
      return { success: false, error: 'Event is not linked to a LINE group' };
    }

    // 檢查群組是否仍活躍（Bot 還在群組中）
    if (!event.lineGroup.isActive) {
      this.logger.warn(
        `LINE group ${event.lineGroup.lineGroupId} is not active (Bot may have left)`,
      );
      return {
        success: false,
        error: 'Bot is no longer in the LINE group',
      };
    }

    this.logger.debug(
      `LINE Group info: id=${event.lineGroup.id}, lineGroupId=${event.lineGroup.lineGroupId}, isActive=${event.lineGroup.isActive}`,
    );

    // 取得 Host 資訊
    const host = await this.getEventHostInfo(event.ownerId);

    // 將分鐘轉換為時間字串
    const formatTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60)
        .toString()
        .padStart(2, '0');
      const mins = (minutes % 60).toString().padStart(2, '0');
      return `${hours}:${mins}`;
    };

    // 檢查 LIFF URL 是否已設定
    if (!process.env.LINE_LIFF_URL) {
      this.logger.warn(
        'LINE_LIFF_URL is not configured, Flex Message buttons may not work correctly',
      );
    }

    // One-time 專用分享訊息。Recurring 不應走這條 date-range 契約。
    const flexMsg = this.flexMessage.buildOneTimeEventShareFlexMessage({
      eventId: event.id,
      title: event.title,
      hostName: host.displayName,
      hostAvatarUrl: host.pictureUrl,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: formatTime(event.startMinuteOfDay),
      endTime: formatTime(event.endMinuteOfDay),
      votingDeadline: event.votingDeadline,
    });

    this.logger.debug(`Sending to LINE group: ${event.lineGroup.lineGroupId}`);

    try {
      await this.lineApi.pushMessages(event.lineGroup.lineGroupId, [flexMsg]);
      this.logger.log(
        `Sent event notification for ${eventId} to group ${event.lineGroup.lineGroupId}`,
      );
      return { success: true };
    } catch (error) {
      // 記錄詳細錯誤資訊
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { status?: number; data?: unknown };
        };
        this.logger.error(
          `Failed to send event notification: ${JSON.stringify({
            status: axiosError.response?.status,
            data: axiosError.response?.data,
          })}`,
        );
      } else {
        this.logger.error(
          `Failed to send event notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
      return { success: false, error: 'Failed to send message to LINE group' };
    }
  }
}
