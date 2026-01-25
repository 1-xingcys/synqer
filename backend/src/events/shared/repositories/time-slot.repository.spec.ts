import { Test, TestingModule } from '@nestjs/testing';
import { TimeSlotRepository } from './time-slot.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('TimeSlotRepository', () => {
  let repository: TimeSlotRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    eventTimeSlot: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeSlotRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<TimeSlotRepository>(TimeSlotRepository);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('createMany', () => {
    it('should create multiple time slots', async () => {
      const eventId = 'event-123';
      const slots = [
        { date: new Date('2024-12-25'), startMinute: 540, endMinute: 555 },
        { date: new Date('2024-12-25'), startMinute: 555, endMinute: 570 },
      ];

      mockPrismaService.eventTimeSlot.createMany.mockResolvedValue({ count: 2 });

      const result = await repository.createMany(eventId, slots);

      expect(prismaService.eventTimeSlot.createMany).toHaveBeenCalledWith({
        data: [
          { eventId, date: slots[0].date, startMinute: 540, endMinute: 555, index: 0 },
          { eventId, date: slots[1].date, startMinute: 555, endMinute: 570, index: 1 },
        ],
      });
      expect(result).toEqual({ count: 2 });
    });

    it('should use provided prisma client in transaction', async () => {
      const eventId = 'event-123';
      const slots = [{ date: new Date(), startMinute: 540, endMinute: 555 }];
      const mockTransactionClient = {
        eventTimeSlot: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      const result = await repository.createMany(
        eventId,
        slots,
        mockTransactionClient as any,
      );

      expect(mockTransactionClient.eventTimeSlot.createMany).toHaveBeenCalled();
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('findByEventId', () => {
    it('should find all slots for an event', async () => {
      const eventId = 'event-123';
      const mockSlots = [
        { id: 'slot-1', eventId, date: new Date(), startMinute: 540, endMinute: 555 },
        { id: 'slot-2', eventId, date: new Date(), startMinute: 555, endMinute: 570 },
      ];

      mockPrismaService.eventTimeSlot.findMany.mockResolvedValue(mockSlots);

      const result = await repository.findByEventId(eventId);

      expect(prismaService.eventTimeSlot.findMany).toHaveBeenCalledWith({
        where: { eventId },
        orderBy: [{ date: 'asc' }, { startMinute: 'asc' }],
      });
      expect(result).toEqual(mockSlots);
    });
  });

  describe('findIdsByEventId', () => {
    it('should find slot IDs for an event', async () => {
      const eventId = 'event-123';
      const mockSlots = [{ id: 'slot-1' }, { id: 'slot-2' }, { id: 'slot-3' }];

      mockPrismaService.eventTimeSlot.findMany.mockResolvedValue(mockSlots);

      const result = await repository.findIdsByEventId(eventId);

      expect(prismaService.eventTimeSlot.findMany).toHaveBeenCalledWith({
        where: { eventId },
        select: { id: true },
      });
      expect(result).toEqual(['slot-1', 'slot-2', 'slot-3']);
    });

    it('should return empty array when no slots found', async () => {
      mockPrismaService.eventTimeSlot.findMany.mockResolvedValue([]);

      const result = await repository.findIdsByEventId('event-123');

      expect(result).toEqual([]);
    });
  });

  describe('findByIds', () => {
    it('should find slots by IDs', async () => {
      const slotIds = ['slot-1', 'slot-2'];
      const mockSlots = [
        { id: 'slot-1', date: new Date(), startMinute: 540, endMinute: 555 },
        { id: 'slot-2', date: new Date(), startMinute: 555, endMinute: 570 },
      ];

      mockPrismaService.eventTimeSlot.findMany.mockResolvedValue(mockSlots);

      const result = await repository.findByIds(slotIds);

      expect(prismaService.eventTimeSlot.findMany).toHaveBeenCalledWith({
        where: { id: { in: slotIds } },
      });
      expect(result).toEqual(mockSlots);
    });
  });

  describe('validateSlotsForEvent', () => {
    it('should return true when all slots belong to event', async () => {
      const eventId = 'event-123';
      const slotIds = ['slot-1', 'slot-2'];
      const mockSlots = [{ id: 'slot-1' }, { id: 'slot-2' }];

      mockPrismaService.eventTimeSlot.findMany.mockResolvedValue(mockSlots);

      const result = await repository.validateSlotsForEvent(eventId, slotIds);

      expect(prismaService.eventTimeSlot.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: slotIds },
          eventId,
        },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it('should return false when some slots do not belong to event', async () => {
      const eventId = 'event-123';
      const slotIds = ['slot-1', 'slot-2', 'slot-3'];
      const mockSlots = [{ id: 'slot-1' }, { id: 'slot-2' }]; // only 2 found

      mockPrismaService.eventTimeSlot.findMany.mockResolvedValue(mockSlots);

      const result = await repository.validateSlotsForEvent(eventId, slotIds);

      expect(result).toBe(false);
    });

    it('should deduplicate slot IDs before validation', async () => {
      const eventId = 'event-123';
      const slotIds = ['slot-1', 'slot-1', 'slot-2', 'slot-2'];
      const mockSlots = [{ id: 'slot-1' }, { id: 'slot-2' }];

      mockPrismaService.eventTimeSlot.findMany.mockResolvedValue(mockSlots);

      const result = await repository.validateSlotsForEvent(eventId, slotIds);

      expect(prismaService.eventTimeSlot.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['slot-1', 'slot-2'] }, // deduplicated
          eventId,
        },
        select: { id: true },
      });
      expect(result).toBe(true);
    });
  });
});
