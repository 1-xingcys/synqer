import { IsArray, IsString, IsOptional, IsEnum } from 'class-validator';

export enum VoteMode {
  AVAILABLE = 'available', // 投自己「可以」的時間
  UNAVAILABLE = 'unavailable', // 投自己「不行」的時間
}

export class VoteEventDto {
  @IsArray()
  @IsString({ each: true })
  selectedSlotIds: string[]; // 用戶選擇的時段 ID

  @IsOptional()
  @IsEnum(VoteMode)
  voteMode?: VoteMode; // 預設為 'available'
}
