import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateEventDto,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
} from '../dto/create-event.dto';
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

    // ===== Validation =====
    this.validateCharacterLimits(title, description);
    this.validateDates(startDate, endDate);
    this.validateTimes(startTime, endTime);
    if (votingDeadline) {
      this.validateVotingDeadline(votingDeadline, startDate, startTime);
    }

    // 解析時間為分鐘數
    const startMinuteOfDay = this.timeSlotService.parseTimeToMinutes(startTime);
    // Handle "24:00" as end of day
    const endMinuteOfDay =
      endTime === '24:00'
        ? 24 * 60
        : this.timeSlotService.parseTimeToMinutes(endTime);

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
   * 驗證字數限制
   */
  private validateCharacterLimits(title?: string, description?: string) {
    if (title && [...title].length > TITLE_MAX_LENGTH) {
      throw new BadRequestException(
        `Title must be at most ${TITLE_MAX_LENGTH} characters`,
      );
    }
    if (description && [...description].length > DESCRIPTION_MAX_LENGTH) {
      throw new BadRequestException(
        `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`,
      );
    }
  }

  /**
   * 驗證日期範圍
   */
  private validateDates(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      throw new BadRequestException('Invalid start date');
    }
    if (isNaN(end.getTime())) {
      throw new BadRequestException('Invalid end date');
    }
    if (start > end) {
      throw new BadRequestException(
        'Start date must be before or equal to end date',
      );
    }
  }

  /**
   * 驗證時間範圍
   */
  private validateTimes(startTime: string, endTime: string) {
    const startMinutes = this.timeSlotService.parseTimeToMinutes(startTime);
    const endMinutes =
      endTime === '24:00'
        ? 24 * 60
        : this.timeSlotService.parseTimeToMinutes(endTime);

    if (startMinutes >= endMinutes) {
      throw new BadRequestException('Start time must be before end time');
    }
  }

  /**
   * 驗證投票截止時間
   * 使用 setUTCHours 確保在任何伺服器時區都能正確處理時間
   */
  private validateVotingDeadline(
    votingDeadline: string,
    startDate: string,
    startTime: string,
  ) {
    const deadline = new Date(votingDeadline);
    if (isNaN(deadline.getTime())) {
      throw new BadRequestException('Invalid voting deadline');
    }

    // Combine start date and time
    const [hours, minutes] = startTime.split(':').map(Number);
    const eventStart = new Date(startDate);
    eventStart.setUTCHours(hours, minutes, 0, 0);

    if (deadline > eventStart) {
      throw new BadRequestException(
        'Voting deadline must be before or at the event start time',
      );
    }
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

    // 查詢創建者的 LINE userId
    let creatorLineUserId: string | undefined;
    if (userId) {
      const creatorAuthIdentity = await prisma.authIdentity.findFirst({
        where: { userId, provider: 'line' },
        select: { providerUserId: true },
      });
      creatorLineUserId = creatorAuthIdentity?.providerUserId;

      // 自動將創建者加入為參與者（包含 lineUserId）
      participantData.push({
        eventId,
        userId,
        lineUserId: creatorLineUserId,
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
        // 如果創建者也在 LINE 群組中，避免重複添加
        if (creatorLineUserId && lineUserId === creatorLineUserId) {
          return; // 跳過，因為已經在上面添加了
        }
        const linkedUserId = linkedMap.get(lineUserId);
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
