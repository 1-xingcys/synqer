import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  Prisma,
  Event,
  EventSlotAxisType,
  EventType,
  EventVoteMode,
  Weekday,
} from '@prisma/client';

/**
 * Event data access layer
 */
@Injectable()
export class EventRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an event (with time slots and expected participants) - uses a Transaction
   * @returns the event plus creatorLineUserId (used to count participants correctly)
   */
  async createWithSlotsAndParticipants(
    eventData: {
      title?: string;
      description?: string;
      type: EventType;
      ownerId: string | null;
      startDate: Date;
      endDate: Date;
      startMinuteOfDay: number;
      endMinuteOfDay: number;
      slotDurationMin: number;
      timeZone: string;
      defaultGranularityMin: number;
      defaultVoteMode: EventVoteMode;
      shareVoteToChat: boolean;
      votingDeadline: Date | null;
      lineGroupId: string | null;
    },
    slots: Array<{ date: Date; startMinute: number; endMinute: number }>,
    participantData: Array<{
      eventId?: string;
      lineUserId?: string;
      userId?: string;
    }>,
    creatorUserId?: string,
  ): Promise<{
    event: Event;
    creatorLineUserId?: string;
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const event = await prisma.event.create({
        data: {
          title: eventData.title,
          description: eventData.description,
          type: eventData.type,
          ownerId: eventData.ownerId,
          timeZone: eventData.timeZone,
          defaultGranularityMin: eventData.defaultGranularityMin,
          defaultVoteMode: eventData.defaultVoteMode,
          shareVoteToChat: eventData.shareVoteToChat,
          votingDeadline: eventData.votingDeadline,
          lineGroupId: eventData.lineGroupId,
        },
      });

      await prisma.oneTimeEventSchedule.create({
        data: {
          eventId: event.id,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          startMinuteOfDay: eventData.startMinuteOfDay,
          endMinuteOfDay: eventData.endMinuteOfDay,
          slotDurationMin: eventData.slotDurationMin,
        },
      });

      if (slots.length > 0) {
        await prisma.eventTimeSlot.createMany({
          data: slots.map((slot, index) => ({
            eventId: event.id,
            axisType: EventSlotAxisType.DATE,
            axisDate: slot.date,
            axisWeekday: null,
            startMinute: slot.startMinute,
            endMinute: slot.endMinute,
            index,
          })),
        });
      }

      // Create the expected participants and get creatorLineUserId
      const { participants, creatorLineUserId } =
        await this.buildParticipantData(
          prisma,
          event.id,
          creatorUserId,
          participantData,
        );

      if (participants.length > 0) {
        await prisma.eventExpectedParticipant.createMany({
          data: participants,
        });
      }

      return { event, creatorLineUserId };
    });
  }

  async createRecurringWithSlotsAndParticipants(
    eventData: {
      title?: string;
      description?: string;
      type: EventType;
      ownerId: string | null;
      startMinuteOfDay: number;
      endMinuteOfDay: number;
      slotDurationMin: number;
      timeZone: string;
      defaultGranularityMin: number;
      defaultVoteMode: EventVoteMode;
      shareVoteToChat: boolean;
      votingDeadline: Date | null;
      lineGroupId: string | null;
      weekdays: Weekday[];
    },
    slots: Array<{
      weekday: Weekday;
      startMinute: number;
      endMinute: number;
    }>,
    participantData: Array<{
      eventId?: string;
      lineUserId?: string;
      userId?: string;
    }>,
    creatorUserId?: string,
  ): Promise<{
    event: Event;
    creatorLineUserId?: string;
  }> {
    return this.prisma.$transaction(async (prisma) => {
      const event = await prisma.event.create({
        data: {
          title: eventData.title,
          description: eventData.description,
          type: eventData.type,
          ownerId: eventData.ownerId,
          timeZone: eventData.timeZone,
          defaultGranularityMin: eventData.defaultGranularityMin,
          defaultVoteMode: eventData.defaultVoteMode,
          shareVoteToChat: eventData.shareVoteToChat,
          votingDeadline: eventData.votingDeadline,
          lineGroupId: eventData.lineGroupId,
        },
      });

      await prisma.recurringEventSchedule.create({
        data: {
          eventId: event.id,
          weekdays: eventData.weekdays,
          startMinuteOfDay: eventData.startMinuteOfDay,
          endMinuteOfDay: eventData.endMinuteOfDay,
          slotDurationMin: eventData.slotDurationMin,
        },
      });

      if (slots.length > 0) {
        await prisma.eventTimeSlot.createMany({
          data: slots.map((slot, index) => ({
            eventId: event.id,
            axisType: EventSlotAxisType.WEEKDAY,
            axisDate: null,
            axisWeekday: slot.weekday,
            startMinute: slot.startMinute,
            endMinute: slot.endMinute,
            index,
          })),
        });
      }

      const { participants, creatorLineUserId } =
        await this.buildParticipantData(
          prisma,
          event.id,
          creatorUserId,
          participantData,
        );

      if (participants.length > 0) {
        await prisma.eventExpectedParticipant.createMany({
          data: participants,
        });
      }

      return { event, creatorLineUserId };
    });
  }

  /**
   * List the events created by a user
   */
  async findByOwnerId(userId: string) {
    return this.prisma.event.findMany({
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
                axisType: true,
                axisDate: true,
                axisWeekday: true,
                startMinute: true,
                endMinute: true,
              },
            },
          },
        },
        oneTimeSchedule: true,
        recurringSchedule: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * List the events a user participates in
   */
  async findByParticipantUserId(userId: string) {
    return this.prisma.event.findMany({
      where: {
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
            hasVoted: true,
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
                axisType: true,
                axisDate: true,
                axisWeekday: true,
                startMinute: true,
                endMinute: true,
              },
            },
          },
        },
        oneTimeSchedule: true,
        recurringSchedule: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get the details of a single event
   */
  async findOneWithDetails(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        slots: {
          select: {
            id: true,
            eventId: true,
            axisType: true,
            axisDate: true,
            axisWeekday: true,
            startMinute: true,
            endMinute: true,
            index: true,
          },
          orderBy: [{ index: 'asc' }],
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
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
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
                axisType: true,
                axisDate: true,
                axisWeekday: true,
                startMinute: true,
                endMinute: true,
              },
            },
          },
        },
        oneTimeSchedule: true,
        recurringSchedule: true,
      },
    });
  }

  /**
   * Get a user's staged vote draft for an event
   */
  async findStagedVoteByEventAndUser(eventId: string, userId: string) {
    return this.prisma.eventStagedVote.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      select: {
        slotIds: true,
        baselineSlotIds: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get an event's staged confirmed-time draft
   */
  async findStagedConfirmationByEventId(eventId: string) {
    return this.prisma.eventStagedConfirmation.findUnique({
      where: { eventId },
      select: {
        slotIds: true,
        baselineSlotIds: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get an event's public information
   */
  async findPublicInfo(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        owner: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        expectedParticipants: {
          where: { isRemoved: false },
          select: { id: true },
        },
        confirmedTimeSlots: {
          include: {
            slot: {
              select: {
                id: true,
                axisType: true,
                axisDate: true,
                axisWeekday: true,
                startMinute: true,
                endMinute: true,
              },
            },
          },
        },
        oneTimeSchedule: true,
        recurringSchedule: true,
      },
    });
  }

  /**
   * Get an event's basic information (used for validation)
   */
  async findOneBasic(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        confirmedTimeSlots: {
          select: { id: true },
        },
        oneTimeSchedule: true,
        recurringSchedule: true,
      },
    });
  }

  /**
   * Update an event
   */
  async update(eventId: string, data: Prisma.EventUpdateInput) {
    return this.prisma.event.update({
      where: { id: eventId },
      data,
      include: {
        oneTimeSchedule: true,
        recurringSchedule: true,
      },
    });
  }

  /**
   * Soft delete an event
   */
  async softDelete(eventId: string) {
    return this.prisma.event.update({
      where: { id: eventId },
      data: { isDeleted: true },
    });
  }

  /**
   * Build the expected participant data
   * @returns the participants array plus creatorLineUserId (used to count participants correctly)
   */
  private async buildParticipantData(
    prisma: Prisma.TransactionClient,
    eventId: string,
    creatorUserId?: string,
    expectedLineUserIds?: Array<{ lineUserId?: string; userId?: string }>,
  ): Promise<{
    participants: Array<{
      eventId: string;
      lineUserId?: string;
      userId?: string;
    }>;
    creatorLineUserId?: string;
  }> {
    const participantData: Array<{
      eventId: string;
      lineUserId?: string;
      userId?: string;
    }> = [];

    // Look up the creator's LINE userId
    let creatorLineUserId: string | undefined;
    if (creatorUserId) {
      const creatorAuthIdentity = await prisma.authIdentity.findFirst({
        where: { userId: creatorUserId, provider: 'line' },
        select: { providerUserId: true },
      });
      creatorLineUserId = creatorAuthIdentity?.providerUserId;

      // Automatically add the creator as a participant (including lineUserId)
      participantData.push({
        eventId,
        userId: creatorUserId,
        lineUserId: creatorLineUserId,
      });
    }

    // Add the expected participants from the LINE group
    const lineUserIds = expectedLineUserIds
      ?.filter((p) => p.lineUserId)
      .map((p) => p.lineUserId as string);

    if (lineUserIds && lineUserIds.length > 0) {
      // Deduplicate lineUserIds to avoid creating duplicate participants
      const uniqueLineUserIds = [...new Set(lineUserIds)];

      const linkedMembers = await prisma.lineGroupMember.findMany({
        where: {
          lineUserId: { in: uniqueLineUserIds },
          userId: { not: null },
        },
        select: {
          lineUserId: true,
          userId: true,
        },
      });

      const linkedMap = new Map(
        linkedMembers.map((m) => [m.lineUserId, m.userId]),
      );

      uniqueLineUserIds.forEach((lineUserId) => {
        // Skip if the creator is also in the LINE group, to avoid adding them twice
        if (creatorLineUserId && lineUserId === creatorLineUserId) {
          return;
        }
        const linkedUserId = linkedMap.get(lineUserId);
        participantData.push({
          eventId,
          lineUserId,
          userId: linkedUserId || undefined,
        });
      });
    }

    return { participants: participantData, creatorLineUserId };
  }
}
