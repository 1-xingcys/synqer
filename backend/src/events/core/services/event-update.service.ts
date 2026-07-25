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
 * Event update service (business logic layer)
 */
@Injectable()
export class EventUpdateService {
  constructor(
    private eventRepository: EventRepository,
    private eventAuthorizationService: EventAuthorizationService,
    private eventScheduleService: EventScheduleService,
  ) {}

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

    if (updateDto.defaultGranularityMin !== undefined) {
      updateData.defaultGranularityMin = updateDto.defaultGranularityMin;
    }

    if (updateDto.defaultVoteMode !== undefined) {
      updateData.defaultVoteMode = updateDto.defaultVoteMode;
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
   * Check whether the voting deadline can still be edited: it is locked once
   * the event time is confirmed.
   */
  private assertVotingDeadlineIsEditable(event: VotingDeadlineEditableEvent) {
    if (event.confirmedTimeSlots.length > 0) {
      throw new BadRequestException(
        'Voting deadline cannot be changed after confirming the event time',
      );
    }
  }

  /**
   * Validate the voting deadline: format only.
   */
  private validateVotingDeadline(votingDeadline: string) {
    const deadline = new Date(votingDeadline);
    if (isNaN(deadline.getTime())) {
      throw new BadRequestException('Invalid voting deadline');
    }
  }
}
