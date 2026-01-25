import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventUpdateService } from './event-update.service';
import { EventRepository } from '../repositories/event.repository';
import { EventAuthorizationService } from '../../shared/services/event-authorization.service';

describe('EventUpdateService', () => {
  let service: EventUpdateService;
  let eventRepository: jest.Mocked<EventRepository>;
  let eventAuthorizationService: jest.Mocked<EventAuthorizationService>;

  const mockEventRepository = {
    findOneBasic: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockEventAuthorizationService = {
    verifyOwner: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventUpdateService,
        { provide: EventRepository, useValue: mockEventRepository },
        { provide: EventAuthorizationService, useValue: mockEventAuthorizationService },
      ],
    }).compile();

    service = module.get<EventUpdateService>(EventUpdateService);
    eventRepository = module.get(EventRepository);
    eventAuthorizationService = module.get(EventAuthorizationService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    const eventId = 'event-123';
    const userId = 'user-123';

    it('should update event title', async () => {
      const updateDto = { title: 'New Title' };
      const updatedEvent = {
        id: eventId,
        title: 'New Title',
        description: 'Description',
        startDate: new Date('2024-12-25'),
        endDate: new Date('2024-12-25'),
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await service.update(eventId, userId, updateDto);

      expect(eventAuthorizationService.verifyOwner).toHaveBeenCalledWith(eventId, userId);
      expect(eventRepository.update).toHaveBeenCalledWith(eventId, { title: 'New Title' });
      expect(result).toEqual({
        id: eventId,
        title: 'New Title',
        description: 'Description',
        startDate: new Date('2024-12-25'),
        endDate: new Date('2024-12-25'),
      });
    });

    it('should update event description', async () => {
      const updateDto = { description: 'New Description' };
      const updatedEvent = {
        id: eventId,
        title: 'Title',
        description: 'New Description',
        startDate: new Date(),
        endDate: new Date(),
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await service.update(eventId, userId, updateDto);

      expect(eventRepository.update).toHaveBeenCalledWith(eventId, { description: 'New Description' });
      expect(result.description).toBe('New Description');
    });

    it('should update event timeZone', async () => {
      const updateDto = { timeZone: 'America/New_York' };
      const updatedEvent = {
        id: eventId,
        title: 'Title',
        description: null,
        startDate: new Date(),
        endDate: new Date(),
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      await service.update(eventId, userId, updateDto);

      expect(eventRepository.update).toHaveBeenCalledWith(eventId, { timeZone: 'America/New_York' });
    });

    it('should update votingDeadline when valid', async () => {
      const updateDto = { votingDeadline: '2024-12-24T08:00:00Z' };
      const mockEvent = {
        id: eventId,
        startDate: new Date('2024-12-25'),
        startMinuteOfDay: 540, // 09:00
      };
      const updatedEvent = {
        id: eventId,
        title: 'Title',
        description: null,
        startDate: new Date('2024-12-25'),
        endDate: new Date('2024-12-25'),
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.findOneBasic.mockResolvedValue(mockEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      await service.update(eventId, userId, updateDto);

      expect(eventRepository.findOneBasic).toHaveBeenCalledWith(eventId);
      expect(eventRepository.update).toHaveBeenCalledWith(eventId, {
        votingDeadline: new Date('2024-12-24T08:00:00Z'),
      });
    });

    it('should throw BadRequestException when votingDeadline is after event start', async () => {
      const updateDto = { votingDeadline: '2024-12-25T10:00:00Z' };
      const mockEvent = {
        id: eventId,
        startDate: new Date('2024-12-25'),
        startMinuteOfDay: 540, // 09:00
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.findOneBasic.mockResolvedValue(mockEvent);

      await expect(service.update(eventId, userId, updateDto)).rejects.toThrow(
        new BadRequestException('Voting deadline must be before or at the event start time'),
      );
    });

    it('should throw BadRequestException when event not found for votingDeadline validation', async () => {
      const updateDto = { votingDeadline: '2024-12-24T08:00:00Z' };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.findOneBasic.mockResolvedValue(null);

      await expect(service.update(eventId, userId, updateDto)).rejects.toThrow(
        new BadRequestException('Event not found'),
      );
    });

    it('should throw BadRequestException for invalid votingDeadline format', async () => {
      const updateDto = { votingDeadline: 'invalid-date' };
      const mockEvent = {
        id: eventId,
        startDate: new Date('2024-12-25'),
        startMinuteOfDay: 540,
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.findOneBasic.mockResolvedValue(mockEvent);

      await expect(service.update(eventId, userId, updateDto)).rejects.toThrow(
        new BadRequestException('Invalid voting deadline'),
      );
    });

    it('should handle multiple field updates', async () => {
      const updateDto = {
        title: 'New Title',
        description: 'New Description',
        timeZone: 'Asia/Tokyo',
      };
      const updatedEvent = {
        id: eventId,
        title: 'New Title',
        description: 'New Description',
        startDate: new Date(),
        endDate: new Date(),
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      await service.update(eventId, userId, updateDto);

      expect(eventRepository.update).toHaveBeenCalledWith(eventId, {
        title: 'New Title',
        description: 'New Description',
        timeZone: 'Asia/Tokyo',
      });
    });

    it('should not include undefined fields in update data', async () => {
      const updateDto = { title: 'New Title' };
      const updatedEvent = {
        id: eventId,
        title: 'New Title',
        description: null,
        startDate: new Date(),
        endDate: new Date(),
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      await service.update(eventId, userId, updateDto);

      const updateCall = eventRepository.update.mock.calls[0][1];
      expect(updateCall).not.toHaveProperty('description');
      expect(updateCall).not.toHaveProperty('timeZone');
      expect(updateCall).not.toHaveProperty('votingDeadline');
    });
  });

  describe('remove', () => {
    const eventId = 'event-123';
    const userId = 'user-123';

    it('should soft delete event successfully', async () => {
      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.softDelete.mockResolvedValue({ id: eventId, isDeleted: true });

      const result = await service.remove(eventId, userId);

      expect(eventAuthorizationService.verifyOwner).toHaveBeenCalledWith(eventId, userId);
      expect(eventRepository.softDelete).toHaveBeenCalledWith(eventId);
      expect(result).toEqual({ success: true });
    });
  });
});
