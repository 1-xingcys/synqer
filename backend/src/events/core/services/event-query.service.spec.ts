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

  describe('findUserEvents', () => {
    it('should return user events with vote stats', async () => {
      const userId = 'user-123';
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Event 1',
          expectedParticipants: [
            { id: 'ep-1', userId: 'user-1' },
            { id: 'ep-2', userId: 'user-2' },
          ],
          votes: [{ userId: 'user-1' }],
        },
      ];

      mockEventRepository.findByOwnerId.mockResolvedValue(mockEvents);
      mockEventMapper.mapEventToList.mockReturnValue({
        id: 'event-1',
        title: 'Event 1',
      });

      const result = await service.findUserEvents(userId);

      expect(eventRepository.findByOwnerId).toHaveBeenCalledWith(userId);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'event-1',
        title: 'Event 1',
        expectedParticipantCount: 2,
        votedCount: 1,
      });
    });

    it('should handle empty events list', async () => {
      mockEventRepository.findByOwnerId.mockResolvedValue([]);

      const result = await service.findUserEvents('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('findAttendedEvents', () => {
    it('should return attended events with hasVoted flag', async () => {
      const userId = 'user-123';
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Event 1',
          expectedParticipants: [{ id: 'ep-1', userId }],
          votes: [{ userId }],
          owner: { id: 'owner-1', displayName: 'Owner', avatarUrl: null },
        },
      ];

      mockEventRepository.findByParticipantUserId.mockResolvedValue(mockEvents);
      mockEventMapper.mapEventToList.mockReturnValue({
        id: 'event-1',
        title: 'Event 1',
      });

      const result = await service.findAttendedEvents(userId);

      expect(eventRepository.findByParticipantUserId).toHaveBeenCalledWith(userId);
      expect(result).toHaveLength(1);
      expect(result[0].hasVoted).toBe(true);
      expect(result[0].host).toEqual({
        id: 'owner-1',
        displayName: 'Owner',
        avatarUrl: null,
      });
    });

    it('should set hasVoted to false when user has not voted', async () => {
      const userId = 'user-123';
      const mockEvents = [
        {
          id: 'event-1',
          expectedParticipants: [{ id: 'ep-1', userId }],
          votes: [], // no votes
          owner: null,
        },
      ];

      mockEventRepository.findByParticipantUserId.mockResolvedValue(mockEvents);
      mockEventMapper.mapEventToList.mockReturnValue({ id: 'event-1' });

      const result = await service.findAttendedEvents(userId);

      expect(result[0].hasVoted).toBe(false);
      expect(result[0].host).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return event details', async () => {
      const eventId = 'event-123';
      const mockEvent = {
        id: eventId,
        isDeleted: false,
        expectedParticipants: [{ id: 'ep-1', userId: 'user-1' }],
        votes: [{ userId: 'user-1', slotId: 'slot-1', user: { displayName: 'User 1' } }],
        slots: [{ id: 'slot-1' }],
        lineGroup: null,
      };

      mockEventRepository.findOneWithDetails.mockResolvedValue(mockEvent);
      mockEventMapper.mapEventToDetail.mockReturnValue({ id: eventId });
      mockEventMapper.mapVotes.mockReturnValue([{ slotId: 'slot-1', userId: 'user-1' }]);
      mockEventMapper.extractParticipants.mockReturnValue([{ userId: 'user-1' }]);

      const result = await service.findOne(eventId);

      expect(result).toEqual({
        isDeleted: false,
        event: { id: eventId },
        lineGroup: null,
        slots: [{ id: 'slot-1' }],
        votes: [{ slotId: 'slot-1', userId: 'user-1' }],
        participants: [{ userId: 'user-1' }],
        expectedParticipants: expect.any(Array),
      });
    });

    it('should return null when event not found', async () => {
      mockEventRepository.findOneWithDetails.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
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

      const result = await service.findOne('event-123');

      expect(result).toEqual({
        isDeleted: true,
        event: { id: 'event-123' },
        lineGroup: null,
        slots: [],
        votes: [],
        participants: [],
        expectedParticipants: [],
      });
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
        expectedParticipants: [{ id: 'ep-1', userId: 'user-1' }],
        votes: [{ userId: 'user-1', user: { displayName: 'User 1' } }],
        slots: [],
      };

      mockEventRepository.findOneWithDetails.mockResolvedValue(mockEvent);
      mockEventMapper.mapEventToDetail.mockReturnValue({ id: eventId });
      mockEventMapper.mapVotes.mockReturnValue([]);
      mockEventMapper.extractParticipantsForHost.mockReturnValue([]);
      mockEventMapper.calculateVotingStats.mockReturnValue({
        totalExpected: 1,
        totalVoted: 1,
        votingPercentage: 100,
      });

      const result = await service.findOneHosted(eventId, userId);

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

  describe('getEventInfo', () => {
    const mockEvent = {
      id: 'event-123',
      ownerId: 'owner-123',
      isDeleted: false,
      createdAt: new Date('2024-01-01'),
      votingDeadline: null,
      expectedParticipants: [
        { id: 'ep-1', userId: 'participant-1', lineUserId: null, user: { id: 'participant-1', displayName: 'Participant 1', avatarUrl: 'https://example.com/avatar1.jpg' } },
        { id: 'ep-2', userId: 'participant-2', lineUserId: null, user: { id: 'participant-2', displayName: 'Participant 2', avatarUrl: null } },
      ],
      votes: [{ userId: 'participant-1', slotId: 'slot-1' }],
      owner: { id: 'owner-123', displayName: 'Owner', avatarUrl: 'https://example.com/owner.jpg' },
      slots: [],
    };

    it('should return event info for owner', async () => {
      mockEventRepository.findOneWithDetails.mockResolvedValue(mockEvent);
      mockEventMapper.mapEventToDetail.mockReturnValue({ id: 'event-123', title: 'Test Event' });
      mockEventStatusService.computeParticipantStatus.mockReturnValue('VOTED');

      const result = await service.getEventInfo('event-123', 'owner-123');

      expect(result).not.toBeNull();
      expect(result?.isDeleted).toBe(false);
      expect(result?.host).toEqual({
        id: 'owner-123',
        displayName: 'Owner',
        avatarUrl: 'https://example.com/owner.jpg',
      });
      expect(result?.expectedParticipants).toHaveLength(2);
    });

    it('should return event info for participant', async () => {
      mockEventRepository.findOneWithDetails.mockResolvedValue(mockEvent);
      mockEventMapper.mapEventToDetail.mockReturnValue({ id: 'event-123', title: 'Test Event' });
      mockEventStatusService.computeParticipantStatus.mockReturnValue('VOTED');

      const result = await service.getEventInfo('event-123', 'participant-1');

      expect(result).not.toBeNull();
      expect(result?.isDeleted).toBe(false);
      expect(result?.currentUserHasVoted).toBe(true);
    });

    it('should return null for unauthorized user (not owner or participant)', async () => {
      mockEventRepository.findOneWithDetails.mockResolvedValue(mockEvent);

      const result = await service.getEventInfo('event-123', 'unauthorized-user');

      expect(result).toBeNull();
    });

    it('should return null when event not found', async () => {
      mockEventRepository.findOneWithDetails.mockResolvedValue(null);

      const result = await service.getEventInfo('nonexistent', 'user-123');

      expect(result).toBeNull();
    });

    it('should return deleted event info for authorized user', async () => {
      const deletedEvent = {
        ...mockEvent,
        isDeleted: true,
      };

      mockEventRepository.findOneWithDetails.mockResolvedValue(deletedEvent);
      mockEventMapper.mapEventToDetail.mockReturnValue({ id: 'event-123', title: 'Test Event' });

      const result = await service.getEventInfo('event-123', 'owner-123');

      expect(result?.isDeleted).toBe(true);
      expect(result?.host).toBeNull();
      expect(result?.expectedParticipants).toEqual([]);
      expect(result?.currentUserHasVoted).toBe(false);
    });

    it('should correctly identify currentUserHasVoted as false when user has not voted', async () => {
      mockEventRepository.findOneWithDetails.mockResolvedValue(mockEvent);
      mockEventMapper.mapEventToDetail.mockReturnValue({ id: 'event-123', title: 'Test Event' });
      mockEventStatusService.computeParticipantStatus.mockReturnValue('NOT_VOTED');

      const result = await service.getEventInfo('event-123', 'participant-2');

      expect(result).not.toBeNull();
      expect(result?.currentUserHasVoted).toBe(false);
    });

    it('should return participant details with hasVoted status', async () => {
      mockEventRepository.findOneWithDetails.mockResolvedValue(mockEvent);
      mockEventMapper.mapEventToDetail.mockReturnValue({ id: 'event-123', title: 'Test Event' });
      mockEventStatusService.computeParticipantStatus.mockReturnValue('VOTED');

      const result = await service.getEventInfo('event-123', 'owner-123');

      expect(result?.expectedParticipants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'ep-1',
            userId: 'participant-1',
            hasVoted: true,
          }),
          expect.objectContaining({
            id: 'ep-2',
            userId: 'participant-2',
            hasVoted: false,
          }),
        ]),
      );
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
      mockEventMapper.mapEventToList.mockReturnValue({ id: eventId });
      mockEventStatusService.computeEventStatus.mockReturnValue('VOTING');

      const result = await service.getEventPublicInfo(eventId);

      expect(result).toEqual({
        isDeleted: false,
        id: eventId,
        host: null,
        participantCount: 1,
        status: 'VOTING',
      });
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
      expect(result?.participantCount).toBe(0);
    });
  });
});
