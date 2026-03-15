import {
  Controller,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ConfirmationService } from './services/confirmation.service';
import {
  ConfirmEventTimeDto,
  UpdateStagedConfirmationDto,
} from './dto/confirm-event-time.dto';
import {
  CommitStagedConfirmationResponseDto,
  ConfirmEventTimeResponseDto,
  UpdateStagedConfirmationResponseDto,
} from './dto/confirm-event-time-response.dto';
import {
  CancelConfirmedTimeResponseDto,
  DiscardStagedConfirmationResponseDto,
} from './dto/cancel-confirmed-time-response.dto';
import { SessionAuthGuard, CurrentUser } from '../../auth';

@Controller('events/:eventId/confirmation')
export class ConfirmationController {
  constructor(private readonly confirmationService: ConfirmationService) {}

  /**
   * POST /events/:eventId/confirmation
   * 確認活動時間（僅限活動擁有者）
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async confirmEventTime(
    @Param('eventId') eventId: string,
    @Body() dto: ConfirmEventTimeDto,
    @CurrentUser() userId: string,
  ): Promise<ConfirmEventTimeResponseDto> {
    return this.confirmationService.confirmEventTime(eventId, userId, dto);
  }

  /**
   * PATCH /events/:eventId/confirmation/staged
   * 更新 staged confirmation 草稿
   */
  @Patch('staged')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async updateStagedConfirmation(
    @Param('eventId') eventId: string,
    @Body() dto: UpdateStagedConfirmationDto,
    @CurrentUser() userId: string,
  ): Promise<UpdateStagedConfirmationResponseDto> {
    return this.confirmationService.updateStagedConfirmation(
      eventId,
      userId,
      dto,
    );
  }

  /**
   * POST /events/:eventId/confirmation/commit
   * 提交 staged confirmation 草稿為正式 confirmed time
   */
  @Post('commit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async commitStagedConfirmation(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ): Promise<CommitStagedConfirmationResponseDto> {
    return this.confirmationService.commitStagedConfirmation(eventId, userId);
  }

  /**
   * DELETE /events/:eventId/confirmation
   * 取消確認的活動時間（僅限活動擁有者）
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async cancelConfirmedTime(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ): Promise<CancelConfirmedTimeResponseDto> {
    return this.confirmationService.cancelConfirmedTime(eventId, userId);
  }

  /**
   * DELETE /events/:eventId/confirmation/staged
   * 捨棄 staged confirmation 草稿
   */
  @Delete('staged')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async discardStagedConfirmation(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ): Promise<DiscardStagedConfirmationResponseDto> {
    return this.confirmationService.discardStagedConfirmation(eventId, userId);
  }
}
