import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfirmationService } from './confirmation.service';
import { ConfirmationRepository } from '../repositories/confirmation.repository';
import { EventStatusService } from '../../shared/services/event-status.service';
import { EventAuthorizationService } from '../../shared/services/event-authorization.service';
import { TimeSlotRepository } from '../../shared/repositories/time-slot.repository';

describe('ConfirmationService', () => {
  let service: ConfirmationService;
  let confirmationRepository: jest.Mocked<ConfirmationRepository>;
  let eventStatusService: jest.Mocked<EventStatusService>;
  let eventAuthorizationService: jest.Mocked<EventAuthorizationService>;
  let timeSlotRepository: jest.Mocked<TimeSlotRepository>;

  const mockConfirmationRepository = {
    findSlotsByIdsAndEventId: jest.fn(),
    updateConfirmedSlotsInTransaction: jest.fn(),
    findEventWithConfirmedSlots: jest.fn(),
    deleteAllConfirmedSlots: jest.fn(),
    findEventBasicInfo: jest.fn(),
    findConfirmedSlotIds: jest.fn(),
    findStagedConfirmation: jest.fn(),
    upsertStagedConfirmation: jest.fn(),
    deleteStagedConfirmation: jest.fn(),
    commitStagedConfirmationInTransaction: jest.fn(),
  };

  const mockEventStatusService = {
    computeEventStatus: jest.fn(),
  };

  const mockEventAuthorizationService = {
    verifyOwner: jest.fn(),
  };

  const mockTimeSlotRepository = {
    findIdsByEventId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmationService,
        { provide: ConfirmationRepository, useValue: mockConfirmationRepository },
        { provide: EventStatusService, useValue: mockEventStatusService },
        { provide: EventAuthorizationService, useValue: mockEventAuthorizationService },
        { provide: TimeSlotRepository, useValue: mockTimeSlotRepository },
      ],
    }).compile();

    service = module.get<ConfirmationService>(ConfirmationService);
    confirmationRepository = module.get(ConfirmationRepository);
    eventStatusService = module.get(EventStatusService);
    eventAuthorizationService = module.get(EventAuthorizationService);
    timeSlotRepository = module.get(TimeSlotRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('confirmEventTime', () => {
    const eventId = 'event-123';
    const userId = 'user-123';
    const dto = { slotIds: ['slot-1', 'slot-2'] };

    it('should confirm event time successfully', async () => {
      const mockSlots = [
        { id: 'slot-1', eventId },
        { id: 'slot-2', eventId },
      ];
      const mockUpdatedEvent = {
        id: eventId,
        votingDeadline: new Date('2024-12-31'),
        confirmedTimeSlots: [
          {
            slotId: 'slot-1',
            slot: {
              date: new Date('2024-12-25'),
              startMinute: 540,
              endMinute: 600,
            },
          },
          {
            slotId: 'slot-2',
            slot: {
              date: new Date('2024-12-25'),
              startMinute: 600,
              endMinute: 660,
            },
          },
        ],
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockConfirmationRepository.findSlotsByIdsAndEventId.mockResolvedValue(mockSlots);
      mockConfirmationRepository.updateConfirmedSlotsInTransaction.mockResolvedValue(undefined);
      mockConfirmationRepository.findEventWithConfirmedSlots.mockResolvedValue(mockUpdatedEvent);
      mockEventStatusService.computeEventStatus.mockReturnValue('CONFIRMED');

      const result = await service.confirmEventTime(eventId, userId, dto);

      expect(eventAuthorizationService.verifyOwner).toHaveBeenCalledWith(eventId, userId);
      expect(confirmationRepository.findSlotsByIdsAndEventId).toHaveBeenCalledWith(eventId, ['slot-1', 'slot-2']);
      expect(confirmationRepository.updateConfirmedSlotsInTransaction).toHaveBeenCalledWith(eventId, ['slot-1', 'slot-2']);
      expect(result).toEqual({
        id: eventId,
        confirmedSlotIds: ['slot-1', 'slot-2'],
        status: 'CONFIRMED',
      });
    });

    it('should deduplicate slot IDs', async () => {
      const dtoWithDuplicates = { slotIds: ['slot-1', 'slot-1', 'slot-2', 'slot-2'] };
      const mockSlots = [
        { id: 'slot-1', eventId },
        { id: 'slot-2', eventId },
      ];
      const mockUpdatedEvent = {
        id: eventId,
        votingDeadline: null,
        confirmedTimeSlots: [
          {
            slotId: 'slot-1',
            slot: {
              date: new Date('2024-12-25'),
              startMinute: 540,
              endMinute: 600,
            },
          },
          {
            slotId: 'slot-2',
            slot: {
              date: new Date('2024-12-25'),
              startMinute: 600,
              endMinute: 660,
            },
          },
        ],
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockConfirmationRepository.findSlotsByIdsAndEventId.mockResolvedValue(mockSlots);
      mockConfirmationRepository.updateConfirmedSlotsInTransaction.mockResolvedValue(undefined);
      mockConfirmationRepository.findEventWithConfirmedSlots.mockResolvedValue(mockUpdatedEvent);
      mockEventStatusService.computeEventStatus.mockReturnValue('CONFIRMED');

      await service.confirmEventTime(eventId, userId, dtoWithDuplicates);

      expect(confirmationRepository.findSlotsByIdsAndEventId).toHaveBeenCalledWith(eventId, ['slot-1', 'slot-2']);
    });

    it('should throw BadRequestException when some slot IDs are invalid', async () => {
      const mockSlots = [{ id: 'slot-1', eventId }]; // Only one slot found

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockConfirmationRepository.findSlotsByIdsAndEventId.mockResolvedValue(mockSlots);

      await expect(service.confirmEventTime(eventId, userId, dto)).rejects.toThrow(
        new BadRequestException('Some slot IDs are invalid or do not belong to this event'),
      );
    });

    it('should throw BadRequestException when event not found after update', async () => {
      const mockSlots = [
        { id: 'slot-1', eventId },
        { id: 'slot-2', eventId },
      ];

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockConfirmationRepository.findSlotsByIdsAndEventId.mockResolvedValue(mockSlots);
      mockConfirmationRepository.updateConfirmedSlotsInTransaction.mockResolvedValue(undefined);
      mockConfirmationRepository.findEventWithConfirmedSlots.mockResolvedValue(null);

      await expect(service.confirmEventTime(eventId, userId, dto)).rejects.toThrow(
        new BadRequestException('Event not found'),
      );
    });
  });

  describe('cancelConfirmedTime', () => {
    const eventId = 'event-123';
    const userId = 'user-123';

    it('should cancel confirmed time successfully', async () => {
      const mockUpdatedEvent = {
        id: eventId,
        votingDeadline: new Date('2024-12-31'),
      };

      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockConfirmationRepository.deleteAllConfirmedSlots.mockResolvedValue({ count: 2 });
      mockConfirmationRepository.findEventBasicInfo.mockResolvedValue(mockUpdatedEvent);
      mockEventStatusService.computeEventStatus.mockReturnValue('VOTING_ENDED');

      const result = await service.cancelConfirmedTime(eventId, userId);

      expect(eventAuthorizationService.verifyOwner).toHaveBeenCalledWith(eventId, userId);
      expect(confirmationRepository.deleteAllConfirmedSlots).toHaveBeenCalledWith(eventId);
      expect(eventStatusService.computeEventStatus).toHaveBeenCalledWith({
        votingDeadline: mockUpdatedEvent.votingDeadline,
        confirmedTimeSlots: [],
      });
      expect(result).toEqual({
        id: eventId,
        status: 'VOTING_ENDED',
      });
    });

    it('should throw BadRequestException when event not found', async () => {
      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockConfirmationRepository.deleteAllConfirmedSlots.mockResolvedValue({ count: 0 });
      mockConfirmationRepository.findEventBasicInfo.mockResolvedValue(null);

      await expect(service.cancelConfirmedTime(eventId, userId)).rejects.toThrow(
        new BadRequestException('Event not found'),
      );
    });
  });

  describe('updateStagedConfirmation', () => {
    const eventId = 'event-123';
    const userId = 'user-123';

    it('should create staged confirmation draft from confirmed slots', async () => {
      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue([
        'slot-1',
        'slot-2',
        'slot-3',
      ]);
      mockConfirmationRepository.findStagedConfirmation.mockResolvedValue(null);
      mockConfirmationRepository.findConfirmedSlotIds.mockResolvedValue(['slot-1']);

      const result = await service.updateStagedConfirmation(eventId, userId, {
        addSlotIds: ['slot-2'],
      });

      expect(timeSlotRepository.findIdsByEventId).toHaveBeenCalledWith(eventId);
      expect(confirmationRepository.upsertStagedConfirmation).toHaveBeenCalledWith(
        eventId,
        ['slot-1', 'slot-2'],
        ['slot-1'],
      );
      expect(result).toEqual({
        success: true,
        stagedSlotCount: 2,
      });
    });
  });

  describe('commitStagedConfirmation', () => {
    const eventId = 'event-123';
    const userId = 'user-123';

    it('should commit staged confirmation successfully', async () => {
      mockEventAuthorizationService.verifyOwner.mockResolvedValue(undefined);
      mockTimeSlotRepository.findIdsByEventId.mockResolvedValue(['slot-1', 'slot-2']);
      mockConfirmationRepository.findStagedConfirmation.mockResolvedValue({
        slotIds: ['slot-1'],
        baselineSlotIds: [],
        updatedAt: new Date('2026-03-14T00:00:00.000Z'),
      });
      mockConfirmationRepository.commitStagedConfirmationInTransaction.mockResolvedValue(
        undefined,
      );
      mockConfirmationRepository.findEventWithConfirmedSlots.mockResolvedValue({
        id: eventId,
        votingDeadline: null,
        confirmedTimeSlots: [
          {
            slotId: 'slot-1',
            slot: {
              date: new Date('2026-03-20'),
              startMinute: 540,
              endMinute: 600,
            },
          },
        ],
      });
      mockEventStatusService.computeEventStatus.mockReturnValue('CONFIRMED');

      const result = await service.commitStagedConfirmation(eventId, userId);

      expect(confirmationRepository.commitStagedConfirmationInTransaction).toHaveBeenCalledWith(
        eventId,
        ['slot-1'],
      );
      expect(result).toEqual({
        id: eventId,
        confirmedSlotIds: ['slot-1'],
        status: 'CONFIRMED',
      });
    });
  });
});
