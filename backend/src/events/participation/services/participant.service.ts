import { Injectable, NotFoundException } from '@nestjs/common';
import { ParticipantRepository } from '../repositories/participant.repository';
import { UpdateParticipantsDto } from '../dto/update-participants.dto';
import { EventAuthorizationService } from '../../shared/services/event-authorization.service';

/**
 * 參與者管理服務（業務邏輯層）
 */
@Injectable()
export class ParticipantService {
  constructor(
    private participantRepository: ParticipantRepository,
    private eventAuthorizationService: EventAuthorizationService,
  ) {}

  /**
   * 取得活動中尚未投票的預期參與者
   */
  async getUnvotedParticipants(eventId: string) {
    const event =
      await this.participantRepository.findEventWithParticipants(eventId);

    if (!event || event.isDeleted) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    const votedUserIds = new Set(event.votes.map((v) => v.userId));

    // 找出未投票且有 lineUserId 的預期參與者
    const unvotedWithLineUserId = event.expectedParticipants.filter((ep) => {
      const hasVoted = ep.userId ? votedUserIds.has(ep.userId) : false;
      return !hasVoted && ep.lineUserId;
    });

    // 批次查詢 LINE 群組成員資料
    const lineUserIds = unvotedWithLineUserId
      .map((ep) => ep.lineUserId)
      .filter((id): id is string => !!id);

    const lineGroupMembers = event.lineGroup
      ? await this.participantRepository.findLineGroupMembersByLineUserIdsAndGroupId(
          event.lineGroup.id,
          lineUserIds,
        )
      : [];

    // 建立 lineUserId -> member 的映射
    const memberMap = new Map(lineGroupMembers.map((m) => [m.lineUserId, m]));

    const unvoted = unvotedWithLineUserId.map((ep) => {
      const memberInfo = ep.lineUserId ? memberMap.get(ep.lineUserId) : null;
      return {
        id: ep.id,
        lineUserId: ep.lineUserId!,
        userId: ep.userId,
        displayName:
          ep.user?.displayName || memberInfo?.displayName || 'Unknown',
        pictureUrl: memberInfo?.pictureUrl,
        reminderSentAt: ep.reminderSentAt,
      };
    });

    return {
      eventId,
      lineGroupId: event.lineGroup?.id,
      lineGroupLineId: event.lineGroup?.lineGroupId,
      unvotedParticipants: unvoted,
    };
  }

  /**
   * 檢查使用者是否已經是活動的參與者
   */
  async checkParticipantStatus(eventId: string, userId: string) {
    const event = await this.participantRepository.findEventBasicInfo(eventId);

    if (!event || event.isDeleted) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    // 檢查是否已經是預期參與者（且未被移除）
    const existingParticipant =
      await this.participantRepository.findParticipantByUserId(eventId, userId);

    // 檢查是否有投票紀錄
    const hasVoted = await this.participantRepository.findVoteByUserId(
      eventId,
      userId,
    );

    return {
      isParticipant: !!existingParticipant,
      hasVoted: !!hasVoted,
    };
  }

  /**
   * 加入活動（透過分享連結）
   */
  async joinEvent(eventId: string, userId: string) {
    const event = await this.participantRepository.findEventBasicInfo(eventId);

    if (!event || event.isDeleted) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    // 檢查是否已經是參與者
    const existingParticipant =
      await this.participantRepository.findParticipantByUserIdIncludeRemoved(
        eventId,
        userId,
      );

    if (existingParticipant) {
      // 如果已被移除（曾經是參與者），則恢復
      if (existingParticipant.isRemoved) {
        await this.participantRepository.restoreParticipant(
          existingParticipant.id,
        );
        return {
          success: true,
          alreadyJoined: false,
          message: 'Successfully rejoined the event',
        };
      }

      return {
        success: true,
        alreadyJoined: true,
        message: 'You are already a participant of this event',
      };
    }

    // 加入為參與者
    await this.participantRepository.createParticipant(eventId, userId);

    return {
      success: true,
      alreadyJoined: false,
      message: 'Successfully joined the event',
    };
  }

  /**
   * 更新活動的預期參與者
   * 採用軟刪除策略：移除的參與者標記 isRemoved = true，保留投票紀錄
   * 重新加入的參與者會恢復 isRemoved = false
   * 注意：Host 不能被移除
   */
  async updateParticipants(
    eventId: string,
    userId: string,
    dto: UpdateParticipantsDto,
  ) {
    await this.eventAuthorizationService.verifyOwner(eventId, userId);

    // 過濾有效的參與者（至少有 lineUserId 或 userId）
    const validParticipants = dto.participants.filter(
      (p) => p.lineUserId || p.userId,
    );

    // 確保 host 在參與者列表中（不能移除自己）
    const hostInParticipants = validParticipants.some(
      (p) => p.userId === userId,
    );
    const participantsWithHost = hostInParticipants
      ? validParticipants
      : [...validParticipants, { userId }];

    // 取得現有的所有預期參與者（包含已移除的）
    const existingParticipants =
      await this.participantRepository.findAllParticipants(eventId);

    // 建立現有參與者的識別 key -> { id, isRemoved, userId }
    const existingKeys = new Map<
      string,
      { id: string; isRemoved: boolean; userId: string | null }
    >();
    existingParticipants.forEach((p) => {
      const key = p.lineUserId || p.userId;
      if (key) {
        existingKeys.set(key, {
          id: p.id,
          isRemoved: p.isRemoved,
          userId: p.userId,
        });
      }
    });

    // 建立新參與者的識別 key 集合
    const newKeys = new Set<string>();
    participantsWithHost.forEach((p) => {
      const key = p.lineUserId || p.userId;
      if (key) newKeys.add(key);
    });

    // 找出需要標記為移除、恢復的參與者
    const toRemoveIds: string[] = [];
    const toRestoreIds: string[] = [];

    existingKeys.forEach((info, key) => {
      if (!newKeys.has(key) && !info.isRemoved) {
        // 需要移除，但不能移除 host
        if (info.userId !== userId) {
          toRemoveIds.push(info.id);
        }
      } else if (newKeys.has(key) && info.isRemoved) {
        // 需要恢復
        toRestoreIds.push(info.id);
      }
    });

    // 找出需要新增的參與者（在新的中但不在現有中）
    const toAdd = participantsWithHost.filter((p) => {
      const key = (p.lineUserId || p.userId) as string;
      return !existingKeys.has(key);
    });

    // 使用 transaction 更新參與者
    await this.participantRepository.updateParticipantsInTransaction(
      eventId,
      toRemoveIds,
      toRestoreIds,
      toAdd,
    );

    // 回傳原始 DTO 的數量（不含自動補入的 host）
    return { success: true, count: validParticipants.length };
  }
}
