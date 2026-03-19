import { Test, TestingModule } from '@nestjs/testing';
import { EventType, Weekday } from '@prisma/client';
import { EventMapperService } from './event-mapper.service';
import { EventStatusService } from './event-status.service';
import { ConfirmedTimeService } from './confirmed-time.service';
import { EventCapabilitiesService } from './event-capabilities.service';
import { EventScheduleService } from './event-schedule.service';

describe('EventMapperService', () => {
  let service: EventMapperService;
  let eventStatusService: jest.Mocked<EventStatusService>;
  let confirmedTimeService: jest.Mocked<ConfirmedTimeService>;
  let eventCapabilitiesService: jest.Mocked<EventCapabilitiesService>;

  const mockEventStatusService = {
    computeEventStatus: jest.fn(),
  };

  const mockConfirmedTimeService = {
    mergeToTimeRanges: jest.fn(),
    mergeToSelections: jest.fn(),
  };

  const mockEventCapabilitiesService = {
    buildCapabilities: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventMapperService,
        { provide: EventStatusService, useValue: mockEventStatusService },
        { provide: ConfirmedTimeService, useValue: mockConfirmedTimeService },
        {
          provide: EventCapabilitiesService,
          useValue: mockEventCapabilitiesService,
        },
        EventScheduleService,
      ],
    }).compile();

    service = module.get<EventMapperService>(EventMapperService);
    eventStatusService = module.get(EventStatusService);
    confirmedTimeService = module.get(ConfirmedTimeService);
    eventCapabilitiesService = module.get(EventCapabilitiesService);

    jest.clearAllMocks();
    mockConfirmedTimeService.mergeToTimeRanges.mockReturnValue([]);
    mockConfirmedTimeService.mergeToSelections.mockReturnValue([]);
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
      type: EventType.ONE_TIME,
      title: 'Test Event',
      description: 'Description',
      createdAt: new Date('2024-12-01'),
      oneTimeSchedule: {
        startDate: new Date('2024-12-25'),
        endDate: new Date('2024-12-26'),
        startMinuteOfDay: 540,
        endMinuteOfDay: 1080,
        slotDurationMin: 15,
      },
      recurringSchedule: null,
      votingDeadline: null,
      expectedParticipants: [{ id: 'ep-1' }],
      confirmedTimeSlots: [],
    };

    it('should map event to list format with status', () => {
      mockConfirmedTimeService.mergeToTimeRanges.mockReturnValue([]);
      mockEventStatusService.computeEventStatus.mockReturnValue('VOTING');
      mockEventCapabilitiesService.buildCapabilities.mockReturnValue({
        supportsCompletion: true,
        supportsCalendarConflict: true,
        supportsAddToCalendar: true,
      });

      const result = service.mapEventToList(mockEvent);

      expect(result).toEqual({
        id: 'event-123',
        type: EventType.ONE_TIME,
        title: 'Test Event',
        description: 'Description',
        schedule: {
          kind: EventType.ONE_TIME,
          startDate: new Date('2024-12-25'),
          endDate: new Date('2024-12-26'),
          weekdays: undefined,
          startMinuteOfDay: 540,
          endMinuteOfDay: 1080,
          slotDurationMin: 15,
        },
        createdAt: new Date('2024-12-01'),
        votingDeadline: null,
        confirmedSlotIds: [],
        confirmedSelections: [],
        status: 'VOTING',
        capabilities: {
          supportsCompletion: true,
          supportsCalendarConflict: true,
          supportsAddToCalendar: true,
        },
      });
      expect(eventStatusService.computeEventStatus).toHaveBeenCalledWith({
        eventType: EventType.ONE_TIME,
        votingDeadline: null,
        confirmedTimeSlots: undefined,
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

      mockConfirmedTimeService.mergeToSelections.mockReturnValue([
        {
          kind: 'ONE_TIME_RANGE',
          startTime: new Date(),
          endTime: new Date(),
          slotIds: ['slot-1'],
        },
      ]);
      mockEventStatusService.computeEventStatus.mockReturnValue('CONFIRMED');
      mockEventCapabilitiesService.buildCapabilities.mockReturnValue({
        supportsCompletion: true,
        supportsCalendarConflict: true,
        supportsAddToCalendar: true,
      });

      const result = service.mapEventToList(eventWithConfirmed);

      expect(result.confirmedSlotIds).toEqual(['slot-1']);
      expect(result.status).toBe('CONFIRMED');
    });

    it('should expose recurring schedule metadata', () => {
      const recurringEvent = {
        id: 'event-recurring-123',
        type: EventType.RECURRING,
        title: 'Recurring Event',
        description: 'Recurring Description',
        createdAt: new Date('2024-12-01'),
        votingDeadline: null,
        startMinuteOfDay: 540,
        endMinuteOfDay: 1080,
        slotDurationMin: 15,
        recurringSchedule: {
          weekdays: [Weekday.MONDAY, Weekday.WEDNESDAY],
          startMinuteOfDay: 540,
          endMinuteOfDay: 1080,
          slotDurationMin: 15,
        },
        oneTimeSchedule: null,
        confirmedTimeSlots: [],
      };

      mockConfirmedTimeService.mergeToSelections.mockReturnValue([]);
      mockEventStatusService.computeEventStatus.mockReturnValue('VOTING');
      mockEventCapabilitiesService.buildCapabilities.mockReturnValue({
        supportsCompletion: false,
        supportsCalendarConflict: false,
        supportsAddToCalendar: false,
      });

      const result = service.mapEventToList(recurringEvent);

      expect(result.schedule.kind).toEqual(EventType.RECURRING);
      expect(result.schedule.weekdays).toEqual([
        Weekday.MONDAY,
        Weekday.WEDNESDAY,
      ]);
      expect(result.confirmedSelections).toEqual([]);
    });
  });

  describe('mapEventToDetail', () => {
    const mockEvent = {
      id: 'event-123',
      type: EventType.ONE_TIME,
      title: 'Test Event',
      description: 'Description',
      createdAt: new Date('2024-12-01'),
      oneTimeSchedule: {
        startDate: new Date('2024-12-25'),
        endDate: new Date('2024-12-26'),
        startMinuteOfDay: 540,
        endMinuteOfDay: 1080,
        slotDurationMin: 15,
      },
      recurringSchedule: null,
      timeZone: 'Asia/Taipei',
      lineGroupId: 'group-1',
      ownerId: 'user-123',
      votingDeadline: null,
      confirmedTimeSlots: [],
    };

    it('should map event to detail format', () => {
      mockEventStatusService.computeEventStatus.mockReturnValue('VOTING');
      mockEventCapabilitiesService.buildCapabilities.mockReturnValue({
        supportsCompletion: true,
        supportsCalendarConflict: true,
        supportsAddToCalendar: true,
      });

      const result = service.mapEventToDetail(mockEvent);

      expect(result).toEqual({
        id: 'event-123',
        type: EventType.ONE_TIME,
        title: 'Test Event',
        description: 'Description',
        schedule: {
          kind: EventType.ONE_TIME,
          startDate: new Date('2024-12-25'),
          endDate: new Date('2024-12-26'),
          startMinuteOfDay: 540,
          endMinuteOfDay: 1080,
          slotDurationMin: 15,
          weekdays: undefined,
        },
        timeZone: 'Asia/Taipei',
        lineGroupId: 'group-1',
        ownerId: 'user-123',
        votingDeadline: null,
        confirmedSlotIds: [],
        confirmedSelections: [],
        status: 'VOTING',
        capabilities: {
          supportsCompletion: true,
          supportsCalendarConflict: true,
          supportsAddToCalendar: true,
        },
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

      mockConfirmedTimeService.mergeToSelections.mockReturnValue([
        {
          kind: 'ONE_TIME_RANGE',
          startTime: mockTimeRange.startTime,
          endTime: mockTimeRange.endTime,
          slotIds: ['slot-1'],
        },
      ]);
      mockEventStatusService.computeEventStatus.mockReturnValue('CONFIRMED');

      const result = service.mapEventToDetail(eventWithConfirmed);

      expect(result.confirmedSlotIds).toEqual(['slot-1']);
      expect(result.confirmedSelections).toEqual([
        {
          kind: 'ONE_TIME_RANGE',
          startTime: mockTimeRange.startTime,
          endTime: mockTimeRange.endTime,
          slotIds: ['slot-1'],
        },
      ]);
    });

    it('should map recurring event detail with weekdays and recurring capabilities', () => {
      const recurringEvent = {
        id: 'event-recurring-123',
        type: EventType.RECURRING,
        title: 'Recurring Event',
        description: 'Recurring Description',
        createdAt: new Date('2024-12-01'),
        startMinuteOfDay: 540,
        endMinuteOfDay: 1080,
        slotDurationMin: 15,
        timeZone: 'Asia/Taipei',
        lineGroupId: null,
        ownerId: 'user-123',
        votingDeadline: null,
        recurringSchedule: {
          weekdays: [Weekday.TUESDAY, Weekday.THURSDAY],
          startMinuteOfDay: 600,
          endMinuteOfDay: 720,
          slotDurationMin: 30,
        },
        oneTimeSchedule: null,
        confirmedTimeSlots: [],
      };

      mockConfirmedTimeService.mergeToSelections.mockReturnValue([
        {
          kind: 'WEEKDAY_RANGE',
          weekday: Weekday.TUESDAY,
          startMinute: 600,
          endMinute: 720,
          slotIds: ['slot-1', 'slot-2'],
        },
      ]);
      mockEventStatusService.computeEventStatus.mockReturnValue('VOTING');
      mockEventCapabilitiesService.buildCapabilities.mockReturnValue({
        supportsCompletion: false,
        supportsCalendarConflict: false,
        supportsAddToCalendar: false,
      });

      const result = service.mapEventToDetail(recurringEvent);

      expect(result).toEqual({
        id: 'event-recurring-123',
        type: EventType.RECURRING,
        title: 'Recurring Event',
        description: 'Recurring Description',
        schedule: {
          kind: EventType.RECURRING,
          weekdays: [Weekday.TUESDAY, Weekday.THURSDAY],
          startMinuteOfDay: 600,
          endMinuteOfDay: 720,
          slotDurationMin: 30,
          startDate: undefined,
          endDate: undefined,
        },
        timeZone: 'Asia/Taipei',
        lineGroupId: null,
        ownerId: 'user-123',
        votingDeadline: null,
        confirmedSlotIds: [],
        confirmedSelections: [
          {
            kind: 'WEEKDAY_RANGE',
            weekday: Weekday.TUESDAY,
            startMinute: 600,
            endMinute: 720,
            slotIds: ['slot-1', 'slot-2'],
          },
        ],
        status: 'VOTING',
        capabilities: {
          supportsCompletion: false,
          supportsCalendarConflict: false,
          supportsAddToCalendar: false,
        },
      });
    });
  });
});
