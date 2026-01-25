import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EventBaseRepository } from '../repositories/event.repository';

/**
 * 活動權限檢查服務
 */
@Injectable()
export class EventAuthorizationService {
  constructor(private eventBaseRepository: EventBaseRepository) {}

  /**
   * 檢查活動是否存在並驗證擁有者權限
   * @throws NotFoundException 如果活動不存在或已刪除
   * @throws ForbiddenException 如果用戶不是擁有者
   */
  async verifyOwner(eventId: string, userId: string): Promise<void> {
    const event = await this.eventBaseRepository.findOwnerInfo(eventId);

    if (!event || event.isDeleted) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this event');
    }
  }
}
