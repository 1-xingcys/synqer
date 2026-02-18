import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { VoteService } from './services/vote.service';
import {
  VoteEventDto,
  UpdateVoteDto,
  UpdateStagedVoteDto,
} from './dto/vote-event.dto';
import {
  VoteEventResponseDto,
  UpdateVoteResponseDto,
  UpdateStagedVoteResponseDto,
  CommitStagedVoteResponseDto,
} from './dto/vote-response.dto';
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
  ): Promise<VoteEventResponseDto> {
    return this.voteService.vote(eventId, userId, voteDto);
  }

  /**
   * PATCH /events/:eventId/voting
   * 更新投票（新增/移除特定 slots）
   */
  @Patch()
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async updateVotes(
    @Param('eventId') eventId: string,
    @Body() updateVoteDto: UpdateVoteDto,
    @CurrentUser() userId: string,
  ): Promise<UpdateVoteResponseDto> {
    return this.voteService.updateVotes(eventId, userId, updateVoteDto);
  }

  /**
   * PATCH /events/:eventId/voting/staged
   * 更新 staged vote 草稿（新增/移除特定 slots）
   */
  @Patch('staged')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async updateStagedVotes(
    @Param('eventId') eventId: string,
    @Body() updateStagedVoteDto: UpdateStagedVoteDto,
    @CurrentUser() userId: string,
  ): Promise<UpdateStagedVoteResponseDto> {
    return this.voteService.updateStagedVotes(
      eventId,
      userId,
      updateStagedVoteDto,
    );
  }

  /**
   * POST /events/:eventId/voting/commit
   * 提交 staged vote 草稿為 committed votes
   */
  @Post('commit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  async commitStagedVotes(
    @Param('eventId') eventId: string,
    @CurrentUser() userId: string,
  ): Promise<CommitStagedVoteResponseDto> {
    return this.voteService.commitStagedVotes(eventId, userId);
  }
}
