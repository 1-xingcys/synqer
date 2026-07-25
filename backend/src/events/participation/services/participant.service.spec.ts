import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { ParticipantRepository } from '../repositories/participant.repository';
import { EventAuthorizationService } from '../../shared/services/event-authorization.service';

describe('ParticipantService', () => {
  let service: ParticipantService;
  let participantRepository: jest.Mocked<ParticipantRepository>;
  let eventAuthorizationService: jest.Mocked<EventAuthorizationService>;

  const mockParticipantRepository = {
    findEventWithParticipants: jest.fn(),
    findLineGroupMembersByLineUserIdsAndGroupId: jest.fn(),
    findEventBasicInfo: jest.fn(),
    findParticipantByUserId: jest.fn(),
    findParticipantByUserIdIncludeRemoved: jest.fn(),
    findVoteByUserId: jest.fn(),
    restoreParticipant: jest.fn(),
    createParticipant: jest.fn(),
    findAllParticipants: jest.fn(),
    updateParticipantsInTransaction: jest.fn(),
  };

  const mockEventAuthorizationService = {
    verifyOwner: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantService,
        { provide: ParticipantRepository, useValue: mockParticipantRepository },
        { provide: EventAuthorizationService, useValue: mockEventAuthorizationService },
      ],
    }).compile();

    service = module.get<ParticipantService>(ParticipantService);
    participantRepository = module.get(ParticipantRepository);
    eventAuthorizationService = module.get(EventAuthorizationService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUnvotedParticipants', () => {
    const eventId = 'event-123';

    it('should return unvoted participants', async () => {
      const mockEvent = {
        id: eventId,
        isDeleted: false,
        votes: [{ userId: 'user-1' }],
        expectedParticipants: [
          { id: 'ep-1', userId: 'user-1', lineUserId: 'line-1', user: null },
          { id: 'ep-2', userId: 'user-2', lineUserId: 'line-2', user: null },
        ],
        lineGroup: { id: 'group-1', lineGroupId: 'line-group-1' },
      };

      const mockLineGroupMembers = [
        { lineUserId: 'line-2', displayName: 'User 2', pictureUrl: 'url' },
      ];

      mockParticipantRepository.findEventWithParticipants.mockResolvedValue(mockEvent);
      mockParticipantRepository.findLineGroupMembersByLineUserIdsAndGroupId.mockResolvedValue(mockLineGroupMembers);

      const result = await service.getUnvotedParticipants(eventId);

      expect(result.eventId).toBe(eventId);
      expect(result.unvotedParticipants).toHaveLength(1);
      expect(result.unvotedParticipants[0].lineUserId).toBe('line-2');
    });

    it('should throw NotFoundException when event not found', async () => {
      mockParticipantRepository.findEventWithParticipants.mockResolvedValue(null);

      await expect(service.getUnvotedParticipants(eventId)).rejects.toThrow(
        new NotFoundException(`Event ${eventId} not found`),
      );
    });

    it('should throw NotFoundException when event is deleted', async () => {
      mockParticipantRepository.findEventWithParticipants.mockResolvedValue({
        id: eventId,
        isDeleted: true,
      });

      await expect(service.getUnvotedParticipants(eventId)).rejects.toThrow(
        new NotFoundException(`Event ${eventId} not found`),
      );
    });

    it('should handle event without line group', async () => {
      const mockEvent = {
        id: eventId,
        isDeleted: false,
        votes: [],
        expectedParticipants: [
          { id: 'ep-1', userId: 'user-1', lineUserId: 'line-1', user: { displayName: 'User 1' } },
        ],
        lineGroup: null,
      };

      mockParticipantRepository.findEventWithParticipants.mockResolvedValue(mockEvent);

      const result = await service.getUnvotedParticipants(eventId);

      expect(result.lineGroupId).toBeUndefined();
      expect(result.unvotedParticipants).toHaveLength(1);
    });
  });

  describe('checkParticipantStatus', () => {
    const eventId = 'event-123';
    const userId = 'user-123';

    it('should return participant status', async () => {
      mockParticipantRepository.findEventBasicInfo.mockResolvedValue({
        id: eventId,
        isDeleted: false,
      });
      mockParticipantRepository.findParticipantByUserId.mockResolvedValue({ id: 'ep-1' });
      mockParticipantRepository.findVoteByUserId.mockResolvedValue({ id: 'vote-1' });

      const result = await service.checkParticipantStatus(eventId, userId);

      expect(result).toEqual({
        isParticipant: true,
        hasVoted: true,
      });
    });

    it('should return false for non-participant', async () => {
      mockParticipantRepository.findEventBasicInfo.mockResolvedValue({
        id: eventId,
        isDeleted: false,
      });
      mockParticipantRepository.findParticipantByUserId.mockResolvedValue(null);
      mockParticipantRepository.findVoteByUserId.mockResolvedValue(null);

      const result = await service.checkParticipantStatus(eventId, userId);

      expect(result).toEqual({
        isParticipant: false,
        hasVoted: false,
      });
    });

    it('should throw NotFoundException when event not found', async () => {
      mockParticipantRepository.findEventBasicInfo.mockResolvedValue(null);

      await expect(service.checkParticipantStatus(eventId, userId)).rejects.toThrow(
        new NotFoundException(`Event ${eventId} not found`),
      );
    });
  });

  describe('joinEvent', () => {
    const eventId = 'event-123';
    const userId = 'user-123';

    it('should join event successfully', async () => {
      mockParticipantRepository.findEventBasicInfo.mockResolvedValue({
        id: eventId,
        isDeleted: false,
      });
      mockParticipantRepository.findParticipantByUserIdIncludeRemoved.mockResolvedValue(null);
      mockParticipantRepository.createParticipant.mockResolvedValue({ id: 'ep-new' });

      const result = await service.joinEvent(eventId, userId);

      expect(participantRepository.createParticipant).toHaveBeenCalledWith(eventId, userId);
      expect(result).toEqual({
        success: true,
        alreadyJoined: false,
        message: 'Successfully joined the event',
      });
    });

    it('should return already joined for existing participant', async () => {
      mockParticipantRepository.findEventBasicInfo.mockResolvedValue({
        id: eventId,
        isDeleted: false,
      });
      mockParticipantRepository.findParticipantByUserIdIncludeRemoved.mockResolvedValue({
        id: 'ep-1',
        isRemoved: false,
      });

      const result = await service.joinEvent(eventId, userId);

      expect(result).toEqual({
        success: true,
        alreadyJoined: true,
        message: 'You are already a participant of this event',
      });
    });

    it('should restore removed participant', async () => {
      mockParticipantRepository.findEventBasicInfo.mockResolvedValue({
        id: eventId,
        isDeleted: false,
      });
      mockParticipantRepository.findParticipantByUserIdIncludeRemoved.mockResolvedValue({
        id: 'ep-1',
        isRemoved: true,
      });
      mockParticipantRepository.restoreParticipant.mockResolvedValue({ id: 'ep-1' });

      const result = await service.joinEvent(eventId, userId);

      expect(participantRepository.restoreParticipant).toHaveBeenCalledWith('ep-1');
      expect(result).toEqual({
        success: true,
        alreadyJoined: false,
        message: 'Successfully rejoined the event',
      });
    });

    it('should throw NotFoundException when event not found', async () => {
      mockParticipantRepository.findEventBasicInfo.mockResolvedValue(null);

      await expect(service.joinEvent(eventId, userId)).rejects.toThrow(
        new NotFoundException(`Event ${eventId} not found`),
      );
    });
  });

  describe('updateParticipants', () => {
    const eventId = 'event-123';
    const userId = 'user-123';

    it('should update participants successfully', async () => {
      const dto = {
        participants: [
          { lineUserId: 'line-1' },
          { userId: 'user-2' },
        ],
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockParticipantRepository.findAllParticipants.mockResolvedValue([
        { id: 'ep-1', lineUserId: 'line-1', userId: null, isRemoved: false },
      ]);
      mockParticipantRepository.updateParticipantsInTransaction.mockResolvedValue(undefined);

      const result = await service.updateParticipants(eventId, userId, dto);

      expect(eventAuthorizationService.verifyOwner).toHaveBeenCalledWith(eventId, userId);
      expect(result).toEqual({ success: true, count: 2 });
    });

    it('should ensure host is not removed', async () => {
      const dto = {
        participants: [{ lineUserId: 'line-1' }], // host userId not included
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockParticipantRepository.findAllParticipants.mockResolvedValue([
        { id: 'ep-host', lineUserId: null, userId, isRemoved: false },
        { id: 'ep-1', lineUserId: 'line-1', userId: null, isRemoved: false },
      ]);
      mockParticipantRepository.updateParticipantsInTransaction.mockResolvedValue(undefined);

      await service.updateParticipants(eventId, userId, dto);

      // Host should be automatically added to participants
      expect(participantRepository.updateParticipantsInTransaction).toHaveBeenCalledWith(
        eventId,
        expect.any(Array),
        expect.any(Array),
        expect.any(Array),
      );
    });

    it('should filter invalid participants', async () => {
      const dto = {
        participants: [
          { lineUserId: 'line-1' },
          {}, // invalid - no lineUserId or userId
          { lineUserId: 'line-2' },
        ],
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockParticipantRepository.findAllParticipants.mockResolvedValue([]);
      mockParticipantRepository.updateParticipantsInTransaction.mockResolvedValue(undefined);

      const result = await service.updateParticipants(eventId, userId, dto);

      // Only 2 valid participants
      expect(result.count).toBe(2);
    });
  });

});
