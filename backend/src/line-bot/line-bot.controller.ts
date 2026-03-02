import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Headers,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { LineBotService } from './line-bot.service';
import { RichMenuService } from './services';
import type { WebhookRequestBody } from './dto/webhook-event.dto';
import {
  LineGroupMemberDto,
  LineGroupSummaryDto,
} from './dto/line-group-response.dto';
import { SessionAuthGuard, CurrentUser } from '../auth';

@Controller('line-bot')
export class LineBotController {
  constructor(
    private readonly lineBotService: LineBotService,
    private readonly richMenuService: RichMenuService,
  ) {}

  /**
   * LINE Webhook 端點
   * LINE Platform 會將事件發送到這個端點
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-line-signature') signature: string,
    @Body() body: WebhookRequestBody,
  ) {
    // 驗證簽章
    const rawBody = req.rawBody?.toString() || JSON.stringify(body);

    if (!this.lineBotService.verifySignature(rawBody, signature)) {
      throw new BadRequestException('Invalid signature');
    }

    // 處理事件（異步，立即回應 LINE）
    if (body.events && body.events.length > 0) {
      setImmediate(() => {
        this.lineBotService.handleWebhookEvents(body.events).catch((error) => {
          console.error('Error handling webhook events:', error);
        });
      });
    }

    return {};
  }

  /**
   * 取得當前使用者所在的活躍 LINE 群組
   */
  @Get('my-groups')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ type: LineGroupSummaryDto, isArray: true })
  async getMyGroups(
    @CurrentUser() userId: string,
  ): Promise<LineGroupSummaryDto[]> {
    const groups = await this.lineBotService.getGroupsForUser(userId);
    return groups.map((group) => ({
      id: group.id,
      lineGroupId: group.lineGroupId,
      groupName: group.groupName,
      memberCount: group._count.members,
      botJoinedAt: group.botJoinedAt,
      updatedAt: group.updatedAt,
    }));
  }

  /**
   * 取得當前使用者所在群組的成員列表
   */
  @Get('my-groups/:groupId/members')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ type: LineGroupMemberDto, isArray: true })
  async getMyGroupMembers(
    @CurrentUser() userId: string,
    @Param('groupId') groupId: string,
  ): Promise<LineGroupMemberDto[]> {
    const members = await this.lineBotService.getGroupMembersForUser(
      userId,
      groupId,
    );
    return members.map((member) => ({
      id: member.id,
      lineUserId: member.lineUserId,
      displayName: member.displayName,
      pictureUrl: member.pictureUrl,
      isLinked: !!member.userId,
      linkedUser: member.user
        ? {
            id: member.user.id,
            displayName: member.user.displayName,
            avatarUrl: member.user.avatarUrl,
          }
        : null,
      firstSeenAt: member.firstSeenAt,
      lastSeenAt: member.lastSeenAt,
    }));
  }

  /**
   * 發送投票提醒到群組
   */
  @Post('groups/:groupId/remind')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendReminder(
    @Param('groupId') groupId: string,
    @Body() body: { eventId: string; lineUserIds: string[] },
  ) {
    const { eventId, lineUserIds } = body;

    if (!eventId || !lineUserIds || lineUserIds.length === 0) {
      throw new BadRequestException('eventId and lineUserIds are required');
    }

    await this.lineBotService.sendVoteReminder(eventId, groupId, lineUserIds);

    return { success: true, reminded: lineUserIds.length };
  }

  /**
   * POST /line-bot/events/:eventId/notify-group
   * 發送活動通知到綁定的 LINE 群組
   */
  @Post('events/:eventId/notify-group')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  async notifyGroup(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ) {
    const result = await this.lineBotService.sendEventNotificationToGroup(
      eventId,
      userId,
    );

    if (!result.success) {
      throw new BadRequestException(
        result.error || 'Failed to send notification',
      );
    }

    return { success: true };
  }

  // ============ Rich Menu 管理端點 ============
  // 注意：Rich Menu 的創建與設定請使用 scripts/reset-rich-menu.ts

  /**
   * 取得所有 Rich Menu 列表
   */
  @Get('rich-menu')
  @UseGuards(SessionAuthGuard)
  async listRichMenus() {
    const richMenus = await this.richMenuService.listRichMenus();
    const defaultRichMenuId = await this.richMenuService.getDefaultRichMenuId();

    return {
      richMenus,
      defaultRichMenuId,
    };
  }

  /**
   * 刪除指定的 Rich Menu
   */
  @Delete('rich-menu/:richMenuId')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteRichMenu(@Param('richMenuId') richMenuId: string) {
    const success = await this.richMenuService.deleteRichMenu(richMenuId);

    if (!success) {
      throw new BadRequestException('Failed to delete Rich Menu');
    }

    return { success: true };
  }

  /**
   * 取消預設 Rich Menu
   */
  @Delete('rich-menu/default')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelDefaultRichMenu() {
    const success = await this.richMenuService.cancelDefaultRichMenu();

    if (!success) {
      throw new BadRequestException('Failed to cancel default Rich Menu');
    }

    return { success: true };
  }
}
