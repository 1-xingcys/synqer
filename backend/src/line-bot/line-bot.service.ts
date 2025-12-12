import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LineApiService } from './line-api.service';
import { LineGroupService } from './line-group.service';
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
export class LineBotService {
  private readonly logger = new Logger(LineBotService.name);

  constructor(
    private prisma: PrismaService,
    private lineApi: LineApiService,
    private lineGroup: LineGroupService,
  ) {}

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
        await this.handleBotJoinGroup(event as JoinEvent);
        break;
      case 'leave':
        await this.handleBotLeaveGroup(event as LeaveEvent);
        break;
      case 'memberJoined':
        await this.handleMemberJoined(event as MemberJoinedEvent);
        break;
      case 'memberLeft':
        await this.handleMemberLeft(event as MemberLeftEvent);
        break;
      case 'message':
        await this.handleMessage(event as MessageEvent);
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
    if (event.source.type !== 'group') return;
    const groupId = event.source.groupId;
    const userId = event.source.userId;
    if (!userId) return;

    const group = await this.lineGroup.ensureGroupExists(groupId);
    await this.lineGroup.upsertMember(group.id, userId, true);
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

    const mentions = unvotedMembers
      .map((m) => m.displayName || '成員')
      .join('、');

    const message = `📢 投票提醒\n\n${mentions}，活動「${event.title || '未命名活動'}」還在等你投票唷！\n\n請點擊以下連結參與投票：\n${process.env.WEB_ORIGIN}/events/${eventId}`;

    await this.lineApi.pushMessage(group.lineGroupId, message);

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
