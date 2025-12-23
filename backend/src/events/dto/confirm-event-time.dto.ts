import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class ConfirmEventTimeDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  slotIds: string[]; // 確認的時段 ID 陣列
}
