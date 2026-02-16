import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ParticipantService } from './services/participant.service';
import { UpdateParticipantsDto } from './dto/update-participants.dto';
import { CheckParticipantStatusResponseDto } from './dto/check-participant-status-response.dto';
import { JoinEventResponseDto } from './dto/join-event-response.dto';
import { UpdateParticipantsResponseDto } from './dto/update-participants-response.dto';
import { UnvotedParticipantsResponseDto } from './dto/unvoted-participants-response.dto';
import { SessionAuthGuard, CurrentUser } from '../../auth';

@Controller('events/:eventId/participation')
export class ParticipationController {
  constructor(private readonly participantService: ParticipantService) {}

  /**
   * GET /events/:eventId/participation
   * 檢查當前使用者是否已經是活動的參與者
   */
  @Get()
  @UseGuards(SessionAuthGuard)
  async checkParticipantStatus(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ): Promise<CheckParticipantStatusResponseDto> {
    return this.participantService.checkParticipantStatus(eventId, userId);
  }

  /**
   * POST /events/:eventId/participation/join
   * 加入活動（透過分享連結）
   */
  @Post('join')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async joinEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ): Promise<JoinEventResponseDto> {
    return this.participantService.joinEvent(eventId, userId);
  }

  /**
   * PUT /events/:eventId/participation/members
   * 更新活動的預期參與者
   */
  @Put('members')
  @UseGuards(SessionAuthGuard)
  async updateParticipants(
    @Param('eventId') eventId: string,
    @Body() dto: UpdateParticipantsDto,
    @CurrentUser() userId: string,
  ): Promise<UpdateParticipantsResponseDto> {
    return this.participantService.updateParticipants(eventId, userId, dto);
  }

  /**
   * GET /events/:eventId/participation/unvoted
   * 取得活動中尚未投票的預期參與者（用於提醒功能）
   */
  @Get('unvoted')
  @UseGuards(SessionAuthGuard)
  async getUnvotedParticipants(
    @Param('eventId') eventId: string,
  ): Promise<UnvotedParticipantsResponseDto> {
    return this.participantService.getUnvotedParticipants(eventId);
  }
}
