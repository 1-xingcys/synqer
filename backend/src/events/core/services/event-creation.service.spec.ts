import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventCreationService } from './event-creation.service';
import { EventRepository } from '../repositories/event.repository';
import { TimeSlotService } from '../../shared/services/time-slot.service';

describe('EventCreationService', () => {
  let service: EventCreationService;
  let eventRepository: jest.Mocked<EventRepository>;
  let timeSlotService: jest.Mocked<TimeSlotService>;

  const mockEventRepository = {
    createWithSlotsAndParticipants: jest.fn(),
  };

  const mockTimeSlotService = {
    parseTimeToMinutes: jest.fn(),
    generateTimeSlots: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventCreationService,
        { provide: EventRepository, useValue: mockEventRepository },
        { provide: TimeSlotService, useValue: mockTimeSlotService },
      ],
    }).compile();

    service = module.get<EventCreationService>(EventCreationService);
    eventRepository = module.get(EventRepository);
    timeSlotService = module.get(TimeSlotService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const validDto = {
      title: 'Test Event',
      description: 'Test Description',
      startDate: '2024-12-25',
      endDate: '2024-12-25',
      startTime: '09:00',
      endTime: '18:00',
      slotDurationMin: 15,
      timeZone: 'Asia/Taipei',
    };

    const mockSlots = [
      { date: new Date('2024-12-25'), startMinute: 540, endMinute: 555 },
      { date: new Date('2024-12-25'), startMinute: 555, endMinute: 570 },
    ];

    beforeEach(() => {
      mockTimeSlotService.parseTimeToMinutes.mockImplementation((time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      });
      mockTimeSlotService.generateTimeSlots.mockReturnValue(mockSlots);
    });

    it('should create an event successfully', async () => {
      const userId = 'user-123';
      const mockResult = {
        event: { id: 'event-123', title: 'Test Event', lineGroupId: null },
        creatorLineUserId: undefined,
      };

      mockEventRepository.createWithSlotsAndParticipants.mockResolvedValue(mockResult);

      const result = await service.create(validDto, userId);

      expect(timeSlotService.parseTimeToMinutes).toHaveBeenCalledWith('09:00');
      expect(timeSlotService.generateTimeSlots).toHaveBeenCalled();
      expect(eventRepository.createWithSlotsAndParticipants).toHaveBeenCalled();
      expect(result).toEqual({
        eventId: 'event-123',
        shareUrl: '/events/event-123',
        meta: {
          title: 'Test Event',
          totalSlots: 2,
          lineGroupId: null,
          expectedParticipants: 1, // creator
        },
      });
    });

    it('should create an event without user ID', async () => {
      const mockResult = {
        event: { id: 'event-456', title: 'Test Event', lineGroupId: null },
        creatorLineUserId: undefined,
      };

      mockEventRepository.createWithSlotsAndParticipants.mockResolvedValue(mockResult);

      const result = await service.create(validDto);

      expect(result.meta.expectedParticipants).toBe(0);
    });

    it('should handle 24:00 as end time', async () => {
      const dtoWith24 = { ...validDto, endTime: '24:00' };
      const mockResult = {
        event: { id: 'event-123', title: 'Test Event', lineGroupId: null },
        creatorLineUserId: undefined,
      };

      mockEventRepository.createWithSlotsAndParticipants.mockResolvedValue(mockResult);

      await service.create(dtoWith24);

      // 24:00 should be treated as 1440 minutes
      expect(timeSlotService.generateTimeSlots).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        540, // startMinuteOfDay
        1440, // endMinuteOfDay (24:00)
        15,
      );
    });

    it('should deduplicate expectedLineUserIds', async () => {
      const dtoWithDuplicates = {
        ...validDto,
        expectedLineUserIds: ['line-1', 'line-1', 'line-2', 'line-2'],
      };
      const mockResult = {
        event: { id: 'event-123', title: 'Test Event', lineGroupId: null },
        creatorLineUserId: undefined,
      };

      mockEventRepository.createWithSlotsAndParticipants.mockResolvedValue(mockResult);

      await service.create(dtoWithDuplicates, 'user-123');

      expect(eventRepository.createWithSlotsAndParticipants).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Array),
        [{ lineUserId: 'line-1' }, { lineUserId: 'line-2' }], // deduplicated
        'user-123',
      );
    });

    it('should throw BadRequestException when startDate is after endDate', async () => {
      const invalidDto = {
        ...validDto,
        startDate: '2024-12-26',
        endDate: '2024-12-25',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        new BadRequestException('Start date must be before or equal to end date'),
      );
    });

    it('should throw BadRequestException when startTime is not before endTime', async () => {
      const invalidDto = {
        ...validDto,
        startTime: '18:00',
        endTime: '09:00',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        new BadRequestException('Start time must be before end time'),
      );
    });

    it('should throw BadRequestException when startTime equals endTime', async () => {
      const invalidDto = {
        ...validDto,
        startTime: '09:00',
        endTime: '09:00',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        new BadRequestException('Start time must be before end time'),
      );
    });

    it('should validate votingDeadline when provided', async () => {
      const dtoWithDeadline = {
        ...validDto,
        votingDeadline: '2024-12-26T10:00:00Z', // after event start
      };

      await expect(service.create(dtoWithDeadline)).rejects.toThrow(
        new BadRequestException('Voting deadline must be before or at the event start time'),
      );
    });

    it('should accept valid votingDeadline', async () => {
      const dtoWithValidDeadline = {
        ...validDto,
        votingDeadline: '2024-12-24T08:00:00Z', // before event start
      };
      const mockResult = {
        event: { id: 'event-123', title: 'Test Event', lineGroupId: null },
        creatorLineUserId: undefined,
      };

      mockEventRepository.createWithSlotsAndParticipants.mockResolvedValue(mockResult);

      const result = await service.create(dtoWithValidDeadline, 'user-123');

      expect(result.eventId).toBe('event-123');
    });

    it('should throw BadRequestException for invalid votingDeadline format', async () => {
      const dtoWithInvalidDeadline = {
        ...validDto,
        votingDeadline: 'invalid-date',
      };

      await expect(service.create(dtoWithInvalidDeadline)).rejects.toThrow(
        new BadRequestException('Invalid voting deadline'),
      );
    });

    it('should not count creator twice when creatorLineUserId is in expectedLineUserIds', async () => {
      const dtoWithLineIds = {
        ...validDto,
        expectedLineUserIds: ['line-creator', 'line-other'],
      };
      const mockResult = {
        event: { id: 'event-123', title: 'Test Event', lineGroupId: null },
        creatorLineUserId: 'line-creator',
      };

      mockEventRepository.createWithSlotsAndParticipants.mockResolvedValue(mockResult);

      const result = await service.create(dtoWithLineIds, 'user-123');

      // creator (1) + line-other (1) = 2, line-creator is not double counted
      expect(result.meta.expectedParticipants).toBe(2);
    });
  });
});
