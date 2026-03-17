import { Test, TestingModule } from '@nestjs/testing';
import { EventType } from '@prisma/client';
import {
  EventStatusService,
  EventStatus,
  ParticipantStatus,
} from './event-status.service';

describe('EventStatusService', () => {
  let service: EventStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventStatusService],
    }).compile();

    service = module.get<EventStatusService>(EventStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('computeEventStatus', () => {
    it('should return VOTING when no deadline and no confirmed slots', () => {
      const result = service.computeEventStatus({
        votingDeadline: null,
        confirmedTimeSlots: [],
      });

      expect(result).toBe(EventStatus.VOTING);
    });

    it('should return VOTING when deadline is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const result = service.computeEventStatus({
        votingDeadline: futureDate,
        confirmedTimeSlots: [],
      });

      expect(result).toBe(EventStatus.VOTING);
    });

    it('should return VOTING_ENDED when deadline has passed and no confirmed slots', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const result = service.computeEventStatus({
        votingDeadline: pastDate,
        confirmedTimeSlots: [],
      });

      expect(result).toBe(EventStatus.VOTING_ENDED);
    });

    it('should return CONFIRMED when there are confirmed slots in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const result = service.computeEventStatus({
        votingDeadline: null,
        confirmedTimeSlots: [
          {
            slotId: 'slot-1',
            date: futureDate,
            startMinute: 540, // 09:00
            endMinute: 600, // 10:00
          },
        ],
      });

      expect(result).toBe(EventStatus.CONFIRMED);
    });

    it('should return COMPLETED when confirmed slots have all passed', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const result = service.computeEventStatus({
        votingDeadline: null,
        confirmedTimeSlots: [
          {
            slotId: 'slot-1',
            date: pastDate,
            startMinute: 540,
            endMinute: 600,
          },
        ],
      });

      expect(result).toBe(EventStatus.COMPLETED);
    });

    it('should return CONFIRMED for recurring events with confirmed slots', () => {
      const pastDate = new Date('2020-01-01T00:00:00.000Z');

      const result = service.computeEventStatus({
        eventType: EventType.RECURRING,
        votingDeadline: null,
        confirmedTimeSlots: [
          {
            slotId: 'slot-1',
            date: pastDate,
            startMinute: 540,
            endMinute: 600,
          },
        ],
      });

      expect(result).toBe(EventStatus.CONFIRMED);
    });

    it('should use latest end time to determine COMPLETED status', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const result = service.computeEventStatus({
        votingDeadline: null,
        confirmedTimeSlots: [
          {
            slotId: 'slot-1',
            date: pastDate,
            startMinute: 540,
            endMinute: 600,
          },
          {
            slotId: 'slot-2',
            date: futureDate,
            startMinute: 540,
            endMinute: 600,
          },
        ],
      });

      expect(result).toBe(EventStatus.CONFIRMED); // Not completed because one slot is in future
    });

    it('should handle confirmed slots with same day but different times', () => {
      // Create a date that is definitely in the past
      const pastDate = new Date('2020-01-01T00:00:00.000Z');

      const result = service.computeEventStatus({
        votingDeadline: null,
        confirmedTimeSlots: [
          {
            slotId: 'slot-1',
            date: pastDate,
            startMinute: 540, // 09:00
            endMinute: 600, // 10:00
          },
          {
            slotId: 'slot-2',
            date: pastDate,
            startMinute: 840, // 14:00
            endMinute: 900, // 15:00
          },
        ],
      });

      expect(result).toBe(EventStatus.COMPLETED);
    });
  });

  describe('computeParticipantStatus', () => {
    it('should return VOTED when hasVoted is true', () => {
      const result = service.computeParticipantStatus({
        userId: 'user-123',
        lineUserId: 'line-123',
        hasVoted: true,
      });

      expect(result).toBe(ParticipantStatus.VOTED);
    });

    it('should return NOT_VOTED when has userId but not voted', () => {
      const result = service.computeParticipantStatus({
        userId: 'user-123',
        lineUserId: null,
        hasVoted: false,
      });

      expect(result).toBe(ParticipantStatus.NOT_VOTED);
    });

    it('should return NOT_REGISTERED when only has lineUserId', () => {
      const result = service.computeParticipantStatus({
        userId: null,
        lineUserId: 'line-123',
        hasVoted: false,
      });

      expect(result).toBe(ParticipantStatus.NOT_REGISTERED);
    });

    it('should return NOT_VOTED when no userId and no lineUserId', () => {
      const result = service.computeParticipantStatus({
        userId: null,
        lineUserId: null,
        hasVoted: false,
      });

      expect(result).toBe(ParticipantStatus.NOT_VOTED);
    });

    it('should prioritize VOTED status over other conditions', () => {
      // Even with no userId, if hasVoted is true, return VOTED
      const result = service.computeParticipantStatus({
        userId: null,
        lineUserId: 'line-123',
        hasVoted: true,
      });

      expect(result).toBe(ParticipantStatus.VOTED);
    });
  });
});
