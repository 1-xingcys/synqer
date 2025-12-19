import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { VoteEventDto, VoteMode } from './dto/vote-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateParticipantsDto } from './dto/update-participants.dto';
import { ConfirmEventTimeDto } from './dto/confirm-event-time.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

// 活動狀態
export enum EventStatus {
  VOTING = 'VOTING', // 正在進行投票 (活動創建後 ~ 投票 deadline)
  VOTING_ENDED = 'VOTING_ENDED', // 已經投票結束 (投票 deadline 已過，但 host 還沒決定活動時間)
  CONFIRMED = 'CONFIRMED', // 活動時間已定 (host 決定活動時間 ~ 活動時間結束)
  COMPLETED = 'COMPLETED', // 活動時間已過 (活動已經辦完)
}

// 參與者狀態
export enum ParticipantStatus {
  VOTED = 'VOTED', // 已經投票
  NOT_VOTED = 'NOT_VOTED', // 還沒投票（已註冊）
  NOT_REGISTERED = 'NOT_REGISTERED', // 還沒註冊（只有 LINE 使用者）
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 根據活動資訊計算活動狀態
   */
  computeEventStatus(event: {
    votingDeadline: Date | null;
    confirmedStartTime: Date | null;
    confirmedEndTime: Date | null;
  }): EventStatus {
    const now = new Date();

    // 如果有確認的活動時間
    if (event.confirmedStartTime && event.confirmedEndTime) {
      // 檢查活動是否已結束
      if (now > event.confirmedEndTime) {
        return EventStatus.COMPLETED;
      }
      return EventStatus.CONFIRMED;
    }

    // 如果沒有確認的活動時間，檢查投票截止時間
    if (event.votingDeadline) {
      if (now > event.votingDeadline) {
        return EventStatus.VOTING_ENDED;
      }
    }

    // 預設狀態：正在投票
    return EventStatus.VOTING;
  }

  /**
   * 根據參與者資訊計算參與者狀態
   */
  computeParticipantStatus(participant: {
    userId: string | null;
    lineUserId: string | null;
    hasVoted: boolean;
  }): ParticipantStatus {
    // 如果已經投票
    if (participant.hasVoted) {
      return ParticipantStatus.VOTED;
    }

    // 如果有 userId 但還沒投票
    if (participant.userId) {
      return ParticipantStatus.NOT_VOTED;
    }

    // 如果只有 lineUserId 但沒有 userId（還沒註冊）
    if (participant.lineUserId) {
      return ParticipantStatus.NOT_REGISTERED;
    }

    // 預設狀態
    return ParticipantStatus.NOT_VOTED;
  }

