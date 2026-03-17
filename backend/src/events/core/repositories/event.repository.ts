import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Event, EventSlotAxisType, EventType } from '@prisma/client';

/**
 * 活動資料存取層
 */
@Injectable()
export class EventRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 建立活動（含時間槽與預期參與者）- 使用 Transaction
   * @returns 包含 event 和 creatorLineUserId（用於正確計算參與者數量）
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
      // 建立 Event
      const event = await prisma.event.create({
        data: {
          ...eventData,
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

      // 建立時間槽
      if (slots.length > 0) {
        await prisma.eventTimeSlot.createMany({
          data: slots.map((slot, index) => ({
            eventId: event.id,
            date: slot.date,
            axisType: EventSlotAxisType.DATE,
            axisDate: slot.date,
            axisWeekday: null,
            startMinute: slot.startMinute,
            endMinute: slot.endMinute,
            index,
          })),
        });
      }

      // 建立預期參與者，並取得 creatorLineUserId
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
   * 查詢使用者建立的活動列表
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
                date: true,
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
   * 查詢使用者參與的活動列表
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
                date: true,
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
   * 查詢單一活動詳情
   */
  async findOneWithDetails(eventId: string) {
    return this.prisma.event.findUnique({
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
                date: true,
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
   * 查詢指定使用者在活動中的暫存投票草稿
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
   * 查詢活動的暫存確認時間草稿
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
   * 查詢活動公開資訊
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
                date: true,
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
   * 查詢活動基本資訊（用於驗證）
   */
  async findOneBasic(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        oneTimeSchedule: true,
        recurringSchedule: true,
      },
    });
  }

  /**
   * 更新活動
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
   * 軟刪除活動
   */
  async softDelete(eventId: string) {
    return this.prisma.event.update({
      where: { id: eventId },
      data: { isDeleted: true },
    });
  }

  /**
   * 建立預期參與者資料
   * @returns 包含 participants 陣列和 creatorLineUserId（用於正確計算參與者數量）
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

    // 查詢創建者的 LINE userId
    let creatorLineUserId: string | undefined;
    if (creatorUserId) {
      const creatorAuthIdentity = await prisma.authIdentity.findFirst({
        where: { userId: creatorUserId, provider: 'line' },
        select: { providerUserId: true },
      });
      creatorLineUserId = creatorAuthIdentity?.providerUserId;

      // 自動將創建者加入為參與者（包含 lineUserId）
      participantData.push({
        eventId,
        userId: creatorUserId,
        lineUserId: creatorLineUserId,
      });
    }

    // 加入 LINE 群組的預期參與者
    const lineUserIds = expectedLineUserIds
      ?.filter((p) => p.lineUserId)
      .map((p) => p.lineUserId as string);

    if (lineUserIds && lineUserIds.length > 0) {
      // 對 lineUserIds 去重，避免建立重複的參與者
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
        // 如果創建者也在 LINE 群組中，避免重複添加
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
