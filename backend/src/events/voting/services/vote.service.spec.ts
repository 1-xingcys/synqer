import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { VoteService } from './vote.service';
import { VoteRepository } from '../repositories/vote.repository';
import { TimeSlotRepository } from '../../shared/repositories/time-slot.repository';
import { VoteMode } from '../dto/vote-event.dto';

describe('VoteService', () => {
  let service: VoteService;
  let voteRepository: jest.Mocked<VoteRepository>;
  let timeSlotRepository: jest.Mocked<TimeSlotRepository>;

  const mockVoteRepository = {
    findEventVotingInfo: jest.fn(),
    submitVoteInTransaction: jest.fn(),
    updateVotesInTransaction: jest.fn(),
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
      });

      await expect(
        service.vote(eventId, userId, { selectedSlotIds: [] }),
      ).rejects.toThrow(new BadRequestException('投票已截止'));
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
      const result = await service.updateVotes(eventId, userId, {
        addSlotIds: [],
        removeSlotIds: [],
      });

      expect(result).toEqual({ success: true, added: 0, removed: 0 });
      expect(voteRepository.findEventVotingInfo).not.toHaveBeenCalled();
      expect(timeSlotRepository.findIdsByEventId).not.toHaveBeenCalled();
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
      });

      await expect(
        service.updateVotes(eventId, userId, { addSlotIds: ['slot-1'] }),
      ).rejects.toThrow(new BadRequestException('投票已截止'));
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
  });
});
