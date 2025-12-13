import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
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
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateParticipantsDto } from './dto/update-participants.dto';
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
   * GET /events/:eventId/hosted
   * 取得 Host 端的活動詳細資料（包含投票狀態）
   */
  @Get(':eventId/hosted')
  @UseGuards(SessionAuthGuard)
  async findOneHosted(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ) {
    return this.eventsService.findOneHosted(eventId, userId);
  }

  /**
   * PATCH /events/:eventId
   * 更新活動設定
   */
  @Patch(':eventId')
  @UseGuards(SessionAuthGuard)
  async update(
    @Param('eventId') eventId: string,
    @Body() updateDto: UpdateEventDto,
    @CurrentUser() userId: string,
  ) {
    return this.eventsService.update(eventId, userId, updateDto);
  }

  /**
   * DELETE /events/:eventId
   * 刪除活動
   */
  @Delete(':eventId')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ) {
    return this.eventsService.remove(eventId, userId);
  }

  /**
   * PUT /events/:eventId/participants
   * 更新活動的預期參與者
   */
  @Put(':eventId/participants')
  @UseGuards(SessionAuthGuard)
  async updateParticipants(
    @Param('eventId') eventId: string,
    @Body() dto: UpdateParticipantsDto,
    @CurrentUser() userId: string,
  ) {
    return this.eventsService.updateParticipants(eventId, userId, dto);
  }
}