  /**
   * 建立 Event 並展開所有 TimeSlots
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

    // 解析時間為分鐘數
    const startMinuteOfDay = this.parseTimeToMinutes(startTime);
    const endMinuteOfDay = this.parseTimeToMinutes(endTime);

    // 解析日期
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // 解析投票截止時間
    const votingDeadlineObj = votingDeadline ? new Date(votingDeadline) : null;

    // 使用 transaction 確保一致性
    const result = await this.prisma.$transaction(
      async (prisma: Prisma.TransactionClient) => {
        // 建立 Event
        const event = await prisma.event.create({
          data: {
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
        });

        // 展開 slots
        const slots = this.generateTimeSlots(
          startDateObj,
          endDateObj,
          startMinuteOfDay,
          endMinuteOfDay,
          slotDurationMin,
        );

        // 批次建立 slots
        await prisma.eventTimeSlot.createMany({
          data: slots.map((slot, index) => ({
            eventId: event.id,
            date: slot.date,
            startMinute: slot.startMinute,
            endMinute: slot.endMinute,
            index,
          })),
        });

        // 建立預期參與者記錄
        const participantData: Array<{
          eventId: string;
          lineUserId?: string;
          userId?: string;
        }> = [];

        // 自動將創建者加入為參與者
        if (userId) {
          participantData.push({
            eventId: event.id,
            userId: userId,
          });
        }

        // 加入 LINE 群組的預期參與者
        if (expectedLineUserIds && expectedLineUserIds.length > 0) {
          // 先查詢哪些 LINE userId 已經關聯到系統使用者
          const linkedMembers = await prisma.lineGroupMember.findMany({
            where: {
              lineUserId: { in: expectedLineUserIds },
              userId: { not: null },
            },
            select: {
              lineUserId: true,
              userId: true,
            },
          });

          const linkedMap = new Map(
            linkedMembers.map((m) => [m.lineUserId, m.userId]),
          );

          expectedLineUserIds.forEach((lineUserId) => {
            const linkedUserId = linkedMap.get(lineUserId);
            // 如果創建者也在 LINE 群組中，避免重複添加
            if (linkedUserId && linkedUserId === userId) {
              return; // 跳過，因為已經在上面添加了
            }
            participantData.push({
              eventId: event.id,
              lineUserId,
              userId: linkedUserId || undefined,
            });
          });
        }

        // 批次建立參與者記錄
        if (participantData.length > 0) {
          await prisma.eventExpectedParticipant.createMany({
            data: participantData,
          });
        }

        return event;
      },
    );

    // 計算實際加入的參與者數量（包含 Host）
    let expectedParticipantsCount = userId ? 1 : 0;
    if (expectedLineUserIds && expectedLineUserIds.length > 0) {
      expectedParticipantsCount += expectedLineUserIds.length;
    }

    return {
      eventId: result.id,
      shareUrl: `/events/${result.id}`,
      meta: {
        title: result.title,
        totalSlots: this.generateTimeSlots(
          startDateObj,
          endDateObj,
          startMinuteOfDay,
          endMinuteOfDay,
          slotDurationMin,
        ).length,
        lineGroupId: result.lineGroupId,
        expectedParticipants: expectedParticipantsCount,
      },
    };
  }

  /**
   * 取得使用者建立的所有活動
   */
  async findUserEvents(userId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        expectedParticipants: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return events.map((event) => {
      const votingDeadline = event.votingDeadline;
      const confirmedStartTime = event.confirmedStartTime;
      const confirmedEndTime = event.confirmedEndTime;
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        createdAt: event.createdAt,
        participantCount: event.expectedParticipants.length,
        votingDeadline,
        confirmedStartTime,
        confirmedEndTime,
        status: this.computeEventStatus({
          votingDeadline,
          confirmedStartTime,
          confirmedEndTime,
        }),
      };
    });
  }

  /**
   * 取得使用者參與的所有活動（有投票紀錄或作為預期參與者的活動）
   */
  async findAttendedEvents(userId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        OR: [
          // 有投票紀錄的活動
          {
            votes: {
              some: {
                userId,
              },
            },
          },
          // 作為預期參與者的活動（包括自己創建的）
          {
            expectedParticipants: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        expectedParticipants: {
          select: {
            id: true,
          },
        },
        votes: {
          where: { userId },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return events.map((event) => {
      const hasVoted = event.votes.length > 0;
      const votingDeadline = event.votingDeadline;
      const confirmedStartTime = event.confirmedStartTime;
      const confirmedEndTime = event.confirmedEndTime;
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        createdAt: event.createdAt,
        participantCount: event.expectedParticipants.length,
        votingDeadline,
        confirmedStartTime,
        confirmedEndTime,
        status: this.computeEventStatus({
          votingDeadline,
          confirmedStartTime,
          confirmedEndTime,
        }),
        hasVoted,
      };
    });
  }

  /**
   * 取得 Event 完整資料（含 slots 和 votes）
   */
  async findOne(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        slots: {
          orderBy: [{ date: 'asc' }, { startMinute: 'asc' }],
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        lineGroup: {
          select: {
            id: true,
            lineGroupId: true,
            groupName: true,
          },
        },
        expectedParticipants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    // 整理 votes 資料
    const votes = event.votes.map((vote) => ({
      slotId: vote.slotId,
      userId: vote.userId,
      userDisplayName: vote.user.displayName || 'Anonymous',
    }));

    // 取得所有參與者（有投票紀錄的人）
    const participantsMap = new Map<
      string,
      { userId: string; displayName: string }
    >();
    event.votes.forEach((vote) => {
      if (!participantsMap.has(vote.userId)) {
        participantsMap.set(vote.userId, {
          userId: vote.userId,
          displayName: vote.user.displayName || 'Anonymous',
        });
      }
    });
    const participants = Array.from(participantsMap.values());

    // 計算已投票的 userId 和 lineUserId
    const votedUserIds = new Set(event.votes.map((v) => v.userId));

    // 整理預期參與者資料，標註是否已投票和參與者狀態
    const expectedParticipants = await Promise.all(
      event.expectedParticipants.map(async (ep) => {
        // 檢查是否已投票
        let hasVoted = false;
        if (ep.userId) {
          hasVoted = votedUserIds.has(ep.userId);
        }

        // 取得 LINE 群組成員資料（如果有 lineUserId）
        let lineGroupMember: {
          displayName: string | null;
          pictureUrl: string | null;
        } | null = null;
        if (ep.lineUserId && event.lineGroup) {
          lineGroupMember = await this.prisma.lineGroupMember.findUnique({
            where: {
              lineGroupId_lineUserId: {
                lineGroupId: event.lineGroup.id,
                lineUserId: ep.lineUserId,
              },
            },
            select: {
              displayName: true,
              pictureUrl: true,
            },
          });
        }

        // 計算參與者狀態
        const participantStatus = this.computeParticipantStatus({
          userId: ep.userId,
          lineUserId: ep.lineUserId,
          hasVoted,
        });

        return {
          id: ep.id,
          lineUserId: ep.lineUserId,
          userId: ep.userId,
          hasVoted,
          status: participantStatus,
          reminderSentAt: ep.reminderSentAt,
          user: ep.user,
          lineGroupMember,
        };
      }),
    );

    const votingDeadline = event.votingDeadline;
    const confirmedStartTime = event.confirmedStartTime;
    const confirmedEndTime = event.confirmedEndTime;

    const eventStatus = this.computeEventStatus({
      votingDeadline,
      confirmedStartTime,
      confirmedEndTime,
    });

    return {
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        startMinuteOfDay: event.startMinuteOfDay,
        endMinuteOfDay: event.endMinuteOfDay,
        slotDurationMin: event.slotDurationMin,
        timeZone: event.timeZone,
        lineGroupId: event.lineGroupId,
        ownerId: event.ownerId,
        votingDeadline,
        confirmedStartTime,
        confirmedEndTime,
        status: eventStatus,
      },
      lineGroup: event.lineGroup,
      slots: event.slots,
      votes,
      participants,
      expectedParticipants,
    };
  }

  /**
   * 取得活動中尚未投票的預期參與者
   */
  async getUnvotedParticipants(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        votes: {
          select: { userId: true },
          distinct: ['userId'],
        },
        expectedParticipants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        lineGroup: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    const votedUserIds = new Set(event.votes.map((v) => v.userId));

    // 找出未投票的預期參與者
    const unvoted: Array<{
      id: string;
      lineUserId: string;
      userId: string | null;
      displayName: string;
      pictureUrl: string | null | undefined;
      reminderSentAt: Date | null;
    }> = [];

    for (const ep of event.expectedParticipants) {
      const hasVoted = ep.userId ? votedUserIds.has(ep.userId) : false;

      if (!hasVoted && ep.lineUserId) {
        // 取得 LINE 群組成員資料
        const memberInfo = event.lineGroup
          ? await this.prisma.lineGroupMember.findUnique({
              where: {
                lineGroupId_lineUserId: {
                  lineGroupId: event.lineGroup.id,
                  lineUserId: ep.lineUserId,
                },
              },
            })
          : null;

        unvoted.push({
          id: ep.id,
          lineUserId: ep.lineUserId,
          userId: ep.userId,
          displayName:
            ep.user?.displayName || memberInfo?.displayName || 'Unknown',
          pictureUrl: memberInfo?.pictureUrl,
          reminderSentAt: ep.reminderSentAt,
        });
      }
    }

    return {
      eventId,
      lineGroupId: event.lineGroup?.id,
      lineGroupLineId: event.lineGroup?.lineGroupId,
      unvotedParticipants: unvoted,
    };
  }

  /**
   * 儲存使用者的投票
   * 支援兩種模式：
   * 1. available: 投自己「可以」的時間，未選擇的時段視為不行
   * 2. unavailable: 投自己「不行」的時間，未選擇的時段視為可以
   */
  async vote(eventId: string, userId: string, voteDto: VoteEventDto) {
    const { selectedSlotIds, voteMode = VoteMode.AVAILABLE } = voteDto;

    // 使用 transaction 保證一致性
    const result = await this.prisma.$transaction(
      async (prisma: Prisma.TransactionClient) => {
        // 1. 刪除該 user 在此 event 的舊投票
        await prisma.eventVote.deleteMany({
          where: {
            eventId,
            userId,
          },
        });

        // 2. 取得該活動的所有 slot IDs
        const allSlots = await prisma.eventTimeSlot.findMany({
          where: { eventId },
          select: { id: true },
        });
        const allSlotIds = allSlots.map((s) => s.id);

        // 3. 根據投票模式計算「有空」的時段
        let availableSlotIds: string[];

        if (voteMode === VoteMode.UNAVAILABLE) {
          // 如果是投「不行」的時間，把其他時間都視為可以
          const unavailableSet = new Set(selectedSlotIds);
          availableSlotIds = allSlotIds.filter((id) => !unavailableSet.has(id));
        } else {
          // 如果是投「可以」的時間，直接使用選擇的時段
          availableSlotIds = selectedSlotIds;
        }

        // 4. 建立新的投票紀錄（記錄有空的時段）
        if (availableSlotIds.length > 0) {
          await prisma.eventVote.createMany({
            data: availableSlotIds.map((slotId) => ({
              eventId,
              slotId,
              userId,
            })),
          });
        }

        return { availableSlotIds };
      },
    );

    return {
      success: true,
      votedSlots: result.availableSlotIds.length,
      voteMode,
    };
  }

  /**
   * 工具：將時間字串轉換為分鐘數（例如 "09:00" -> 540）
   */
  private parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 工具：展開所有時間格子
   * 從 startDate 到 endDate，每天從 startMinute 到 endMinute，以 slotDuration 切割
   */
  private generateTimeSlots(
    startDate: Date,
    endDate: Date,
    startMinuteOfDay: number,
    endMinuteOfDay: number,
    slotDurationMin: number,
  ): Array<{ date: Date; startMinute: number; endMinute: number }> {
    const slots: Array<{ date: Date; startMinute: number; endMinute: number }> =
      [];

    // 遍歷每一天
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // 遍歷當天的每個時間段
      let currentMinute = startMinuteOfDay;
      while (currentMinute < endMinuteOfDay) {
        const nextMinute = Math.min(
          currentMinute + slotDurationMin,
          endMinuteOfDay,
        );
        slots.push({
          date: new Date(currentDate),
          startMinute: currentMinute,
          endMinute: nextMinute,
        });
        currentMinute = nextMinute;
      }

      // 移到下一天
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  /**
   * 取得 Host 端的活動詳細資料（包含投票狀態）
   */
  async findOneHosted(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        slots: {
          orderBy: [{ date: 'asc' }, { startMinute: 'asc' }],
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        expectedParticipants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    // 檢查是否為 owner
    if (event.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this event');
    }

    // 整理 votes 資料
    const votes = event.votes.map((vote) => ({
      slotId: vote.slotId,
      userId: vote.userId,
      userDisplayName: vote.user.displayName || 'Anonymous',
    }));

    // 取得所有已投票的使用者
    const votedUserIds = new Set<string>();
    event.votes.forEach((vote) => votedUserIds.add(vote.userId));

    // 整理參與者資料（有投票紀錄的人）
    const participantsMap = new Map<
      string,
      { userId: string; displayName: string; hasVoted: boolean }
    >();
    event.votes.forEach((vote) => {
      if (!participantsMap.has(vote.userId)) {
        participantsMap.set(vote.userId, {
          userId: vote.userId,
          displayName: vote.user.displayName || 'Anonymous',
          hasVoted: true,
        });
      }
    });
    const participants = Array.from(participantsMap.values());

    // 取得所有 lineUserId 以便查詢 LineGroupMember
    const lineUserIds = event.expectedParticipants
      .filter((ep) => ep.lineUserId)
      .map((ep) => ep.lineUserId as string);

    // 查詢 LineGroupMember 以取得未連結使用者的 displayName 和 pictureUrl
    const lineGroupMembers = await this.prisma.lineGroupMember.findMany({
      where: {
        lineUserId: { in: lineUserIds },
      },
      orderBy: { lastSeenAt: 'desc' },
    });

    // 建立 lineUserId -> LineGroupMember 的映射
    const lineUserIdToMember = new Map<
      string,
      { displayName: string | null; pictureUrl: string | null }
    >();
    lineGroupMembers.forEach((member) => {
      // 只取最新的記錄（已經按 lastSeenAt 排序）
      if (!lineUserIdToMember.has(member.lineUserId)) {
        lineUserIdToMember.set(member.lineUserId, {
          displayName: member.displayName,
          pictureUrl: member.pictureUrl,
        });
      }
    });

    // 整理預期參與者資料
    const expectedParticipants = event.expectedParticipants.map((ep) => {
      // 優先使用已連結使用者的資料，否則使用 LineGroupMember 的資料
      const lineMember = ep.lineUserId
        ? lineUserIdToMember.get(ep.lineUserId)
        : null;

      const hasVoted = ep.userId ? votedUserIds.has(ep.userId) : false;

      // 計算參與者狀態
      const participantStatus = this.computeParticipantStatus({
        userId: ep.userId,
        lineUserId: ep.lineUserId,
        hasVoted,
      });

      return {
        id: ep.id,
        lineUserId: ep.lineUserId || undefined,
        userId: ep.userId || undefined,
        displayName:
          ep.user?.displayName || lineMember?.displayName || undefined,
        pictureUrl: lineMember?.pictureUrl || undefined,
        hasVoted,
        status: participantStatus,
      };
    });

    // 計算投票統計
    const totalExpected = expectedParticipants.length || participants.length;
    const totalVoted = participants.filter((p) => p.hasVoted).length;
    const votingPercentage =
      totalExpected > 0 ? (totalVoted / totalExpected) * 100 : 0;

    // 計算活動狀態
    const votingDeadline = event.votingDeadline;
    const confirmedStartTime = event.confirmedStartTime;
    const confirmedEndTime = event.confirmedEndTime;
    const eventStatus = this.computeEventStatus({
      votingDeadline,
      confirmedStartTime,
      confirmedEndTime,
    });

    return {
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        startMinuteOfDay: event.startMinuteOfDay,
        endMinuteOfDay: event.endMinuteOfDay,
        slotDurationMin: event.slotDurationMin,
        timeZone: event.timeZone,
        ownerId: event.ownerId,
        lineGroupId: event.lineGroupId,
        votingDeadline,
        confirmedStartTime,
        confirmedEndTime,
        status: eventStatus,
      },
      slots: event.slots,
      votes,
      participants,
      expectedParticipants,
      votingStats: {
        totalExpected,
        totalVoted,
        votingPercentage,
      },
    };
  }

  /**
   * 更新活動設定
   */
  async update(eventId: string, userId: string, updateDto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this event');
    }

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
      updateData.startMinuteOfDay = this.parseTimeToMinutes(
        updateDto.startTime,
      );
    }

    if (updateDto.endTime !== undefined) {
      updateData.endMinuteOfDay = this.parseTimeToMinutes(updateDto.endTime);
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
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this event');
    }

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
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this event');
    }

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

    const updatedVotingDeadline = updatedEvent.votingDeadline;
    const updatedConfirmedStartTime = updatedEvent.confirmedStartTime;
    const updatedConfirmedEndTime = updatedEvent.confirmedEndTime;

    return {
      id: updatedEvent.id,
      confirmedStartTime: updatedConfirmedStartTime,
      confirmedEndTime: updatedConfirmedEndTime,
      status: this.computeEventStatus({
        votingDeadline: updatedVotingDeadline,
        confirmedStartTime: updatedConfirmedStartTime,
        confirmedEndTime: updatedConfirmedEndTime,
      }),
    };
  }

  /**
   * 取消確認的活動時間（僅限活動擁有者）
   */
  async cancelConfirmedTime(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this event');
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        confirmedStartTime: null,
        confirmedEndTime: null,
      },
    });

    const cancelVotingDeadline = updatedEvent.votingDeadline;
    const cancelConfirmedStartTime = updatedEvent.confirmedStartTime;
    const cancelConfirmedEndTime = updatedEvent.confirmedEndTime;

    return {
      id: updatedEvent.id,
      status: this.computeEventStatus({
        votingDeadline: cancelVotingDeadline,
        confirmedStartTime: cancelConfirmedStartTime,
        confirmedEndTime: cancelConfirmedEndTime,
      }),
    };
  }

  /**
   * 更新活動的預期參與者
   */
  async updateParticipants(
    eventId: string,
    userId: string,
    dto: UpdateParticipantsDto,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this event');
    }

    // 使用 transaction 確保一致性
    await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
      // 刪除現有的預期參與者
      await prisma.eventExpectedParticipant.deleteMany({
        where: { eventId },
      });

      // 建立新的預期參與者
      const participantsData = dto.participants
        .filter((p) => p.lineUserId || p.userId)
        .map((p) => ({
          eventId,
          lineUserId: p.lineUserId || null,
          userId: p.userId || null,
        }));

      if (participantsData.length > 0) {
        await prisma.eventExpectedParticipant.createMany({
          data: participantsData,
        });
      }
    });

    return { success: true, count: dto.participants.length };
  }

  /**
   * 取得活動的公開資訊（用於加入確認頁面）
   */
  async getEventPublicInfo(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        expectedParticipants: {
          select: { id: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    const publicVotingDeadline = event.votingDeadline;
    const publicConfirmedStartTime = event.confirmedStartTime;
    const publicConfirmedEndTime = event.confirmedEndTime;

    const eventStatus = this.computeEventStatus({
      votingDeadline: publicVotingDeadline,
      confirmedStartTime: publicConfirmedStartTime,
      confirmedEndTime: publicConfirmedEndTime,
    });

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      votingDeadline: publicVotingDeadline,
      confirmedStartTime: publicConfirmedStartTime,
      confirmedEndTime: publicConfirmedEndTime,
      status: eventStatus,
      participantCount: event.expectedParticipants.length,
    };
  }

  /**
   * 檢查使用者是否已經是活動的參與者
   */
  async checkParticipantStatus(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    // 檢查是否已經是預期參與者
    const existingParticipant =
      await this.prisma.eventExpectedParticipant.findFirst({
        where: {
          eventId,
          userId,
        },
      });

    // 檢查是否有投票紀錄
    const hasVoted = await this.prisma.eventVote.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    return {
      isParticipant: !!existingParticipant,
      hasVoted: !!hasVoted,
    };
  }

  /**
   * 加入活動（透過分享連結）
   */
  async joinEvent(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    // 檢查是否已經是參與者
    const existingParticipant =
      await this.prisma.eventExpectedParticipant.findFirst({
        where: {
          eventId,
          userId,
        },
      });

    if (existingParticipant) {
      return {
        success: true,
        alreadyJoined: true,
        message: 'You are already a participant of this event',
      };
    }

    // 加入為參與者
    await this.prisma.eventExpectedParticipant.create({
      data: {
        eventId,
        userId,
      },
    });

    return {
      success: true,
      alreadyJoined: false,
      message: 'Successfully joined the event',
    };
  }
}
