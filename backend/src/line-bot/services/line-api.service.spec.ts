/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LineApiService, LineMessage } from './line-api.service';
import axios from 'axios';
import * as crypto from 'crypto';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LineApiService', () => {
  let service: LineApiService;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      LINE_BOT_CHANNEL_SECRET: 'test-channel-secret',
      LINE_CHANNEL_ACCESS_TOKEN: 'test-access-token',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineApiService,
        {
          provide: ConfigService,
          useValue: { get: (key: string) => process.env[key] },
        },
      ],
    }).compile();

    service = module.get<LineApiService>(LineApiService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifySignature', () => {
    it('should return true for valid signature', () => {
      // 使用真實的 HMAC-SHA256 計算
      const body = '{"events":[]}';
      const hash = crypto
        .createHmac('sha256', 'test-channel-secret')
        .update(body)
        .digest('base64');

      const result = service.verifySignature(body, hash);
      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const result = service.verifySignature(
        '{"events":[]}',
        'invalid-signature',
      );
      expect(result).toBe(false);
    });
  });

  describe('getGroupSummary', () => {
    it('should return group summary on success', async () => {
      const mockSummary = {
        groupId: 'group-123',
        groupName: 'Test Group',
        pictureUrl: 'https://example.com/group.jpg',
      };

      mockedAxios.get.mockResolvedValue({ data: mockSummary });

      const result = await service.getGroupSummary('group-123');

      expect(result).toEqual(mockSummary);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/group/group-123/summary',
        { headers: { Authorization: 'Bearer test-access-token' } },
      );
    });

    it('should return null on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const result = await service.getGroupSummary('group-123');

      expect(result).toBeNull();
    });
  });

  describe('getGroupMemberProfile', () => {
    it('should return member profile on success', async () => {
      const mockProfile = {
        userId: 'user-123',
        displayName: 'Test User',
        pictureUrl: 'https://example.com/user.jpg',
      };

      mockedAxios.get.mockResolvedValue({ data: mockProfile });

      const result = await service.getGroupMemberProfile(
        'group-123',
        'user-123',
      );

      expect(result).toEqual(mockProfile);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/group/group-123/member/user-123',
        { headers: { Authorization: 'Bearer test-access-token' } },
      );
    });

    it('should return null on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const result = await service.getGroupMemberProfile(
        'group-123',
        'user-123',
      );

      expect(result).toBeNull();
    });
  });

  describe('pushMessage', () => {
    it('should send a text message successfully', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });

      await service.pushMessage('group-123', 'Hello World');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/push',
        {
          to: 'group-123',
          messages: [{ type: 'text', text: 'Hello World' }],
        },
        {
          headers: {
            Authorization: 'Bearer test-access-token',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should throw error on failure', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      await expect(service.pushMessage('group-123', 'Hello')).rejects.toThrow(
        'API Error',
      );
    });
  });

  describe('pushMessages', () => {
    it('should send multiple messages in one request', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });

      const messages: LineMessage[] = [
        { type: 'text', text: 'Message 1' },
        { type: 'text', text: 'Message 2' },
      ];

      await service.pushMessages('group-123', messages);

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/push',
        {
          to: 'group-123',
          messages,
        },
        expect.any(Object),
      );
    });

    it('should batch messages when more than 5', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });

      const messages: LineMessage[] = Array.from({ length: 8 }, (_, i) => ({
        type: 'text' as const,
        text: `Message ${i + 1}`,
      }));

      await service.pushMessages('group-123', messages);

      expect(mockedAxios.post).toHaveBeenCalledTimes(2);

      // 第一批 5 則
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        1,
        'https://api.line.me/v2/bot/message/push',
        {
          to: 'group-123',
          messages: messages.slice(0, 5),
        },
        expect.any(Object),
      );

      // 第二批 3 則
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        2,
        'https://api.line.me/v2/bot/message/push',
        {
          to: 'group-123',
          messages: messages.slice(5, 8),
        },
        expect.any(Object),
      );
    });

    it('should handle empty messages array', async () => {
      await service.pushMessages('group-123', []);

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should throw error if any batch fails', async () => {
      mockedAxios.post
        .mockResolvedValueOnce({ data: {} })
        .mockRejectedValueOnce(new Error('API Error'));

      const messages: LineMessage[] = Array.from({ length: 8 }, (_, i) => ({
        type: 'text' as const,
        text: `Message ${i + 1}`,
      }));

      await expect(service.pushMessages('group-123', messages)).rejects.toThrow(
        'API Error',
      );
    });

    it('should support flex messages', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });

      const messages: LineMessage[] = [
        { type: 'text', text: 'Text message' },
        {
          type: 'flex',
          altText: 'Flex message',
          contents: { type: 'bubble' },
        },
      ];

      await service.pushMessages('group-123', messages);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/message/push',
        {
          to: 'group-123',
          messages,
        },
        expect.any(Object),
      );
    });
  });

  describe('getBotInfo', () => {
    it('should return bot info on success', async () => {
      const mockBotInfo = {
        userId: 'bot-user-id',
        basicId: '@bot',
        displayName: 'Synqer',
        pictureUrl: 'https://example.com/bot.jpg',
        chatMode: 'chat',
        markAsReadMode: 'manual',
      };

      mockedAxios.get.mockResolvedValue({ data: mockBotInfo });

      const result = await service.getBotInfo();

      expect(result).toEqual({
        userId: 'bot-user-id',
        displayName: 'Synqer',
        pictureUrl: 'https://example.com/bot.jpg',
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.line.me/v2/bot/info',
        { headers: { Authorization: 'Bearer test-access-token' } },
      );
    });

    it('should return null on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const result = await service.getBotInfo();

      expect(result).toBeNull();
    });

    it('should handle bot without pictureUrl', async () => {
      const mockBotInfo = {
        userId: 'bot-user-id',
        basicId: '@bot',
        displayName: 'Synqer',
        chatMode: 'chat',
        markAsReadMode: 'manual',
      };

      mockedAxios.get.mockResolvedValue({ data: mockBotInfo });

      const result = await service.getBotInfo();

      expect(result).toEqual({
        userId: 'bot-user-id',
        displayName: 'Synqer',
        pictureUrl: undefined,
      });
    });
  });
});
