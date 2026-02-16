import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateEventDto } from '../dto/create-event.dto';
import { TimeSlotService } from '../../shared/services/time-slot.service';
import { EventRepository } from '../repositories/event.repository';

/**
 * 活動創建服務（業務邏輯層）
 */
@Injectable()
export class EventCreationService {
  constructor(
    private eventRepository: EventRepository,
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

    // 業務邏輯驗證（格式已由 DTO 驗證）
    this.validateDates(startDate, endDate);
    this.validateTimes(startTime, endTime);
    if (votingDeadline) {
      this.validateVotingDeadline(votingDeadline, startDate, startTime);
    }

    // 對 expectedLineUserIds 去重
    const uniqueLineUserIds = expectedLineUserIds?.length
      ? [...new Set(expectedLineUserIds)]
      : [];

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

    // 生成時間槽
    const slots = this.timeSlotService.generateTimeSlots(
      startDateObj,
      endDateObj,
      startMinuteOfDay,
      endMinuteOfDay,
      slotDurationMin,
    );

    // 準備參與者資料（使用去重後的 lineUserIds）
    const participantData = uniqueLineUserIds.map((lineUserId) => ({
      lineUserId,
    }));

    // 透過 Repository 建立活動，並取得 creator 的 lineUserId
    const result = await this.eventRepository.createWithSlotsAndParticipants(
      {
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
      slots,
      participantData,
      userId,
    );

    return {
      eventId: result.event.id,
    };
  }

  /**
   * 驗證日期範圍：startDate <= endDate
   */
  private validateDates(startDate: string, endDate: string) {
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException(
        'Start date must be before or equal to end date',
      );
    }
  }

  /**
   * 驗證時間範圍：startTime < endTime
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
   * 驗證投票截止時間：deadline <= eventStart
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
   * 計算預期參與者數量（需與 repository 邏輯一致）
   */
  private calculateExpectedParticipantsCount(
    userId?: string,
    uniqueLineUserIds?: string[],
    creatorLineUserId?: string,
  ): number {
    let count = userId ? 1 : 0;

    if (uniqueLineUserIds && uniqueLineUserIds.length > 0) {
      // 如果 creator 的 lineUserId 也在列表中，不重複計算
      count += creatorLineUserId
        ? uniqueLineUserIds.filter((id) => id !== creatorLineUserId).length
        : uniqueLineUserIds.length;
    }

    return count;
  }
}
