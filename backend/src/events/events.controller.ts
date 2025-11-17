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
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { VoteEventDto } from './dto/vote-event.dto';
import { SessionAuthGuard, CurrentUser } from '../auth';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

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
}
