import { Test, TestingModule } from '@nestjs/testing';
import { VoteRepository } from './vote.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('VoteRepository', () => {
  let repository: VoteRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    event: {
      findUnique: jest.fn(),
    },
    eventVote: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    eventExpectedParticipant: {
      updateMany: jest.fn(),
      findFirst: jest.fn(),
    },
    eventStagedVote: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoteRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<VoteRepository>(VoteRepository);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findEventVotingInfo', () => {
    it('should find event voting info', async () => {
      const eventId = 'event-123';
      const mockEvent = {
        votingDeadline: new Date(),
        isDeleted: false,
        timeZone: 'Asia/Taipei',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await repository.findEventVotingInfo(eventId);

      expect(prismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
        select: {
          votingDeadline: true,
          isDeleted: true,
          timeZone: true,
        },
      });
      expect(result).toEqual(mockEvent);
    });

    it('should return null when event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      const result = await repository.findEventVotingInfo('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findParticipantVoteStatus', () => {
    it('should find participant vote status', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';
      const mockStatus = { hasVoted: true };

      mockPrismaService.eventExpectedParticipant.findFirst.mockResolvedValue(
        mockStatus,
      );

      const result = await repository.findParticipantVoteStatus(eventId, userId);

      expect(prismaService.eventExpectedParticipant.findFirst).toHaveBeenCalledWith({
        where: {
          eventId,
          userId,
          isRemoved: false,
        },
        select: {
          hasVoted: true,
        },
      });
      expect(result).toEqual(mockStatus);
    });
  });

  describe('findUserCommittedSlotIds', () => {
    it('should return committed slot ids for user', async () => {
      mockPrismaService.eventVote.findMany.mockResolvedValue([
        { slotId: 'slot-1' },
        { slotId: 'slot-2' },
      ]);

      const result = await repository.findUserCommittedSlotIds(
        'event-123',
        'user-123',
      );

      expect(prismaService.eventVote.findMany).toHaveBeenCalledWith({
        where: {
          eventId: 'event-123',
          userId: 'user-123',
        },
        select: {
          slotId: true,
        },
      });
      expect(result).toEqual(['slot-1', 'slot-2']);
    });
  });

  describe('findUserStagedVote', () => {
    it('should find staged vote by composite key', async () => {
      const mockStagedVote = {
        slotIds: ['slot-1'],
        baselineSlotIds: ['slot-1'],
        updatedAt: new Date('2026-02-18T00:00:00.000Z'),
      };
      mockPrismaService.eventStagedVote.findUnique.mockResolvedValue(
        mockStagedVote,
      );

      const result = await repository.findUserStagedVote('event-123', 'user-123');

      expect(prismaService.eventStagedVote.findUnique).toHaveBeenCalledWith({
        where: {
          eventId_userId: {
            eventId: 'event-123',
            userId: 'user-123',
          },
        },
        select: {
          slotIds: true,
          baselineSlotIds: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockStagedVote);
    });
  });

  describe('upsertStagedVote', () => {
    it('should upsert staged vote with slot ids', async () => {
      mockPrismaService.eventStagedVote.upsert.mockResolvedValue({
        slotIds: ['slot-1'],
        baselineSlotIds: ['slot-2'],
      });

      const result = await repository.upsertStagedVote(
        'event-123',
        'user-123',
        ['slot-1'],
        ['slot-2'],
      );

      expect(prismaService.eventStagedVote.upsert).toHaveBeenCalledWith({
        where: {
          eventId_userId: {
            eventId: 'event-123',
            userId: 'user-123',
          },
        },
        create: {
          eventId: 'event-123',
          userId: 'user-123',
          slotIds: ['slot-1'],
          baselineSlotIds: ['slot-2'],
        },
        update: {
          slotIds: ['slot-1'],
          baselineSlotIds: ['slot-2'],
        },
      });
      expect(result).toEqual({
        slotIds: ['slot-1'],
        baselineSlotIds: ['slot-2'],
      });
    });
  });

  describe('deleteStagedVote', () => {
    it('should delete staged vote by event and user', async () => {
      mockPrismaService.eventStagedVote.deleteMany.mockResolvedValue({
        count: 1,
      });

      const result = await repository.deleteStagedVote('event-123', 'user-123');

      expect(prismaService.eventStagedVote.deleteMany).toHaveBeenCalledWith({
        where: {
          eventId: 'event-123',
          userId: 'user-123',
        },
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('deleteUserVotes', () => {
    it('should delete all votes for a user in an event', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';

      mockPrismaService.eventVote.deleteMany.mockResolvedValue({ count: 5 });

      const result = await repository.deleteUserVotes(eventId, userId);

      expect(prismaService.eventVote.deleteMany).toHaveBeenCalledWith({
        where: {
          eventId,
          userId,
        },
      });
      expect(result).toEqual({ count: 5 });
    });

    it('should use provided prisma client in transaction', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';
      const mockTransactionClient = {
        eventVote: {
          deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
        },
      };

      const result = await repository.deleteUserVotes(
        eventId,
        userId,
        mockTransactionClient as any,
      );

      expect(mockTransactionClient.eventVote.deleteMany).toHaveBeenCalled();
      expect(result).toEqual({ count: 3 });
    });
  });

  describe('createVotes', () => {
    it('should create votes for multiple slots', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';
      const slotIds = ['slot-1', 'slot-2', 'slot-3'];

      mockPrismaService.eventVote.createMany.mockResolvedValue({ count: 3 });

      const result = await repository.createVotes(eventId, userId, slotIds);

      expect(prismaService.eventVote.createMany).toHaveBeenCalledWith({
        data: [
          { eventId, slotId: 'slot-1', userId },
          { eventId, slotId: 'slot-2', userId },
          { eventId, slotId: 'slot-3', userId },
        ],
      });
      expect(result).toEqual({ count: 3 });
    });

    it('should use provided prisma client in transaction', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';
      const slotIds = ['slot-1'];
      const mockTransactionClient = {
        eventVote: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      const result = await repository.createVotes(
        eventId,
        userId,
        slotIds,
        mockTransactionClient as any,
      );

      expect(mockTransactionClient.eventVote.createMany).toHaveBeenCalled();
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('updateParticipantVoteStatus', () => {
    it('should update participant vote status', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';

      mockPrismaService.eventExpectedParticipant.updateMany.mockResolvedValue({
        count: 1,
      });

      const result = await repository.updateParticipantVoteStatus(
        eventId,
        userId,
        true,
      );

      expect(prismaService.eventExpectedParticipant.updateMany).toHaveBeenCalledWith({
        where: {
          eventId,
          userId,
        },
        data: {
          hasVoted: true,
        },
      });
      expect(result).toEqual({ count: 1 });
    });

    it('should use provided prisma client in transaction', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';
      const mockTransactionClient = {
        eventExpectedParticipant: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      const result = await repository.updateParticipantVoteStatus(
        eventId,
        userId,
        true,
        mockTransactionClient as any,
      );

      expect(mockTransactionClient.eventExpectedParticipant.updateMany).toHaveBeenCalled();
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('submitVoteInTransaction', () => {
    it('should execute complete vote flow in transaction', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';
      const availableSlotIds = ['slot-1', 'slot-2'];

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          eventVote: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
          eventExpectedParticipant: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(mockPrisma);
      });

      const result = await repository.submitVoteInTransaction(
        eventId,
        userId,
        availableSlotIds,
      );

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ availableSlotIds });
    });

    it('should handle empty slot IDs (no available times)', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';
      const availableSlotIds: string[] = [];

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          eventVote: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            createMany: jest.fn(),
          },
          eventExpectedParticipant: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(mockPrisma);
      });

      const result = await repository.submitVoteInTransaction(
        eventId,
        userId,
        availableSlotIds,
      );

      expect(result).toEqual({ availableSlotIds: [] });
    });

    it('should delete old votes before creating new ones', async () => {
      const callOrder: string[] = [];
      const eventId = 'event-123';
      const userId = 'user-123';
      const availableSlotIds = ['slot-1'];

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          eventVote: {
            deleteMany: jest.fn().mockImplementation(() => {
              callOrder.push('delete');
              return Promise.resolve({ count: 1 });
            }),
            createMany: jest.fn().mockImplementation(() => {
              callOrder.push('create');
              return Promise.resolve({ count: 1 });
            }),
          },
          eventExpectedParticipant: {
            updateMany: jest.fn().mockImplementation(() => {
              callOrder.push('update');
              return Promise.resolve({ count: 1 });
            }),
          },
        };
        return callback(mockPrisma);
      });

      await repository.submitVoteInTransaction(eventId, userId, availableSlotIds);

      expect(callOrder).toEqual(['delete', 'create', 'update']);
    });
  });

  describe('upsertVotes', () => {
    it('should upsert votes with skipDuplicates', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';
      const slotIds = ['slot-1', 'slot-2'];

      mockPrismaService.eventVote.createMany.mockResolvedValue({ count: 2 });

      const result = await repository.upsertVotes(eventId, userId, slotIds);

      expect(prismaService.eventVote.createMany).toHaveBeenCalledWith({
        data: [
          { eventId, slotId: 'slot-1', userId },
          { eventId, slotId: 'slot-2', userId },
        ],
        skipDuplicates: true,
      });
      expect(result).toEqual({ count: 2 });
    });

    it('should return early for empty slot ids', async () => {
      const result = await repository.upsertVotes('event-123', 'user-123', []);

      expect(result).toBeUndefined();
      expect(prismaService.eventVote.createMany).not.toHaveBeenCalled();
    });
  });

  describe('deleteSpecificVotes', () => {
    it('should delete only specified slot votes', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';
      const slotIds = ['slot-1', 'slot-3'];

      mockPrismaService.eventVote.deleteMany.mockResolvedValue({ count: 2 });

      const result = await repository.deleteSpecificVotes(
        eventId,
        userId,
        slotIds,
      );

      expect(prismaService.eventVote.deleteMany).toHaveBeenCalledWith({
        where: {
          eventId,
          userId,
          slotId: { in: slotIds },
        },
      });
      expect(result).toEqual({ count: 2 });
    });

    it('should return early for empty slot ids', async () => {
      const result = await repository.deleteSpecificVotes(
        'event-123',
        'user-123',
        [],
      );

      expect(result).toBeUndefined();
      expect(prismaService.eventVote.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('updateVotesInTransaction', () => {
    it('should execute upsert then delete then participant update in transaction', async () => {
      const callOrder: string[] = [];
      const eventId = 'event-123';
      const userId = 'user-123';
      const addSlotIds = ['slot-1'];
      const removeSlotIds = ['slot-2'];

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          eventVote: {
            createMany: jest.fn().mockImplementation(() => {
              callOrder.push('upsert');
              return Promise.resolve({ count: 1 });
            }),
            deleteMany: jest.fn().mockImplementation(() => {
              callOrder.push('delete');
              return Promise.resolve({ count: 1 });
            }),
          },
          eventExpectedParticipant: {
            updateMany: jest.fn().mockImplementation(() => {
              callOrder.push('update');
              return Promise.resolve({ count: 1 });
            }),
          },
        };
        return callback(mockPrisma as any);
      });

      const result = await repository.updateVotesInTransaction(
        eventId,
        userId,
        addSlotIds,
        removeSlotIds,
      );

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(callOrder).toEqual(['upsert', 'delete', 'update']);
      expect(result).toEqual({ addSlotIds, removeSlotIds });
    });

    it('should only update participant status when add/remove are empty', async () => {
      const callOrder: string[] = [];

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          eventVote: {
            createMany: jest.fn().mockImplementation(() => {
              callOrder.push('upsert');
              return Promise.resolve({ count: 0 });
            }),
            deleteMany: jest.fn().mockImplementation(() => {
              callOrder.push('delete');
              return Promise.resolve({ count: 0 });
            }),
          },
          eventExpectedParticipant: {
            updateMany: jest.fn().mockImplementation(() => {
              callOrder.push('update');
              return Promise.resolve({ count: 1 });
            }),
          },
        };
        return callback(mockPrisma as any);
      });

      const result = await repository.updateVotesInTransaction(
        'event-123',
        'user-123',
        [],
        [],
      );

      expect(callOrder).toEqual(['update']);
      expect(result).toEqual({ addSlotIds: [], removeSlotIds: [] });
    });
  });

  describe('commitStagedVotesInTransaction', () => {
    it('should replace committed votes, mark hasVoted, and clear staged in transaction', async () => {
      const callOrder: string[] = [];
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          eventVote: {
            deleteMany: jest.fn().mockImplementation(() => {
              callOrder.push('delete-votes');
              return Promise.resolve({ count: 1 });
            }),
            createMany: jest.fn().mockImplementation(() => {
              callOrder.push('create-votes');
              return Promise.resolve({ count: 2 });
            }),
          },
          eventExpectedParticipant: {
            updateMany: jest.fn().mockImplementation(() => {
              callOrder.push('update-status');
              return Promise.resolve({ count: 1 });
            }),
          },
          eventStagedVote: {
            deleteMany: jest.fn().mockImplementation(() => {
              callOrder.push('delete-staged');
              return Promise.resolve({ count: 1 });
            }),
          },
        };
        return callback(mockPrisma as any);
      });

      const result = await repository.commitStagedVotesInTransaction(
        'event-123',
        'user-123',
        ['slot-1', 'slot-2'],
      );

      expect(callOrder).toEqual([
        'delete-votes',
        'create-votes',
        'update-status',
        'delete-staged',
      ]);
      expect(result).toEqual({ availableSlotIds: ['slot-1', 'slot-2'] });
    });
  });
});
