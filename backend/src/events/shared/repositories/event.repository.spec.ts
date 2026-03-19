import { Test, TestingModule } from '@nestjs/testing';
import { EventBaseRepository } from './event.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('EventBaseRepository', () => {
  let repository: EventBaseRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    event: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventBaseRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<EventBaseRepository>(EventBaseRepository);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findOwnerInfo', () => {
    it('should find owner info', async () => {
      const eventId = 'event-123';
      const mockOwnerInfo = {
        id: eventId,
        ownerId: 'user-123',
        isDeleted: false,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockOwnerInfo);

      const result = await repository.findOwnerInfo(eventId);

      expect(prismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
        select: { id: true, ownerId: true, isDeleted: true },
      });
      expect(result).toEqual(mockOwnerInfo);
    });

    it('should return null when event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      const result = await repository.findOwnerInfo('nonexistent');

      expect(result).toBeNull();
    });
  });
});
