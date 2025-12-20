import { Test, TestingModule } from '@nestjs/testing';
import { LineBotController } from './line-bot.controller';
import { LineBotService } from './line-bot.service';
import { BadRequestException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import type { WebhookRequestBody, WebhookEvent } from './dto/webhook-event.dto';

describe('LineBotController', () => {
  let controller: LineBotController;
  let lineBotService: jest.Mocked<LineBotService>;

  const mockLineBotService = {
    verifySignature: jest.fn(),
    handleWebhookEvents: jest.fn(),
    getActiveGroups: jest.fn(),
    getGroupMembers: jest.fn(),
    sendVoteReminder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LineBotController],
      providers: [{ provide: LineBotService, useValue: mockLineBotService }],
    }).compile();

    controller = module.get<LineBotController>(LineBotController);
    lineBotService = module.get(LineBotService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleWebhook', () => {
    const createMockRequest = (body: object): RawBodyRequest<Request> => {
      const jsonBody = JSON.stringify(body);
      return {
        rawBody: Buffer.from(jsonBody),
      } as unknown as RawBodyRequest<Request>;
    };

    const createMockEvent = (type: string): WebhookEvent => ({
      type: type as any,
      mode: 'active',
      timestamp: Date.now(),
      source: { type: 'group', groupId: 'group-123' },
      webhookEventId: 'event-1',
      deliveryContext: { isRedelivery: false },
    } as WebhookEvent);

    it('should return empty object for valid webhook', () => {
      const body: WebhookRequestBody = {
        destination: 'dest',
        events: [createMockEvent('join')],
      };
      const req = createMockRequest(body);

      mockLineBotService.verifySignature.mockReturnValue(true);
      mockLineBotService.handleWebhookEvents.mockResolvedValue(undefined);

      const result = controller.handleWebhook(req, 'valid-signature', body);

      expect(mockLineBotService.verifySignature).toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it('should throw BadRequestException for invalid signature', () => {
      const body: WebhookRequestBody = { destination: 'dest', events: [] };
      const req = createMockRequest(body);

      mockLineBotService.verifySignature.mockReturnValue(false);

      expect(() =>
        controller.handleWebhook(req, 'invalid-signature', body),
      ).toThrow(BadRequestException);
    });

    it('should handle empty events array', () => {
      const body: WebhookRequestBody = { destination: 'dest', events: [] };
      const req = createMockRequest(body);

      mockLineBotService.verifySignature.mockReturnValue(true);

      const result = controller.handleWebhook(req, 'valid-signature', body);

      expect(mockLineBotService.handleWebhookEvents).not.toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it('should use JSON.stringify fallback when rawBody is undefined', () => {
      const body: WebhookRequestBody = {
        destination: 'dest',
        events: [createMockEvent('message')],
      };
      const req = { rawBody: undefined } as unknown as RawBodyRequest<Request>;

      mockLineBotService.verifySignature.mockReturnValue(true);

      controller.handleWebhook(req, 'valid-signature', body);

      expect(mockLineBotService.verifySignature).toHaveBeenCalledWith(
        JSON.stringify(body),
        'valid-signature',
      );
    });
  });

  describe('getGroups', () => {
    it('should return formatted groups list', async () => {
      const mockGroups = [
        {
          id: 'group-1',
          lineGroupId: 'line-group-123',
          groupName: 'Test Group',
          botJoinedAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-02'),
          _count: { members: 5 },
        },
      ];

      mockLineBotService.getActiveGroups.mockResolvedValue(mockGroups as any);

      const result = await controller.getGroups();

      expect(result).toEqual([
        {
          id: 'group-1',
          lineGroupId: 'line-group-123',
          groupName: 'Test Group',
          memberCount: 5,
          botJoinedAt: mockGroups[0].botJoinedAt,
          updatedAt: mockGroups[0].updatedAt,
        },
      ]);
    });

    it('should return empty array when no groups', async () => {
      mockLineBotService.getActiveGroups.mockResolvedValue([]);

      const result = await controller.getGroups();

      expect(result).toEqual([]);
    });
  });

  describe('getGroupMembers', () => {
    it('should return formatted members list', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          lineUserId: 'line-user-123',
          displayName: 'Test User',
          pictureUrl: 'https://example.com/avatar.jpg',
          userId: 'linked-user-id',
          user: {
            id: 'linked-user-id',
            displayName: 'Linked User',
            avatarUrl: 'https://example.com/linked-avatar.jpg',
          },
          firstSeenAt: new Date('2025-01-01'),
          lastSeenAt: new Date('2025-01-02'),
        },
      ];

      mockLineBotService.getGroupMembers.mockResolvedValue(mockMembers as any);

      const result = await controller.getGroupMembers('group-1');

      expect(result).toEqual([
        {
          id: 'member-1',
          lineUserId: 'line-user-123',
          displayName: 'Test User',
          pictureUrl: 'https://example.com/avatar.jpg',
          isLinked: true,
          linkedUser: {
            id: 'linked-user-id',
            displayName: 'Linked User',
            avatarUrl: 'https://example.com/linked-avatar.jpg',
          },
          firstSeenAt: mockMembers[0].firstSeenAt,
          lastSeenAt: mockMembers[0].lastSeenAt,
        },
      ]);
    });

    it('should handle members without linked user', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          lineUserId: 'line-user-123',
          displayName: 'Test User',
          pictureUrl: null,
          userId: null,
          user: null,
          firstSeenAt: new Date('2025-01-01'),
          lastSeenAt: new Date('2025-01-02'),
        },
      ];

      mockLineBotService.getGroupMembers.mockResolvedValue(mockMembers as any);

      const result = await controller.getGroupMembers('group-1');

      expect(result[0].isLinked).toBe(false);
      expect(result[0].linkedUser).toBeNull();
    });
  });

  describe('sendReminder', () => {
    it('should send reminder and return success', async () => {
      mockLineBotService.sendVoteReminder.mockResolvedValue(undefined);

      const result = await controller.sendReminder('group-1', {
        eventId: 'event-1',
        lineUserIds: ['user-1', 'user-2'],
      });

      expect(mockLineBotService.sendVoteReminder).toHaveBeenCalledWith(
        'event-1',
        'group-1',
        ['user-1', 'user-2'],
      );
      expect(result).toEqual({ success: true, reminded: 2 });
    });

    it('should throw BadRequestException when eventId is missing', async () => {
      await expect(
        controller.sendReminder('group-1', {
          eventId: '',
          lineUserIds: ['user-1'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when lineUserIds is empty', async () => {
      await expect(
        controller.sendReminder('group-1', {
          eventId: 'event-1',
          lineUserIds: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when lineUserIds is missing', async () => {
      await expect(
        controller.sendReminder('group-1', {
          eventId: 'event-1',
          lineUserIds: undefined as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

