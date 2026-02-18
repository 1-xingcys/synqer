import { VoteMode } from './vote-event.dto';

export class VoteEventResponseDto {
  success!: boolean;
  votedSlots!: number;
  voteMode!: VoteMode;
}

export class UpdateVoteResponseDto {
  success!: boolean;
  added!: number;
  removed!: number;
}

export class UpdateStagedVoteResponseDto {
  success!: boolean;
  stagedSlotCount!: number;
}

export class CommitStagedVoteResponseDto {
  success!: boolean;
  committedSlots!: number;
}
