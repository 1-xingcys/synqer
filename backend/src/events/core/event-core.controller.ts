import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { EventCreationService } from './services/event-creation.service';
import { EventQueryService } from './services/event-query.service';
import { EventUpdateService } from './services/event-update.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateEventResponseDto } from './dto/create-event-response.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventResponseDto } from './dto/update-event-response.dto';
import { RemoveEventResponseDto } from './dto/remove-event-response.dto';
import { AttendedEventListItemDto } from './dto/attended-event-list-item.dto';
import { HostedEventListItemDto } from './dto/hosted-event-list-item.dto';
import { EventDetailResponseDto } from './dto/event-detail-response.dto';
import { HostedEventDetailResponseDto } from './dto/hosted-event-detail-response.dto';
import { EventPublicInfoResponseDto } from './dto/event-public-info-response.dto';
import { EventInfoResponseDto } from './dto/event-info-response.dto';
import { SessionAuthGuard, CurrentUser } from '../../auth';

@Controller('events')
export class EventCoreController {
  constructor(
    private readonly eventCreationService: EventCreationService,
    private readonly eventQueryService: EventQueryService,
    private readonly eventUpdateService: EventUpdateService,
  ) {}

  /**
   * GET /events/my
   * 取得當前使用者建立的所有活動
   */
  @Get('my')
  @UseGuards(SessionAuthGuard)
  async findMyEvents(
    @CurrentUser() userId: string,
  ): Promise<HostedEventListItemDto[]> {
    return await this.eventQueryService.findUserEvents(userId);
  }

  /**
   * GET /events/attended
   * 取得當前使用者參與的所有活動（有投票紀錄的活動）
   */
  @Get('attended')
  @UseGuards(SessionAuthGuard)
  async findAttendedEvents(
    @CurrentUser() userId: string,
  ): Promise<AttendedEventListItemDto[]> {
    return await this.eventQueryService.findAttendedEvents(userId);
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
  ): Promise<CreateEventResponseDto> {
    return this.eventCreationService.create(createEventDto, userId);
  }

  /**
   * GET /events/:eventId
   * 取得活動完整資料
   */
  @Get(':eventId')
  @UseGuards(SessionAuthGuard)
  async findOne(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ): Promise<EventDetailResponseDto> {
    const result = await this.eventQueryService.findOne(eventId, userId);
    if (!result) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }
    return result;
  }

  /**
   * GET /events/:eventId/public
   * 取得活動的公開資訊（用於加入確認頁面）
   */
  @Get(':eventId/public')
  async getEventPublicInfo(
    @Param('eventId') eventId: string,
  ): Promise<EventPublicInfoResponseDto> {
    const result = await this.eventQueryService.getEventPublicInfo(eventId);
    if (!result) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }
    return result;
  }

  /**
   * GET /events/:eventId/info
   * 取得活動詳細資訊頁面（參與者視角，包含主辦人、參與者列表）
   */
  @Get(':eventId/info')
  @UseGuards(SessionAuthGuard)
  async getEventInfo(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ): Promise<EventInfoResponseDto> {
    const result = await this.eventQueryService.getEventInfo(eventId, userId);
    if (!result) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }
    return result;
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
  ): Promise<HostedEventDetailResponseDto> {
    const result = await this.eventQueryService.findOneHosted(eventId, userId);
    if (!result) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }
    return result;
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
  ): Promise<UpdateEventResponseDto> {
    return this.eventUpdateService.update(eventId, userId, updateDto);
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
  ): Promise<RemoveEventResponseDto> {
    return this.eventUpdateService.remove(eventId, userId);
  }
}
