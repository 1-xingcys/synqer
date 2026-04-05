import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventRepository } from '../repositories/event.repository';
import { EventAuthorizationService } from '../../shared/services/event-authorization.service';
import { EventScheduleService } from '../../shared/services/event-schedule.service';

/**
 * 活動更新服務（業務邏輯層）
 */
@Injectable()
export class EventUpdateService {
  constructor(
    private eventRepository: EventRepository,
    private eventAuthorizationService: EventAuthorizationService,
    private eventScheduleService: EventScheduleService,
  ) {}

  /**
   * 更新活動設定
   *
   * 注意：為了保持資料一致性，以下欄位不允許更新：
   * - startDate, endDate, startTime, endTime, slotDurationMin
   * 這些欄位已從 UpdateEventDto 中移除
   */
  async update(eventId: string, userId: string, updateDto: UpdateEventDto) {
    await this.eventAuthorizationService.verifyOwner(eventId, userId);

    // 驗證 votingDeadline
    if (typeof updateDto.votingDeadline === 'string') {
      await this.validateVotingDeadline(eventId, updateDto.votingDeadline);
    }

    const updateData: Prisma.EventUpdateInput = {};

    if (updateDto.title !== undefined) {
      updateData.title = updateDto.title;
    }

    if (updateDto.description !== undefined) {
      updateData.description = updateDto.description;
    }

    if (updateDto.timeZone !== undefined) {
      updateData.timeZone = updateDto.timeZone;
    }

    if (updateDto.votingDeadline !== undefined) {
      updateData.votingDeadline =
        updateDto.votingDeadline === null
          ? null
          : new Date(updateDto.votingDeadline);
    }

    const updatedEvent = await this.eventRepository.update(eventId, updateData);
    const schedule = this.eventScheduleService.resolveSchedule(updatedEvent);

    return {
      id: updatedEvent.id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      schedule: {
        kind: schedule.type,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        weekdays: schedule.weekdays,
        startMinuteOfDay: schedule.startMinuteOfDay,
        endMinuteOfDay: schedule.endMinuteOfDay,
        slotDurationMin: schedule.slotDurationMin,
      },
    };
  }

  /**
   * 刪除活動
   */
  async remove(eventId: string, userId: string) {
    await this.eventAuthorizationService.verifyOwner(eventId, userId);

    await this.eventRepository.softDelete(eventId);

    return { success: true };
  }

  /**
   * 驗證投票截止時間必須在活動開始時間之前
   */
  private async validateVotingDeadline(
    eventId: string,
    votingDeadline: string,
  ) {
    const event = await this.eventRepository.findOneBasic(eventId);
    if (!event) {
      throw new BadRequestException('Event not found');
    }

    const deadline = new Date(votingDeadline);
    if (isNaN(deadline.getTime())) {
      throw new BadRequestException('Invalid voting deadline');
    }

    const eventStart = this.eventScheduleService.getEventStartInstant(event);

    if (eventStart && deadline > eventStart) {
      throw new BadRequestException(
        'Voting deadline must be before or at the event start time',
      );
    }
  }
}
