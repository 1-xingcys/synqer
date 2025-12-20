import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 活動權限檢查服務
 */
@Injectable()
export class EventAuthorizationService {
  constructor(private prisma: PrismaService) {}

  /**
   * 檢查活動是否存在並驗證擁有者權限
   * @throws NotFoundException 如果活動不存在
   * @throws ForbiddenException 如果用戶不是擁有者
   */
  async verifyOwner(eventId: string, userId: string): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, ownerId: true },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this event');
    }
  }

  /**
   * 檢查活動是否存在
   * @throws NotFoundException 如果活動不存在
   */
  async verifyExists(eventId: string): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }
  }

  /**
   * 獲取活動並檢查擁有者權限
   * @returns 活動記錄
   * @throws NotFoundException 如果活動不存在
   * @throws ForbiddenException 如果用戶不是擁有者
   */
  async getEventAndVerifyOwner<T extends { ownerId: string | null }>(
    eventId: string,
    userId: string,
    select?: Record<string, boolean>,
  ): Promise<T> {
    const event = (await this.prisma.event.findUnique({
      where: { id: eventId },
      ...(select && { select }),
    })) as T | null;

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this event');
    }

    return event;
  }
}
