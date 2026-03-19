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

});
