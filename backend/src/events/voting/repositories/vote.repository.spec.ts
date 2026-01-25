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
    },
    eventExpectedParticipant: {
      updateMany: jest.fn(),
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
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await repository.findEventVotingInfo(eventId);

      expect(prismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
        select: {
          votingDeadline: true,
          isDeleted: true,
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
});
