import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantRepository } from './participant.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('ParticipantRepository', () => {
  let repository: ParticipantRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    event: {
      findUnique: jest.fn(),
    },
    lineGroupMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    eventExpectedParticipant: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      createMany: jest.fn(),
    },
    eventVote: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<ParticipantRepository>(ParticipantRepository);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findEventWithParticipants', () => {
    it('should find event with participants', async () => {
      const eventId = 'event-123';
      const mockEvent = {
        id: eventId,
        votes: [],
        expectedParticipants: [],
        lineGroup: null,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await repository.findEventWithParticipants(eventId);

      expect(prismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
        include: expect.objectContaining({
          votes: expect.any(Object),
          expectedParticipants: expect.any(Object),
          lineGroup: true,
        }),
      });
      expect(result).toEqual(mockEvent);
    });
  });

  describe('findLineGroupMembersByLineUserIdsAndGroupId', () => {
    it('should find multiple LINE group members', async () => {
      const lineGroupId = 'group-1';
      const lineUserIds = ['line-1', 'line-2'];
      const mockMembers = [
        { lineUserId: 'line-1', displayName: 'User 1' },
        { lineUserId: 'line-2', displayName: 'User 2' },
      ];

      mockPrismaService.lineGroupMember.findMany.mockResolvedValue(mockMembers);

      const result = await repository.findLineGroupMembersByLineUserIdsAndGroupId(
        lineGroupId,
        lineUserIds,
      );

      expect(prismaService.lineGroupMember.findMany).toHaveBeenCalledWith({
        where: {
          lineGroupId,
          lineUserId: { in: lineUserIds },
        },
      });
      expect(result).toEqual(mockMembers);
    });

    it('should return empty array for empty lineUserIds', async () => {
      const result = await repository.findLineGroupMembersByLineUserIdsAndGroupId(
        'group-1',
        [],
      );

      expect(prismaService.lineGroupMember.findMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findEventBasicInfo', () => {
    it('should find event basic info', async () => {
      const eventId = 'event-123';
      const mockEvent = { id: eventId, isDeleted: false };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await repository.findEventBasicInfo(eventId);

      expect(prismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
        select: { id: true, isDeleted: true },
      });
      expect(result).toEqual(mockEvent);
    });
  });

  describe('findParticipantByUserId', () => {
    it('should find participant by user ID', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';
      const mockParticipant = { id: 'ep-1', eventId, userId };

      mockPrismaService.eventExpectedParticipant.findFirst.mockResolvedValue(mockParticipant);

      const result = await repository.findParticipantByUserId(eventId, userId);

      expect(prismaService.eventExpectedParticipant.findFirst).toHaveBeenCalledWith({
        where: {
          eventId,
          userId,
          isRemoved: false,
        },
      });
      expect(result).toEqual(mockParticipant);
    });
  });

  describe('findParticipantByUserIdIncludeRemoved', () => {
    it('should find participant including removed', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';
      const mockParticipant = { id: 'ep-1', eventId, userId, isRemoved: true };

      mockPrismaService.eventExpectedParticipant.findFirst.mockResolvedValue(mockParticipant);

      const result = await repository.findParticipantByUserIdIncludeRemoved(eventId, userId);

      expect(prismaService.eventExpectedParticipant.findFirst).toHaveBeenCalledWith({
        where: {
          eventId,
          userId,
        },
      });
      expect(result).toEqual(mockParticipant);
    });
  });

  describe('findVoteByUserId', () => {
    it('should find vote by user ID', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';
      const mockVote = { id: 'vote-1', eventId, userId };

      mockPrismaService.eventVote.findFirst.mockResolvedValue(mockVote);

      const result = await repository.findVoteByUserId(eventId, userId);

      expect(prismaService.eventVote.findFirst).toHaveBeenCalledWith({
        where: {
          eventId,
          userId,
        },
      });
      expect(result).toEqual(mockVote);
    });
  });

  describe('restoreParticipant', () => {
    it('should restore participant', async () => {
      const participantId = 'ep-1';
      const mockParticipant = { id: participantId, isRemoved: false };

      mockPrismaService.eventExpectedParticipant.update.mockResolvedValue(mockParticipant);

      const result = await repository.restoreParticipant(participantId);

      expect(prismaService.eventExpectedParticipant.update).toHaveBeenCalledWith({
        where: { id: participantId },
        data: { isRemoved: false },
      });
      expect(result).toEqual(mockParticipant);
    });
  });

  describe('createParticipant', () => {
    it('should create participant', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';
      const mockParticipant = { id: 'ep-new', eventId, userId };

      mockPrismaService.eventExpectedParticipant.create.mockResolvedValue(mockParticipant);

      const result = await repository.createParticipant(eventId, userId);

      expect(prismaService.eventExpectedParticipant.create).toHaveBeenCalledWith({
        data: {
          eventId,
          userId,
        },
      });
      expect(result).toEqual(mockParticipant);
    });
  });

  describe('findAllParticipants', () => {
    it('should find all participants including removed', async () => {
      const eventId = 'event-123';
      const mockParticipants = [
        { id: 'ep-1', lineUserId: 'line-1', userId: null, isRemoved: false },
        { id: 'ep-2', lineUserId: null, userId: 'user-1', isRemoved: true },
      ];

      mockPrismaService.eventExpectedParticipant.findMany.mockResolvedValue(mockParticipants);

      const result = await repository.findAllParticipants(eventId);

      expect(prismaService.eventExpectedParticipant.findMany).toHaveBeenCalledWith({
        where: { eventId },
        select: {
          id: true,
          lineUserId: true,
          userId: true,
          isRemoved: true,
        },
      });
      expect(result).toEqual(mockParticipants);
    });
  });

  describe('updateParticipantsInTransaction', () => {
    it('should update participants in transaction', async () => {
      const eventId = 'event-123';
      const toRemoveIds = ['ep-1'];
      const toRestoreIds = ['ep-2'];
      const toAdd = [{ lineUserId: 'line-new' }];

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          eventExpectedParticipant: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(mockPrisma);
      });

      await repository.updateParticipantsInTransaction(
        eventId,
        toRemoveIds,
        toRestoreIds,
        toAdd,
      );

      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should handle empty arrays', async () => {
      const eventId = 'event-123';

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          eventExpectedParticipant: {
            updateMany: jest.fn(),
            createMany: jest.fn(),
          },
        };
        return callback(mockPrisma);
      });

      await repository.updateParticipantsInTransaction(eventId, [], [], []);

      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });
});
