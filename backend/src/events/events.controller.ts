import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Session,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { VoteEventDto } from './dto/vote-event.dto';
import { SessionAuthGuard, CurrentUser } from '../auth';
import { LineBotService } from '../line-bot/line-bot.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly lineBotService: LineBotService,
  ) {}

  /**
   * GET /events/my
   * 取得當前使用者建立的所有活動
   */
  @Get('my')
  @UseGuards(SessionAuthGuard)
  async findMyEvents(@CurrentUser() userId: string) {
    return await this.eventsService.findUserEvents(userId);
  }

  /**
   * GET /events/attended
   * 取得當前使用者參與的所有活動（有投票紀錄的活動）
   */
  @Get('attended')
  @UseGuards(SessionAuthGuard)
  async findAttendedEvents(@CurrentUser() userId: string) {
    return await this.eventsService.findAttendedEvents(userId);
  }

  /**
   * POST /events
   * 建立新活動（包含自動展開 slots）
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createEventDto: CreateEventDto,
    @Session() session: { userId?: string },
  ) {
    // 從 session 取得 userId（如未登入則為 undefined）
    const userId = session.userId;
    return this.eventsService.create(createEventDto, userId);
  }

  /**
   * GET /events/:eventId
   * 取得活動完整資料（含 slots、votes、participants）
   */
  @Get(':eventId')
  async findOne(@Param('eventId') eventId: string) {
    return this.eventsService.findOne(eventId);
  }

  /**
   * POST /events/:eventId/votes
   * 儲存使用者的有空時段投票
   */
  @Post(':eventId/votes')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async vote(
    @Param('eventId') eventId: string,
    @Body() voteDto: VoteEventDto,
    @CurrentUser() userId: string,
  ) {
    // TODO: 未來可支援匿名投票
    return this.eventsService.vote(eventId, userId, voteDto);
  }

  /**
   * GET /events/:eventId/unvoted
   * 取得活動中尚未投票的預期參與者
   */
  @Get(':eventId/unvoted')
  @UseGuards(SessionAuthGuard)
  async getUnvotedParticipants(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ) {
    // 驗證使用者是活動擁有者
    const eventData = await this.eventsService.findOne(eventId);
    if (eventData.event.ownerId !== userId) {
      throw new ForbiddenException('Only event owner can view unvoted participants');
    }
    
    return this.eventsService.getUnvotedParticipants(eventId);
  }

  /**
   * POST /events/:eventId/remind
   * 發送提醒給未投票的參與者
   */
  @Post(':eventId/remind')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async sendReminder(
    @Param('eventId') eventId: string,
    @Body() body: { lineUserIds: string[] },
    @CurrentUser() userId: string,
  ) {
    // 驗證使用者是活動擁有者
    const eventData = await this.eventsService.findOne(eventId);
    if (eventData.event.ownerId !== userId) {
      throw new ForbiddenException('Only event owner can send reminders');
    }

    if (!eventData.lineGroup) {
      throw new ForbiddenException('Event is not linked to a LINE group');
    }

    const { lineUserIds } = body;
    if (!lineUserIds || lineUserIds.length === 0) {
      return { success: true, reminded: 0 };
    }

    await this.lineBotService.sendVoteReminder(
      eventId,
      eventData.lineGroup.id,
      lineUserIds,
    );

    return { success: true, reminded: lineUserIds.length };
  }
}
