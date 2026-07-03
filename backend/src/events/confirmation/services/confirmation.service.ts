import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfirmationRepository } from '../repositories/confirmation.repository';
import {
  ConfirmEventTimeDto,
  UpdateStagedConfirmationDto,
} from '../dto/confirm-event-time.dto';
import { EventStatusService } from '../../shared/services/event-status.service';
import { EventAuthorizationService } from '../../shared/services/event-authorization.service';
import { TimeSlotRepository } from '../../shared/repositories/time-slot.repository';

/**
 * 活動時間確認服務（業務邏輯層）
 */
@Injectable()
export class ConfirmationService {
  constructor(
    private confirmationRepository: ConfirmationRepository,
    private eventStatusService: EventStatusService,
    private eventAuthorizationService: EventAuthorizationService,
    private timeSlotRepository: TimeSlotRepository,
  ) {}

  /**
   * 確認活動時間（僅限活動擁有者）
   */
  async confirmEventTime(
    eventId: string,
    userId: string,
    dto: ConfirmEventTimeDto,
  ) {
    await this.eventAuthorizationService.verifyOwner(eventId, userId);

    // 去重 slotIds
    const uniqueSlotIds = [...new Set(dto.slotIds)];

    // 驗證所有 slotIds 都屬於這個活動
    const slots = await this.confirmationRepository.findSlotsByIdsAndEventId(
      eventId,
      uniqueSlotIds,
    );

    if (slots.length !== uniqueSlotIds.length) {
      throw new BadRequestException(
        'Some slot IDs are invalid or do not belong to this event',
      );
    }

    // 使用 transaction 更新確認的時段
    await this.confirmationRepository.updateConfirmedSlotsInTransaction(
      eventId,
      uniqueSlotIds,
    );

    // 查詢更新後的資料並回傳實際儲存的結果
    const updatedEvent =
      await this.confirmationRepository.findEventWithConfirmedSlots(eventId);

    // 理論上不會發生（verifyOwner 已驗證），但作為防禦性檢查
    if (!updatedEvent) {
      throw new BadRequestException('Event not found');
    }

    return {
      id: updatedEvent.id,
      confirmedSlotIds: updatedEvent.confirmedTimeSlots.map((s) => s.slotId),
      status: this.eventStatusService.computeEventStatus({
        eventType: updatedEvent.type,
        votingDeadline: updatedEvent.votingDeadline,
        timeZone: updatedEvent.timeZone,
        confirmedTimeSlots: updatedEvent.confirmedTimeSlots,
      }),
    };
  }

  /**
   * 更新 staged confirmation 草稿
   */
  async updateStagedConfirmation(
    eventId: string,
    userId: string,
    dto: UpdateStagedConfirmationDto,
  ) {
    await this.eventAuthorizationService.verifyOwner(eventId, userId);

    const { addSlotIds = [], removeSlotIds = [] } = dto;
    const allSlotIds = await this.timeSlotRepository.findIdsByEventId(eventId);

    if (addSlotIds.length === 0 && removeSlotIds.length === 0) {
      const existing =
        await this.confirmationRepository.findStagedConfirmation(eventId);
      return {
        success: true,
        stagedSlotCount: existing?.slotIds.length ?? 0,
      };
    }

    const uniqueAddSlotIds = [...new Set(addSlotIds)];
    const uniqueRemoveSlotIds = [...new Set(removeSlotIds)];
    this.validateSlotIdsBelongToEvent(allSlotIds, [
      ...uniqueAddSlotIds,
      ...uniqueRemoveSlotIds,
    ]);

    const existing =
      await this.confirmationRepository.findStagedConfirmation(eventId);

    let baseSlotIds: string[];
    let baselineSlotIds: string[];

    if (existing) {
      baseSlotIds = this.toCanonicalSlotIds(allSlotIds, existing.slotIds);
      baselineSlotIds = this.toCanonicalSlotIds(
        allSlotIds,
        existing.baselineSlotIds,
      );
    } else {
      const confirmedSlotIds =
        await this.confirmationRepository.findConfirmedSlotIds(eventId);
      baselineSlotIds = this.toCanonicalSlotIds(allSlotIds, confirmedSlotIds);
      baseSlotIds = [...baselineSlotIds];
    }

    const nextSlotIds = new Set(baseSlotIds);
    uniqueAddSlotIds.forEach((slotId) => nextSlotIds.add(slotId));
    uniqueRemoveSlotIds.forEach((slotId) => nextSlotIds.delete(slotId));

    const nextCanonicalSlotIds = this.toCanonicalSlotIds(
      allSlotIds,
      nextSlotIds,
    );

    if (this.areSameSlotIds(nextCanonicalSlotIds, baselineSlotIds)) {
      if (existing) {
        await this.confirmationRepository.deleteStagedConfirmation(eventId);
      }
      return {
        success: true,
        stagedSlotCount: 0,
      };
    }

    await this.confirmationRepository.upsertStagedConfirmation(
      eventId,
      nextCanonicalSlotIds,
      baselineSlotIds,
    );

    return {
      success: true,
      stagedSlotCount: nextCanonicalSlotIds.length,
    };
  }

