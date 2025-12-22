import {
  Controller,
  Get,
  Delete,
  Query,
  Res,
  UseGuards,
  Param,
} from '@nestjs/common';
import type { Response } from 'express';
import { GoogleCalendarService } from './google-calendar.service';
import { SessionAuthGuard, CurrentUser } from '../auth';

@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  /**
   * 取得 Google Calendar 連結狀態
   * GET /google-calendar/status
   */
  @Get('status')
  @UseGuards(SessionAuthGuard)
  async getStatus(@CurrentUser() userId: string) {
    return this.googleCalendarService.getConnectionStatus(userId);
  }

  /**
   * 開始 Google Calendar 連結流程
   * GET /google-calendar/connect
   * 會重導向到 Google OAuth
   */
  @Get('connect')
  @UseGuards(SessionAuthGuard)
  connect(@Query('redirect') redirect: string, @Res() res: Response) {
    const authUrl = this.googleCalendarService.getConnectUrl(redirect);
    res.redirect(authUrl);
  }

  /**
   * Google Calendar OAuth callback
   * GET /google-calendar/callback
   * Google 會重導向到這個端點
   */
  @Get('callback')
  @UseGuards(SessionAuthGuard)
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @CurrentUser() userId: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.googleCalendarService.handleCallback(
        code,
        state,
        userId,
      );

      // Redirect to frontend with success message
      const frontendUrl = process.env.WEB_ORIGIN;
      const redirectUrl = result.redirect || '/settings';
      res.redirect(`${frontendUrl}${redirectUrl}?calendar_connected=true`);
    } catch {
      // Redirect to frontend with error message
      const frontendUrl = process.env.WEB_ORIGIN;
      res.redirect(`${frontendUrl}/settings?calendar_error=true`);
    }
  }

  /**
   * 斷開 Google Calendar 連結
   * DELETE /google-calendar/disconnect
   */
  @Delete('disconnect')
  @UseGuards(SessionAuthGuard)
  async disconnect(@CurrentUser() userId: string) {
    return this.googleCalendarService.disconnect(userId);
  }

  /**
   * 取得指定活動時間範圍內的 Calendar 事件和衝突的時段
   * GET /google-calendar/events/:eventId/conflicts
   */
  @Get('events/:eventId/conflicts')
  @UseGuards(SessionAuthGuard)
  async getConflictingSlots(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ) {
    return this.googleCalendarService.getConflictingSlots(userId, eventId);
  }

  /**
   * 取得指定時間範圍內的 Calendar 事件
   * GET /google-calendar/events
   */
  @Get('events')
  @UseGuards(SessionAuthGuard)
  async getEvents(
    @Query('timeMin') timeMin: string,
    @Query('timeMax') timeMax: string,
    @Query('timeZone') timeZone: string,
    @CurrentUser() userId: string,
  ) {
    return this.googleCalendarService.getCalendarEvents(
      userId,
      new Date(timeMin),
      new Date(timeMax),
      timeZone || 'Asia/Taipei',
    );
  }
}
