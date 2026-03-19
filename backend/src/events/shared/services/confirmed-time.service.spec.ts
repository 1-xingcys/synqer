import { Test, TestingModule } from '@nestjs/testing';
import { EventSlotAxisType, Weekday } from '@prisma/client';
import { ConfirmedTimeService } from './confirmed-time.service';
import {
  ConfirmedSelectionKind,
  ConfirmedTimeSlotData,
} from '../interfaces/confirmed-time.interface';

describe('ConfirmedTimeService', () => {
  let service: ConfirmedTimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfirmedTimeService],
    }).compile();

    service = module.get<ConfirmedTimeService>(ConfirmedTimeService);
  });

  const buildDateSlot = (
    slotId: string,
    date: string,
    startMinute: number,
    endMinute: number,
  ): ConfirmedTimeSlotData => ({
    slotId,
    slot: {
      id: slotId,
      axisType: EventSlotAxisType.DATE,
      axisDate: new Date(date),
      axisWeekday: null,
      startMinute,
      endMinute,
    },
  });

  const buildWeekdaySlot = (
    slotId: string,
    weekday: Weekday,
    startMinute: number,
    endMinute: number,
  ): ConfirmedTimeSlotData => ({
    slotId,
    slot: {
      id: slotId,
      axisType: EventSlotAxisType.WEEKDAY,
      axisDate: null,
      axisWeekday: weekday,
      startMinute,
      endMinute,
    },
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mergeToSelections for one-time slots', () => {
    it('should return empty array for empty input', () => {
      expect(service.mergeToSelections([])).toEqual([]);
      expect(service.mergeToSelections(null as never)).toEqual([]);
      expect(service.mergeToSelections(undefined as never)).toEqual([]);
    });

    it('should map a single date slot to one-time selection', () => {
      expect(
        service.mergeToSelections([
          buildDateSlot('slot-1', '2024-12-25T00:00:00.000Z', 540, 570),
        ]),
      ).toEqual([
        {
          kind: ConfirmedSelectionKind.ONE_TIME_RANGE,
          startTime: new Date('2024-12-25T09:00:00.000Z'),
          endTime: new Date('2024-12-25T09:30:00.000Z'),
          slotIds: ['slot-1'],
        },
      ]);
    });

    it('should merge consecutive slots on the same day', () => {
      expect(
        service.mergeToSelections([
          buildDateSlot('slot-1', '2024-12-25T00:00:00.000Z', 540, 555),
          buildDateSlot('slot-2', '2024-12-25T00:00:00.000Z', 555, 570),
          buildDateSlot('slot-3', '2024-12-25T00:00:00.000Z', 570, 585),
        ]),
      ).toEqual([
        {
          kind: ConfirmedSelectionKind.ONE_TIME_RANGE,
          startTime: new Date('2024-12-25T09:00:00.000Z'),
          endTime: new Date('2024-12-25T09:45:00.000Z'),
          slotIds: ['slot-1', 'slot-2', 'slot-3'],
        },
      ]);
    });

    it('should split non-consecutive or cross-day slots', () => {
      expect(
        service.mergeToSelections([
          buildDateSlot('slot-1', '2024-12-25T00:00:00.000Z', 540, 555),
          buildDateSlot('slot-2', '2024-12-25T00:00:00.000Z', 600, 615),
          buildDateSlot('slot-3', '2024-12-26T00:00:00.000Z', 540, 555),
        ]),
      ).toEqual([
        {
          kind: ConfirmedSelectionKind.ONE_TIME_RANGE,
          startTime: new Date('2024-12-25T09:00:00.000Z'),
          endTime: new Date('2024-12-25T09:15:00.000Z'),
          slotIds: ['slot-1'],
        },
        {
          kind: ConfirmedSelectionKind.ONE_TIME_RANGE,
          startTime: new Date('2024-12-25T10:00:00.000Z'),
          endTime: new Date('2024-12-25T10:15:00.000Z'),
          slotIds: ['slot-2'],
        },
        {
          kind: ConfirmedSelectionKind.ONE_TIME_RANGE,
          startTime: new Date('2024-12-26T09:00:00.000Z'),
          endTime: new Date('2024-12-26T09:15:00.000Z'),
          slotIds: ['slot-3'],
        },
      ]);
    });

    it('should sort date slots before merging', () => {
      expect(
        service.mergeToSelections([
          buildDateSlot('slot-3', '2024-12-25T00:00:00.000Z', 570, 585),
          buildDateSlot('slot-1', '2024-12-25T00:00:00.000Z', 540, 555),
          buildDateSlot('slot-2', '2024-12-25T00:00:00.000Z', 555, 570),
        ]),
      ).toEqual([
        {
          kind: ConfirmedSelectionKind.ONE_TIME_RANGE,
          startTime: new Date('2024-12-25T09:00:00.000Z'),
          endTime: new Date('2024-12-25T09:45:00.000Z'),
          slotIds: ['slot-1', 'slot-2', 'slot-3'],
        },
      ]);
    });
  });

  describe('mergeToSelections for recurring slots', () => {
    it('should merge contiguous weekday slots', () => {
      expect(
        service.mergeToSelections([
          buildWeekdaySlot('slot-2', Weekday.MONDAY, 570, 600),
          buildWeekdaySlot('slot-1', Weekday.MONDAY, 540, 570),
          buildWeekdaySlot('slot-3', Weekday.WEDNESDAY, 600, 630),
        ]),
      ).toEqual([
        {
          kind: ConfirmedSelectionKind.WEEKDAY_RANGE,
          weekday: Weekday.MONDAY,
          startMinute: 540,
          endMinute: 600,
          slotIds: ['slot-1', 'slot-2'],
        },
        {
          kind: ConfirmedSelectionKind.WEEKDAY_RANGE,
          weekday: Weekday.WEDNESDAY,
          startMinute: 600,
          endMinute: 630,
          slotIds: ['slot-3'],
        },
      ]);
    });

    it('should split weekday slots when minutes are not contiguous', () => {
      expect(
        service.mergeToSelections([
          buildWeekdaySlot('slot-1', Weekday.FRIDAY, 540, 570),
          buildWeekdaySlot('slot-2', Weekday.FRIDAY, 600, 630),
        ]),
      ).toEqual([
        {
          kind: ConfirmedSelectionKind.WEEKDAY_RANGE,
          weekday: Weekday.FRIDAY,
          startMinute: 540,
          endMinute: 570,
          slotIds: ['slot-1'],
        },
        {
          kind: ConfirmedSelectionKind.WEEKDAY_RANGE,
          weekday: Weekday.FRIDAY,
          startMinute: 600,
          endMinute: 630,
          slotIds: ['slot-2'],
        },
      ]);
    });

    it('should sort recurring slots by weekday order then start minute', () => {
      expect(
        service.mergeToSelections([
          buildWeekdaySlot('slot-3', Weekday.WEDNESDAY, 600, 630),
          buildWeekdaySlot('slot-2', Weekday.MONDAY, 570, 600),
          buildWeekdaySlot('slot-1', Weekday.MONDAY, 540, 570),
        ]),
      ).toEqual([
        {
          kind: ConfirmedSelectionKind.WEEKDAY_RANGE,
          weekday: Weekday.MONDAY,
          startMinute: 540,
          endMinute: 600,
          slotIds: ['slot-1', 'slot-2'],
        },
        {
          kind: ConfirmedSelectionKind.WEEKDAY_RANGE,
          weekday: Weekday.WEDNESDAY,
          startMinute: 600,
          endMinute: 630,
          slotIds: ['slot-3'],
        },
      ]);
    });
  });
});
