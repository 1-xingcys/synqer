import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { VoteEventDto } from './dto/vote-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateParticipantsDto } from './dto/update-participants.dto';
import { ConfirmEventTimeDto } from './dto/confirm-event-time.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  EventStatusService,
  EventStatus,
  ParticipantStatus,
  TimeSlotService,
  EventParticipantService,
  EventVoteService,
  EventAuthorizationService,
  EventQueryService,
  EventCreationService,
} from './services';

// 重新導出 enum 以保持向後兼容
export { EventStatus, ParticipantStatus };

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private eventStatusService: EventStatusService,
    private timeSlotService: TimeSlotService,
    private eventParticipantService: EventParticipantService,
    private eventVoteService: EventVoteService,
    private eventAuthorizationService: EventAuthorizationService,
    private eventQueryService: EventQueryService,
    private eventCreationService: EventCreationService,
  ) {}

  /**
   * 根據活動資訊計算活動狀態
   * @deprecated 使用 EventStatusService.computeEventStatus 代替
   */
  computeEventStatus(event: {
    votingDeadline: Date | null;
    confirmedStartTime: Date | null;
    confirmedEndTime: Date | null;
  }): EventStatus {
    return this.eventStatusService.computeEventStatus(event);
  }

  /**
   * 根據參與者資訊計算參與者狀態
   * @deprecated 使用 EventStatusService.computeParticipantStatus 代替
   */
  computeParticipantStatus(participant: {
    userId: string | null;
    lineUserId: string | null;
    hasVoted: boolean;
  }): ParticipantStatus {
    return this.eventStatusService.computeParticipantStatus(participant);
  }

  /**
   * 建立 Event 並展開所有 TimeSlots
   */
  async create(createEventDto: CreateEventDto, userId?: string) {
    return this.eventCreationService.create(createEventDto, userId);
  }

  /**
   * 取得使用者建立的所有活動
   */
  async findUserEvents(userId: string) {
    return this.eventQueryService.findUserEvents(userId);
  }

  /**
   * 取得使用者參與的所有活動（有投票紀錄或作為預期參與者的活動）
   */
  async findAttendedEvents(userId: string) {
    return this.eventQueryService.findAttendedEvents(userId);
  }

  /**
   * 取得 Event 完整資料（含 slots 和 votes）
   */
  async findOne(eventId: string) {
    const result = await this.eventQueryService.findOne(eventId);
    if (!result) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }
    return result;
  }

  /**
   * 取得活動中尚未投票的預期參與者
   */
  async getUnvotedParticipants(eventId: string) {
    return this.eventParticipantService.getUnvotedParticipants(eventId);
  }

  /**
   * 儲存使用者的投票
   * 支援兩種模式：
   * 1. available: 投自己「可以」的時間，未選擇的時段視為不行
   * 2. unavailable: 投自己「不行」的時間，未選擇的時段視為可以
   */
  async vote(eventId: string, userId: string, voteDto: VoteEventDto) {
    return this.eventVoteService.vote(eventId, userId, voteDto);
  }

  /**
   * 取得 Host 端的活動詳細資料（包含投票狀態）
   */
  async findOneHosted(eventId: string, userId: string) {
    const result = await this.eventQueryService.findOneHosted(eventId, userId);
    if (!result) {
      // 檢查是權限問題還是活動不存在
      await this.eventAuthorizationService.verifyOwner(eventId, userId);
      throw new NotFoundException(`Event ${eventId} not found`);
    }
    return result;
  }

  /**
   * 更新活動設定
   */
  async update(eventId: string, userId: string, updateDto: UpdateEventDto) {
    await this.eventAuthorizationService.verifyOwner(eventId, userId);

    const updateData: Prisma.EventUpdateInput = {};

    if (updateDto.title !== undefined) {
      updateData.title = updateDto.title;
    }

    if (updateDto.description !== undefined) {
      updateData.description = updateDto.description;
    }

    if (updateDto.startDate !== undefined) {
      updateData.startDate = new Date(updateDto.startDate);
    }

    if (updateDto.endDate !== undefined) {
      updateData.endDate = new Date(updateDto.endDate);
    }

    if (updateDto.startTime !== undefined) {
      updateData.startMinuteOfDay = this.timeSlotService.parseTimeToMinutes(
        updateDto.startTime,
      );
    }

    if (updateDto.endTime !== undefined) {
      updateData.endMinuteOfDay = this.timeSlotService.parseTimeToMinutes(
        updateDto.endTime,
      );
    }

    if (updateDto.slotDurationMin !== undefined) {
      updateData.slotDurationMin = updateDto.slotDurationMin;
    }

    if (updateDto.timeZone !== undefined) {
      updateData.timeZone = updateDto.timeZone;
    }

    if (updateDto.votingDeadline !== undefined) {
      updateData.votingDeadline = new Date(updateDto.votingDeadline);
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    return {
      id: updatedEvent.id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      startDate: updatedEvent.startDate,
      endDate: updatedEvent.endDate,
    };
  }

  /**
   * 刪除活動
   */
  async remove(eventId: string, userId: string) {
    await this.eventAuthorizationService.verifyOwner(eventId, userId);

    await this.prisma.event.delete({
      where: { id: eventId },
    });

    return { success: true };
  }

  /**
   * 確認活動時間（僅限活動擁有者）
   */
  async confirmEventTime(
    eventId: string,
    userId: string,
    dto: ConfirmEventTimeDto,
  ) {
    await this.eventAuthorizationService.verifyOwner(eventId, userId);

    const confirmedStartTime = new Date(dto.confirmedStartTime);
    const confirmedEndTime = new Date(dto.confirmedEndTime);

    // 驗證結束時間必須在開始時間之後
    if (confirmedEndTime <= confirmedStartTime) {
      throw new BadRequestException(
        'Confirmed end time must be after confirmed start time',
      );
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        confirmedStartTime,
        confirmedEndTime,
      },
    });

    return {
      id: updatedEvent.id,
      confirmedStartTime: updatedEvent.confirmedStartTime,
      confirmedEndTime: updatedEvent.confirmedEndTime,
      status: this.eventStatusService.computeEventStatus({
        votingDeadline: updatedEvent.votingDeadline,
        confirmedStartTime: updatedEvent.confirmedStartTime,
        confirmedEndTime: updatedEvent.confirmedEndTime,
      }),
    };
  }

  /**
   * 取消確認的活動時間（僅限活動擁有者）
   */
  async cancelConfirmedTime(eventId: string, userId: string) {
    await this.eventAuthorizationService.verifyOwner(eventId, userId);

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        confirmedStartTime: null,
        confirmedEndTime: null,
      },
    });

    return {
      id: updatedEvent.id,
      status: this.eventStatusService.computeEventStatus({
        votingDeadline: updatedEvent.votingDeadline,
        confirmedStartTime: updatedEvent.confirmedStartTime,
        confirmedEndTime: updatedEvent.confirmedEndTime,
      }),
    };
  }

  /**
   * 更新活動的預期參與者
   * 採用差異更新策略：只新增/刪除有變動的參與者，保留現有參與者的狀態（如 hasVoted）
   */
  async updateParticipants(
    eventId: string,
    userId: string,
    dto: UpdateParticipantsDto,
  ) {
    await this.eventAuthorizationService.verifyOwner(eventId, userId);

    // 使用 transaction 確保一致性
    await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
      // 取得現有的預期參與者
      const existingParticipants =
        await prisma.eventExpectedParticipant.findMany({
          where: { eventId },
          select: {
            id: true,
            lineUserId: true,
            userId: true,
          },
        });

      // 建立現有參與者的識別 key（使用 lineUserId 或 userId）
      const existingKeys = new Map<string, string>();
      existingParticipants.forEach((p) => {
        const key = p.lineUserId || p.userId || '';
        if (key) {
          existingKeys.set(key, p.id);
        }
      });

      // 建立新參與者的識別 key 集合
      const newParticipants = dto.participants.filter(
        (p) => p.lineUserId || p.userId,
      );
      const newKeys = new Set<string>();
      newParticipants.forEach((p) => {
        const key = p.lineUserId || p.userId || '';
        if (key) {
          newKeys.add(key);
        }
      });

      // 找出需要刪除的參與者（在現有中但不在新的中）
      const toDeleteIds: string[] = [];
      existingKeys.forEach((id, key) => {
        if (!newKeys.has(key)) {
          toDeleteIds.push(id);
        }
      });

      // 找出需要新增的參與者（在新的中但不在現有中）
      const toAdd = newParticipants.filter((p) => {
        const key = p.lineUserId || p.userId || '';
        return !existingKeys.has(key);
      });

      // 執行刪除
      if (toDeleteIds.length > 0) {
        await prisma.eventExpectedParticipant.deleteMany({
          where: {
            id: { in: toDeleteIds },
          },
        });
      }

      // 執行新增
      if (toAdd.length > 0) {
        await prisma.eventExpectedParticipant.createMany({
          data: toAdd.map((p) => ({
            eventId,
            lineUserId: p.lineUserId || null,
            userId: p.userId || null,
          })),
        });
      }
    });

    return { success: true, count: dto.participants.length };
  }

  /**
   * 取得活動的公開資訊（用於加入確認頁面）
   */
  async getEventPublicInfo(eventId: string) {
    const result = await this.eventQueryService.getEventPublicInfo(eventId);
    if (!result) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }
    return result;
  }

  /**
   * 檢查使用者是否已經是活動的參與者
   */
  async checkParticipantStatus(eventId: string, userId: string) {
    return this.eventParticipantService.checkParticipantStatus(eventId, userId);
  }

  /**
   * 加入活動（透過分享連結）
   */
  async joinEvent(eventId: string, userId: string) {
    return this.eventParticipantService.joinEvent(eventId, userId);
  }
}
