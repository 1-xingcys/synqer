import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { VoteService } from './vote.service';
import { VoteRepository } from '../repositories/vote.repository';
import { TimeSlotRepository } from '../../shared/repositories/time-slot.repository';
import { VoteMode } from '../dto/vote-event.dto';

/**
 * Stands in for the transaction client the lock hands to its callback, so the
 * assertions below can show which reads and writes happen inside the critical
 * section.
 */
const mockTransactionClient = {} as unknown as Prisma.TransactionClient;

describe('VoteService', () => {
  let service: VoteService;
  let voteRepository: jest.Mocked<VoteRepository>;
  let timeSlotRepository: jest.Mocked<TimeSlotRepository>;

  const mockVoteRepository = {
    findEventVotingInfo: jest.fn(),
    submitVoteInTransaction: jest.fn(),
    updateVotesInTransaction: jest.fn(),
    findParticipantVoteStatus: jest.fn(),
    findUserCommittedSlotIds: jest.fn(),
    findUserStagedVote: jest.fn(),
    upsertStagedVote: jest.fn(),
    deleteStagedVote: jest.fn(),
    commitStagedVotesInTransaction: jest.fn(),
    runInStagedVoteLock: jest.fn(
      async (
        _eventId: string,
        _userId: string,
        fn: (tx: Prisma.TransactionClient) => Promise<unknown>,
      ) => fn(mockTransactionClient),
    ),
  };

  const mockTimeSlotRepository = {
    findIdsByEventId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoteService,
        { provide: VoteRepository, useValue: mockVoteRepository },
        { provide: TimeSlotRepository, useValue: mockTimeSlotRepository },
      ],
    }).compile();

    service = module.get<VoteService>(VoteService);
    voteRepository = module.get(VoteRepository);
    timeSlotRepository = module.get(TimeSlotRepository);

    jest.clearAllMocks();
    mockVoteRepository.findParticipantVoteStatus.mockResolvedValue({
      hasVoted: false,
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('vote', () => {
    const eventId = 'event-123';
    const userId = 'user-123';

    it('should vote with AVAILABLE mode successfully', async () => {
      const voteDto = {
        selectedSlotIds: ['slot-1', 'slot-2'],
        voteMode: VoteMode.AVAILABLE,
      };

      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue([
        'slot-1',
        'slot-2',
        'slot-3',
      ]);
      mockVoteRepository.submitVoteInTransaction.mockResolvedValue({
        availableSlotIds: ['slot-1', 'slot-2'],
      });

      const result = await service.vote(eventId, userId, voteDto);

      expect(voteRepository.findEventVotingInfo).toHaveBeenCalledWith(eventId);
      expect(timeSlotRepository.findIdsByEventId).toHaveBeenCalledWith(eventId);
      expect(voteRepository.submitVoteInTransaction).toHaveBeenCalledWith(
        eventId,
        userId,
        ['slot-1', 'slot-2'],
      );
      expect(result).toEqual({
        success: true,
        votedSlots: 2,
        voteMode: VoteMode.AVAILABLE,
      });
    });

    it('should vote with UNAVAILABLE mode successfully', async () => {
      const voteDto = {
        selectedSlotIds: ['slot-1'], // slot-1 is unavailable
        voteMode: VoteMode.UNAVAILABLE,
      };

      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue([
        'slot-1',
        'slot-2',
        'slot-3',
      ]);
      mockVoteRepository.submitVoteInTransaction.mockResolvedValue({
        availableSlotIds: ['slot-2', 'slot-3'], // all except slot-1
      });

      const result = await service.vote(eventId, userId, voteDto);

      expect(voteRepository.submitVoteInTransaction).toHaveBeenCalledWith(
        eventId,
        userId,
        ['slot-2', 'slot-3'], // available slots (inverse of unavailable)
      );
      expect(result.voteMode).toBe(VoteMode.UNAVAILABLE);
    });

    it('should use AVAILABLE as default vote mode', async () => {
      const voteDto = {
        selectedSlotIds: ['slot-1'],
        // voteMode not specified
      };

      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue(['slot-1', 'slot-2']);
      mockVoteRepository.submitVoteInTransaction.mockResolvedValue({
        availableSlotIds: ['slot-1'],
      });

      const result = await service.vote(eventId, userId, voteDto);

      expect(result.voteMode).toBe(VoteMode.AVAILABLE);
    });

    it('should throw BadRequestException when event not found', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue(null);

      await expect(
        service.vote(eventId, userId, { selectedSlotIds: [] }),
      ).rejects.toThrow(new BadRequestException('活動不存在'));
    });

    it('should throw BadRequestException when event is deleted', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: true,
      });

      await expect(
        service.vote(eventId, userId, { selectedSlotIds: [] }),
      ).rejects.toThrow(new BadRequestException('活動不存在'));
    });

    it('should throw BadRequestException when voting deadline has passed', async () => {
      const pastDeadline = new Date();
      pastDeadline.setDate(pastDeadline.getDate() - 1);

      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: pastDeadline,
        isDeleted: false,
        timeZone: 'Asia/Taipei',
      });

      await expect(
        service.vote(eventId, userId, { selectedSlotIds: [] }),
      ).rejects.toThrow(new BadRequestException('投票已截止'));
    });

    it('should resolve naive votingDeadline via event.timeZone before comparing to now (hour-scale skew)', async () => {
      // votingDeadline is stored naive: UTC fields carry the wall-clock digits
      // for event.timeZone. Wall-clock digits "08:00" in Asia/Taipei (UTC+8)
      // resolve to real instant 2024-12-24T00:00:00Z. System clock below sits
      // between the real deadline instant and the raw naive digits, so a
      // naive-vs-real comparison (the bug) says "not yet expired" while the
      // correctly resolved comparison says "expired". Uses fake timers so the
      // ambient `new Date()` default is exercised, not an injected override.
      jest.useFakeTimers().setSystemTime(new Date('2024-12-24T04:00:00Z'));
      try {
        const naiveDeadline = new Date('2024-12-24T08:00:00Z');

        mockVoteRepository.findEventVotingInfo.mockResolvedValue({
          votingDeadline: naiveDeadline,
          isDeleted: false,
          timeZone: 'Asia/Taipei',
        });

        await expect(
          service.vote(eventId, userId, { selectedSlotIds: [] }),
        ).rejects.toThrow(new BadRequestException('投票已截止'));
      } finally {
        jest.useRealTimers();
      }
    });

    it('should throw BadRequestException for invalid slot IDs', async () => {
      const voteDto = {
        selectedSlotIds: ['slot-1', 'invalid-slot'],
      };

      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue([
        'slot-1',
        'slot-2',
      ]);

      await expect(service.vote(eventId, userId, voteDto)).rejects.toThrow(
        new BadRequestException('部分時段不屬於此活動'),
      );
    });

    it('should throw ForbiddenException when user is not expected participant', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue(['slot-1']);
      mockVoteRepository.findParticipantVoteStatus.mockResolvedValue(null);

      await expect(
        service.vote(eventId, userId, { selectedSlotIds: ['slot-1'] }),
      ).rejects.toThrow(new ForbiddenException('非活動參與者不可投票'));
    });

    it('should deduplicate selected slot IDs', async () => {
      const voteDto = {
        selectedSlotIds: ['slot-1', 'slot-1', 'slot-2', 'slot-2'],
      };

      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue([
        'slot-1',
        'slot-2',
      ]);
      mockVoteRepository.submitVoteInTransaction.mockResolvedValue({
        availableSlotIds: ['slot-1', 'slot-2'],
      });

      await service.vote(eventId, userId, voteDto);

      expect(voteRepository.submitVoteInTransaction).toHaveBeenCalledWith(
        eventId,
        userId,
        ['slot-1', 'slot-2'], // deduplicated
      );
    });

    it('should allow voting when deadline is in the future', async () => {
      const futureDeadline = new Date();
      futureDeadline.setDate(futureDeadline.getDate() + 7);

      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: futureDeadline,
        isDeleted: false,
        timeZone: 'Asia/Taipei',
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue(['slot-1']);
      mockVoteRepository.submitVoteInTransaction.mockResolvedValue({
        availableSlotIds: ['slot-1'],
      });

      const result = await service.vote(eventId, userId, {
        selectedSlotIds: ['slot-1'],
      });

      expect(result.success).toBe(true);
    });

    it('should handle empty selected slot IDs with AVAILABLE mode', async () => {
      const voteDto = {
        selectedSlotIds: [],
        voteMode: VoteMode.AVAILABLE,
      };

      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue(['slot-1', 'slot-2']);
      mockVoteRepository.submitVoteInTransaction.mockResolvedValue({
        availableSlotIds: [],
      });

      const result = await service.vote(eventId, userId, voteDto);

      expect(voteRepository.submitVoteInTransaction).toHaveBeenCalledWith(
        eventId,
        userId,
        [], // no available slots
      );
      expect(result.votedSlots).toBe(0);
    });

    it('should handle empty selected slot IDs with UNAVAILABLE mode (all slots available)', async () => {
      const voteDto = {
        selectedSlotIds: [], // no unavailable slots
        voteMode: VoteMode.UNAVAILABLE,
      };

      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue(['slot-1', 'slot-2']);
      mockVoteRepository.submitVoteInTransaction.mockResolvedValue({
        availableSlotIds: ['slot-1', 'slot-2'],
      });

      const result = await service.vote(eventId, userId, voteDto);

      expect(voteRepository.submitVoteInTransaction).toHaveBeenCalledWith(
        eventId,
        userId,
        ['slot-1', 'slot-2'], // all slots available
      );
      expect(result.votedSlots).toBe(2);
    });
  });

  describe('updateVotes', () => {
    const eventId = 'event-123';
    const userId = 'user-123';

    it('should return early when no add/remove slot ids', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue([
        'slot-1',
        'slot-2',
      ]);

      const result = await service.updateVotes(eventId, userId, {
        addSlotIds: [],
        removeSlotIds: [],
      });

      expect(result).toEqual({ success: true, added: 0, removed: 0 });
      expect(voteRepository.findEventVotingInfo).toHaveBeenCalledWith(eventId);
      expect(timeSlotRepository.findIdsByEventId).toHaveBeenCalledWith(eventId);
      expect(voteRepository.findParticipantVoteStatus).toHaveBeenCalledWith(
        eventId,
        userId,
      );
      expect(voteRepository.updateVotesInTransaction).not.toHaveBeenCalled();
    });

    it('should update votes successfully', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue([
        'slot-1',
        'slot-2',
        'slot-3',
      ]);
      mockVoteRepository.updateVotesInTransaction.mockResolvedValue({
        addSlotIds: ['slot-1'],
        removeSlotIds: ['slot-2'],
      });

      const result = await service.updateVotes(eventId, userId, {
        addSlotIds: ['slot-1'],
        removeSlotIds: ['slot-2'],
      });

      expect(voteRepository.findEventVotingInfo).toHaveBeenCalledWith(eventId);
      expect(timeSlotRepository.findIdsByEventId).toHaveBeenCalledWith(eventId);
      expect(voteRepository.updateVotesInTransaction).toHaveBeenCalledWith(
        eventId,
        userId,
        ['slot-1'],
        ['slot-2'],
      );
      expect(result).toEqual({ success: true, added: 1, removed: 1 });
    });

    it('should deduplicate add/remove slot ids before updating', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue([
        'slot-1',
        'slot-2',
        'slot-3',
      ]);
      mockVoteRepository.updateVotesInTransaction.mockResolvedValue({
        addSlotIds: ['slot-1'],
        removeSlotIds: ['slot-2'],
      });

      await service.updateVotes(eventId, userId, {
        addSlotIds: ['slot-1', 'slot-1'],
        removeSlotIds: ['slot-2', 'slot-2'],
      });

      expect(voteRepository.updateVotesInTransaction).toHaveBeenCalledWith(
        eventId,
        userId,
        ['slot-1'],
        ['slot-2'],
      );
    });

    it('should throw BadRequestException when event not found', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue(null);

      await expect(
        service.updateVotes(eventId, userId, { addSlotIds: ['slot-1'] }),
      ).rejects.toThrow(new BadRequestException('活動不存在'));
    });

    it('should throw BadRequestException when event is deleted', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: true,
      });

      await expect(
        service.updateVotes(eventId, userId, { addSlotIds: ['slot-1'] }),
      ).rejects.toThrow(new BadRequestException('活動不存在'));
    });

    it('should throw BadRequestException when voting deadline has passed', async () => {
      const pastDeadline = new Date();
      pastDeadline.setDate(pastDeadline.getDate() - 1);

      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: pastDeadline,
        isDeleted: false,
        timeZone: 'Asia/Taipei',
      });

      await expect(
        service.updateVotes(eventId, userId, { addSlotIds: ['slot-1'] }),
      ).rejects.toThrow(new BadRequestException('投票已截止'));
    });

    it('should resolve naive votingDeadline via event.timeZone before comparing to now (hour-scale skew)', async () => {
      // Same discriminating scenario as VoteService#vote — see comment there.
      jest.useFakeTimers().setSystemTime(new Date('2024-12-24T04:00:00Z'));
      try {
        const naiveDeadline = new Date('2024-12-24T08:00:00Z');

        mockVoteRepository.findEventVotingInfo.mockResolvedValue({
          votingDeadline: naiveDeadline,
          isDeleted: false,
          timeZone: 'Asia/Taipei',
        });

        await expect(
          service.updateVotes(eventId, userId, { addSlotIds: ['slot-1'] }),
        ).rejects.toThrow(new BadRequestException('投票已截止'));
      } finally {
        jest.useRealTimers();
      }
    });

    it('should throw BadRequestException for invalid slot IDs', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue([
        'slot-1',
        'slot-2',
      ]);

      await expect(
        service.updateVotes(eventId, userId, {
          addSlotIds: ['slot-1'],
          removeSlotIds: ['invalid-slot'],
        }),
      ).rejects.toThrow(new BadRequestException('部分時段不屬於此活動'));
    });

    it('should throw ForbiddenException when user is not expected participant', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue(['slot-1']);
      mockVoteRepository.findParticipantVoteStatus.mockResolvedValue(null);

      await expect(
        service.updateVotes(eventId, userId, { addSlotIds: ['slot-1'] }),
      ).rejects.toThrow(new ForbiddenException('非活動參與者不可投票'));
    });
  });

  describe('updateStagedVotes', () => {
    const eventId = 'event-123';
    const userId = 'user-123';

    it('should initialize base from unavailable mode defaults for first-time voter', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue([
        'slot-1',
        'slot-2',
        'slot-3',
      ]);
      mockVoteRepository.findUserStagedVote.mockResolvedValue(null);
      mockVoteRepository.findParticipantVoteStatus.mockResolvedValue({
        hasVoted: false,
      });
      mockVoteRepository.upsertStagedVote.mockResolvedValue({});

      const result = await service.updateStagedVotes(eventId, userId, {
        addSlotIds: [],
        removeSlotIds: ['slot-1'],
        voteMode: VoteMode.UNAVAILABLE,
      });

      expect(voteRepository.upsertStagedVote).toHaveBeenCalledWith(
        eventId,
        userId,
        ['slot-2', 'slot-3'],
        ['slot-1', 'slot-2', 'slot-3'],
        mockTransactionClient,
      );
      expect(result).toEqual({ success: true, stagedSlotCount: 2 });
    });

    it('should use existing staged vote as base when staged exists', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue([
        'slot-1',
        'slot-2',
        'slot-3',
      ]);
      mockVoteRepository.findUserStagedVote.mockResolvedValue({
        slotIds: ['slot-1'],
        baselineSlotIds: ['slot-1'],
        updatedAt: new Date(),
      });
      mockVoteRepository.upsertStagedVote.mockResolvedValue({});

      const result = await service.updateStagedVotes(eventId, userId, {
        addSlotIds: ['slot-2'],
        removeSlotIds: [],
        voteMode: VoteMode.AVAILABLE,
      });

      expect(voteRepository.findParticipantVoteStatus).toHaveBeenCalledWith(
        eventId,
        userId,
      );
      expect(voteRepository.findUserCommittedSlotIds).not.toHaveBeenCalled();
      expect(voteRepository.upsertStagedVote).toHaveBeenCalledWith(
        eventId,
        userId,
        ['slot-1', 'slot-2'],
        ['slot-1'],
        mockTransactionClient,
      );
      expect(result).toEqual({ success: true, stagedSlotCount: 2 });
    });

    it('should initialize base from committed votes when hasVoted is true', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue([
        'slot-1',
        'slot-2',
        'slot-3',
      ]);
      mockVoteRepository.findUserStagedVote.mockResolvedValue(null);
      mockVoteRepository.findParticipantVoteStatus.mockResolvedValue({
        hasVoted: true,
      });
      mockVoteRepository.findUserCommittedSlotIds.mockResolvedValue(['slot-1']);
      mockVoteRepository.upsertStagedVote.mockResolvedValue({});

      const result = await service.updateStagedVotes(eventId, userId, {
        addSlotIds: ['slot-3'],
        removeSlotIds: [],
      });

      expect(voteRepository.findUserCommittedSlotIds).toHaveBeenCalledWith(
        eventId,
        userId,
        mockTransactionClient,
      );
      expect(voteRepository.upsertStagedVote).toHaveBeenCalledWith(
        eventId,
        userId,
        ['slot-1', 'slot-3'],
        ['slot-1'],
        mockTransactionClient,
      );
      expect(result).toEqual({ success: true, stagedSlotCount: 2 });
    });

    it('should delete staged vote when update returns to baseline', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue([
        'slot-1',
        'slot-2',
        'slot-3',
      ]);
      mockVoteRepository.findUserStagedVote.mockResolvedValue({
        slotIds: ['slot-1', 'slot-2'],
        baselineSlotIds: ['slot-1'],
        updatedAt: new Date(),
      });
      mockVoteRepository.deleteStagedVote.mockResolvedValue({ count: 1 });

      const result = await service.updateStagedVotes(eventId, userId, {
        addSlotIds: [],
        removeSlotIds: ['slot-2'],
      });

      expect(voteRepository.deleteStagedVote).toHaveBeenCalledWith(
        eventId,
        userId,
        mockTransactionClient,
      );
      expect(voteRepository.upsertStagedVote).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, stagedSlotCount: 0 });
    });

    it('should throw ForbiddenException when user is not expected participant', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue(['slot-1']);
      mockVoteRepository.findParticipantVoteStatus.mockResolvedValue(null);

      await expect(
        service.updateStagedVotes(eventId, userId, { addSlotIds: ['slot-1'] }),
      ).rejects.toThrow(new ForbiddenException('非活動參與者不可投票'));
    });
  });

  describe('updateStagedVotes under concurrent requests', () => {
    const eventId = 'event-123';
    const userId = 'user-123';
    const allSlotIds = ['slot-1', 'slot-2', 'slot-3', 'slot-4'];

    let store: { slotIds: string[]; baselineSlotIds: string[] } | null;

    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

    beforeEach(() => {
      store = null;
      let lockChain: Promise<unknown> = Promise.resolve();

      mockVoteRepository.findEventVotingInfo.mockImplementation(async () => {
        await tick();
        return { votingDeadline: null, isDeleted: false };
      });
      mockTimeSlotRepository.findIdsByEventId.mockImplementation(async () => {
        await tick();
        return allSlotIds;
      });
      mockVoteRepository.findParticipantVoteStatus.mockImplementation(
        async () => {
          await tick();
          return { hasVoted: false };
        },
      );
      mockVoteRepository.findUserStagedVote.mockImplementation(async () => {
        await tick();
        return store ? { ...store, updatedAt: new Date() } : null;
      });
      mockVoteRepository.upsertStagedVote.mockImplementation(
        async (
          _eventId: string,
          _userId: string,
          slotIds: string[],
          baselineSlotIds: string[],
        ) => {
          await tick();
          store = { slotIds, baselineSlotIds };
          return {};
        },
      );
      mockVoteRepository.deleteStagedVote.mockImplementation(async () => {
        await tick();
        store = null;
        return { count: 1 };
      });

      // A real critical section: a second caller's callback does not start
      // until the first one has finished, which is what the advisory lock
      // buys us in Postgres.
      mockVoteRepository.runInStagedVoteLock.mockImplementation(
        async (
          _eventId: string,
          _userId: string,
          fn: (tx: Prisma.TransactionClient) => Promise<unknown>,
        ) => {
          const run = lockChain.then(() => fn(mockTransactionClient));
          lockChain = run.catch(() => undefined);
          return run;
        },
      );
    });

    it('keeps both slots when two clicks overlap', async () => {
      await Promise.all([
        service.updateStagedVotes(eventId, userId, {
          addSlotIds: ['slot-1'],
          removeSlotIds: [],
          voteMode: VoteMode.AVAILABLE,
        }),
        service.updateStagedVotes(eventId, userId, {
          addSlotIds: ['slot-2'],
          removeSlotIds: [],
          voteMode: VoteMode.AVAILABLE,
        }),
      ]);

      expect(store?.slotIds).toEqual(['slot-1', 'slot-2']);
    });

    it('keeps the draft alive when a removal overlaps an addition', async () => {
      await service.updateStagedVotes(eventId, userId, {
        addSlotIds: ['slot-1', 'slot-2', 'slot-3'],
        removeSlotIds: [],
        voteMode: VoteMode.AVAILABLE,
      });

      await Promise.all([
        service.updateStagedVotes(eventId, userId, {
          addSlotIds: ['slot-4'],
          removeSlotIds: [],
          voteMode: VoteMode.AVAILABLE,
        }),
        service.updateStagedVotes(eventId, userId, {
          addSlotIds: [],
          removeSlotIds: ['slot-3'],
          voteMode: VoteMode.AVAILABLE,
        }),
      ]);

      expect(store?.slotIds).toEqual(['slot-1', 'slot-2', 'slot-4']);
    });
  });

  describe('commitStagedVotes', () => {
    const eventId = 'event-123';
    const userId = 'user-123';

    it('should commit staged votes and clear draft', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue([
        'slot-1',
        'slot-2',
      ]);
      mockVoteRepository.findUserStagedVote.mockResolvedValue({
        slotIds: ['slot-1'],
        baselineSlotIds: ['slot-1'],
        updatedAt: new Date(),
      });
      mockVoteRepository.commitStagedVotesInTransaction.mockResolvedValue({
        availableSlotIds: ['slot-1'],
      });

      const result = await service.commitStagedVotes(eventId, userId);

      expect(voteRepository.commitStagedVotesInTransaction).toHaveBeenCalledWith(
        eventId,
        userId,
        ['slot-1'],
      );
      expect(result).toEqual({ success: true, committedSlots: 1 });
    });

    it('should throw ForbiddenException when user is not expected participant', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue(['slot-1']);
      mockVoteRepository.findParticipantVoteStatus.mockResolvedValue(null);

      await expect(service.commitStagedVotes(eventId, userId)).rejects.toThrow(
        new ForbiddenException('非活動參與者不可投票'),
      );
    });

    it('should throw when there is no staged vote to commit', async () => {
      mockVoteRepository.findEventVotingInfo.mockResolvedValue({
        votingDeadline: null,
        isDeleted: false,
      });
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue(['slot-1']);
      mockVoteRepository.findUserStagedVote.mockResolvedValue(null);

      await expect(service.commitStagedVotes(eventId, userId)).rejects.toThrow(
        new BadRequestException('尚無暫存投票可提交'),
      );
    });
  });
});
