import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventStatusService } from './event-status.service';

/**
 * 活動參與者管理服務
 */
@Injectable()
export class EventParticipantService {
  constructor(
    private prisma: PrismaService,
    private eventStatusService: EventStatusService,
  ) {}

  /**
   * 取得活動中尚未投票的預期參與者
   */
  async getUnvotedParticipants(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        votes: {
          select: { userId: true },
          distinct: ['userId'],
        },
        expectedParticipants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        lineGroup: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    const votedUserIds = new Set(event.votes.map((v) => v.userId));

    // 找出未投票的預期參與者
    const unvoted: Array<{
      id: string;
      lineUserId: string;
      userId: string | null;
      displayName: string;
      pictureUrl: string | null | undefined;
      reminderSentAt: Date | null;
    }> = [];

    for (const ep of event.expectedParticipants) {
      const hasVoted = ep.userId ? votedUserIds.has(ep.userId) : false;

      if (!hasVoted && ep.lineUserId) {
        // 取得 LINE 群組成員資料
        const memberInfo = event.lineGroup
          ? await this.prisma.lineGroupMember.findUnique({
              where: {
                lineGroupId_lineUserId: {
                  lineGroupId: event.lineGroup.id,
                  lineUserId: ep.lineUserId,
                },
              },
            })
          : null;

        unvoted.push({
          id: ep.id,
          lineUserId: ep.lineUserId,
          userId: ep.userId,
          displayName:
            ep.user?.displayName || memberInfo?.displayName || 'Unknown',
          pictureUrl: memberInfo?.pictureUrl,
          reminderSentAt: ep.reminderSentAt,
        });
      }
    }

    return {
      eventId,
      lineGroupId: event.lineGroup?.id,
      lineGroupLineId: event.lineGroup?.lineGroupId,
      unvotedParticipants: unvoted,
    };
  }

  /**
   * 整理預期參與者資料，標註是否已投票和參與者狀態
   */
  async enrichExpectedParticipants(
    eventId: string,
    expectedParticipants: Array<{
      id: string;
      userId: string | null;
      lineUserId: string | null;
      reminderSentAt: Date | null;
      user: {
        id: string;
        displayName: string | null;
        avatarUrl: string | null;
      } | null;
    }>,
    votedUserIds: Set<string>,
    lineGroupId: string | null,
  ) {
    return Promise.all(
      expectedParticipants.map(async (ep) => {
        // 檢查是否已投票
        let hasVoted = false;
        if (ep.userId) {
          hasVoted = votedUserIds.has(ep.userId);
        }

        // 取得 LINE 群組成員資料（如果有 lineUserId）
        let lineGroupMember: {
          displayName: string | null;
          pictureUrl: string | null;
        } | null = null;
        if (ep.lineUserId && lineGroupId) {
          lineGroupMember = await this.prisma.lineGroupMember.findUnique({
            where: {
              lineGroupId_lineUserId: {
                lineGroupId,
                lineUserId: ep.lineUserId,
              },
            },
            select: {
              displayName: true,
              pictureUrl: true,
            },
          });
        }

        // 計算參與者狀態
        const participantStatus =
          this.eventStatusService.computeParticipantStatus({
            userId: ep.userId,
            lineUserId: ep.lineUserId,
            hasVoted,
          });

        return {
          id: ep.id,
          lineUserId: ep.lineUserId,
          userId: ep.userId,
          hasVoted,
          status: participantStatus,
          reminderSentAt: ep.reminderSentAt,
          user: ep.user,
          lineGroupMember,
        };
      }),
    );
  }

  /**
   * 整理預期參與者資料（Host 端版本）
   */
  async enrichExpectedParticipantsForHost(
    expectedParticipants: Array<{
      id: string;
      userId: string | null;
      lineUserId: string | null;
      user: {
        id: string;
        displayName: string | null;
      } | null;
    }>,
    votedUserIds: Set<string>,
    lineUserIds: string[],
  ) {
    // 查詢 LineGroupMember 以取得未連結使用者的 displayName 和 pictureUrl
    const lineGroupMembers = await this.prisma.lineGroupMember.findMany({
      where: {
        lineUserId: { in: lineUserIds },
      },
      orderBy: { lastSeenAt: 'desc' },
    });

    // 建立 lineUserId -> LineGroupMember 的映射
    const lineUserIdToMember = new Map<
      string,
      { displayName: string | null; pictureUrl: string | null }
    >();
    lineGroupMembers.forEach((member) => {
      // 只取最新的記錄（已經按 lastSeenAt 排序）
      if (!lineUserIdToMember.has(member.lineUserId)) {
        lineUserIdToMember.set(member.lineUserId, {
          displayName: member.displayName,
          pictureUrl: member.pictureUrl,
        });
      }
    });

    // 整理預期參與者資料
    return expectedParticipants.map((ep) => {
      // 優先使用已連結使用者的資料，否則使用 LineGroupMember 的資料
      const lineMember = ep.lineUserId
        ? lineUserIdToMember.get(ep.lineUserId)
        : null;

      const hasVoted = ep.userId ? votedUserIds.has(ep.userId) : false;

      // 計算參與者狀態
      const participantStatus =
        this.eventStatusService.computeParticipantStatus({
          userId: ep.userId,
          lineUserId: ep.lineUserId,
          hasVoted,
        });

      return {
        id: ep.id,
        lineUserId: ep.lineUserId || undefined,
        userId: ep.userId || undefined,
        displayName:
          ep.user?.displayName || lineMember?.displayName || undefined,
        pictureUrl: lineMember?.pictureUrl || undefined,
        hasVoted,
        status: participantStatus,
      };
    });
  }

  /**
   * 檢查使用者是否已經是活動的參與者
   */
  async checkParticipantStatus(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    // 檢查是否已經是預期參與者
    const existingParticipant =
      await this.prisma.eventExpectedParticipant.findFirst({
        where: {
          eventId,
          userId,
        },
      });

    // 檢查是否有投票紀錄
    const hasVoted = await this.prisma.eventVote.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    return {
      isParticipant: !!existingParticipant,
      hasVoted: !!hasVoted,
    };
  }

  /**
   * 加入活動（透過分享連結）
   */
  async joinEvent(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    // 檢查是否已經是參與者
    const existingParticipant =
      await this.prisma.eventExpectedParticipant.findFirst({
        where: {
          eventId,
          userId,
        },
      });

    if (existingParticipant) {
      return {
        success: true,
        alreadyJoined: true,
        message: 'You are already a participant of this event',
      };
    }

    // 加入為參與者
    await this.prisma.eventExpectedParticipant.create({
      data: {
        eventId,
        userId,
      },
    });

    return {
      success: true,
      alreadyJoined: false,
      message: 'Successfully joined the event',
    };
  }
}
