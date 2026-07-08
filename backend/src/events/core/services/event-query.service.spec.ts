import { Test, TestingModule } from '@nestjs/testing';
import { EventQueryService } from './event-query.service';
import { EventRepository } from '../repositories/event.repository';
import { EventMapperService } from '../../shared/services/event-mapper.service';
import { EventStatusService } from '../../shared/services/event-status.service';

describe('EventQueryService', () => {
  let service: EventQueryService;
  let eventRepository: jest.Mocked<EventRepository>;
  let eventMapper: jest.Mocked<EventMapperService>;
  let eventStatusService: jest.Mocked<EventStatusService>;

  const mockEventRepository = {
    findByOwnerId: jest.fn(),
    findByParticipantUserId: jest.fn(),
    findOneWithDetails: jest.fn(),
    findStagedVoteByEventAndUser: jest.fn(),
    findStagedConfirmationByEventId: jest.fn(),
    findPublicInfo: jest.fn(),
  };

  const mockEventMapper = {
    mapEventToList: jest.fn(),
    mapEventToDetail: jest.fn(),
    mapVotes: jest.fn(),
    extractParticipants: jest.fn(),
    extractParticipantsForHost: jest.fn(),
    calculateVotingStats: jest.fn(),
  };

  const mockEventStatusService = {
    computeEventStatus: jest.fn(),
    computeParticipantStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventQueryService,
        { provide: EventRepository, useValue: mockEventRepository },
        { provide: EventMapperService, useValue: mockEventMapper },
        { provide: EventStatusService, useValue: mockEventStatusService },
      ],
    }).compile();

    service = module.get<EventQueryService>(EventQueryService);
    eventRepository = module.get(EventRepository);
    eventMapper = module.get(EventMapperService);
    eventStatusService = module.get(EventStatusService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return event details', async () => {
      const eventId = 'event-123';
      const userId = 'user-1';
      const mockEvent = {
        id: eventId,
        isDeleted: false,
        expectedParticipants: [{ id: 'ep-1', userId, hasVoted: true }],
        votes: [{ userId, slotId: 'slot-1', user: { displayName: 'User 1' } }],
        slots: [
          {
            id: 'slot-1',
            eventId: eventId,
            axisType: 'DATE',
            axisDate: new Date('2024-12-25T00:00:00.000Z'),
            axisWeekday: null,
            startMinute: 540,
            endMinute: 570,
            index: 0,
          },
        ],
        lineGroup: null,
      };

      mockEventRepository.findOneWithDetails.mockResolvedValue(mockEvent);
      mockEventRepository.findStagedVoteByEventAndUser.mockResolvedValue(null);
      mockEventMapper.mapEventToDetail.mockReturnValue({ id: eventId });
      mockEventMapper.mapVotes.mockReturnValue([{ slotId: 'slot-1', userId }]);
      mockEventMapper.extractParticipants.mockReturnValue([{ userId }]);

      const result = await service.findOne(eventId, userId);

      expect(result).toEqual({
        isDeleted: false,
        event: { id: eventId },
        lineGroup: null,
        slots: [
          {
            id: 'slot-1',
            eventId: eventId,
            axisType: 'DATE',
            axisDate: new Date('2024-12-25T00:00:00.000Z'),
            axisWeekday: null,
            startMinute: 540,
            endMinute: 570,
            index: 0,
          },
        ],
        votes: [{ slotId: 'slot-1', userId: 'user-1' }],
        stagedVote: null,
        participants: [{ userId: 'user-1' }],
        expectedParticipants: expect.any(Array),
      });
    });

    it('should return null when event not found', async () => {
      const userId = 'user-1';
      mockEventRepository.findOneWithDetails.mockResolvedValue(null);

      const result = await service.findOne('nonexistent', userId);

      expect(result).toBeNull();
    });

    it('should include staged vote for current user when userId is provided', async () => {
      const eventId = 'event-123';
      const userId = 'user-1';
      const mockEvent = {
        id: eventId,
        isDeleted: false,
        expectedParticipants: [{ id: 'ep-1', userId, hasVoted: true }],
        votes: [{ userId, slotId: 'slot-1', user: { displayName: 'User 1' } }],
        slots: [
          {
            id: 'slot-1',
            eventId: eventId,
            axisType: 'DATE',
            axisDate: new Date('2024-12-25T00:00:00.000Z'),
            axisWeekday: null,
            startMinute: 540,
            endMinute: 570,
            index: 0,
          },
        ],
        lineGroup: null,
      };

      mockEventRepository.findOneWithDetails.mockResolvedValue(mockEvent);
      mockEventRepository.findStagedVoteByEventAndUser.mockResolvedValue({
        slotIds: ['slot-1'],
        baselineSlotIds: ['slot-1'],
        updatedAt: new Date('2026-02-18T00:00:00.000Z'),
      });
      mockEventMapper.mapEventToDetail.mockReturnValue({ id: eventId });
      mockEventMapper.mapVotes.mockReturnValue([{ slotId: 'slot-1', userId }]);
      mockEventMapper.extractParticipants.mockReturnValue([{ userId }]);

      const result = await service.findOne(eventId, userId);

      expect(eventRepository.findStagedVoteByEventAndUser).toHaveBeenCalledWith(
        eventId,
        userId,
      );
      expect(result?.stagedVote).toEqual({
        slotIds: ['slot-1'],
        baselineSlotIds: ['slot-1'],
        updatedAt: new Date('2026-02-18T00:00:00.000Z'),
      });
    });

    it('should return deleted event with empty arrays', async () => {
      const mockEvent = {
        id: 'event-123',
        isDeleted: true,
        expectedParticipants: [],
        votes: [],
        lineGroup: null,
      };

      mockEventRepository.findOneWithDetails.mockResolvedValue(mockEvent);
      mockEventMapper.mapEventToDetail.mockReturnValue({ id: 'event-123' });
      mockEventRepository.findStagedVoteByEventAndUser.mockResolvedValue(null);

      const result = await service.findOne('event-123', 'user-1');

      expect(result).toEqual({
        isDeleted: true,
        event: { id: 'event-123' },
        lineGroup: null,
        slots: [],
        votes: [],
        stagedVote: null,
        participants: [],
        expectedParticipants: [],
      });
    });

    it('should preserve recurring slot axis metadata in detail response', async () => {
      const eventId = 'event-recurring';
      const userId = 'user-1';
      const mockEvent = {
        id: eventId,
        isDeleted: false,
        expectedParticipants: [{ id: 'ep-1', userId, hasVoted: false }],
        votes: [],
        slots: [
          {
            id: 'slot-1',
            eventId: eventId,
            axisType: 'WEEKDAY',
            axisDate: null,
            axisWeekday: 'MONDAY',
            startMinute: 540,
            endMinute: 570,
            index: 0,
          },
        ],
        lineGroup: null,
      };

      mockEventRepository.findOneWithDetails.mockResolvedValue(mockEvent);
      mockEventRepository.findStagedVoteByEventAndUser.mockResolvedValue(null);
      mockEventMapper.mapEventToDetail.mockReturnValue({ id: eventId });
      mockEventMapper.mapVotes.mockReturnValue([]);
      mockEventMapper.extractParticipants.mockReturnValue([]);

      const result = await service.findOne(eventId, userId);

      expect(result?.slots).toEqual([
        {
          id: 'slot-1',
          eventId: eventId,
          axisType: 'WEEKDAY',
          axisDate: null,
          axisWeekday: 'MONDAY',
          startMinute: 540,
          endMinute: 570,
          index: 0,
        },
      ]);
    });
  });

  describe('findOneHosted', () => {
    it('should return event details for host', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';
      const mockEvent = {
        id: eventId,
        ownerId: userId,
        isDeleted: false,
        expectedParticipants: [{ id: 'ep-1', userId: 'user-1', hasVoted: true }],
        votes: [{ userId: 'user-1', user: { displayName: 'User 1' } }],
        slots: [],
      };

      mockEventRepository.findOneWithDetails.mockResolvedValue(mockEvent);
      mockEventRepository.findStagedConfirmationByEventId.mockResolvedValue(
        null,
      );
      mockEventMapper.mapEventToDetail.mockReturnValue({ id: eventId });
      mockEventMapper.mapVotes.mockReturnValue([]);
      mockEventMapper.extractParticipantsForHost.mockReturnValue([]);
      mockEventMapper.calculateVotingStats.mockReturnValue({
        totalExpected: 1,
        totalVoted: 1,
        votingPercentage: 100,
      });

      const result = await service.findOneHosted(eventId, userId);

      expect(result?.stagedConfirmation).toBeNull();
      expect(result?.votingStats).toEqual({
        totalExpected: 1,
        totalVoted: 1,
        votingPercentage: 100,
      });
    });

    it('should return null when user is not the owner', async () => {
      const mockEvent = {
        id: 'event-123',
        ownerId: 'different-user',
        isDeleted: false,
      };

      mockEventRepository.findOneWithDetails.mockResolvedValue(mockEvent);

      const result = await service.findOneHosted('event-123', 'user-123');

      expect(result).toBeNull();
    });

    it('should return null when event not found', async () => {
      mockEventRepository.findOneWithDetails.mockResolvedValue(null);

      const result = await service.findOneHosted('nonexistent', 'user-123');

      expect(result).toBeNull();
    });

    it('should handle deleted event', async () => {
      const mockEvent = {
        id: 'event-123',
        ownerId: 'user-123',
        isDeleted: true,
        expectedParticipants: [],
        votes: [],
      };

      mockEventRepository.findOneWithDetails.mockResolvedValue(mockEvent);
      mockEventMapper.mapEventToDetail.mockReturnValue({ id: 'event-123' });

      const result = await service.findOneHosted('event-123', 'user-123');

      expect(result?.isDeleted).toBe(true);
      expect(result?.votingStats).toEqual({
        totalExpected: 0,
        totalVoted: 0,
        votingPercentage: 0,
      });
    });
  });

  describe('getEventPublicInfo', () => {
    it('should return public event info', async () => {
      const eventId = 'event-123';
      const mockEvent = {
        id: eventId,
        isDeleted: false,
        votingDeadline: null,
        expectedParticipants: [{ id: 'ep-1' }],
        confirmedTimeSlots: [],
      };

      mockEventRepository.findPublicInfo.mockResolvedValue(mockEvent);
      mockEventMapper.mapEventToList.mockReturnValue({
        id: eventId,
        status: 'VOTING',
      });
      const result = await service.getEventPublicInfo(eventId);

      expect(result).toEqual({
        isDeleted: false,
        id: eventId,
        host: null,
        expectedParticipantCount: 1,
        status: 'VOTING',
      });
      expect(mockEventStatusService.computeEventStatus).not.toHaveBeenCalled();
    });

    it('should return null when event not found', async () => {
      mockEventRepository.findPublicInfo.mockResolvedValue(null);

      const result = await service.getEventPublicInfo('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle deleted event', async () => {
      const mockEvent = {
        id: 'event-123',
        isDeleted: true,
        votingDeadline: null,
      };

      mockEventRepository.findPublicInfo.mockResolvedValue(mockEvent);
      mockEventMapper.mapEventToList.mockReturnValue({ id: 'event-123' });
      mockEventStatusService.computeEventStatus.mockReturnValue('VOTING');

      const result = await service.getEventPublicInfo('event-123');

      expect(result?.isDeleted).toBe(true);
      expect(result?.expectedParticipantCount).toBe(0);
    });

    it('should return recurring public info without root minute fields', async () => {
      const mockEvent = {
        id: 'event-recurring',
        type: 'RECURRING',
        isDeleted: false,
        votingDeadline: null,
        expectedParticipants: [{ id: 'ep-1' }, { id: 'ep-2' }],
        confirmedTimeSlots: [],
        owner: null,
      };

      mockEventRepository.findPublicInfo.mockResolvedValue(mockEvent);
      mockEventMapper.mapEventToList.mockReturnValue({
        id: 'event-recurring',
        status: 'VOTING',
      });
      const result = await service.getEventPublicInfo('event-recurring');

      expect(result).toEqual({
        isDeleted: false,
        id: 'event-recurring',
        status: 'VOTING',
        expectedParticipantCount: 2,
        host: null,
      });
    });
  });

  describe('findMyInvolvedEvents', () => {
    it('unions hosted and participated events, dedupes, and marks isHost', async () => {
      const ownerId = 'user-1';
      const hostedEvent = {
        id: 'evt-hosted',
        ownerId,
        expectedParticipants: [{ id: 'ep-1', userId: ownerId, hasVoted: true }],
      };
      const participatedEvent = {
        id: 'evt-joined',
        ownerId: 'user-2',
        owner: { id: 'user-2', displayName: 'Owner Two', avatarUrl: null },
        expectedParticipants: [{ id: 'ep-2', userId: ownerId, hasVoted: false }],
      };

      (eventRepository.findByOwnerId as jest.Mock).mockResolvedValue([
        hostedEvent,
      ]);
      (eventRepository.findByParticipantUserId as jest.Mock).mockResolvedValue([
        participatedEvent,
      ]);
      (eventMapper.mapEventToList as jest.Mock).mockImplementation((e) => ({
        id: e.id,
      }));

      const result = await service.findMyInvolvedEvents(ownerId);

      const byId = Object.fromEntries(result.map((r) => [r.id, r]));
      expect(result).toHaveLength(2);
      expect(byId['evt-hosted'].isHost).toBe(true);
      expect(byId['evt-hosted'].hasVoted).toBe(true);
      expect(byId['evt-joined'].isHost).toBe(false);
      expect(byId['evt-joined'].hasVoted).toBe(false);
      expect(byId['evt-joined'].host).toEqual({
        id: 'user-2',
        displayName: 'Owner Two',
        avatarUrl: null,
      });
    });

    it('dedupes when host is also a participant (single entry, isHost true)', async () => {
      const ownerId = 'user-1';
      const evt = {
        id: 'evt-both',
        ownerId,
        owner: { id: ownerId, displayName: 'Me', avatarUrl: null },
        expectedParticipants: [{ id: 'ep-1', userId: ownerId, hasVoted: true }],
      };
      (eventRepository.findByOwnerId as jest.Mock).mockResolvedValue([evt]);
      (eventRepository.findByParticipantUserId as jest.Mock).mockResolvedValue([
        evt,
      ]);
      (eventMapper.mapEventToList as jest.Mock).mockImplementation((e) => ({
        id: e.id,
      }));

      const result = await service.findMyInvolvedEvents(ownerId);

      expect(result).toHaveLength(1);
      expect(result[0].isHost).toBe(true);
    });
  });
});
