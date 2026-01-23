import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventMapperService } from './event-mapper.service';
import { EventParticipantService } from './event-participant.service';
import { EventStatusService } from './event-status.service';

/**
 * 活動查詢服務
 */
@Injectable()
export class EventQueryService {
  constructor(
    private prisma: PrismaService,
    private eventMapper: EventMapperService,
    private eventParticipantService: EventParticipantService,
    private eventStatusService: EventStatusService,
  ) {}

  /**
   * 查詢用戶創建的活動
   */
  async findUserEvents(userId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        ownerId: userId,
        isDeleted: false,
      },
      include: {
        expectedParticipants: {
          where: { isRemoved: false },
          select: {
            id: true,
            userId: true,
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

    return events.map((event) => {
      const expectedParticipantCount = event.expectedParticipants.length;

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

      // 從過濾後的 votes 表建立已投票的 userId Set
      const votedUserIds = new Set<string>(filteredVotes.map((v) => v.userId));

      // 計算 expectedParticipants 中已投票的人數
      const votedCount = event.expectedParticipants.filter(
        (p) => p.userId && votedUserIds.has(p.userId),
      ).length;

      return {
        ...this.eventMapper.mapEventToList(event),
        expectedParticipantCount,
        votedCount,
      };
    });
  }

  /**
   * 查詢用戶參與的活動
   */
  async findAttendedEvents(userId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        // 只顯示使用者是未被移除的預期參與者的活動
        expectedParticipants: {
          some: {
            userId,
            isRemoved: false,
          },
        },
        isDeleted: false,
      },
      include: {
        expectedParticipants: {
          where: { isRemoved: false },
          select: {
            id: true,
            userId: true,
          },
        },
        votes: {
          select: {
            userId: true,
          },
        },
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
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

    return events.map((event) => {
      const expectedParticipantCount = event.expectedParticipants.length;

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

      // 從過濾後的 votes 表建立已投票的 userId Set
      const votedUserIds = new Set<string>(filteredVotes.map((v) => v.userId));

      // 計算 expectedParticipants 中已投票的人數
      const votedCount = event.expectedParticipants.filter(
        (p) => p.userId && votedUserIds.has(p.userId),
      ).length;

      // 檢查當前用戶是否已投票（且未被移除）
      const hasVoted =
        activeParticipantUserIds.has(userId) && votedUserIds.has(userId);

      return {
        ...this.eventMapper.mapEventToList(event),
        hasVoted,
        expectedParticipantCount,
        votedCount,
        host: event.owner
          ? {
              id: event.owner.id,
              displayName: event.owner.displayName,
              avatarUrl: event.owner.avatarUrl,
            }
          : null,
      };
    });
  }

  /**
   * 查詢單個活動詳情
   */
  async findOne(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        slots: {
          orderBy: [{ date: 'asc' }, { startMinute: 'asc' }],
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        lineGroup: {
          select: {
            id: true,
            lineGroupId: true,
            groupName: true,
          },
        },
        expectedParticipants: {
          where: { isRemoved: false },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
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
      return null;
    }

    // 檢查活動是否已被軟刪除
    if (event.isDeleted) {
      return {
        isDeleted: true,
        event: this.eventMapper.mapEventToDetail(event),
        lineGroup: event.lineGroup,
        slots: [],
        votes: [],
        participants: [],
        expectedParticipants: [],
      };
    }

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

    const votes = this.eventMapper.mapVotes(filteredVotes);
    const participants = this.eventMapper.extractParticipants(filteredVotes);
    const votedUserIds = new Set<string>(filteredVotes.map((v) => v.userId));

    const expectedParticipants =
      await this.eventParticipantService.enrichExpectedParticipants(
        event.id,
        event.expectedParticipants.map((ep) => ({
          id: ep.id,
          userId: ep.userId,
          lineUserId: ep.lineUserId,
          reminderSentAt: ep.reminderSentAt,
          user: ep.user,
        })),
        votedUserIds,
        event.lineGroup?.id || null,
      );

    return {
      isDeleted: false,
      event: this.eventMapper.mapEventToDetail(event),
      lineGroup: event.lineGroup,
      slots: event.slots,
      votes,
      participants,
      expectedParticipants,
    };
  }

  /**
   * 查詢 Host 端的活動詳情
   */
  async findOneHosted(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        slots: {
          orderBy: [{ date: 'asc' }, { startMinute: 'asc' }],
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        expectedParticipants: {
          where: { isRemoved: false },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
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
      return null;
    }

    if (event.ownerId !== userId) {
      return null; // 權限檢查由調用者處理
    }

    // 檢查活動是否已被軟刪除
    if (event.isDeleted) {
      return {
        isDeleted: true,
        event: this.eventMapper.mapEventToDetail(event),
        slots: [],
        votes: [],
        participants: [],
        expectedParticipants: [],
        votingStats: {
          totalExpected: 0,
          totalVoted: 0,
          votingPercentage: 0,
        },
      };
    }

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

    const votes = this.eventMapper.mapVotes(filteredVotes);
    const participants =
      this.eventMapper.extractParticipantsForHost(filteredVotes);
    const votedUserIds = new Set<string>(filteredVotes.map((v) => v.userId));

    const lineUserIds = event.expectedParticipants
      .filter((ep) => ep.lineUserId)
      .map((ep) => ep.lineUserId as string);

    const expectedParticipants =
      await this.eventParticipantService.enrichExpectedParticipantsForHost(
        event.expectedParticipants.map((ep) => ({
          id: ep.id,
          userId: ep.userId,
          lineUserId: ep.lineUserId,
          user: ep.user,
        })),
        votedUserIds,
        lineUserIds,
      );

    const votingStats = this.eventMapper.calculateVotingStats(
      expectedParticipants,
      participants,
    );

    return {
      isDeleted: false,
      event: this.eventMapper.mapEventToDetail(event),
      slots: event.slots,
      votes,
      participants,
      expectedParticipants,
      votingStats,
    };
  }

  /**
   * 查詢活動公開信息
   */
  async getEventPublicInfo(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        expectedParticipants: {
          where: { isRemoved: false },
          select: { id: true },
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
      return null;
    }

    // 檢查活動是否已被軟刪除
    if (event.isDeleted) {
      return {
        isDeleted: true,
        ...this.eventMapper.mapEventToList(event, false),
        participantCount: 0,
        status: this.eventStatusService.computeEventStatus({
          votingDeadline: event.votingDeadline,
          confirmedTimeSlots: [],
        }),
      };
    }

    const confirmedTimeSlots = event.confirmedTimeSlots.map((cts) => ({
      slotId: cts.slotId,
      date: cts.slot.date,
      startMinute: cts.slot.startMinute,
      endMinute: cts.slot.endMinute,
    }));

    return {
      isDeleted: false,
      ...this.eventMapper.mapEventToList(event, false),
      participantCount: event.expectedParticipants.length,
      status: this.eventStatusService.computeEventStatus({
        votingDeadline: event.votingDeadline,
        confirmedTimeSlots,
      }),
    };
  }
}
