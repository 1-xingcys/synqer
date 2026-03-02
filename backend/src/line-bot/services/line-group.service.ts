import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LineApiService } from './line-api.service';

/**
 * LINE 群組與成員的資料庫操作服務
 */
@Injectable()
export class LineGroupService {
  constructor(
    private prisma: PrismaService,
    private lineApi: LineApiService,
  ) {}

  /**
   * 建立或更新群組記錄
   */
  async upsertGroup(lineGroupId: string, isActive = true) {
    // 嘗試取得群組名稱
    let groupName: string | undefined;
    try {
      const summary = await this.lineApi.getGroupSummary(lineGroupId);
      groupName = summary?.groupName;
    } catch {
      // 忽略錯誤
    }

    return this.prisma.lineGroup.upsert({
      where: { lineGroupId },
      update: {
        isActive,
        groupName,
        updatedAt: new Date(),
      },
      create: {
        lineGroupId,
        groupName,
        botJoinedAt: new Date(),
      },
    });
  }

  /**
   * 標記群組為不活躍（Bot 離開）
   */
  async deactivateGroup(lineGroupId: string) {
    return this.prisma.lineGroup.updateMany({
      where: { lineGroupId },
      data: { isActive: false, updatedAt: new Date() },
    });
  }

  /**
   * 確保群組記錄存在
   */
  async ensureGroupExists(lineGroupId: string) {
    let group = await this.prisma.lineGroup.findUnique({
      where: { lineGroupId },
    });

    if (!group) {
      group = await this.upsertGroup(lineGroupId);
    }

    return group;
  }

  /**
   * 新增或更新群組成員
   */
  async upsertMember(
    lineGroupDbId: string,
    lineUserId: string,
    fetchProfile = true,
  ) {
    let displayName: string | undefined;
    let pictureUrl: string | undefined;

    if (fetchProfile) {
      try {
        const groupRecord = await this.prisma.lineGroup.findUnique({
          where: { id: lineGroupDbId },
        });

        if (groupRecord) {
          const profile = await this.lineApi.getGroupMemberProfile(
            groupRecord.lineGroupId,
            lineUserId,
          );
          displayName = profile?.displayName;
          pictureUrl = profile?.pictureUrl;
        }
      } catch {
        // 忽略錯誤
      }
    }

    // 檢查是否有已 OAuth 的使用者
    const authIdentity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider: 'line',
          providerUserId: lineUserId,
        },
      },
    });

    return this.prisma.lineGroupMember.upsert({
      where: {
        lineGroupId_lineUserId: {
          lineGroupId: lineGroupDbId,
          lineUserId,
        },
      },
      update: {
        isActive: true,
        leftAt: null,
        lastSeenAt: new Date(),
        ...(displayName && { displayName }),
        ...(pictureUrl && { pictureUrl }),
        ...(authIdentity && { userId: authIdentity.userId }),
      },
      create: {
        lineGroupId: lineGroupDbId,
        lineUserId,
        displayName,
        pictureUrl,
        userId: authIdentity?.userId,
      },
    });
  }

  /**
   * 標記成員為已離開
   */
  async deactivateMembers(lineGroupDbId: string, lineUserIds: string[]) {
    return this.prisma.lineGroupMember.updateMany({
      where: {
        lineGroupId: lineGroupDbId,
        lineUserId: { in: lineUserIds },
      },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });
  }

  /**
   * 取得當前使用者所在的活躍群組
   */
  async getGroupsForUser(userId: string) {
    return this.prisma.lineGroup.findMany({
      where: {
        isActive: true,
        members: {
          some: {
            userId,
            isActive: true,
          },
        },
      },
      include: {
        _count: {
          select: { members: { where: { isActive: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * 取得當前使用者所在群組的所有活躍成員
   */
  async getGroupMembersForUser(userId: string, lineGroupDbId: string) {
    const membership = await this.prisma.lineGroupMember.findFirst({
      where: {
        lineGroupId: lineGroupDbId,
        userId,
        isActive: true,
        lineGroup: {
          isActive: true,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      throw new NotFoundException('LINE group not found');
    }

    return this.prisma.lineGroupMember.findMany({
      where: {
        lineGroupId: lineGroupDbId,
        isActive: true,
        lineGroup: {
          isActive: true,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            primaryEmail: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  /**
   * 透過 LINE groupId 取得群組
   */
  async getGroupByLineGroupId(lineGroupId: string) {
    return this.prisma.lineGroup.findUnique({
      where: { lineGroupId },
      include: {
        members: {
          where: { isActive: true },
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
  }

  /**
   * 關聯 OAuth 使用者到群組成員
   */
  async linkUserToMembers(userId: string, lineUserId: string) {
    await this.prisma.lineGroupMember.updateMany({
      where: { lineUserId },
      data: { userId },
    });

    await this.prisma.eventExpectedParticipant.updateMany({
      where: { lineUserId },
      data: { userId },
    });
  }
}
