import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Session,
  UnauthorizedException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { VoteEventDto } from './dto/vote-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

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
  async vote(
    @Param('eventId') eventId: string,
    @Body() voteDto: VoteEventDto,
    @Session() session: { userId?: string },
  ) {
    // TODO: 未來可支援匿名投票，目前需要登入
    const userId = session.userId;
    if (!userId) {
      throw new UnauthorizedException('Please login first'); // 暫時簡化，未來可用 Guard
    }
    return this.eventsService.vote(eventId, userId, voteDto);
  }
}
