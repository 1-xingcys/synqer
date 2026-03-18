import { Test, TestingModule } from '@nestjs/testing';
import { EventType, Weekday } from '@prisma/client';
import { EventRepository } from './event.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('EventRepository', () => {
  let repository: EventRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    eventTimeSlot: {
      createMany: jest.fn(),
    },
    recurringEventSchedule: {
      create: jest.fn(),
    },
    eventExpectedParticipant: {
      createMany: jest.fn(),
    },
    authIdentity: {
      findFirst: jest.fn(),
    },
    lineGroupMember: {
      findMany: jest.fn(),
    },
    eventStagedVote: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<EventRepository>(EventRepository);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('createWithSlotsAndParticipants', () => {
    it('should create event with slots and participants in transaction', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Description',
        type: EventType.ONE_TIME,
        ownerId: 'user-123',
        startDate: new Date('2024-12-25'),
        endDate: new Date('2024-12-25'),
        startMinuteOfDay: 540,
        endMinuteOfDay: 1080,
        slotDurationMin: 15,
        timeZone: 'Asia/Taipei',
        votingDeadline: null,
        lineGroupId: null,
      };
      const slots = [
        { date: new Date('2024-12-25'), startMinute: 540, endMinute: 555 },
      ];
      const participantData = [{ lineUserId: 'line-1' }];
      const creatorUserId = 'user-123';

      const mockEvent = { id: 'event-123', ...eventData };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          event: {
            create: jest.fn().mockResolvedValue(mockEvent),
          },
          oneTimeEventSchedule: {
            create: jest.fn().mockResolvedValue({}),
          },
          eventTimeSlot: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          eventExpectedParticipant: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
          authIdentity: {
            findFirst: jest.fn().mockResolvedValue({ providerUserId: 'line-creator' }),
          },
          lineGroupMember: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        };
        return callback(mockPrisma);
      });

      const result = await repository.createWithSlotsAndParticipants(
        eventData,
        slots,
        participantData,
        creatorUserId,
      );

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(result.event).toEqual(mockEvent);
    });

    it('should handle event creation without creator', async () => {
      const eventData = {
        title: 'Test Event',
        type: EventType.ONE_TIME,
        ownerId: null,
        startDate: new Date(),
        endDate: new Date(),
        startMinuteOfDay: 540,
        endMinuteOfDay: 1080,
        slotDurationMin: 15,
        timeZone: 'Asia/Taipei',
        votingDeadline: null,
        lineGroupId: null,
      };
      const slots: Array<{ date: Date; startMinute: number; endMinute: number }> = [];
      const participantData: Array<{ lineUserId?: string }> = [];

      const mockEvent = { id: 'event-456', ...eventData };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          event: {
            create: jest.fn().mockResolvedValue(mockEvent),
          },
          oneTimeEventSchedule: {
            create: jest.fn().mockResolvedValue({}),
          },
          eventTimeSlot: {
            createMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          eventExpectedParticipant: {
            createMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          authIdentity: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          lineGroupMember: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        };
        return callback(mockPrisma);
      });

      const result = await repository.createWithSlotsAndParticipants(
        eventData,
        slots,
        participantData,
      );

      expect(result.event).toEqual(mockEvent);
      expect(result.creatorLineUserId).toBeUndefined();
    });
  });

  describe('findByOwnerId', () => {
    it('should find events by owner ID', async () => {
      const userId = 'user-123';
      const mockEvents = [
        { id: 'event-1', ownerId: userId },
        { id: 'event-2', ownerId: userId },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const result = await repository.findByOwnerId(userId);

      expect(prismaService.event.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: userId,
          isDeleted: false,
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockEvents);
    });
  });

  describe('createRecurringWithSlotsAndParticipants', () => {
    it('should create recurring event with weekday slots and participants in transaction', async () => {
      const eventData = {
        title: 'Recurring Event',
        description: 'Recurring Description',
        type: EventType.RECURRING,
        ownerId: 'user-123',
        startDate: new Date('2000-01-03T00:00:00.000Z'),
        endDate: new Date('2000-01-07T00:00:00.000Z'),
        startMinuteOfDay: 540,
        endMinuteOfDay: 1080,
        slotDurationMin: 15,
        timeZone: 'Asia/Taipei',
        votingDeadline: null,
        lineGroupId: null,
        weekdays: [Weekday.MONDAY, Weekday.FRIDAY],
      };
      const slots = [
        {
          date: new Date('2000-01-03T00:00:00.000Z'),
          weekday: Weekday.MONDAY,
          startMinute: 540,
          endMinute: 555,
        },
      ];
      const participantData = [{ lineUserId: 'line-1' }];

      const mockEvent = { id: 'event-recurring-123', ...eventData };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          event: {
            create: jest.fn().mockResolvedValue(mockEvent),
          },
          recurringEventSchedule: {
            create: jest.fn().mockResolvedValue({}),
          },
          eventTimeSlot: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          eventExpectedParticipant: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          authIdentity: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          lineGroupMember: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        };
        return callback(mockPrisma);
      });

      const result = await repository.createRecurringWithSlotsAndParticipants(
        eventData,
        slots,
        participantData,
      );

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(result.event).toEqual(mockEvent);
    });
  });

  describe('findByParticipantUserId', () => {
    it('should find events where user is a participant', async () => {
      const userId = 'user-123';
      const mockEvents = [{ id: 'event-1' }];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const result = await repository.findByParticipantUserId(userId);

      expect(prismaService.event.findMany).toHaveBeenCalledWith({
        where: {
          expectedParticipants: {
            some: {
              userId,
              isRemoved: false,
            },
          },
          isDeleted: false,
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockEvents);
    });
  });

  describe('findOneWithDetails', () => {
    it('should find one event with all details', async () => {
      const eventId = 'event-123';
      const mockEvent = {
        id: eventId,
        slots: [],
        votes: [],
        expectedParticipants: [],
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await repository.findOneWithDetails(eventId);

      expect(prismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
        include: expect.objectContaining({
          slots: expect.any(Object),
          votes: expect.any(Object),
          lineGroup: expect.any(Object),
          expectedParticipants: expect.any(Object),
          confirmedTimeSlots: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockEvent);
    });
  });

  describe('findPublicInfo', () => {
    it('should find public event info', async () => {
      const eventId = 'event-123';
      const mockEvent = { id: eventId, title: 'Test' };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await repository.findPublicInfo(eventId);

      expect(prismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
        include: expect.objectContaining({
          expectedParticipants: expect.any(Object),
          confirmedTimeSlots: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockEvent);
    });
  });

  describe('findStagedVoteByEventAndUser', () => {
    it('should find staged vote by event and user', async () => {
      const eventId = 'event-123';
      const userId = 'user-123';
      const mockStagedVote = {
        slotIds: ['slot-1'],
        baselineSlotIds: ['slot-1'],
        updatedAt: new Date('2026-02-18T00:00:00.000Z'),
      };

      mockPrismaService.eventStagedVote.findUnique.mockResolvedValue(
        mockStagedVote,
      );

      const result = await repository.findStagedVoteByEventAndUser(
        eventId,
        userId,
      );

      expect(prismaService.eventStagedVote.findUnique).toHaveBeenCalledWith({
        where: {
          eventId_userId: {
            eventId,
            userId,
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

  describe('findOneBasic', () => {
    it('should find basic event info', async () => {
      const eventId = 'event-123';
      const mockEvent = {
        id: eventId,
        type: 'ONE_TIME',
        startDate: new Date(),
        startMinuteOfDay: 540,
        oneTimeSchedule: null,
        recurringSchedule: null,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await repository.findOneBasic(eventId);

      expect(prismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
        include: {
          oneTimeSchedule: true,
          recurringSchedule: true,
        },
      });
      expect(result).toEqual(mockEvent);
    });
  });

  describe('update', () => {
    it('should update event', async () => {
      const eventId = 'event-123';
      const updateData = { title: 'New Title' };
      const updatedEvent = {
        id: eventId,
        title: 'New Title',
        oneTimeSchedule: null,
        recurringSchedule: null,
      };

      mockPrismaService.event.update.mockResolvedValue(updatedEvent);

      const result = await repository.update(eventId, updateData);

      expect(prismaService.event.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: updateData,
        include: {
          oneTimeSchedule: true,
          recurringSchedule: true,
        },
      });
      expect(result).toEqual(updatedEvent);
    });
  });

  describe('softDelete', () => {
    it('should soft delete event', async () => {
      const eventId = 'event-123';
      const deletedEvent = { id: eventId, isDeleted: true };

      mockPrismaService.event.update.mockResolvedValue(deletedEvent);

      const result = await repository.softDelete(eventId);

      expect(prismaService.event.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: { isDeleted: true },
      });
      expect(result).toEqual(deletedEvent);
    });
  });
});
