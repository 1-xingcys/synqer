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
  };

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-12-20T00:00:00.000Z'));

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

  afterEach(() => {
    jest.useRealTimers();
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
        confirmedTimeSlots: [],
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
        confirmedTimeSlots: [],
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
        confirmedTimeSlots: [],
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
        timeZone: 'Asia/Taipei',
        confirmedTimeSlots: [],
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
        confirmedTimeSlots: [],
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
      const mockEvent = {
        id: eventId,
        type: EventType.ONE_TIME,
        confirmedTimeSlots: [],
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
        confirmedTimeSlots: [],
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
        votingDeadline: null,
      });
    });

    it('should accept a votingDeadline after the event start time', async () => {
      // The deadline value is deliberately unconstrained: a host may keep
      // voting open past the event start.
      const updateDto = { votingDeadline: '2024-12-25T10:00:00Z' };
      const schedule = {
        startDate: new Date('2024-12-25'),
        endDate: new Date('2024-12-25'),
        startMinuteOfDay: 540,
        endMinuteOfDay: 600,
        slotDurationMin: 15,
      };
      const mockEvent = {
        id: eventId,
        type: EventType.ONE_TIME,
        timeZone: 'Asia/Taipei',
        confirmedTimeSlots: [],
        oneTimeSchedule: schedule,
        recurringSchedule: null,
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.findOneBasic.mockResolvedValue(mockEvent);
      mockEventRepository.update.mockResolvedValue({
        ...mockEvent,
        title: 'Title',
        description: null,
      });
      mockEventScheduleService.resolveSchedule.mockReturnValue({
        type: EventType.ONE_TIME,
        ...schedule,
      });

      await service.update(eventId, userId, updateDto);

      expect(eventRepository.update).toHaveBeenCalledWith(eventId, {
        votingDeadline: new Date('2024-12-25T10:00:00Z'),
      });
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
        confirmedTimeSlots: [],
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
        confirmedTimeSlots: [],
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
        confirmedTimeSlots: [],
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

    it('should allow updating votingDeadline after the previous deadline has passed', async () => {
      const updateDto = { votingDeadline: '2024-12-24T08:00:00Z' };
      const mockEvent = {
        id: eventId,
        type: EventType.ONE_TIME,
        votingDeadline: new Date('2024-12-19T08:00:00Z'),
        confirmedTimeSlots: [],
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
        confirmedTimeSlots: [],
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
        votingDeadline: new Date('2024-12-24T08:00:00Z'),
      });
    });

    it('should throw BadRequestException when votingDeadline is changed after event time is confirmed', async () => {
      const updateDto = { votingDeadline: null };
      const mockEvent = {
        id: eventId,
        type: EventType.ONE_TIME,
        confirmedTimeSlots: [{ id: 'confirmed-slot-1' }],
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

      await expect(service.update(eventId, userId, updateDto)).rejects.toThrow(
        new BadRequestException(
          'Voting deadline cannot be changed after confirming the event time',
        ),
      );
    });

    it('should allow changing votingDeadline after the event has started when the time is not confirmed', async () => {
      // An event that started without a confirmed time is still collecting
      // votes, so the host keeps full control over the deadline.
      const updateDto = { votingDeadline: null };
      const schedule = {
        startDate: new Date('2024-12-15'),
        endDate: new Date('2024-12-15'),
        startMinuteOfDay: 540,
        endMinuteOfDay: 600,
        slotDurationMin: 15,
      };
      const mockEvent = {
        id: eventId,
        type: EventType.ONE_TIME,
        timeZone: 'Asia/Taipei',
        confirmedTimeSlots: [],
        oneTimeSchedule: schedule,
        recurringSchedule: null,
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.findOneBasic.mockResolvedValue(mockEvent);
      mockEventRepository.update.mockResolvedValue({
        ...mockEvent,
        title: 'Title',
        description: null,
      });
      mockEventScheduleService.resolveSchedule.mockReturnValue({
        type: EventType.ONE_TIME,
        ...schedule,
      });

      await service.update(eventId, userId, updateDto);

      expect(eventRepository.update).toHaveBeenCalledWith(eventId, {
        votingDeadline: null,
      });
    });

    it('should accept a votingDeadline in the past', async () => {
      // Setting a past deadline is how a host closes voting immediately.
      const updateDto = { votingDeadline: '2024-12-19T08:00:00Z' };
      const schedule = {
        startDate: new Date('2024-12-25'),
        endDate: new Date('2024-12-25'),
        startMinuteOfDay: 540,
        endMinuteOfDay: 600,
        slotDurationMin: 15,
      };
      const mockEvent = {
        id: eventId,
        type: EventType.ONE_TIME,
        timeZone: 'Asia/Taipei',
        confirmedTimeSlots: [],
        oneTimeSchedule: schedule,
        recurringSchedule: null,
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockEventRepository.findOneBasic.mockResolvedValue(mockEvent);
      mockEventRepository.update.mockResolvedValue({
        ...mockEvent,
        title: 'Title',
        description: null,
      });
      mockEventScheduleService.resolveSchedule.mockReturnValue({
        type: EventType.ONE_TIME,
        ...schedule,
      });

      await service.update(eventId, userId, updateDto);

      expect(eventRepository.update).toHaveBeenCalledWith(eventId, {
        votingDeadline: new Date('2024-12-19T08:00:00Z'),
      });
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
