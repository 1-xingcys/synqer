import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmationRepository } from './confirmation.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('ConfirmationRepository', () => {
  let repository: ConfirmationRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    eventTimeSlot: {
      findMany: jest.fn(),
    },
    confirmedEventTimeSlot: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmationRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<ConfirmationRepository>(ConfirmationRepository);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findSlotsByIdsAndEventId', () => {
    it('should find slots by IDs and event ID', async () => {
      const eventId = 'event-123';
      const slotIds = ['slot-1', 'slot-2'];
      const expectedSlots = [
        { id: 'slot-1', eventId, date: new Date(), startMinute: 540, endMinute: 600 },
        { id: 'slot-2', eventId, date: new Date(), startMinute: 600, endMinute: 660 },
      ];

      mockPrismaService.eventTimeSlot.findMany.mockResolvedValue(expectedSlots);

      const result = await repository.findSlotsByIdsAndEventId(eventId, slotIds);

      expect(prismaService.eventTimeSlot.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: slotIds },
          eventId,
        },
      });
      expect(result).toEqual(expectedSlots);
    });
  });

  describe('deleteAllConfirmedSlots', () => {
    it('should delete all confirmed slots for an event', async () => {
      const eventId = 'event-123';
      const deleteResult = { count: 3 };

      mockPrismaService.confirmedEventTimeSlot.deleteMany.mockResolvedValue(deleteResult);

      const result = await repository.deleteAllConfirmedSlots(eventId);

      expect(prismaService.confirmedEventTimeSlot.deleteMany).toHaveBeenCalledWith({
        where: { eventId },
      });
      expect(result).toEqual(deleteResult);
    });

    it('should use provided prisma client when in transaction', async () => {
      const eventId = 'event-123';
      const mockTransactionClient = {
        confirmedEventTimeSlot: {
          deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
      };

      const result = await repository.deleteAllConfirmedSlots(
        eventId,
        mockTransactionClient as any,
      );

      expect(mockTransactionClient.confirmedEventTimeSlot.deleteMany).toHaveBeenCalledWith({
        where: { eventId },
      });
      expect(result).toEqual({ count: 2 });
    });
  });

  describe('createConfirmedSlots', () => {
    it('should create confirmed slots', async () => {
      const eventId = 'event-123';
      const slotIds = ['slot-1', 'slot-2'];
      const createResult = { count: 2 };

      mockPrismaService.confirmedEventTimeSlot.createMany.mockResolvedValue(createResult);

      const result = await repository.createConfirmedSlots(eventId, slotIds);

      expect(prismaService.confirmedEventTimeSlot.createMany).toHaveBeenCalledWith({
        data: [
          { eventId, slotId: 'slot-1' },
          { eventId, slotId: 'slot-2' },
        ],
      });
      expect(result).toEqual(createResult);
    });

    it('should use provided prisma client when in transaction', async () => {
      const eventId = 'event-123';
      const slotIds = ['slot-1'];
      const mockTransactionClient = {
        confirmedEventTimeSlot: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      const result = await repository.createConfirmedSlots(
        eventId,
        slotIds,
        mockTransactionClient as any,
      );

      expect(mockTransactionClient.confirmedEventTimeSlot.createMany).toHaveBeenCalled();
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('updateConfirmedSlotsInTransaction', () => {
    it('should update confirmed slots in a transaction', async () => {
      const eventId = 'event-123';
      const slotIds = ['slot-1', 'slot-2'];

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          confirmedEventTimeSlot: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return callback(mockPrisma);
      });

      await repository.updateConfirmedSlotsInTransaction(eventId, slotIds);

      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('findEventWithConfirmedSlots', () => {
    it('should find event with confirmed slots', async () => {
      const eventId = 'event-123';
      const expectedEvent = {
        id: eventId,
        confirmedTimeSlots: [
          {
            slotId: 'slot-1',
            slot: {
              id: 'slot-1',
              date: new Date(),
              startMinute: 540,
              endMinute: 600,
            },
          },
        ],
      };

      mockPrismaService.event.findUnique.mockResolvedValue(expectedEvent);

      const result = await repository.findEventWithConfirmedSlots(eventId);

      expect(prismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
        include: {
          confirmedTimeSlots: {
            include: {
              slot: {
                select: {
                  id: true,
                  date: true,
                  startMinute: true,
                  endMinute: true,
                },
              },
            },
          },
        },
      });
      expect(result).toEqual(expectedEvent);
    });
  });

  describe('findEventBasicInfo', () => {
    it('should find event basic info', async () => {
      const eventId = 'event-123';
      const expectedEvent = {
        id: eventId,
        title: 'Test Event',
        votingDeadline: new Date(),
      };

      mockPrismaService.event.findUnique.mockResolvedValue(expectedEvent);

      const result = await repository.findEventBasicInfo(eventId);

      expect(prismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
      });
      expect(result).toEqual(expectedEvent);
    });
  });
});
