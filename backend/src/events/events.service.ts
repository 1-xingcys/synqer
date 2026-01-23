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
    confirmedTimeSlots?: Array<{
      slotId: string;
      date: Date;
      startMinute: number;
      endMinute: number;
    }>;
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

    await this.prisma.event.update({
      where: { id: eventId },
      data: { isDeleted: true },
    });

    return { success: true };
  }

  /**
   * 確認活動時間（僅限活動擁有者）
   * 以 timeSlot 為單位儲存確認的時段
   */
  async confirmEventTime(
    eventId: string,
    userId: string,
    dto: ConfirmEventTimeDto,
  ) {
    await this.eventAuthorizationService.verifyOwner(eventId, userId);

    // 驗證所有 slotIds 都屬於這個活動
    const slots = await this.prisma.eventTimeSlot.findMany({
      where: {
        id: { in: dto.slotIds },
        eventId,
      },
    });

    if (slots.length !== dto.slotIds.length) {
      throw new BadRequestException(
        'Some slot IDs are invalid or do not belong to this event',
      );
    }

    // 使用 transaction 更新確認的時段
    await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
      // 刪除現有的確認時段
      await prisma.confirmedEventTimeSlot.deleteMany({
        where: { eventId },
      });

      // 新增新的確認時段
      await prisma.confirmedEventTimeSlot.createMany({
        data: dto.slotIds.map((slotId) => ({
          eventId,
          slotId,
        })),
      });
    });

    // 查詢更新後的資料
    const updatedEvent = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        confirmedTimeSlots: {
          include: {
            slot: {
              select: {
                id: true,
                date: true,
                startMinute: true,
                endMinute: true,
              },
            },
          },
        },
      },
    });

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
      confirmedSlotIds: dto.slotIds,
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
    await this.prisma.confirmedEventTimeSlot.deleteMany({
      where: { eventId },
    });

    const updatedEvent = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

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

    // 確保 host 在參與者列表中（不能移除自己）
    const hostInParticipants = dto.participants.some(
      (p) => p.userId === userId,
    );
    if (!hostInParticipants) {
      // 自動將 host 加入參與者列表
      dto.participants.push({ userId });
    }

    // 使用 transaction 確保一致性
    await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
      // 取得現有的所有預期參與者（包含已移除的）
      const existingParticipants =
        await prisma.eventExpectedParticipant.findMany({
          where: { eventId },
          select: {
            id: true,
            lineUserId: true,
            userId: true,
            isRemoved: true,
          },
        });

      // 建立現有參與者的識別 key -> { id, isRemoved }
      const existingKeys = new Map<
        string,
        { id: string; isRemoved: boolean; userId: string | null }
      >();
      existingParticipants.forEach((p) => {
        const key = p.lineUserId || p.userId || '';
        if (key) {
          existingKeys.set(key, {
            id: p.id,
            isRemoved: p.isRemoved,
            userId: p.userId,
          });
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

      // 找出需要標記為移除的參與者（在現有中且未移除，但不在新的中）
      // 注意：Host 不能被移除
      const toRemoveIds: string[] = [];
      // 找出需要恢復的參與者（在現有中且已移除，但在新的中）
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
      const toAdd = newParticipants.filter((p) => {
        const key = p.lineUserId || p.userId || '';
        return !existingKeys.has(key);
      });

      // 執行軟刪除（標記 isRemoved = true）
      if (toRemoveIds.length > 0) {
        await prisma.eventExpectedParticipant.updateMany({
          where: {
            id: { in: toRemoveIds },
          },
          data: {
            isRemoved: true,
          },
        });
      }

      // 執行恢復（標記 isRemoved = false）
      if (toRestoreIds.length > 0) {
        await prisma.eventExpectedParticipant.updateMany({
          where: {
            id: { in: toRestoreIds },
          },
          data: {
            isRemoved: false,
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
