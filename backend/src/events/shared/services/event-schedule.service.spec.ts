import { EventType, Weekday } from '@prisma/client';
import { EventScheduleService } from './event-schedule.service';

describe('EventScheduleService', () => {
  let service: EventScheduleService;

  beforeEach(() => {
    service = new EventScheduleService();
  });

  describe('resolveSchedule', () => {
    it('should resolve one-time schedules from oneTimeSchedule only', () => {
      const result = service.resolveSchedule({
        type: EventType.ONE_TIME,
        oneTimeSchedule: {
          startDate: new Date('2024-02-01T00:00:00.000Z'),
          endDate: new Date('2024-02-02T00:00:00.000Z'),
          startMinuteOfDay: 540,
          endMinuteOfDay: 600,
          slotDurationMin: 15,
        },
        recurringSchedule: null,
      });

      expect(result).toEqual({
        type: EventType.ONE_TIME,
        startDate: new Date('2024-02-01T00:00:00.000Z'),
        endDate: new Date('2024-02-02T00:00:00.000Z'),
        startMinuteOfDay: 540,
        endMinuteOfDay: 600,
        slotDurationMin: 15,
      });
    });

    it('should throw when one-time schedule data is missing', () => {
      expect(() =>
        service.resolveSchedule({
          type: EventType.ONE_TIME,
          oneTimeSchedule: null,
          recurringSchedule: null,
        }),
      ).toThrow('One-time event is missing oneTimeSchedule');
    });

    it('should resolve recurring schedules', () => {
      const result = service.resolveSchedule({
        type: EventType.RECURRING,
        oneTimeSchedule: null,
        recurringSchedule: {
          weekdays: [Weekday.MONDAY, Weekday.WEDNESDAY],
          startMinuteOfDay: 1140,
          endMinuteOfDay: 1260,
          slotDurationMin: 30,
        },
      });

      expect(result).toEqual({
        type: EventType.RECURRING,
        weekdays: [Weekday.MONDAY, Weekday.WEDNESDAY],
        startMinuteOfDay: 1140,
        endMinuteOfDay: 1260,
        slotDurationMin: 30,
      });
    });
  });

  describe('getCalendarRange', () => {
    it('should return null for recurring events', () => {
      expect(
        service.getCalendarRange({
          type: EventType.RECURRING,
          oneTimeSchedule: null,
          recurringSchedule: {
            weekdays: [Weekday.FRIDAY],
            startMinuteOfDay: 540,
            endMinuteOfDay: 600,
            slotDurationMin: 15,
          },
        }),
      ).toBeNull();
    });

    it('should return one-time calendar range with 1 day buffer', () => {
      expect(
        service.getCalendarRange({
          type: EventType.ONE_TIME,
          oneTimeSchedule: {
            startDate: new Date('2024-02-01T00:00:00.000Z'),
            endDate: new Date('2024-02-03T00:00:00.000Z'),
            startMinuteOfDay: 540,
            endMinuteOfDay: 600,
            slotDurationMin: 15,
          },
          recurringSchedule: null,
        }),
      ).toEqual({
        timeMin: new Date('2024-02-01T00:00:00.000Z'),
        timeMax: new Date('2024-02-04T00:00:00.000Z'),
      });
    });
  });
});
