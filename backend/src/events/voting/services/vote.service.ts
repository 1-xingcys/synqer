import { Injectable, BadRequestException } from '@nestjs/common';
import { VoteRepository } from '../repositories/vote.repository';
import { VoteEventDto, VoteMode, UpdateVoteDto } from '../dto/vote-event.dto';
import { TimeSlotRepository } from '../../shared/repositories/time-slot.repository';

/**
 * 投票服務（業務邏輯層）
 */
@Injectable()
export class VoteService {
  constructor(
    private voteRepository: VoteRepository,
    private timeSlotRepository: TimeSlotRepository,
  ) {}

  /**
   * 儲存使用者的投票
   * 支援兩種模式：
   * 1. available: 投自己「可以」的時間，未選擇的時段視為不行
   * 2. unavailable: 投自己「不行」的時間，未選擇的時段視為可以
   */
  async vote(eventId: string, userId: string, voteDto: VoteEventDto) {
    const { selectedSlotIds, voteMode = VoteMode.AVAILABLE } = voteDto;

    // 檢查活動是否存在、是否已刪除、投票是否已截止
    const event = await this.voteRepository.findEventVotingInfo(eventId);

    if (!event || event.isDeleted) {
      throw new BadRequestException('活動不存在');
    }

    if (event.votingDeadline && new Date() > event.votingDeadline) {
      throw new BadRequestException('投票已截止');
    }

    // 取得該活動的所有 slot IDs
    const allSlotIds = await this.timeSlotRepository.findIdsByEventId(eventId);
    const allSlotIdSet = new Set(allSlotIds);

    // 去重並驗證 selectedSlotIds 都屬於該活動
    const uniqueSelectedSlotIds = [...new Set(selectedSlotIds)];
    const invalidSlotIds = uniqueSelectedSlotIds.filter(
      (id) => !allSlotIdSet.has(id),
    );
    if (invalidSlotIds.length > 0) {
      throw new BadRequestException('部分時段不屬於此活動');
    }

    // 根據投票模式計算「有空」的時段
    let availableSlotIds: string[];

    if (voteMode === VoteMode.UNAVAILABLE) {
      // 如果是投「不行」的時間，把其他時間都視為可以
      const unavailableSet = new Set(uniqueSelectedSlotIds);
      availableSlotIds = allSlotIds.filter((id) => !unavailableSet.has(id));
    } else {
      // 如果是投「可以」的時間，使用去重後的選擇
      availableSlotIds = uniqueSelectedSlotIds;
    }

    // 使用 transaction 執行投票
    const result = await this.voteRepository.submitVoteInTransaction(
      eventId,
      userId,
      availableSlotIds,
    );

    return {
      success: true,
      votedSlots: result.availableSlotIds.length,
      voteMode,
    };
  }

  /**
   * 增量更新使用者的投票
   * 新增 addSlotIds 的投票紀錄、移除 removeSlotIds 的投票紀錄
   */
  async updateVotes(
    eventId: string,
    userId: string,
    updateVoteDto: UpdateVoteDto,
  ) {
    const { addSlotIds = [], removeSlotIds = [] } = updateVoteDto;
    if (addSlotIds.length === 0 && removeSlotIds.length === 0) {
      return { success: true, added: 0, removed: 0 };
    }

    const event = await this.voteRepository.findEventVotingInfo(eventId);

    if (!event || event.isDeleted) {
      throw new BadRequestException('活動不存在');
    }

    if (event.votingDeadline && new Date() > event.votingDeadline) {
      throw new BadRequestException('投票已截止');
    }

    const allSlotIds = await this.timeSlotRepository.findIdsByEventId(eventId);
    const allSlotIdSet = new Set(allSlotIds);
    const uniqueAddSlotIds = [...new Set(addSlotIds)];
    const uniqueRemoveSlotIds = [...new Set(removeSlotIds)];

    const allRequestedIds = [...uniqueAddSlotIds, ...uniqueRemoveSlotIds];
    const invalidSlotIds = allRequestedIds.filter(
      (id) => !allSlotIdSet.has(id),
    );
    if (invalidSlotIds.length > 0) {
      throw new BadRequestException('部分時段不屬於此活動');
    }

    // 使用 transaction 執行增量更新
    const result = await this.voteRepository.updateVotesInTransaction(
      eventId,
      userId,
      uniqueAddSlotIds,
      uniqueRemoveSlotIds,
    );

    return {
      success: true,
      added: result.addSlotIds.length,
      removed: result.removeSlotIds.length,
    };
  }
}
