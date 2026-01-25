import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { VoteService } from './services/vote.service';
import { VoteEventDto } from './dto/vote-event.dto';
import { SessionAuthGuard, CurrentUser } from '../../auth';

@Controller('events/:eventId/voting')
export class VotingController {
  constructor(private readonly voteService: VoteService) {}

  /**
   * POST /events/:eventId/voting
   * 儲存使用者的有空時段投票
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async vote(
    @Param('eventId') eventId: string,
    @Body() voteDto: VoteEventDto,
    @CurrentUser() userId: string,
  ) {
    return this.voteService.vote(eventId, userId, voteDto);
  }
}
