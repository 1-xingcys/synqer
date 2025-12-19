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
      },
      include: {
        expectedParticipants: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return events.map((event) => this.eventMapper.mapEventToList(event));
  }

  /**
   * 查詢用戶參與的活動
   */
  async findAttendedEvents(userId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        OR: [
          {
            votes: {
              some: {
                userId,
              },
            },
          },
          {
            expectedParticipants: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        expectedParticipants: {
          select: {
            id: true,
          },
        },
        votes: {
          where: { userId },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return events.map((event) => ({
      ...this.eventMapper.mapEventToList(event),
      hasVoted: event.votes.length > 0,
    }));
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
      },
    });

    if (!event) {
      return null;
    }

    const votes = this.eventMapper.mapVotes(event.votes);
    const participants = this.eventMapper.extractParticipants(event.votes);
    const votedUserIds = new Set<string>(event.votes.map((v) => v.userId));

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
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
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

    const votes = this.eventMapper.mapVotes(event.votes);
    const participants = this.eventMapper.extractParticipantsForHost(event.votes);
    const votedUserIds = new Set<string>(event.votes.map((v) => v.userId));

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
          select: { id: true },
        },
      },
    });

    if (!event) {
      return null;
    }

    return {
      ...this.eventMapper.mapEventToList(event, false),
      participantCount: event.expectedParticipants.length,
      status: this.eventStatusService.computeEventStatus({
        votingDeadline: event.votingDeadline,
        confirmedStartTime: event.confirmedStartTime,
        confirmedEndTime: event.confirmedEndTime,
      }),
    };
  }
}

