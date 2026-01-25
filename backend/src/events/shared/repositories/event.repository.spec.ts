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

  describe('findById', () => {
    it('should find event by ID', async () => {
      const eventId = 'event-123';
      const mockEvent = {
        id: eventId,
        title: 'Test Event',
        description: 'Description',
        isDeleted: false,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await repository.findById(eventId);

      expect(prismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
      });
      expect(result).toEqual(mockEvent);
    });

    it('should return null when event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByIdSelect', () => {
    it('should find event with specific fields', async () => {
      const eventId = 'event-123';
      const select = { id: true, title: true };
      const mockEvent = { id: eventId, title: 'Test Event' };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await repository.findByIdSelect<{ id: string; title: string }>(
        eventId,
        select,
      );

      expect(prismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
        select,
      });
      expect(result).toEqual(mockEvent);
    });
  });

  describe('exists', () => {
    it('should return true when event exists and is not deleted', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-123',
        isDeleted: false,
      });

      const result = await repository.exists('event-123');

      expect(prismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        select: { id: true, isDeleted: true },
      });
      expect(result).toBe(true);
    });

    it('should return false when event does not exist', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      const result = await repository.exists('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when event is deleted', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-123',
        isDeleted: true,
      });

      const result = await repository.exists('event-123');

      expect(result).toBe(false);
    });
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
