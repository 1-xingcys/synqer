import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ConfirmationService } from './services/confirmation.service';
import { ConfirmEventTimeDto } from './dto/confirm-event-time.dto';
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
  ) {
    return this.confirmationService.confirmEventTime(eventId, userId, dto);
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
  ) {
    return this.confirmationService.cancelConfirmedTime(eventId, userId);
  }
}