  /**
   * 提交 staged confirmation 草稿為正式 confirmed time
   */
  async commitStagedConfirmation(eventId: string, userId: string) {
    await this.eventAuthorizationService.verifyOwner(eventId, userId);

    const allSlotIds = await this.timeSlotRepository.findIdsByEventId(eventId);
    const staged =
      await this.confirmationRepository.findStagedConfirmation(eventId);

    if (!staged) {
      throw new BadRequestException('尚無暫存活動時間可提交');
    }

    const uniqueSlotIds = [...new Set(staged.slotIds)];
    this.validateSlotIdsBelongToEvent(allSlotIds, uniqueSlotIds);

    await this.confirmationRepository.commitStagedConfirmationInTransaction(
      eventId,
      uniqueSlotIds,
    );

    const updatedEvent =
      await this.confirmationRepository.findEventWithConfirmedSlots(eventId);

    if (!updatedEvent) {
      throw new BadRequestException('Event not found');
    }

    return {
      id: updatedEvent.id,
      confirmedSlotIds: updatedEvent.confirmedTimeSlots.map(
        (slot) => slot.slotId,
      ),
      status: this.eventStatusService.computeEventStatus({
        eventType: updatedEvent.type,
        votingDeadline: updatedEvent.votingDeadline,
        timeZone: updatedEvent.timeZone,
        confirmedTimeSlots: updatedEvent.confirmedTimeSlots,
      }),
    };
  }

  /**
   * 取消確認的活動時間（僅限活動擁有者）
   */
  async cancelConfirmedTime(eventId: string, userId: string) {
    await this.eventAuthorizationService.verifyOwner(eventId, userId);

    // 刪除所有確認的時段
    await this.confirmationRepository.deleteAllConfirmedSlots(eventId);

    const updatedEvent =
      await this.confirmationRepository.findEventBasicInfo(eventId);

    if (!updatedEvent) {
      throw new BadRequestException('Event not found');
    }

    return {
      id: updatedEvent.id,
      status: this.eventStatusService.computeEventStatus({
        eventType: updatedEvent.type,
        votingDeadline: updatedEvent.votingDeadline,
        timeZone: updatedEvent.timeZone,
        confirmedTimeSlots: [],
      }),
    };
  }

  /**
   * 捨棄 staged confirmation 草稿
   */
  async discardStagedConfirmation(eventId: string, userId: string) {
    await this.eventAuthorizationService.verifyOwner(eventId, userId);
    await this.confirmationRepository.deleteStagedConfirmation(eventId);
    return { success: true };
  }

  private validateSlotIdsBelongToEvent(
    allSlotIds: string[],
    requestedSlotIds: string[],
  ) {
    const allSlotIdSet = new Set(allSlotIds);
    const invalidSlotIds = requestedSlotIds.filter(
      (slotId) => !allSlotIdSet.has(slotId),
    );

    if (invalidSlotIds.length > 0) {
      throw new BadRequestException(
        'Some slot IDs are invalid or do not belong to this event',
      );
    }
  }

  private toCanonicalSlotIds(allSlotIds: string[], slotIds: Iterable<string>) {
    const slotIdSet = new Set(slotIds);
    return allSlotIds.filter((slotId) => slotIdSet.has(slotId));
  }

  private areSameSlotIds(left: string[], right: string[]) {
    if (left.length !== right.length) return false;
    return left.every((slotId, index) => slotId === right[index]);
  }
}
