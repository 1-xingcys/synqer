export class LineGroupSummaryDto {
  id!: string;
  lineGroupId!: string;
  groupName!: string | null;
  memberCount!: number;
  botJoinedAt!: Date;
  updatedAt!: Date;
}

export class LinkedUserDto {
  id!: string;
  displayName!: string | null;
  avatarUrl!: string | null;
}

export class LineGroupMemberDto {
  id!: string;
  lineUserId!: string;
  displayName!: string | null;
  pictureUrl!: string | null;
  isLinked!: boolean;
  linkedUser!: LinkedUserDto | null;
  firstSeenAt!: Date;
  lastSeenAt!: Date;
}
