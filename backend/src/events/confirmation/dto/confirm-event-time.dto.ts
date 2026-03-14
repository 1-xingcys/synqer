import { IsArray, IsOptional, IsString, ArrayMinSize } from 'class-validator';

export class ConfirmEventTimeDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  slotIds: string[]; // 確認的時段 ID 陣列
}

export class UpdateStagedConfirmationDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  addSlotIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeSlotIds?: string[];
}
