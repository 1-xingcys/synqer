import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfirmationRepository } from '../repositories/confirmation.repository';
import { ConfirmEventTimeDto } from '../dto/confirm-event-time.dto';
import { EventStatusService } from '../../shared/services/event-status.service';
import { EventAuthorizationService } from '../../shared/services/event-authorization.service';

/**
 * 活動時間確認服務（業務邏輯層）
 */
@Injectable()
export class ConfirmationService {
  constructor(
    private confirmationRepository: ConfirmationRepository,
    private eventStatusService: EventStatusService,
    private eventAuthorizationService: EventAuthorizationService,
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

    const confirmedTimeSlots = updatedEvent.confirmedTimeSlots.map((cts) => ({
      slotId: cts.slotId,
      date: cts.slot.date,
      startMinute: cts.slot.startMinute,
      endMinute: cts.slot.endMinute,
    }));

    return {
      id: updatedEvent.id,
      confirmedSlotIds: confirmedTimeSlots.map((s) => s.slotId),
      status: this.eventStatusService.computeEventStatus({
        votingDeadline: updatedEvent.votingDeadline,
        confirmedTimeSlots,
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
        votingDeadline: updatedEvent.votingDeadline,
        confirmedTimeSlots: [],
      }),
    };
  }
}
