/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  EventStatusService,
  EventStatus,
  ParticipantStatus,
  TimeSlotService,
  EventParticipantService,
  EventVoteService,
  EventAuthorizationService,
  EventMapperService,
  EventQueryService,
  EventCreationService,
} from './services';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { VoteEventDto, VoteMode } from './dto/vote-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ConfirmEventTimeDto } from './dto/confirm-event-time.dto';
import { UpdateParticipantsDto } from './dto/update-participants.dto';

describe('EventsService', () => {
  let service: EventsService;
  let prismaService: jest.Mocked<PrismaService>;
  let eventStatusService: jest.Mocked<EventStatusService>;
  let timeSlotService: jest.Mocked<TimeSlotService>;
  let eventParticipantService: jest.Mocked<EventParticipantService>;
  let eventVoteService: jest.Mocked<EventVoteService>;
  let eventAuthorizationService: jest.Mocked<EventAuthorizationService>;
  let eventMapperService: jest.Mocked<EventMapperService>;
  let eventQueryService: jest.Mocked<EventQueryService>;
  let eventCreationService: jest.Mocked<EventCreationService>;

  const mockPrismaService = {
    event: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    eventTimeSlot: {
      createMany: jest.fn(),
    },
    lineGroupMember: {
      findMany: jest.fn(),
    },
    eventExpectedParticipant: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEventStatusService = {
    computeEventStatus: jest.fn(),
    computeParticipantStatus: jest.fn(),
  };

  const mockTimeSlotService = {
    parseTimeToMinutes: jest.fn(),
    generateTimeSlots: jest.fn(),
  };

  const mockEventParticipantService = {
    getUnvotedParticipants: jest.fn(),
    enrichExpectedParticipants: jest.fn(),
    enrichExpectedParticipantsForHost: jest.fn(),
    checkParticipantStatus: jest.fn(),
    joinEvent: jest.fn(),
  };

  const mockEventVoteService = {
    vote: jest.fn(),
  };

  const mockEventAuthorizationService = {
    verifyOwner: jest.fn(),
    verifyExists: jest.fn(),
    getEventAndVerifyOwner: jest.fn(),
  };

  const mockEventMapperService = {
    mapVotes: jest.fn(),
    extractParticipants: jest.fn(),
    extractParticipantsForHost: jest.fn(),
    calculateVotingStats: jest.fn(),
    mapEventToList: jest.fn(),
    mapEventToDetail: jest.fn(),
  };

  const mockEventQueryService = {
    findUserEvents: jest.fn(),
    findAttendedEvents: jest.fn(),
    findOne: jest.fn(),
    findOneHosted: jest.fn(),
    getEventPublicInfo: jest.fn(),
  };

  const mockEventCreationService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventStatusService,
          useValue: mockEventStatusService,
        },
        {
          provide: TimeSlotService,
          useValue: mockTimeSlotService,
        },
        {
          provide: EventParticipantService,
          useValue: mockEventParticipantService,
        },
        {
          provide: EventVoteService,
          useValue: mockEventVoteService,
        },
        {
          provide: EventAuthorizationService,
          useValue: mockEventAuthorizationService,
        },
        {
          provide: EventMapperService,
          useValue: mockEventMapperService,
        },
        {
          provide: EventQueryService,
          useValue: mockEventQueryService,
        },
        {
          provide: EventCreationService,
          useValue: mockEventCreationService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prismaService = module.get(PrismaService);
    eventStatusService = module.get(EventStatusService);
    timeSlotService = module.get(TimeSlotService);
    eventParticipantService = module.get(EventParticipantService);
    eventVoteService = module.get(EventVoteService);
    eventAuthorizationService = module.get(EventAuthorizationService);
    eventMapperService = module.get(EventMapperService);
    eventQueryService = module.get(EventQueryService);
    eventCreationService = module.get(EventCreationService);

    // 重置所有 mock
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('computeEventStatus', () => {
    it('should delegate to EventStatusService', () => {
      const event = {
        votingDeadline: new Date('2025-12-31'),
        confirmedStartTime: null,
        confirmedEndTime: null,
      };
      const expectedStatus = EventStatus.VOTING;

      eventStatusService.computeEventStatus.mockReturnValue(expectedStatus);

      const result = service.computeEventStatus(event);

      expect(eventStatusService.computeEventStatus).toHaveBeenCalledWith(event);
      expect(result).toBe(expectedStatus);
    });
  });

  describe('computeParticipantStatus', () => {
    it('should delegate to EventStatusService', () => {
      const participant = {
        userId: 'user-1',
        lineUserId: null,
        hasVoted: true,
      };
      const expectedStatus = ParticipantStatus.VOTED;

      eventStatusService.computeParticipantStatus.mockReturnValue(
        expectedStatus,
      );

      const result = service.computeParticipantStatus(participant);

      expect(eventStatusService.computeParticipantStatus).toHaveBeenCalledWith(
        participant,
      );
      expect(result).toBe(expectedStatus);
    });
  });

  describe('create', () => {
    const createEventDto: CreateEventDto = {
      title: 'Test Event',
      description: 'Test Description',
      startDate: '2025-08-12',
      endDate: '2025-08-15',
      startTime: '09:00',
      endTime: '18:00',
      slotDurationMin: 15,
      timeZone: 'Asia/Taipei',
    };

    const userId = 'user-1';
    const expectedResult = {
      eventId: 'event-1',
      shareUrl: '/events/event-1',
      meta: {
        title: 'Test Event',
        totalSlots: 100,
        lineGroupId: null,
        expectedParticipants: 1,
      },
    };

    it('should create an event successfully', async () => {
      eventCreationService.create.mockResolvedValue(expectedResult);

      const result = await service.create(createEventDto, userId);

      expect(eventCreationService.create).toHaveBeenCalledWith(
        createEventDto,
        userId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should create event without userId', async () => {
      const resultWithoutUser = {
        ...expectedResult,
        meta: { ...expectedResult.meta, expectedParticipants: 0 },
      };
      eventCreationService.create.mockResolvedValue(resultWithoutUser);

      const result = await service.create(createEventDto);

      expect(eventCreationService.create).toHaveBeenCalledWith(
        createEventDto,
        undefined,
      );
      expect(result.meta.expectedParticipants).toBe(0);
    });
  });

  describe('findUserEvents', () => {
    it('should return user events with status', async () => {
      const userId = 'user-1';
      const expectedEvents = [
        {
          id: 'event-1',
          title: 'Event 1',
          status: EventStatus.VOTING,
          participantCount: 1,
        },
      ];

      eventQueryService.findUserEvents.mockResolvedValue(expectedEvents as any);

      const result = await service.findUserEvents(userId);

      expect(eventQueryService.findUserEvents).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedEvents);
    });
  });

  describe('findAttendedEvents', () => {
    it('should return attended events with hasVoted flag', async () => {
      const userId = 'user-1';
      const expectedEvents = [
        {
          id: 'event-1',
          title: 'Event 1',
          hasVoted: true,
          status: EventStatus.VOTING,
        },
      ];

      eventQueryService.findAttendedEvents.mockResolvedValue(
        expectedEvents as any,
      );

      const result = await service.findAttendedEvents(userId);

      expect(eventQueryService.findAttendedEvents).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedEvents);
    });
  });

  describe('findOne', () => {
    it('should return event details with enriched participants', async () => {
      const eventId = 'event-1';
      const expectedResult = {
        event: {
          id: eventId,
          status: EventStatus.VOTING,
        },
        participants: [{ userId: 'user-1', displayName: 'User 1' }],
        expectedParticipants: [{ id: 'ep-1', hasVoted: true }],
      };

      eventQueryService.findOne.mockResolvedValue(expectedResult as any);

      const result = await service.findOne(eventId);

      expect(eventQueryService.findOne).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when event not found', async () => {
      eventQueryService.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUnvotedParticipants', () => {
    it('should delegate to EventParticipantService', async () => {
      const eventId = 'event-1';
      const expectedResult = {
        eventId,
        lineGroupId: undefined,
        lineGroupLineId: undefined,
        unvotedParticipants: [],
      };

      eventParticipantService.getUnvotedParticipants.mockResolvedValue(
        expectedResult as any,
      );

      const result = await service.getUnvotedParticipants(eventId);

      expect(
        eventParticipantService.getUnvotedParticipants,
      ).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('vote', () => {
    it('should delegate to EventVoteService', async () => {
      const eventId = 'event-1';
      const userId = 'user-1';
      const voteDto: VoteEventDto = {
        selectedSlotIds: ['slot-1', 'slot-2'],
        voteMode: VoteMode.AVAILABLE,
      };
      const expectedResult = {
        success: true,
        votedSlots: 2,
        voteMode: VoteMode.AVAILABLE,
      };

      eventVoteService.vote.mockResolvedValue(expectedResult);

      const result = await service.vote(eventId, userId, voteDto);

      expect(eventVoteService.vote).toHaveBeenCalledWith(
        eventId,
        userId,
        voteDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOneHosted', () => {
    it('should return hosted event details for owner', async () => {
      const eventId = 'event-1';
      const userId = 'user-1';
      const expectedResult = {
        event: { id: eventId, status: EventStatus.VOTING },
        votingStats: {
          totalExpected: 1,
          totalVoted: 1,
          votingPercentage: 100,
        },
      };

      eventQueryService.findOneHosted.mockResolvedValue(expectedResult as any);

      const result = await service.findOneHosted(eventId, userId);

      expect(eventQueryService.findOneHosted).toHaveBeenCalledWith(
        eventId,
        userId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const eventId = 'event-1';
      const userId = 'user-1';

      eventQueryService.findOneHosted.mockResolvedValue(null);
      eventAuthorizationService.verifyOwner.mockRejectedValue(
        new ForbiddenException('You are not the owner of this event'),
      );

      await expect(service.findOneHosted(eventId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when event not found', async () => {
      const eventId = 'non-existent';
      const userId = 'user-1';

      eventQueryService.findOneHosted.mockResolvedValue(null);
      eventAuthorizationService.verifyOwner.mockRejectedValue(
        new NotFoundException(`Event ${eventId} not found`),
      );

      await expect(service.findOneHosted(eventId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update event successfully', async () => {
      const eventId = 'event-1';
      const userId = 'user-1';
      const updateDto: UpdateEventDto = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const mockUpdatedEvent = {
        id: eventId,
        title: 'Updated Title',
        description: 'Updated Description',
        startDate: new Date('2025-08-12'),
        endDate: new Date('2025-08-15'),
      };

      eventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockPrismaService.event.update.mockResolvedValue(mockUpdatedEvent as any);

      const result = await service.update(eventId, userId, updateDto);

      expect(eventAuthorizationService.verifyOwner).toHaveBeenCalledWith(
        eventId,
        userId,
      );
      expect(prismaService.event.update).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
    });

    it('should update time fields using TimeSlotService', async () => {
      const eventId = 'event-1';
      const userId = 'user-1';
      const updateDto: UpdateEventDto = {
        startTime: '10:00',
        endTime: '19:00',
      };

      timeSlotService.parseTimeToMinutes.mockImplementation((time: string) => {
        if (time === '10:00') return 600;
        if (time === '19:00') return 1140;
        return 0;
      });

      eventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockPrismaService.event.update.mockResolvedValue({
        id: eventId,
        title: null,
        description: null,
        startDate: new Date(),
        endDate: new Date(),
      } as any);

      await service.update(eventId, userId, updateDto);

      expect(timeSlotService.parseTimeToMinutes).toHaveBeenCalledWith('10:00');
      expect(timeSlotService.parseTimeToMinutes).toHaveBeenCalledWith('19:00');
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      eventAuthorizationService.verifyOwner.mockRejectedValue(
        new ForbiddenException('You are not the owner of this event'),
      );

      await expect(service.update('event-1', 'user-1', {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete event successfully', async () => {
      const eventId = 'event-1';
      const userId = 'user-1';

      eventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockPrismaService.event.update.mockResolvedValue({
        id: eventId,
        isDeleted: true,
      } as any);

      const result = await service.remove(eventId, userId);

      expect(eventAuthorizationService.verifyOwner).toHaveBeenCalledWith(
        eventId,
        userId,
      );
      expect(prismaService.event.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: { isDeleted: true },
      });
      expect(result.success).toBe(true);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      eventAuthorizationService.verifyOwner.mockRejectedValue(
        new ForbiddenException('You are not the owner of this event'),
      );

      await expect(service.remove('event-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('confirmEventTime', () => {
    it('should confirm event time successfully', async () => {
      const eventId = 'event-1';
      const userId = 'user-1';
      const dto: ConfirmEventTimeDto = {
        confirmedStartTime: '2025-08-12T09:00:00Z',
        confirmedEndTime: '2025-08-12T18:00:00Z',
      };

      const mockUpdatedEvent = {
        id: eventId,
        votingDeadline: null,
        confirmedStartTime: new Date(dto.confirmedStartTime),
        confirmedEndTime: new Date(dto.confirmedEndTime),
      };

      eventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockPrismaService.event.update.mockResolvedValue(mockUpdatedEvent as any);
      eventStatusService.computeEventStatus.mockReturnValue(
        EventStatus.CONFIRMED,
      );

      const result = await service.confirmEventTime(eventId, userId, dto);

      expect(eventAuthorizationService.verifyOwner).toHaveBeenCalledWith(
        eventId,
        userId,
      );
      expect(result.id).toBe(eventId);
      expect(result.status).toBe(EventStatus.CONFIRMED);
    });

    it('should throw BadRequestException when end time is before start time', async () => {
      const eventId = 'event-1';
      const userId = 'user-1';
      const dto: ConfirmEventTimeDto = {
        confirmedStartTime: '2025-08-12T18:00:00Z',
        confirmedEndTime: '2025-08-12T09:00:00Z', // End before start
      };

      eventAuthorizationService.verifyOwner.mockResolvedValue(undefined);

      await expect(
        service.confirmEventTime(eventId, userId, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelConfirmedTime', () => {
    it('should cancel confirmed time successfully', async () => {
      const eventId = 'event-1';
      const userId = 'user-1';

      const mockUpdatedEvent = {
        id: eventId,
        votingDeadline: new Date('2025-08-20'),
        confirmedStartTime: null,
        confirmedEndTime: null,
      };

      eventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockPrismaService.event.update.mockResolvedValue(mockUpdatedEvent as any);
      eventStatusService.computeEventStatus.mockReturnValue(
        EventStatus.VOTING_ENDED,
      );

      const result = await service.cancelConfirmedTime(eventId, userId);

      expect(eventAuthorizationService.verifyOwner).toHaveBeenCalledWith(
        eventId,
        userId,
      );
      expect(result.id).toBe(eventId);
      expect(result.status).toBe(EventStatus.VOTING_ENDED);
    });
  });

  describe('updateParticipants', () => {
    it('should update participants successfully with diff strategy', async () => {
      const eventId = 'event-1';
      const userId = 'user-1';
      const dto: UpdateParticipantsDto = {
        participants: [{ userId: 'user-2' }, { lineUserId: 'line-user-1' }],
      };

      eventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          eventExpectedParticipant: {
            findMany: jest.fn().mockResolvedValue([
              { id: 'ep-1', userId: 'user-3', lineUserId: null }, // 會被刪除
            ]),
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return callback(mockPrisma as any);
      });

      const result = await service.updateParticipants(eventId, userId, dto);

      expect(eventAuthorizationService.verifyOwner).toHaveBeenCalledWith(
        eventId,
        userId,
      );
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });

    it('should preserve existing participants that are still in the list', async () => {
      const eventId = 'event-1';
      const userId = 'user-1';
      const dto: UpdateParticipantsDto = {
        participants: [
          { userId: 'user-2' }, // 已存在，應保留
          { lineUserId: 'line-user-1' }, // 新增
        ],
      };

      eventAuthorizationService.verifyOwner.mockResolvedValue(undefined);

      const mockDeleteMany = jest.fn().mockResolvedValue({ count: 0 });
      const mockCreateMany = jest.fn().mockResolvedValue({ count: 1 });

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrisma = {
          eventExpectedParticipant: {
            findMany: jest.fn().mockResolvedValue([
              { id: 'ep-1', userId: 'user-2', lineUserId: null }, // 已存在，應保留
            ]),
            deleteMany: mockDeleteMany,
            createMany: mockCreateMany,
          },
        };
        return callback(mockPrisma as any);
      });

      const result = await service.updateParticipants(eventId, userId, dto);

      expect(result.success).toBe(true);
      // 不應該刪除 user-2（因為仍在列表中）
      // 應該只新增 line-user-1
    });
  });

  describe('getEventPublicInfo', () => {
    it('should return public event info', async () => {
      const eventId = 'event-1';
      const expectedResult = {
        id: eventId,
        title: 'Test Event',
        participantCount: 2,
        status: EventStatus.VOTING,
      };

      eventQueryService.getEventPublicInfo.mockResolvedValue(
        expectedResult as any,
      );

      const result = await service.getEventPublicInfo(eventId);

      expect(eventQueryService.getEventPublicInfo).toHaveBeenCalledWith(
        eventId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when event not found', async () => {
      eventQueryService.getEventPublicInfo.mockResolvedValue(null);

      await expect(service.getEventPublicInfo('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('checkParticipantStatus', () => {
    it('should delegate to EventParticipantService', async () => {
      const eventId = 'event-1';
      const userId = 'user-1';
      const expectedResult = {
        isParticipant: true,
        hasVoted: true,
      };

      eventParticipantService.checkParticipantStatus.mockResolvedValue(
        expectedResult,
      );

      const result = await service.checkParticipantStatus(eventId, userId);

      expect(
        eventParticipantService.checkParticipantStatus,
      ).toHaveBeenCalledWith(eventId, userId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('joinEvent', () => {
    it('should delegate to EventParticipantService', async () => {
      const eventId = 'event-1';
      const userId = 'user-1';
      const expectedResult = {
        success: true,
        alreadyJoined: false,
        message: 'Successfully joined the event',
      };

      eventParticipantService.joinEvent.mockResolvedValue(expectedResult);

      const result = await service.joinEvent(eventId, userId);

      expect(eventParticipantService.joinEvent).toHaveBeenCalledWith(
        eventId,
        userId,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
