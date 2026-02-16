export class UnvotedParticipantDto {
  id!: string;
  lineUserId!: string;
  userId!: string | null;
  displayName!: string;
  pictureUrl?: string | null;
  reminderSentAt!: Date | null;
}

export class UnvotedParticipantsResponseDto {
  eventId!: string;
  lineGroupId?: string;
  lineGroupLineId?: string;
  unvotedParticipants!: UnvotedParticipantDto[];
}
