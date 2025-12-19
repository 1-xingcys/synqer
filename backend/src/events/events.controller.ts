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
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { VoteEventDto } from './dto/vote-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateParticipantsDto } from './dto/update-participants.dto';
import { ConfirmEventTimeDto } from './dto/confirm-event-time.dto';
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
   * 需要登入，創建者會自動加入為參與者
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(SessionAuthGuard)
  async create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() userId: string,
  ) {
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
   * GET /events/:eventId/public
   * 取得活動的公開資訊（用於加入確認頁面）
   */
  @Get(':eventId/public')
  async getEventPublicInfo(@Param('eventId') eventId: string) {
    return this.eventsService.getEventPublicInfo(eventId);
  }

  /**
   * GET /events/:eventId/participation
   * 檢查當前使用者是否已經是活動的參與者
   */
  @Get(':eventId/participation')
  @UseGuards(SessionAuthGuard)
  async checkParticipantStatus(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ) {
    return this.eventsService.checkParticipantStatus(eventId, userId);
  }

  /**
   * POST /events/:eventId/join
   * 加入活動（透過分享連結）
   */
  @Post(':eventId/join')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async joinEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ) {
    return this.eventsService.joinEvent(eventId, userId);
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

  /**
   * POST /events/:eventId/confirm-time
   * 確認活動時間（僅限活動擁有者）
   */
  @Post(':eventId/confirm-time')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async confirmEventTime(
    @Param('eventId') eventId: string,
    @Body() dto: ConfirmEventTimeDto,
    @CurrentUser() userId: string,
  ) {
    return this.eventsService.confirmEventTime(eventId, userId, dto);
  }

  /**
   * DELETE /events/:eventId/confirm-time
   * 取消確認的活動時間（僅限活動擁有者）
   */
  @Delete(':eventId/confirm-time')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async cancelConfirmedTime(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ) {
    return this.eventsService.cancelConfirmedTime(eventId, userId);
  }
}
