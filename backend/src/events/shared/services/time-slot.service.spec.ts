import { Test, TestingModule } from '@nestjs/testing';
import { TimeSlotService } from './time-slot.service';

describe('TimeSlotService', () => {
  let service: TimeSlotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeSlotService],
    }).compile();

    service = module.get<TimeSlotService>(TimeSlotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseTimeToMinutes', () => {
    it('should parse "00:00" to 0', () => {
      expect(service.parseTimeToMinutes('00:00')).toBe(0);
    });

    it('should parse "09:00" to 540', () => {
      expect(service.parseTimeToMinutes('09:00')).toBe(540);
    });

    it('should parse "12:30" to 750', () => {
      expect(service.parseTimeToMinutes('12:30')).toBe(750);
    });

    it('should parse "18:00" to 1080', () => {
      expect(service.parseTimeToMinutes('18:00')).toBe(1080);
    });

    it('should parse "23:59" to 1439', () => {
      expect(service.parseTimeToMinutes('23:59')).toBe(1439);
    });
  });

  describe('generateTimeSlots', () => {
    it('should generate slots for a single day', () => {
      const startDate = new Date('2024-12-25');
      const endDate = new Date('2024-12-25');
      const startMinuteOfDay = 540; // 09:00
      const endMinuteOfDay = 600; // 10:00
      const slotDurationMin = 15;

      const result = service.generateTimeSlots(
        startDate,
        endDate,
        startMinuteOfDay,
        endMinuteOfDay,
        slotDurationMin,
      );

      expect(result).toHaveLength(4); // 4 x 15min slots = 60min
      expect(result[0]).toEqual({
        date: expect.any(Date),
        startMinute: 540,
        endMinute: 555,
      });
      expect(result[1]).toEqual({
        date: expect.any(Date),
        startMinute: 555,
        endMinute: 570,
      });
      expect(result[2]).toEqual({
        date: expect.any(Date),
        startMinute: 570,
        endMinute: 585,
      });
      expect(result[3]).toEqual({
        date: expect.any(Date),
        startMinute: 585,
        endMinute: 600,
      });
    });

    it('should generate slots for multiple days', () => {
      const startDate = new Date('2024-12-25');
      const endDate = new Date('2024-12-26');
      const startMinuteOfDay = 540;
      const endMinuteOfDay = 570; // 30 minutes
      const slotDurationMin = 15;

      const result = service.generateTimeSlots(
        startDate,
        endDate,
        startMinuteOfDay,
        endMinuteOfDay,
        slotDurationMin,
      );

      expect(result).toHaveLength(4); // 2 slots per day x 2 days
    });

    it('should handle slot duration that does not divide evenly', () => {
      const startDate = new Date('2024-12-25');
      const endDate = new Date('2024-12-25');
      const startMinuteOfDay = 540; // 09:00
      const endMinuteOfDay = 580; // 09:40 (40 minutes total)
      const slotDurationMin = 15;

      const result = service.generateTimeSlots(
        startDate,
        endDate,
        startMinuteOfDay,
        endMinuteOfDay,
        slotDurationMin,
      );

      expect(result).toHaveLength(3);
      expect(result[0].endMinute).toBe(555); // 09:15
      expect(result[1].endMinute).toBe(570); // 09:30
      expect(result[2].endMinute).toBe(580); // 09:40 (partial slot)
    });

    it('should return empty array when start time equals end time', () => {
      const startDate = new Date('2024-12-25');
      const endDate = new Date('2024-12-25');
      const startMinuteOfDay = 540;
      const endMinuteOfDay = 540;
      const slotDurationMin = 15;

      const result = service.generateTimeSlots(
        startDate,
        endDate,
        startMinuteOfDay,
        endMinuteOfDay,
        slotDurationMin,
      );

      expect(result).toHaveLength(0);
    });

    it('should handle full day slots', () => {
      const startDate = new Date('2024-12-25');
      const endDate = new Date('2024-12-25');
      const startMinuteOfDay = 0;
      const endMinuteOfDay = 1440; // 24:00
      const slotDurationMin = 60;

      const result = service.generateTimeSlots(
        startDate,
        endDate,
        startMinuteOfDay,
        endMinuteOfDay,
        slotDurationMin,
      );

      expect(result).toHaveLength(24); // 24 hours
    });

    it('should generate unique dates for each day', () => {
      const startDate = new Date('2024-12-25');
      const endDate = new Date('2024-12-27');
      const startMinuteOfDay = 540;
      const endMinuteOfDay = 555;
      const slotDurationMin = 15;

      const result = service.generateTimeSlots(
        startDate,
        endDate,
        startMinuteOfDay,
        endMinuteOfDay,
        slotDurationMin,
      );

      expect(result).toHaveLength(3); // 1 slot per day x 3 days

      const dates = result.map((s) => s.date.toISOString().split('T')[0]);
      expect(dates[0]).toBe('2024-12-25');
      expect(dates[1]).toBe('2024-12-26');
      expect(dates[2]).toBe('2024-12-27');
    });
  });
});
