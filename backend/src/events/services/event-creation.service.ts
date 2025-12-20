import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateEventDto } from '../dto/create-event.dto';
import { TimeSlotService } from './time-slot.service';

/**
 * 活動創建服務
 */
@Injectable()
export class EventCreationService {
  constructor(
    private prisma: PrismaService,
    private timeSlotService: TimeSlotService,
  ) {}

  /**
   * 創建活動並處理所有相關數據
   */
  async create(createEventDto: CreateEventDto, userId?: string) {
    const {
      title,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      slotDurationMin = 15,
      timeZone = 'Asia/Taipei',
      votingDeadline,
      lineGroupId,
      expectedLineUserIds,
    } = createEventDto;

    // 解析時間為分鐘數
    const startMinuteOfDay = this.timeSlotService.parseTimeToMinutes(startTime);
    const endMinuteOfDay = this.timeSlotService.parseTimeToMinutes(endTime);

    // 解析日期
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const votingDeadlineObj = votingDeadline ? new Date(votingDeadline) : null;

    // 使用 transaction 確保一致性
    const result = await this.prisma.$transaction(
      async (prisma: Prisma.TransactionClient) => {
        // 建立 Event
        const event = await prisma.event.create({
          data: {
            title,
            description,
            ownerId: userId || null,
            startDate: startDateObj,
            endDate: endDateObj,
            startMinuteOfDay,
            endMinuteOfDay,
            slotDurationMin,
            timeZone,
            votingDeadline: votingDeadlineObj,
            lineGroupId: lineGroupId || null,
          },
        });

        // 展開並建立 slots
        await this.createTimeSlots(
          prisma,
          event.id,
          startDateObj,
          endDateObj,
          startMinuteOfDay,
          endMinuteOfDay,
          slotDurationMin,
        );

        // 建立預期參與者
        await this.createExpectedParticipants(
          prisma,
          event.id,
          userId,
          expectedLineUserIds,
        );

        return event;
      },
    );

    // 計算實際加入的參與者數量
    const expectedParticipantsCount = this.calculateExpectedParticipantsCount(
      userId,
      expectedLineUserIds,
    );

    return {
      eventId: result.id,
      shareUrl: `/events/${result.id}`,
      meta: {
        title: result.title,
        totalSlots: this.timeSlotService.generateTimeSlots(
          startDateObj,
          endDateObj,
          startMinuteOfDay,
          endMinuteOfDay,
          slotDurationMin,
        ).length,
        lineGroupId: result.lineGroupId,
        expectedParticipants: expectedParticipantsCount,
      },
    };
  }

  /**
   * 創建時間槽
   */
  private async createTimeSlots(
    prisma: Prisma.TransactionClient,
    eventId: string,
    startDate: Date,
    endDate: Date,
    startMinuteOfDay: number,
    endMinuteOfDay: number,
    slotDurationMin: number,
  ) {
    const slots = this.timeSlotService.generateTimeSlots(
      startDate,
      endDate,
      startMinuteOfDay,
      endMinuteOfDay,
      slotDurationMin,
    );

    if (slots.length > 0) {
      await prisma.eventTimeSlot.createMany({
        data: slots.map((slot, index) => ({
          eventId,
          date: slot.date,
          startMinute: slot.startMinute,
          endMinute: slot.endMinute,
          index,
        })),
      });
    }
  }

  /**
   * 創建預期參與者
   */
  private async createExpectedParticipants(
    prisma: Prisma.TransactionClient,
    eventId: string,
    userId?: string,
    expectedLineUserIds?: string[],
  ) {
    const participantData: Array<{
      eventId: string;
      lineUserId?: string;
      userId?: string;
    }> = [];

    // 自動將創建者加入為參與者
    if (userId) {
      participantData.push({
        eventId,
        userId,
      });
    }

    // 加入 LINE 群組的預期參與者
    if (expectedLineUserIds && expectedLineUserIds.length > 0) {
      const linkedMembers = await prisma.lineGroupMember.findMany({
        where: {
          lineUserId: { in: expectedLineUserIds },
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

      expectedLineUserIds.forEach((lineUserId) => {
        const linkedUserId = linkedMap.get(lineUserId);
        // 如果創建者也在 LINE 群組中，避免重複添加
        if (linkedUserId && linkedUserId === userId) {
          return; // 跳過，因為已經在上面添加了
        }
        participantData.push({
          eventId,
          lineUserId,
          userId: linkedUserId || undefined,
        });
      });
    }

    // 批次建立參與者記錄
    if (participantData.length > 0) {
      await prisma.eventExpectedParticipant.createMany({
        data: participantData,
      });
    }
  }

  /**
   * 計算預期參與者數量
   */
  private calculateExpectedParticipantsCount(
    userId?: string,
    expectedLineUserIds?: string[],
  ): number {
    let count = userId ? 1 : 0;
    if (expectedLineUserIds && expectedLineUserIds.length > 0) {
      count += expectedLineUserIds.length;
    }
    return count;
  }
}
