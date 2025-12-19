import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { LineBotService } from './line-bot.service';
import type { WebhookRequestBody } from './dto/webhook-event.dto';
import { SessionAuthGuard } from '../auth/guards';

@Controller('line-bot')
export class LineBotController {
  constructor(private readonly lineBotService: LineBotService) {}

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
   * 取得所有活躍的 LINE 群組
   */
  @Get('groups')
  @UseGuards(SessionAuthGuard)
  async getGroups() {
    const groups = await this.lineBotService.getActiveGroups();
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
   * 取得特定群組的成員列表
   */
  @Get('groups/:groupId/members')
  @UseGuards(SessionAuthGuard)
  async getGroupMembers(@Param('groupId') groupId: string) {
    const members = await this.lineBotService.getGroupMembers(groupId);
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
}
