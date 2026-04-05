import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventType } from '@prisma/client';
import { EventUpdateService } from './event-update.service';
import { EventRepository } from '../repositories/event.repository';
import { EventAuthorizationService } from '../../shared/services/event-authorization.service';
import { EventScheduleService } from '../../shared/services/event-schedule.service';

describe('EventUpdateService', () => {
  let service: EventUpdateService;
  let eventRepository: jest.Mocked<EventRepository>;
  let eventAuthorizationService: jest.Mocked<EventAuthorizationService>;
  let eventScheduleService: jest.Mocked<EventScheduleService>;

  const mockEventRepository = {
    findOneBasic: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockEventAuthorizationService = {
    verifyOwner: jest.fn(),
  };

  const mockEventScheduleService = {
    resolveSchedule: jest.fn(),
    getEventStartInstant: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventUpdateService,
        { provide: EventRepository, useValue: mockEventRepository },
        { provide: EventAuthorizationService, useValue: mockEventAuthorizationService },
        { provide: EventScheduleService, useValue: mockEventScheduleService },
      ],
    }).compile();

    service = module.get<EventUpdateService>(EventUpdateService);
    eventRepository = module.get(EventRepository);
    eventAuthorizationService = module.get(EventAuthorizationService);
    eventScheduleService = module.get(EventScheduleService);

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
        type: EventType.ONE_TIME,
        title: 'New Title',
        description: 'Description',
        oneTimeSchedule: {
          startDate: new Date('2024-12-25'),
          endDate: new Date('2024-12-25'),
          startMinuteOfDay: 540,
          endMinuteOfDay: 600,
          slotDurationMin: 15,
        },
        recurringSchedule: null,
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.update.mockResolvedValue(updatedEvent);
      mockEventScheduleService.resolveSchedule.mockReturnValue({
        type: EventType.ONE_TIME,
        startDate: new Date('2024-12-25'),
        endDate: new Date('2024-12-25'),
        startMinuteOfDay: 540,
        endMinuteOfDay: 600,
        slotDurationMin: 15,
      });

      const result = await service.update(eventId, userId, updateDto);

      expect(eventAuthorizationService.verifyOwner).toHaveBeenCalledWith(eventId, userId);
      expect(eventRepository.update).toHaveBeenCalledWith(eventId, { title: 'New Title' });
      expect(result).toEqual({
        id: eventId,
        title: 'New Title',
        description: 'Description',
        schedule: {
          kind: EventType.ONE_TIME,
          startDate: new Date('2024-12-25'),
          endDate: new Date('2024-12-25'),
          weekdays: undefined,
          startMinuteOfDay: 540,
          endMinuteOfDay: 600,
          slotDurationMin: 15,
        },
      });
    });

    it('should update event description', async () => {
      const updateDto = { description: 'New Description' };
      const updatedEvent = {
        id: eventId,
        type: EventType.ONE_TIME,
        title: 'Title',
        description: 'New Description',
        oneTimeSchedule: {
          startDate: new Date(),
          endDate: new Date(),
          startMinuteOfDay: 540,
          endMinuteOfDay: 600,
          slotDurationMin: 15,
        },
        recurringSchedule: null,
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.update.mockResolvedValue(updatedEvent);
      mockEventScheduleService.resolveSchedule.mockReturnValue({
        type: EventType.ONE_TIME,
        startDate: updatedEvent.oneTimeSchedule.startDate,
        endDate: updatedEvent.oneTimeSchedule.endDate,
        startMinuteOfDay: 540,
        endMinuteOfDay: 600,
        slotDurationMin: 15,
      });

      const result = await service.update(eventId, userId, updateDto);

      expect(eventRepository.update).toHaveBeenCalledWith(eventId, { description: 'New Description' });
      expect(result.description).toBe('New Description');
    });

    it('should update event timeZone', async () => {
      const updateDto = { timeZone: 'America/New_York' };
      const updatedEvent = {
        id: eventId,
        type: EventType.ONE_TIME,
        title: 'Title',
        description: null,
        oneTimeSchedule: {
          startDate: new Date(),
          endDate: new Date(),
          startMinuteOfDay: 540,
          endMinuteOfDay: 600,
          slotDurationMin: 15,
        },
        recurringSchedule: null,
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.update.mockResolvedValue(updatedEvent);
      mockEventScheduleService.resolveSchedule.mockReturnValue({
        type: EventType.ONE_TIME,
        startDate: updatedEvent.oneTimeSchedule.startDate,
        endDate: updatedEvent.oneTimeSchedule.endDate,
        startMinuteOfDay: 540,
        endMinuteOfDay: 600,
        slotDurationMin: 15,
      });

      await service.update(eventId, userId, updateDto);

      expect(eventRepository.update).toHaveBeenCalledWith(eventId, { timeZone: 'America/New_York' });
    });

    it('should update votingDeadline when valid', async () => {
      const updateDto = { votingDeadline: '2024-12-24T08:00:00Z' };
      const mockEvent = {
        id: eventId,
        type: EventType.ONE_TIME,
        oneTimeSchedule: {
          startDate: new Date('2024-12-25'),
          endDate: new Date('2024-12-25'),
          startMinuteOfDay: 540,
          endMinuteOfDay: 600,
          slotDurationMin: 15,
        },
        recurringSchedule: null,
      };
      const updatedEvent = {
        id: eventId,
        type: EventType.ONE_TIME,
        title: 'Title',
        description: null,
        oneTimeSchedule: {
          startDate: new Date('2024-12-25'),
          endDate: new Date('2024-12-25'),
          startMinuteOfDay: 540,
          endMinuteOfDay: 600,
          slotDurationMin: 15,
        },
        recurringSchedule: null,
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.findOneBasic.mockResolvedValue(mockEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);
      mockEventScheduleService.getEventStartInstant.mockReturnValue(
        new Date('2024-12-25T09:00:00.000Z'),
      );
      mockEventScheduleService.resolveSchedule.mockReturnValue({
        type: EventType.ONE_TIME,
        startDate: updatedEvent.oneTimeSchedule.startDate,
        endDate: updatedEvent.oneTimeSchedule.endDate,
        startMinuteOfDay: 540,
        endMinuteOfDay: 600,
        slotDurationMin: 15,
      });

      await service.update(eventId, userId, updateDto);

      expect(eventRepository.findOneBasic).toHaveBeenCalledWith(eventId);
      expect(eventRepository.update).toHaveBeenCalledWith(eventId, {
        votingDeadline: new Date('2024-12-24T08:00:00Z'),
      });
    });

    it('should clear votingDeadline when set to null', async () => {
      const updateDto = { votingDeadline: null };
      const updatedEvent = {
        id: eventId,
        type: EventType.ONE_TIME,
        title: 'Title',
        description: null,
        oneTimeSchedule: {
          startDate: new Date('2024-12-25'),
          endDate: new Date('2024-12-25'),
          startMinuteOfDay: 540,
          endMinuteOfDay: 600,
          slotDurationMin: 15,
        },
        recurringSchedule: null,
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.update.mockResolvedValue(updatedEvent);
      mockEventScheduleService.resolveSchedule.mockReturnValue({
        type: EventType.ONE_TIME,
        startDate: updatedEvent.oneTimeSchedule.startDate,
        endDate: updatedEvent.oneTimeSchedule.endDate,
        startMinuteOfDay: 540,
        endMinuteOfDay: 600,
        slotDurationMin: 15,
      });

      await service.update(eventId, userId, updateDto);

      expect(eventRepository.findOneBasic).not.toHaveBeenCalled();
      expect(eventRepository.update).toHaveBeenCalledWith(eventId, {
        votingDeadline: null,
      });
    });

    it('should throw BadRequestException when votingDeadline is after event start', async () => {
      const updateDto = { votingDeadline: '2024-12-25T10:00:00Z' };
      const mockEvent = {
        id: eventId,
        type: EventType.ONE_TIME,
        oneTimeSchedule: {
          startDate: new Date('2024-12-25'),
          endDate: new Date('2024-12-25'),
          startMinuteOfDay: 540,
          endMinuteOfDay: 600,
          slotDurationMin: 15,
        },
        recurringSchedule: null,
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.findOneBasic.mockResolvedValue(mockEvent);
      mockEventScheduleService.getEventStartInstant.mockReturnValue(
        new Date('2024-12-25T09:00:00.000Z'),
      );

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
        type: EventType.ONE_TIME,
        oneTimeSchedule: {
          startDate: new Date('2024-12-25'),
          endDate: new Date('2024-12-25'),
          startMinuteOfDay: 540,
          endMinuteOfDay: 600,
          slotDurationMin: 15,
        },
        recurringSchedule: null,
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.findOneBasic.mockResolvedValue(mockEvent);
      mockEventScheduleService.getEventStartInstant.mockReturnValue(
        new Date('2024-12-25T09:00:00.000Z'),
      );

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
        type: EventType.ONE_TIME,
        title: 'New Title',
        description: 'New Description',
        oneTimeSchedule: {
          startDate: new Date(),
          endDate: new Date(),
          startMinuteOfDay: 540,
          endMinuteOfDay: 600,
          slotDurationMin: 15,
        },
        recurringSchedule: null,
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.update.mockResolvedValue(updatedEvent);
      mockEventScheduleService.resolveSchedule.mockReturnValue({
        type: EventType.ONE_TIME,
        startDate: updatedEvent.oneTimeSchedule.startDate,
        endDate: updatedEvent.oneTimeSchedule.endDate,
        startMinuteOfDay: 540,
        endMinuteOfDay: 600,
        slotDurationMin: 15,
      });

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
        type: EventType.ONE_TIME,
        title: 'New Title',
        description: null,
        oneTimeSchedule: {
          startDate: new Date(),
          endDate: new Date(),
          startMinuteOfDay: 540,
          endMinuteOfDay: 600,
          slotDurationMin: 15,
        },
        recurringSchedule: null,
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.update.mockResolvedValue(updatedEvent);
      mockEventScheduleService.resolveSchedule.mockReturnValue({
        type: EventType.ONE_TIME,
        startDate: updatedEvent.oneTimeSchedule.startDate,
        endDate: updatedEvent.oneTimeSchedule.endDate,
        startMinuteOfDay: 540,
        endMinuteOfDay: 600,
        slotDurationMin: 15,
      });

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
