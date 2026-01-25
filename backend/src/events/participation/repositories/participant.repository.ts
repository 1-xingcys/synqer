import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * 參與者資料存取層
 */
@Injectable()
export class ParticipantRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 查詢活動的預期參與者（含投票和群組資訊）
   */
  async findEventWithParticipants(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        votes: {
          select: { userId: true },
          distinct: ['userId'],
        },
        expectedParticipants: {
          where: { isRemoved: false },
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
  }

  /**
   * 根據 LINE 群組和使用者 ID 查詢成員資料
   */
  async findLineGroupMember(lineGroupId: string, lineUserId: string) {
    return this.prisma.lineGroupMember.findUnique({
      where: {
        lineGroupId_lineUserId: {
          lineGroupId,
          lineUserId,
        },
      },
    });
  }

  /**
   * 根據 LINE 群組和使用者 ID 查詢成員資料（僅 displayName 和 pictureUrl）
   */
  async findLineGroupMemberInfo(lineGroupId: string, lineUserId: string) {
    return this.prisma.lineGroupMember.findUnique({
      where: {
        lineGroupId_lineUserId: {
          lineGroupId,
          lineUserId,
        },
      },
      select: {
        displayName: true,
        pictureUrl: true,
      },
    });
  }

  /**
   * 批次查詢指定群組的 LINE 群組成員
   */
  async findLineGroupMembersByLineUserIdsAndGroupId(
    lineGroupId: string,
    lineUserIds: string[],
  ) {
    if (lineUserIds.length === 0) return [];
    return this.prisma.lineGroupMember.findMany({
      where: {
        lineGroupId,
        lineUserId: { in: lineUserIds },
      },
    });
  }

  /**
   * 查詢活動基本資訊
   */
  async findEventBasicInfo(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, isDeleted: true },
    });
  }

  /**
   * 查詢使用者是否為活動的預期參與者
   */
  async findParticipantByUserId(eventId: string, userId: string) {
    return this.prisma.eventExpectedParticipant.findFirst({
      where: {
        eventId,
        userId,
        isRemoved: false,
      },
    });
  }

  /**
   * 查詢使用者是否為活動的預期參與者（包含已移除的）
   */
  async findParticipantByUserIdIncludeRemoved(eventId: string, userId: string) {
    return this.prisma.eventExpectedParticipant.findFirst({
      where: {
        eventId,
        userId,
      },
    });
  }

  /**
   * 查詢使用者是否有投票紀錄
   */
  async findVoteByUserId(eventId: string, userId: string) {
    return this.prisma.eventVote.findFirst({
      where: {
        eventId,
        userId,
      },
    });
  }

  /**
   * 恢復已移除的參與者
   */
  async restoreParticipant(participantId: string) {
    return this.prisma.eventExpectedParticipant.update({
      where: { id: participantId },
      data: { isRemoved: false },
    });
  }

  /**
   * 建立預期參與者
   */
  async createParticipant(eventId: string, userId: string) {
    return this.prisma.eventExpectedParticipant.create({
      data: {
        eventId,
        userId,
      },
    });
  }

  /**
   * 查詢活動的所有預期參與者（包含已移除的）
   */
  async findAllParticipants(eventId: string) {
    return this.prisma.eventExpectedParticipant.findMany({
      where: { eventId },
      select: {
        id: true,
        lineUserId: true,
        userId: true,
        isRemoved: true,
      },
    });
  }

  /**
   * 批次軟刪除參與者
   */
  async softDeleteParticipants(participantIds: string[]) {
    return this.prisma.eventExpectedParticipant.updateMany({
      where: {
        id: { in: participantIds },
      },
      data: {
        isRemoved: true,
      },
    });
  }

  /**
   * 批次恢復參與者
   */
  async restoreParticipants(participantIds: string[]) {
    return this.prisma.eventExpectedParticipant.updateMany({
      where: {
        id: { in: participantIds },
      },
      data: {
        isRemoved: false,
      },
    });
  }

  /**
   * 批次建立參與者
   */
  async createParticipants(
    data: Array<{
      eventId: string;
      lineUserId?: string | null;
      userId?: string | null;
    }>,
  ) {
    return this.prisma.eventExpectedParticipant.createMany({
      data,
    });
  }

  /**
   * 使用交易更新參與者列表
   */
  async updateParticipantsInTransaction(
    eventId: string,
    toRemoveIds: string[],
    toRestoreIds: string[],
    toAdd: Array<{ lineUserId?: string; userId?: string }>,
  ) {
    return this.prisma.$transaction(
      async (prisma: Prisma.TransactionClient) => {
        // 執行軟刪除
        if (toRemoveIds.length > 0) {
          await prisma.eventExpectedParticipant.updateMany({
            where: { id: { in: toRemoveIds } },
            data: { isRemoved: true },
          });
        }

        // 執行恢復
        if (toRestoreIds.length > 0) {
          await prisma.eventExpectedParticipant.updateMany({
            where: { id: { in: toRestoreIds } },
            data: { isRemoved: false },
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
      },
    );
  }
}
