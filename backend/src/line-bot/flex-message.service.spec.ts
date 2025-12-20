import { Test, TestingModule } from '@nestjs/testing';
import { FlexMessageService, EventInfo } from './flex-message.service';
import { EventStatus } from '../events/services/event-status.service';

describe('FlexMessageService', () => {
  let service: FlexMessageService;
  const originalEnv = process.env;

  beforeEach(async () => {
    // 設定測試環境變數
    process.env = {
      ...originalEnv,
      LINE_LIFF_URL: 'https://liff.line.me/test-liff-id',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FlexMessageService],
    }).compile();

    service = module.get<FlexMessageService>(FlexMessageService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildEventFlexMessage', () => {
    const baseEvent: EventInfo = {
      id: 'event-1',
      title: 'Test Event',
      description: 'Test Description',
      status: EventStatus.VOTING,
      votingDeadline: new Date('2025-12-31T23:59:59Z'),
      confirmedStartTime: null,
      confirmedEndTime: null,
      host: {
        displayName: 'Test Host',
        pictureUrl: 'https://example.com/avatar.jpg',
      },
      votingStats: {
        totalExpected: 10,
        totalVoted: 5,
        votingPercentage: 50,
      },
    };

    it('should build a flex message with correct structure', () => {
      const result = service.buildEventFlexMessage(baseEvent);

      expect(result).toHaveProperty('type', 'flex');
      expect(result).toHaveProperty('altText', '活動：Test Event');
      expect(result).toHaveProperty('contents');
      expect(result.contents).toHaveProperty('type', 'bubble');
    });

    it('should use "未命名活動" for events without title', () => {
      const eventWithoutTitle = { ...baseEvent, title: null };
      const result = service.buildEventFlexMessage(eventWithoutTitle);

      expect(result.altText).toBe('活動：未命名活動');
    });

    describe('VOTING status', () => {
      it('should display voting deadline for VOTING status', () => {
        const result = service.buildEventFlexMessage(baseEvent);
        const body = (result.contents as any).body;

        // 檢查 body 中包含時間資訊
        expect(body).toBeDefined();
        expect(body.contents).toBeDefined();
      });

      it('should display voting stats for VOTING status', () => {
        const result = service.buildEventFlexMessage(baseEvent);
        const body = (result.contents as any).body;

        // 確保有投票統計區塊
        expect(body.contents.length).toBeGreaterThan(0);
      });

      it('should have "前往投票" button for VOTING status', () => {
        const result = service.buildEventFlexMessage(baseEvent);
        const footer = (result.contents as any).footer;

        expect(footer).toBeDefined();
        const button = footer.contents[0];
        expect(button.action.label).toBe('前往投票');
        expect(button.action.uri).toBe('https://liff.line.me/test-liff-id/joined/event-1');
      });
    });

    describe('VOTING_ENDED status', () => {
      const votingEndedEvent: EventInfo = {
        ...baseEvent,
        status: EventStatus.VOTING_ENDED,
        votingStats: undefined,
      };

      it('should have "投票結果" button for VOTING_ENDED status', () => {
        const result = service.buildEventFlexMessage(votingEndedEvent);
        const footer = (result.contents as any).footer;

        const button = footer.contents[0];
        expect(button.action.label).toBe('投票結果');
        expect(button.action.uri).toBe('https://liff.line.me/test-liff-id/joined/event-1/results');
      });

      it('should not display voting stats for VOTING_ENDED status', () => {
        const result = service.buildEventFlexMessage(votingEndedEvent);
        const body = (result.contents as any).body;

        // VOTING_ENDED 不應該有投票進度條
        const hasProgressBar = body.contents.some((c: any) =>
          c.contents?.some?.((cc: any) => cc.text === '📊 投票進度')
        );
        expect(hasProgressBar).toBeFalsy();
      });
    });

    describe('CONFIRMED status', () => {
      const confirmedEvent: EventInfo = {
        ...baseEvent,
        status: EventStatus.CONFIRMED,
        confirmedStartTime: new Date('2025-12-25T10:00:00Z'),
        confirmedEndTime: new Date('2025-12-25T12:00:00Z'),
        votingStats: undefined,
      };

      it('should have "查看活動" button for CONFIRMED status', () => {
        const result = service.buildEventFlexMessage(confirmedEvent);
        const footer = (result.contents as any).footer;

        const button = footer.contents[0];
        expect(button.action.label).toBe('查看活動');
        expect(button.action.uri).toBe('https://liff.line.me/test-liff-id/joined/event-1');
      });

      it('should display confirmed time range', () => {
        const result = service.buildEventFlexMessage(confirmedEvent);
        const body = (result.contents as any).body;

        // 確保有時間資訊
        expect(body.contents.length).toBeGreaterThan(0);
      });
    });

    describe('host information', () => {
      it('should include host displayName', () => {
        const result = service.buildEventFlexMessage(baseEvent);
        const body = (result.contents as any).body;

        // 檢查 body 中有主辦人資訊
        const hasHostInfo = JSON.stringify(body).includes('Test Host');
        expect(hasHostInfo).toBeTruthy();
      });

      it('should include host pictureUrl when provided', () => {
        const result = service.buildEventFlexMessage(baseEvent);
        const body = (result.contents as any).body;

        const hasAvatar = JSON.stringify(body).includes('https://example.com/avatar.jpg');
        expect(hasAvatar).toBeTruthy();
      });

      it('should work without host pictureUrl', () => {
        const eventWithoutAvatar = {
          ...baseEvent,
          host: { displayName: 'Test Host', pictureUrl: null },
        };
        const result = service.buildEventFlexMessage(eventWithoutAvatar);

        expect(result).toBeDefined();
        expect(result.contents).toBeDefined();
      });
    });

    describe('status colors', () => {
      it('should use green for VOTING status', () => {
        const result = service.buildEventFlexMessage(baseEvent);
        const bodyStr = JSON.stringify(result.contents);

        expect(bodyStr).toContain('#06C755'); // LINE Green
      });

      it('should use orange for VOTING_ENDED status', () => {
        const votingEndedEvent = { ...baseEvent, status: EventStatus.VOTING_ENDED };
        const result = service.buildEventFlexMessage(votingEndedEvent);
        const bodyStr = JSON.stringify(result.contents);

        expect(bodyStr).toContain('#FF9800'); // Orange
      });

      it('should use blue for CONFIRMED status', () => {
        const confirmedEvent = { ...baseEvent, status: EventStatus.CONFIRMED };
        const result = service.buildEventFlexMessage(confirmedEvent);
        const bodyStr = JSON.stringify(result.contents);

        expect(bodyStr).toContain('#2196F3'); // Blue
      });
    });
  });

  describe('buildVoteReminderMessage', () => {
    it('should build a text message with member names', () => {
      const members = [
        { lineUserId: 'user-1', displayName: 'Alice' },
        { lineUserId: 'user-2', displayName: 'Bob' },
      ];

      const result = service.buildVoteReminderMessage('Test Event', members);

      expect(result.type).toBe('text');
      expect(result.text).toContain('Alice');
      expect(result.text).toContain('Bob');
      expect(result.text).toContain('Test Event');
      expect(result.text).toContain('📢 投票提醒');
    });

    it('should use "成員" for members without displayName', () => {
      const members = [
        { lineUserId: 'user-1', displayName: null },
        { lineUserId: 'user-2', displayName: 'Bob' },
      ];

      const result = service.buildVoteReminderMessage('Test Event', members);

      expect(result.text).toContain('成員');
      expect(result.text).toContain('Bob');
    });

    it('should handle empty member list', () => {
      const result = service.buildVoteReminderMessage('Test Event', []);

      expect(result.type).toBe('text');
      expect(result.text).toContain('Test Event');
    });
  });

  describe('edge cases', () => {
    it('should handle event without voting deadline', () => {
      const event: EventInfo = {
        id: 'event-1',
        title: 'Test Event',
        description: null,
        status: EventStatus.VOTING,
        votingDeadline: null,
        confirmedStartTime: null,
        confirmedEndTime: null,
        host: { displayName: 'Host' },
        votingStats: { totalExpected: 0, totalVoted: 0, votingPercentage: 0 },
      };

      const result = service.buildEventFlexMessage(event);
      expect(result).toBeDefined();
    });

    it('should handle event without description', () => {
      const event: EventInfo = {
        id: 'event-1',
        title: 'Test Event',
        description: null,
        status: EventStatus.VOTING,
        votingDeadline: new Date(),
        confirmedStartTime: null,
        confirmedEndTime: null,
        host: { displayName: 'Host' },
        votingStats: { totalExpected: 5, totalVoted: 2, votingPercentage: 40 },
      };

      const result = service.buildEventFlexMessage(event);
      expect(result).toBeDefined();
    });

    it('should handle LIFF URL not set', () => {
      process.env.LINE_LIFF_URL = '';

      const module = Test.createTestingModule({
        providers: [FlexMessageService],
      });

      // 重新建立 service
      return module.compile().then((testModule) => {
        const newService = testModule.get<FlexMessageService>(FlexMessageService);
        const event: EventInfo = {
          id: 'event-1',
          title: 'Test Event',
          description: null,
          status: EventStatus.VOTING,
          votingDeadline: new Date(),
          confirmedStartTime: null,
          confirmedEndTime: null,
          host: { displayName: 'Host' },
        };

        const result = newService.buildEventFlexMessage(event);
        const footer = (result.contents as any).footer;
        expect(footer.contents[0].action.uri).toBe('/joined/event-1');
      });
    });
  });
});

