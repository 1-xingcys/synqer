import { Test, TestingModule } from '@nestjs/testing';
import { EventMapperService } from './event-mapper.service';
import { EventStatusService } from './event-status.service';
import { ConfirmedTimeService } from './confirmed-time.service';

describe('EventMapperService', () => {
  let service: EventMapperService;
  let eventStatusService: jest.Mocked<EventStatusService>;
  let confirmedTimeService: jest.Mocked<ConfirmedTimeService>;

  const mockEventStatusService = {
    computeEventStatus: jest.fn(),
  };

  const mockConfirmedTimeService = {
    mergeToTimeRanges: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventMapperService,
        { provide: EventStatusService, useValue: mockEventStatusService },
        { provide: ConfirmedTimeService, useValue: mockConfirmedTimeService },
      ],
    }).compile();

    service = module.get<EventMapperService>(EventMapperService);
    eventStatusService = module.get(EventStatusService);
    confirmedTimeService = module.get(ConfirmedTimeService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mapVotes', () => {
    it('should map votes to simplified format', () => {
      const votes = [
        { slotId: 'slot-1', userId: 'user-1', user: { displayName: 'User One' } },
        { slotId: 'slot-2', userId: 'user-2', user: { displayName: null } },
        { slotId: 'slot-3', userId: 'user-3', user: null },
      ];

      const result = service.mapVotes(votes);

      expect(result).toEqual([
        { slotId: 'slot-1', userId: 'user-1', userDisplayName: 'User One' },
        { slotId: 'slot-2', userId: 'user-2', userDisplayName: 'Anonymous' },
        { slotId: 'slot-3', userId: 'user-3', userDisplayName: 'Anonymous' },
      ]);
    });

    it('should handle empty votes array', () => {
      const result = service.mapVotes([]);
      expect(result).toEqual([]);
    });
  });

  describe('extractParticipants', () => {
    it('should extract unique participants from votes', () => {
      const votes = [
        { userId: 'user-1', user: { displayName: 'User One' } },
        { userId: 'user-1', user: { displayName: 'User One' } }, // duplicate
        { userId: 'user-2', user: { displayName: 'User Two' } },
      ];

      const result = service.extractParticipants(votes);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ userId: 'user-1', displayName: 'User One' });
      expect(result).toContainEqual({ userId: 'user-2', displayName: 'User Two' });
    });

    it('should use Anonymous for null displayName', () => {
      const votes = [
        { userId: 'user-1', user: null },
      ];

      const result = service.extractParticipants(votes);

      expect(result[0].displayName).toBe('Anonymous');
    });
  });

  describe('extractParticipantsForHost', () => {
    it('should extract participants with hasVoted flag', () => {
      const votes = [
        { userId: 'user-1', user: { displayName: 'User One' } },
      ];

      const result = service.extractParticipantsForHost(votes);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        userId: 'user-1',
        displayName: 'User One',
        hasVoted: true,
      });
    });
  });

  describe('calculateVotingStats', () => {
    it('should calculate voting statistics', () => {
      const expectedParticipants = [
        { hasVoted: true },
        { hasVoted: false },
        { hasVoted: true },
      ];
      const participants = [
        { hasVoted: true },
        { hasVoted: true },
      ];

      const result = service.calculateVotingStats(expectedParticipants, participants);

      expect(result).toEqual({
        totalExpected: 3,
        totalVoted: 2,
        votingPercentage: (2 / 3) * 100,
      });
    });

    it('should use participants length when expectedParticipants is empty', () => {
      const participants = [{ hasVoted: true }];

      const result = service.calculateVotingStats([], participants);

      expect(result.totalExpected).toBe(1);
    });

    it('should handle zero participants', () => {
      const result = service.calculateVotingStats([], []);

      expect(result).toEqual({
        totalExpected: 0,
        totalVoted: 0,
        votingPercentage: 0,
      });
    });
  });

  describe('mapConfirmedSlotsForStatus', () => {
    it('should map confirmed slots for status calculation', () => {
      const confirmedTimeSlots = [
        {
          slotId: 'slot-1',
          slot: {
            id: 'slot-1',
            date: new Date('2024-12-25'),
            startMinute: 540,
            endMinute: 600,
          },
        },
      ];

      const result = service.mapConfirmedSlotsForStatus(confirmedTimeSlots);

      expect(result).toEqual([
        {
          slotId: 'slot-1',
          date: new Date('2024-12-25'),
          startMinute: 540,
          endMinute: 600,
        },
      ]);
    });

    it('should return undefined for empty or undefined input', () => {
      expect(service.mapConfirmedSlotsForStatus([])).toBeUndefined();
      expect(service.mapConfirmedSlotsForStatus(undefined)).toBeUndefined();
    });
  });

  describe('mapEventToList', () => {
    const mockEvent = {
      id: 'event-123',
      title: 'Test Event',
      description: 'Description',
      startDate: new Date('2024-12-25'),
      endDate: new Date('2024-12-26'),
      createdAt: new Date('2024-12-01'),
      votingDeadline: null,
      expectedParticipants: [{ id: 'ep-1' }],
      confirmedTimeSlots: [],
    };

    it('should map event to list format with status', () => {
      mockConfirmedTimeService.mergeToTimeRanges.mockReturnValue([]);
      mockEventStatusService.computeEventStatus.mockReturnValue('VOTING');

      const result = service.mapEventToList(mockEvent);

      expect(result).toEqual({
        id: 'event-123',
        title: 'Test Event',
        description: 'Description',
        startDate: new Date('2024-12-25'),
        endDate: new Date('2024-12-26'),
        createdAt: new Date('2024-12-01'),
        votingDeadline: null,
        confirmedSlotIds: [],
        confirmedTimeRanges: [],
        participantCount: 1,
        status: 'VOTING',
      });
    });

    it('should handle event with confirmed time slots', () => {
      const eventWithConfirmed = {
        ...mockEvent,
        confirmedTimeSlots: [
          {
            slotId: 'slot-1',
            slot: { id: 'slot-1', date: new Date(), startMinute: 540, endMinute: 600 },
          },
        ],
      };

      mockConfirmedTimeService.mergeToTimeRanges.mockReturnValue([
        { startTime: new Date(), endTime: new Date(), slotIds: ['slot-1'] },
      ]);
      mockEventStatusService.computeEventStatus.mockReturnValue('CONFIRMED');

      const result = service.mapEventToList(eventWithConfirmed);

      expect(result.confirmedSlotIds).toEqual(['slot-1']);
      expect(result.status).toBe('CONFIRMED');
    });
  });

  describe('mapEventToDetail', () => {
    const mockEvent = {
      id: 'event-123',
      title: 'Test Event',
      description: 'Description',
      startDate: new Date('2024-12-25'),
      endDate: new Date('2024-12-26'),
      startMinuteOfDay: 540,
      endMinuteOfDay: 1080,
      slotDurationMin: 15,
      timeZone: 'Asia/Taipei',
      lineGroupId: 'group-1',
      ownerId: 'user-123',
      votingDeadline: null,
      confirmedTimeSlots: [],
    };

    it('should map event to detail format', () => {
      mockConfirmedTimeService.mergeToTimeRanges.mockReturnValue([]);
      mockEventStatusService.computeEventStatus.mockReturnValue('VOTING');

      const result = service.mapEventToDetail(mockEvent);

      expect(result).toEqual({
        id: 'event-123',
        title: 'Test Event',
        description: 'Description',
        startDate: new Date('2024-12-25'),
        endDate: new Date('2024-12-26'),
        startMinuteOfDay: 540,
        endMinuteOfDay: 1080,
        slotDurationMin: 15,
        timeZone: 'Asia/Taipei',
        lineGroupId: 'group-1',
        ownerId: 'user-123',
        votingDeadline: null,
        confirmedSlotIds: [],
        confirmedTimeRanges: [],
        status: 'VOTING',
      });
    });

    it('should include confirmed slot IDs and time ranges', () => {
      const eventWithConfirmed = {
        ...mockEvent,
        confirmedTimeSlots: [
          {
            slotId: 'slot-1',
            slot: { id: 'slot-1', date: new Date(), startMinute: 540, endMinute: 600 },
          },
        ],
      };
      const mockTimeRange = {
        startTime: new Date(),
        endTime: new Date(),
        slotIds: ['slot-1'],
      };

      mockConfirmedTimeService.mergeToTimeRanges.mockReturnValue([mockTimeRange]);
      mockEventStatusService.computeEventStatus.mockReturnValue('CONFIRMED');

      const result = service.mapEventToDetail(eventWithConfirmed);

      expect(result.confirmedSlotIds).toEqual(['slot-1']);
      expect(result.confirmedTimeRanges).toEqual([mockTimeRange]);
    });
  });
});
