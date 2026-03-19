import { Test, TestingModule } from '@nestjs/testing';
import { Weekday } from '@prisma/client';
import { ConfirmedTimeService } from './confirmed-time.service';
import {
  ConfirmedSelectionKind,
  ConfirmedTimeSlotData,
  ConfirmedTimeRange,
} from '../interfaces/confirmed-time.interface';

describe('ConfirmedTimeService', () => {
  let service: ConfirmedTimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfirmedTimeService],
    }).compile();

    service = module.get<ConfirmedTimeService>(ConfirmedTimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mergeToTimeRanges', () => {
    it('should return empty array when input is empty', () => {
      expect(service.mergeToTimeRanges([])).toEqual([]);
    });

    it('should return empty array when input is null/undefined', () => {
      expect(service.mergeToTimeRanges(null as any)).toEqual([]);
      expect(service.mergeToTimeRanges(undefined as any)).toEqual([]);
    });

    it('should return single range for single slot', () => {
      const slots: ConfirmedTimeSlotData[] = [
        {
          slotId: 'slot-1',
          slot: {
            id: 'slot-1',
            date: new Date('2024-12-25T00:00:00.000Z'),
            startMinute: 540, // 09:00
            endMinute: 555, // 09:15
          },
        },
      ];

      const result = service.mergeToTimeRanges(slots);

      expect(result).toHaveLength(1);
      expect(result[0].slotIds).toEqual(['slot-1']);
      expect(result[0].startTime.getUTCHours()).toBe(9);
      expect(result[0].startTime.getUTCMinutes()).toBe(0);
      expect(result[0].endTime.getUTCHours()).toBe(9);
      expect(result[0].endTime.getUTCMinutes()).toBe(15);
    });

    it('should merge consecutive slots on same day', () => {
      const slots: ConfirmedTimeSlotData[] = [
        {
          slotId: 'slot-1',
          slot: {
            id: 'slot-1',
            date: new Date('2024-12-25T00:00:00.000Z'),
            startMinute: 540, // 09:00
            endMinute: 555, // 09:15
          },
        },
        {
          slotId: 'slot-2',
          slot: {
            id: 'slot-2',
            date: new Date('2024-12-25T00:00:00.000Z'),
            startMinute: 555, // 09:15
            endMinute: 570, // 09:30
          },
        },
        {
          slotId: 'slot-3',
          slot: {
            id: 'slot-3',
            date: new Date('2024-12-25T00:00:00.000Z'),
            startMinute: 570, // 09:30
            endMinute: 585, // 09:45
          },
        },
      ];

      const result = service.mergeToTimeRanges(slots);

      expect(result).toHaveLength(1);
      expect(result[0].slotIds).toEqual(['slot-1', 'slot-2', 'slot-3']);
      expect(result[0].startTime.getUTCHours()).toBe(9);
      expect(result[0].startTime.getUTCMinutes()).toBe(0);
      expect(result[0].endTime.getUTCHours()).toBe(9);
      expect(result[0].endTime.getUTCMinutes()).toBe(45);
    });

    it('should not merge non-consecutive slots on same day', () => {
      const slots: ConfirmedTimeSlotData[] = [
        {
          slotId: 'slot-1',
          slot: {
            id: 'slot-1',
            date: new Date('2024-12-25T00:00:00.000Z'),
            startMinute: 540, // 09:00
            endMinute: 555, // 09:15
          },
        },
        {
          slotId: 'slot-2',
          slot: {
            id: 'slot-2',
            date: new Date('2024-12-25T00:00:00.000Z'),
            startMinute: 600, // 10:00 (gap)
            endMinute: 615, // 10:15
          },
        },
      ];

      const result = service.mergeToTimeRanges(slots);

      expect(result).toHaveLength(2);
      expect(result[0].slotIds).toEqual(['slot-1']);
      expect(result[1].slotIds).toEqual(['slot-2']);
    });

    it('should not merge slots on different days', () => {
      const slots: ConfirmedTimeSlotData[] = [
        {
          slotId: 'slot-1',
          slot: {
            id: 'slot-1',
            date: new Date('2024-12-25T00:00:00.000Z'),
            startMinute: 540, // 09:00
            endMinute: 555, // 09:15
          },
        },
        {
          slotId: 'slot-2',
          slot: {
            id: 'slot-2',
            date: new Date('2024-12-26T00:00:00.000Z'),
            startMinute: 540, // 09:00 next day
            endMinute: 555, // 09:15
          },
        },
      ];

      const result = service.mergeToTimeRanges(slots);

      expect(result).toHaveLength(2);
      expect(result[0].slotIds).toEqual(['slot-1']);
      expect(result[1].slotIds).toEqual(['slot-2']);
    });

    it('should sort slots before merging', () => {
      const slots: ConfirmedTimeSlotData[] = [
        {
          slotId: 'slot-3',
          slot: {
            id: 'slot-3',
            date: new Date('2024-12-25T00:00:00.000Z'),
            startMinute: 570, // 09:30
            endMinute: 585, // 09:45
          },
        },
        {
          slotId: 'slot-1',
          slot: {
            id: 'slot-1',
            date: new Date('2024-12-25T00:00:00.000Z'),
            startMinute: 540, // 09:00
            endMinute: 555, // 09:15
          },
        },
        {
          slotId: 'slot-2',
          slot: {
            id: 'slot-2',
            date: new Date('2024-12-25T00:00:00.000Z'),
            startMinute: 555, // 09:15
            endMinute: 570, // 09:30
          },
        },
      ];

      const result = service.mergeToTimeRanges(slots);

      expect(result).toHaveLength(1);
      expect(result[0].slotIds).toEqual(['slot-1', 'slot-2', 'slot-3']);
    });

    it('should handle multiple ranges with mixed consecutive and non-consecutive slots', () => {
      const slots: ConfirmedTimeSlotData[] = [
        {
          slotId: 'slot-1',
          slot: {
            id: 'slot-1',
            date: new Date('2024-12-25T00:00:00.000Z'),
            startMinute: 540, // 09:00
            endMinute: 555, // 09:15
          },
        },
        {
          slotId: 'slot-2',
          slot: {
            id: 'slot-2',
            date: new Date('2024-12-25T00:00:00.000Z'),
            startMinute: 555, // 09:15
            endMinute: 570, // 09:30
          },
        },
        {
          slotId: 'slot-3',
          slot: {
            id: 'slot-3',
            date: new Date('2024-12-25T00:00:00.000Z'),
            startMinute: 840, // 14:00 (gap)
            endMinute: 855, // 14:15
          },
        },
        {
          slotId: 'slot-4',
          slot: {
            id: 'slot-4',
            date: new Date('2024-12-25T00:00:00.000Z'),
            startMinute: 855, // 14:15
            endMinute: 870, // 14:30
          },
        },
      ];

      const result = service.mergeToTimeRanges(slots);

      expect(result).toHaveLength(2);
      expect(result[0].slotIds).toEqual(['slot-1', 'slot-2']);
      expect(result[0].startTime.getUTCHours()).toBe(9);
      expect(result[0].endTime.getUTCHours()).toBe(9);
      expect(result[0].endTime.getUTCMinutes()).toBe(30);
      expect(result[1].slotIds).toEqual(['slot-3', 'slot-4']);
      expect(result[1].startTime.getUTCHours()).toBe(14);
      expect(result[1].endTime.getUTCHours()).toBe(14);
      expect(result[1].endTime.getUTCMinutes()).toBe(30);
    });
  });

  describe('formatTimeRange', () => {
    it('should format same day range correctly', () => {
      const range: ConfirmedTimeRange = {
        startTime: new Date('2024-12-25T09:00:00.000Z'),
        endTime: new Date('2024-12-25T10:30:00.000Z'),
        slotIds: ['slot-1'],
      };

      const result = service.formatTimeRange(range);

      expect(result).toBe('12/25 09:00 - 10:30');
    });

    it('should format cross-day range correctly', () => {
      const range: ConfirmedTimeRange = {
        startTime: new Date('2024-12-25T22:00:00.000Z'),
        endTime: new Date('2024-12-26T01:00:00.000Z'),
        slotIds: ['slot-1'],
      };

      const result = service.formatTimeRange(range);

      expect(result).toBe('12/25 22:00 - 12/26 01:00');
    });
  });

  describe('formatTimeRangesSummary', () => {
    it('should return empty string for empty array', () => {
      expect(service.formatTimeRangesSummary([])).toBe('');
    });

    it('should format single range', () => {
      const ranges: ConfirmedTimeRange[] = [
        {
          startTime: new Date('2024-12-25T09:00:00.000Z'),
          endTime: new Date('2024-12-25T10:00:00.000Z'),
          slotIds: ['slot-1'],
        },
      ];

      const result = service.formatTimeRangesSummary(ranges);

      expect(result).toBe('12/25 09:00 - 10:00');
    });

    it('should format multiple ranges', () => {
      const ranges: ConfirmedTimeRange[] = [
        {
          startTime: new Date('2024-12-25T09:00:00.000Z'),
          endTime: new Date('2024-12-25T10:00:00.000Z'),
          slotIds: ['slot-1'],
        },
        {
          startTime: new Date('2024-12-25T14:00:00.000Z'),
          endTime: new Date('2024-12-25T15:00:00.000Z'),
          slotIds: ['slot-2'],
        },
      ];

      const result = service.formatTimeRangesSummary(ranges);

      expect(result).toBe('12/25 09:00 - 10:00\n12/25 14:00 - 15:00');
    });

    it('should truncate with maxDisplay', () => {
      const ranges: ConfirmedTimeRange[] = [
        {
          startTime: new Date('2024-12-25T09:00:00.000Z'),
          endTime: new Date('2024-12-25T10:00:00.000Z'),
          slotIds: ['slot-1'],
        },
        {
          startTime: new Date('2024-12-25T14:00:00.000Z'),
          endTime: new Date('2024-12-25T15:00:00.000Z'),
          slotIds: ['slot-2'],
        },
        {
          startTime: new Date('2024-12-26T09:00:00.000Z'),
          endTime: new Date('2024-12-26T10:00:00.000Z'),
          slotIds: ['slot-3'],
        },
      ];

      const result = service.formatTimeRangesSummary(ranges, 2);

      expect(result).toBe(
        '12/25 09:00 - 10:00\n12/25 14:00 - 15:00\n(+1 個時段)',
      );
    });

    it('should not truncate when maxDisplay is greater than or equal to ranges length', () => {
      const ranges: ConfirmedTimeRange[] = [
        {
          startTime: new Date('2024-12-25T09:00:00.000Z'),
          endTime: new Date('2024-12-25T10:00:00.000Z'),
          slotIds: ['slot-1'],
        },
        {
          startTime: new Date('2024-12-25T14:00:00.000Z'),
          endTime: new Date('2024-12-25T15:00:00.000Z'),
          slotIds: ['slot-2'],
        },
      ];

      const result = service.formatTimeRangesSummary(ranges, 3);

      expect(result).toBe('12/25 09:00 - 10:00\n12/25 14:00 - 15:00');
    });
  });

  describe('mergeToSelections', () => {
    it('should map one-time slots to one-time selections', () => {
      const slots: ConfirmedTimeSlotData[] = [
        {
          slotId: 'slot-1',
          slot: {
            id: 'slot-1',
            date: new Date('2024-12-25T00:00:00.000Z'),
            startMinute: 540,
            endMinute: 570,
          },
        },
      ];

      expect(service.mergeToSelections(slots)).toEqual([
        {
          kind: ConfirmedSelectionKind.ONE_TIME_RANGE,
          startTime: new Date('2024-12-25T09:00:00.000Z'),
          endTime: new Date('2024-12-25T09:30:00.000Z'),
          slotIds: ['slot-1'],
        },
      ]);
    });

    it('should merge recurring slots by weekday and contiguous minutes', () => {
      const slots: ConfirmedTimeSlotData[] = [
        {
          slotId: 'slot-2',
          slot: {
            id: 'slot-2',
            date: new Date('2000-01-03T00:00:00.000Z'),
            axisType: 'WEEKDAY',
            axisWeekday: Weekday.MONDAY,
            startMinute: 570,
            endMinute: 600,
          },
        },
        {
          slotId: 'slot-1',
          slot: {
            id: 'slot-1',
            date: new Date('2000-01-03T00:00:00.000Z'),
            axisType: 'WEEKDAY',
            axisWeekday: Weekday.MONDAY,
            startMinute: 540,
            endMinute: 570,
          },
        },
        {
          slotId: 'slot-3',
          slot: {
            id: 'slot-3',
            date: new Date('2000-01-05T00:00:00.000Z'),
            axisType: 'WEEKDAY',
            axisWeekday: Weekday.WEDNESDAY,
            startMinute: 600,
            endMinute: 630,
          },
        },
      ];

      expect(service.mergeToSelections(slots)).toEqual([
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
