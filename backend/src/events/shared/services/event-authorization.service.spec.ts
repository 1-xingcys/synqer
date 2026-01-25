import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventAuthorizationService } from './event-authorization.service';
import { EventBaseRepository } from '../repositories/event.repository';

describe('EventAuthorizationService', () => {
  let service: EventAuthorizationService;
  let eventBaseRepository: jest.Mocked<EventBaseRepository>;

  const mockEventBaseRepository = {
    findOwnerInfo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventAuthorizationService,
        { provide: EventBaseRepository, useValue: mockEventBaseRepository },
      ],
    }).compile();

    service = module.get<EventAuthorizationService>(EventAuthorizationService);
    eventBaseRepository = module.get(EventBaseRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyOwner', () => {
    const eventId = 'event-123';
    const userId = 'user-123';

    it('should pass when user is the owner', async () => {
      mockEventBaseRepository.findOwnerInfo.mockResolvedValue({
        id: eventId,
        ownerId: userId,
        isDeleted: false,
      });

      await expect(service.verifyOwner(eventId, userId)).resolves.toBeUndefined();
      expect(eventBaseRepository.findOwnerInfo).toHaveBeenCalledWith(eventId);
    });

    it('should throw NotFoundException when event not found', async () => {
      mockEventBaseRepository.findOwnerInfo.mockResolvedValue(null);

      await expect(service.verifyOwner(eventId, userId)).rejects.toThrow(
        new NotFoundException(`Event ${eventId} not found`),
      );
    });

    it('should throw NotFoundException when event is deleted', async () => {
      mockEventBaseRepository.findOwnerInfo.mockResolvedValue({
        id: eventId,
        ownerId: userId,
        isDeleted: true,
      });

      await expect(service.verifyOwner(eventId, userId)).rejects.toThrow(
        new NotFoundException(`Event ${eventId} not found`),
      );
    });

    it('should throw ForbiddenException when user is not the owner', async () => {
      mockEventBaseRepository.findOwnerInfo.mockResolvedValue({
        id: eventId,
        ownerId: 'different-user',
        isDeleted: false,
      });

      await expect(service.verifyOwner(eventId, userId)).rejects.toThrow(
        new ForbiddenException('You are not the owner of this event'),
      );
    });
  });
});
