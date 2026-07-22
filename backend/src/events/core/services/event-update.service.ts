import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventRepository } from '../repositories/event.repository';
import { EventAuthorizationService } from '../../shared/services/event-authorization.service';
import { EventScheduleService } from '../../shared/services/event-schedule.service';

type VotingDeadlineEditableEvent = NonNullable<
  Awaited<ReturnType<EventRepository['findOneBasic']>>
>;

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

    if (updateDto.votingDeadline !== undefined) {
      const event = await this.getEventForVotingDeadlineUpdate(eventId);
      this.assertVotingDeadlineIsEditable(event);

      if (typeof updateDto.votingDeadline === 'string') {
        this.validateVotingDeadline(updateDto.votingDeadline);
      }
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

  private async getEventForVotingDeadlineUpdate(
    eventId: string,
  ): Promise<VotingDeadlineEditableEvent> {
    const event = await this.eventRepository.findOneBasic(eventId);
    if (!event) {
      throw new BadRequestException('Event not found');
    }

    return event;
  }

  /**
   * 驗證投票截止時間是否仍可編輯：
   * - 已確認活動時間後不可調整
   * - 單次活動開始後不可調整
   */
  private assertVotingDeadlineIsEditable(event: VotingDeadlineEditableEvent) {
    if (event.confirmedTimeSlots.length > 0) {
      throw new BadRequestException(
        'Voting deadline cannot be changed after confirming the event time',
      );
    }

    const eventStart = this.eventScheduleService.getEventStartInstant(event);
    if (eventStart && new Date() >= eventStart) {
      throw new BadRequestException(
        'Voting deadline cannot be changed after the event has started',
      );
    }
  }

  /**
   * 驗證投票截止時間：只檢查格式。
   *
   * 截止時間的「數值」不設限 —— 主辦人可以刻意設在過去（立即關閉投票），
   * 或設在活動時間之後。是否還能編輯由 assertVotingDeadlineIsEditable 決定。
   */
  private validateVotingDeadline(votingDeadline: string) {
    const deadline = new Date(votingDeadline);
    if (isNaN(deadline.getTime())) {
      throw new BadRequestException('Invalid voting deadline');
    }
  }
}
