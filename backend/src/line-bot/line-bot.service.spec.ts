/* eslint-disable @typescript-eslint/no-explicit-any */

import { Test, TestingModule } from '@nestjs/testing';
import { LineBotService } from './line-bot.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  LineApiService,
  LineGroupService,
  FlexMessageService,
} from './services';
import {
  EventStatusService,
  EventStatus,
} from '../events/shared/services/event-status.service';
import { MessageEvent } from './dto/webhook-event.dto';

describe('LineBotService', () => {
  let service: LineBotService;

  const mockPrismaService = {
    lineGroup: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    lineGroupMember: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    eventExpectedParticipant: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockLineApiService = {
    verifySignature: jest.fn(),
    getGroupSummary: jest.fn(),
    getGroupMemberProfile: jest.fn(),
    pushMessage: jest.fn(),
    pushMessages: jest.fn(),
    getBotInfo: jest.fn(),
  };

  const mockLineGroupService = {
    upsertGroup: jest.fn(),
    deactivateGroup: jest.fn(),
    ensureGroupExists: jest.fn(),
    upsertMember: jest.fn(),
    deactivateMembers: jest.fn(),
    getActiveGroups: jest.fn(),
    getGroupMembers: jest.fn(),
    getGroupByLineGroupId: jest.fn(),
    linkUserToMembers: jest.fn(),
  };

  const mockFlexMessageService = {
    buildEventFlexMessage: jest.fn(),
    buildVoteReminderMessage: jest.fn(),
  };

  const mockEventStatusService = {
    computeEventStatus: jest.fn(),
    computeParticipantStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineBotService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LineApiService, useValue: mockLineApiService },
        { provide: LineGroupService, useValue: mockLineGroupService },
        { provide: FlexMessageService, useValue: mockFlexMessageService },
        { provide: EventStatusService, useValue: mockEventStatusService },
      ],
    }).compile();

    service = module.get<LineBotService>(LineBotService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should get bot info and store userId', async () => {
      mockLineApiService.getBotInfo.mockResolvedValue({
        userId: 'bot-user-id',
        displayName: 'Synqer',
      });

      await service.onModuleInit();

      expect(mockLineApiService.getBotInfo).toHaveBeenCalled();
    });

    it('should handle getBotInfo failure gracefully', async () => {
      mockLineApiService.getBotInfo.mockRejectedValue(new Error('API Error'));

      // Should not throw
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('verifySignature', () => {
    it('should delegate to LineApiService', () => {
      mockLineApiService.verifySignature.mockReturnValue(true);

      const result = service.verifySignature('body', 'signature');

      expect(mockLineApiService.verifySignature).toHaveBeenCalledWith(
        'body',
        'signature',
      );
      expect(result).toBe(true);
    });
  });

  describe('handleWebhookEvents', () => {
    it('should handle join event', async () => {
      const joinEvent = {
        type: 'join' as const,
        mode: 'active' as const,
        timestamp: Date.now(),
        source: { type: 'group' as const, groupId: 'group-123' },
        webhookEventId: 'event-1',
        deliveryContext: { isRedelivery: false },
      };

      mockLineGroupService.upsertGroup.mockResolvedValue({} as any);

      await service.handleWebhookEvents([joinEvent]);

      expect(mockLineGroupService.upsertGroup).toHaveBeenCalledWith(
        'group-123',
        true,
      );
    });

    it('should handle leave event', async () => {
      const leaveEvent = {
        type: 'leave' as const,
        mode: 'active' as const,
        timestamp: Date.now(),
        source: { type: 'group' as const, groupId: 'group-123' },
        webhookEventId: 'event-1',
        deliveryContext: { isRedelivery: false },
      };

      mockLineGroupService.deactivateGroup.mockResolvedValue({} as any);

      await service.handleWebhookEvents([leaveEvent]);

      expect(mockLineGroupService.deactivateGroup).toHaveBeenCalledWith(
        'group-123',
      );
    });

    it('should handle memberJoined event', async () => {
      const memberJoinedEvent = {
        type: 'memberJoined' as const,
        mode: 'active' as const,
        timestamp: Date.now(),
        source: { type: 'group' as const, groupId: 'group-123' },
        webhookEventId: 'event-1',
        deliveryContext: { isRedelivery: false },
        joined: {
          members: [{ type: 'user' as const, userId: 'user-1' }],
        },
      };

      mockLineGroupService.ensureGroupExists.mockResolvedValue({
        id: 'db-group-id',
      } as any);
      mockLineGroupService.upsertMember.mockResolvedValue({} as any);

      await service.handleWebhookEvents([memberJoinedEvent]);

      expect(mockLineGroupService.ensureGroupExists).toHaveBeenCalledWith(
        'group-123',
      );
      expect(mockLineGroupService.upsertMember).toHaveBeenCalledWith(
        'db-group-id',
        'user-1',
        true,
      );
    });

    it('should handle memberLeft event', async () => {
      const memberLeftEvent = {
        type: 'memberLeft' as const,
        mode: 'active' as const,
        timestamp: Date.now(),
        source: { type: 'group' as const, groupId: 'group-123' },
        webhookEventId: 'event-1',
        deliveryContext: { isRedelivery: false },
        left: {
          members: [{ type: 'user' as const, userId: 'user-1' }],
        },
      };

      mockPrismaService.lineGroup.findUnique.mockResolvedValue({
        id: 'db-group-id',
      } as any);
      mockLineGroupService.deactivateMembers.mockResolvedValue({} as any);

      await service.handleWebhookEvents([memberLeftEvent]);

      expect(mockLineGroupService.deactivateMembers).toHaveBeenCalledWith(
        'db-group-id',
        ['user-1'],
      );
    });

    it('should handle message event without mention', async () => {
      const messageEvent: MessageEvent = {
        type: 'message',
        mode: 'active',
        timestamp: Date.now(),
        source: { type: 'group', groupId: 'group-123', userId: 'user-1' },
        webhookEventId: 'event-1',
        deliveryContext: { isRedelivery: false },
        message: { id: 'msg-1', type: 'text', text: 'Hello' },
      };

      mockLineGroupService.ensureGroupExists.mockResolvedValue({
        id: 'db-group-id',
      } as any);
      mockLineGroupService.upsertMember.mockResolvedValue({} as any);

      await service.handleWebhookEvents([messageEvent]);

      expect(mockLineGroupService.ensureGroupExists).toHaveBeenCalledWith(
        'group-123',
      );
      expect(mockLineGroupService.upsertMember).toHaveBeenCalledWith(
        'db-group-id',
        'user-1',
        true,
      );
      // 沒有 mention，不應該發送訊息
      expect(mockLineApiService.pushMessages).not.toHaveBeenCalled();
    });

    it('should ignore non-group events', async () => {
      const userEvent = {
        type: 'message' as const,
        mode: 'active' as const,
        timestamp: Date.now(),
        source: { type: 'user' as const, userId: 'user-1' },
        webhookEventId: 'event-1',
        deliveryContext: { isRedelivery: false },
        message: { id: 'msg-1', type: 'text' as const, text: '@Synqer' },
      };

      await service.handleWebhookEvents([userEvent]);

      // 1:1 對話不應觸發任何群組相關操作
      expect(mockLineGroupService.ensureGroupExists).not.toHaveBeenCalled();
      expect(mockLineApiService.pushMessages).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const event = {
        type: 'join' as const,
        mode: 'active' as const,
        timestamp: Date.now(),
        source: { type: 'group' as const, groupId: 'group-123' },
        webhookEventId: 'event-1',
        deliveryContext: { isRedelivery: false },
      };

      mockLineGroupService.upsertGroup.mockRejectedValue(new Error('DB Error'));

      // Should not throw
      await expect(service.handleWebhookEvents([event])).resolves.not.toThrow();
    });
  });

  describe('handleMessage with @mention', () => {
    const createMessageEventWithMention = (
      botUserId: string,
    ): MessageEvent => ({
      type: 'message',
      mode: 'active',
      timestamp: Date.now(),
      source: { type: 'group', groupId: 'group-123', userId: 'user-1' },
      webhookEventId: 'event-1',
      deliveryContext: { isRedelivery: false },
      message: {
        id: 'msg-1',
        type: 'text',
        text: '@Synqer show events',
        mention: {
          mentionees: [
            { index: 0, length: 7, type: 'user', userId: botUserId },
          ],
        },
      },
    });

    beforeEach(() => {
      // 設定 Bot userId
      mockLineApiService.getBotInfo.mockResolvedValue({
        userId: 'bot-user-id',
        displayName: 'Synqer',
      });
    });

    it('should respond to @mention with active events', async () => {
      // 先初始化 bot userId
      await service.onModuleInit();

      mockLineGroupService.ensureGroupExists.mockResolvedValue({
        id: 'db-group-id',
        lineGroupId: 'group-123',
      } as any);
      mockLineGroupService.upsertMember.mockResolvedValue({} as any);

      // Mock 活動資料
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Test Event',
          description: 'Description',
          ownerId: 'owner-1',
          votingDeadline: new Date('2025-12-31'),
          confirmedStartTime: null,
          confirmedEndTime: null,
          expectedParticipants: [{ id: 'ep-1', hasVoted: false }],
          votes: [],
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents as any);
      mockEventStatusService.computeEventStatus.mockReturnValue(
        EventStatus.VOTING,
      );
      mockPrismaService.user.findUnique.mockResolvedValue({
        displayName: 'Host Name',
        avatarUrl: 'https://example.com/avatar.jpg',
      } as any);
      mockPrismaService.eventExpectedParticipant.findMany.mockResolvedValue([
        { lineUserId: 'unvoted-user' },
      ] as any);
      mockPrismaService.lineGroupMember.findMany.mockResolvedValue([
        { lineUserId: 'unvoted-user', displayName: 'Unvoted User' },
      ] as any);

      const mockFlexMessage = { type: 'flex', altText: 'Test', contents: {} };
      mockFlexMessageService.buildEventFlexMessage.mockReturnValue(
        mockFlexMessage as any,
      );
      mockFlexMessageService.buildVoteReminderMessage.mockReturnValue({
        type: 'textV2',
        text: '{user0}，投票提醒',
        substitution: {
          user0: {
            type: 'mention',
            mentionee: { type: 'user', userId: 'unvoted-user' },
          },
        },
      });

      mockLineApiService.pushMessages.mockResolvedValue(undefined);

      const event = createMessageEventWithMention('bot-user-id');
      await service.handleWebhookEvents([event]);

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { lineGroupId: 'db-group-id' },
        }),
      );
      expect(mockFlexMessageService.buildEventFlexMessage).toHaveBeenCalled();
      expect(mockLineApiService.pushMessages).toHaveBeenCalled();
    });

    it('should send "no events" message when group has no active events', async () => {
      await service.onModuleInit();

      mockLineGroupService.ensureGroupExists.mockResolvedValue({
        id: 'db-group-id',
        lineGroupId: 'group-123',
      } as any);
      mockLineGroupService.upsertMember.mockResolvedValue({} as any);

      mockPrismaService.event.findMany.mockResolvedValue([]);

      mockLineApiService.pushMessage.mockResolvedValue(undefined);

      const event = createMessageEventWithMention('bot-user-id');
      await service.handleWebhookEvents([event]);

      expect(mockLineApiService.pushMessage).toHaveBeenCalledWith(
        'group-123',
        '目前這個群組沒有進行中的活動喔！',
      );
    });

    it('should not respond to mention by other users', async () => {
      await service.onModuleInit();

      mockLineGroupService.ensureGroupExists.mockResolvedValue({
        id: 'db-group-id',
        lineGroupId: 'group-123',
      } as any);
      mockLineGroupService.upsertMember.mockResolvedValue({} as any);

      // 建立 mention 其他使用者的事件
      const event: MessageEvent = {
        type: 'message',
        mode: 'active',
        timestamp: Date.now(),
        source: { type: 'group', groupId: 'group-123', userId: 'user-1' },
        webhookEventId: 'event-1',
        deliveryContext: { isRedelivery: false },
        message: {
          id: 'msg-1',
          type: 'text',
          text: '@Other hello',
          mention: {
            mentionees: [
              { index: 0, length: 6, type: 'user', userId: 'other-user-id' },
            ],
          },
        },
      };

      await service.handleWebhookEvents([event]);

      // 不應該查詢活動或發送訊息
      expect(mockPrismaService.event.findMany).not.toHaveBeenCalled();
      expect(mockLineApiService.pushMessages).not.toHaveBeenCalled();
    });

    it('should skip COMPLETED events', async () => {
      await service.onModuleInit();

      mockLineGroupService.ensureGroupExists.mockResolvedValue({
        id: 'db-group-id',
        lineGroupId: 'group-123',
      } as any);
      mockLineGroupService.upsertMember.mockResolvedValue({} as any);

      const mockEvents = [
        {
          id: 'event-1',
          title: 'Completed Event',
          description: null,
          ownerId: 'owner-1',
          votingDeadline: null,
          confirmedStartTime: new Date('2025-01-01T10:00:00Z'),
          confirmedEndTime: new Date('2025-01-01T12:00:00Z'),
          expectedParticipants: [],
          votes: [],
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents as any);
      mockEventStatusService.computeEventStatus.mockReturnValue(
        EventStatus.COMPLETED,
      );

      mockLineApiService.pushMessage.mockResolvedValue(undefined);

      const event = createMessageEventWithMention('bot-user-id');
      await service.handleWebhookEvents([event]);

      // COMPLETED 的活動應該被過濾掉
      expect(
        mockFlexMessageService.buildEventFlexMessage,
      ).not.toHaveBeenCalled();
      expect(mockLineApiService.pushMessage).toHaveBeenCalledWith(
        'group-123',
        '目前這個群組沒有進行中的活動喔！',
      );
    });

    it('should send vote reminder for VOTING events with unvoted members', async () => {
      await service.onModuleInit();

      mockLineGroupService.ensureGroupExists.mockResolvedValue({
        id: 'db-group-id',
        lineGroupId: 'group-123',
      } as any);
      mockLineGroupService.upsertMember.mockResolvedValue({} as any);

      const mockEvents = [
        {
          id: 'event-1',
          title: 'Voting Event',
          description: null,
          ownerId: 'owner-1',
          votingDeadline: new Date('2025-12-31'),
          confirmedStartTime: null,
          confirmedEndTime: null,
          expectedParticipants: [
            { id: 'ep-1', hasVoted: true },
            { id: 'ep-2', hasVoted: false },
          ],
          votes: [{ userId: 'user-voted' }],
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents as any);
      mockEventStatusService.computeEventStatus.mockReturnValue(
        EventStatus.VOTING,
      );
      mockPrismaService.user.findUnique.mockResolvedValue({
        displayName: 'Host',
        avatarUrl: null,
      } as any);

      // 有未投票的成員
      mockPrismaService.eventExpectedParticipant.findMany.mockResolvedValue([
        { lineUserId: 'unvoted-line-user' },
      ] as any);
      mockPrismaService.lineGroupMember.findMany.mockResolvedValue([
        { lineUserId: 'unvoted-line-user', displayName: 'Unvoted User' },
      ] as any);

      const mockFlexMessage = { type: 'flex', altText: 'Test', contents: {} };
      mockFlexMessageService.buildEventFlexMessage.mockReturnValue(
        mockFlexMessage as any,
      );
      mockFlexMessageService.buildVoteReminderMessage.mockReturnValue({
        type: 'textV2',
        text: '{user0}，投票提醒',
        substitution: {
          user0: {
            type: 'mention',
            mentionee: { type: 'user', userId: 'unvoted-line-user' },
          },
        },
      });

      mockLineApiService.pushMessages.mockResolvedValue(undefined);

      const event = createMessageEventWithMention('bot-user-id');
      await service.handleWebhookEvents([event]);

      // 應該發送 Flex Message 和投票提醒
      expect(mockFlexMessageService.buildEventFlexMessage).toHaveBeenCalled();
      expect(
        mockFlexMessageService.buildVoteReminderMessage,
      ).toHaveBeenCalledWith('Voting Event', [
        { lineUserId: 'unvoted-line-user', displayName: 'Unvoted User' },
      ]);
      expect(mockLineApiService.pushMessages).toHaveBeenCalledTimes(2);
    });

    it('should not send vote reminder if everyone has voted', async () => {
      await service.onModuleInit();

      mockLineGroupService.ensureGroupExists.mockResolvedValue({
        id: 'db-group-id',
        lineGroupId: 'group-123',
      } as any);
      mockLineGroupService.upsertMember.mockResolvedValue({} as any);

      const mockEvents = [
        {
          id: 'event-1',
          title: 'Voting Event',
          description: null,
          ownerId: 'owner-1',
          votingDeadline: new Date('2025-12-31'),
          confirmedStartTime: null,
          confirmedEndTime: null,
          expectedParticipants: [{ id: 'ep-1', hasVoted: true }],
          votes: [{ userId: 'user-voted' }],
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents as any);
      mockEventStatusService.computeEventStatus.mockReturnValue(
        EventStatus.VOTING,
      );
      mockPrismaService.user.findUnique.mockResolvedValue({
        displayName: 'Host',
        avatarUrl: null,
      } as any);

      // 沒有未投票的成員
      mockPrismaService.eventExpectedParticipant.findMany.mockResolvedValue([]);

      const mockFlexMessage = { type: 'flex', altText: 'Test', contents: {} };
      mockFlexMessageService.buildEventFlexMessage.mockReturnValue(
        mockFlexMessage as any,
      );

      mockLineApiService.pushMessages.mockResolvedValue(undefined);

      const event = createMessageEventWithMention('bot-user-id');
      await service.handleWebhookEvents([event]);

      // 應該只發送 Flex Message，不發送投票提醒
      expect(
        mockFlexMessageService.buildVoteReminderMessage,
      ).not.toHaveBeenCalled();
      expect(mockLineApiService.pushMessages).toHaveBeenCalledTimes(1);
    });
  });

  describe('getActiveGroups', () => {
    it('should delegate to LineGroupService', async () => {
      const mockGroups = [{ id: 'group-1' }];
      mockLineGroupService.getActiveGroups.mockResolvedValue(mockGroups as any);

      const result = await service.getActiveGroups();

      expect(mockLineGroupService.getActiveGroups).toHaveBeenCalled();
      expect(result).toEqual(mockGroups);
    });
  });

  describe('getGroupMembers', () => {
    it('should delegate to LineGroupService', async () => {
      const mockMembers = [{ id: 'member-1' }];
      mockLineGroupService.getGroupMembers.mockResolvedValue(
        mockMembers as any,
      );

      const result = await service.getGroupMembers('group-id');

      expect(mockLineGroupService.getGroupMembers).toHaveBeenCalledWith(
        'group-id',
      );
      expect(result).toEqual(mockMembers);
    });
  });

  describe('getGroupByLineGroupId', () => {
    it('should delegate to LineGroupService', async () => {
      const mockGroup = { id: 'group-1', lineGroupId: 'line-group-123' };
      mockLineGroupService.getGroupByLineGroupId.mockResolvedValue(
        mockGroup as any,
      );

      const result = await service.getGroupByLineGroupId('line-group-123');

      expect(mockLineGroupService.getGroupByLineGroupId).toHaveBeenCalledWith(
        'line-group-123',
      );
      expect(result).toEqual(mockGroup);
    });
  });

  describe('sendVoteReminder', () => {
    it('should send reminder to unvoted members using buildVoteReminderMessage', async () => {
      mockPrismaService.lineGroup.findUnique.mockResolvedValue({
        id: 'db-group-id',
        lineGroupId: 'line-group-123',
      } as any);

      mockPrismaService.lineGroupMember.findMany.mockResolvedValue([
        { displayName: 'User 1', lineUserId: 'line-user-1' },
        { displayName: 'User 2', lineUserId: 'line-user-2' },
      ] as any);

      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-1',
        title: 'Test Event',
      } as any);

      const mockReminderMessage = {
        type: 'textV2',
        text: '{user0}、{user1}，投票提醒',
        substitution: {
          user0: {
            type: 'mention',
            mentionee: { type: 'user', userId: 'line-user-1' },
          },
          user1: {
            type: 'mention',
            mentionee: { type: 'user', userId: 'line-user-2' },
          },
        },
      };
      mockFlexMessageService.buildVoteReminderMessage.mockReturnValue(
        mockReminderMessage,
      );
      mockLineApiService.pushMessages.mockResolvedValue(undefined);
      mockPrismaService.eventExpectedParticipant.updateMany.mockResolvedValue({
        count: 2,
      } as any);

      await service.sendVoteReminder('event-1', 'db-group-id', [
        'line-user-1',
        'line-user-2',
      ]);

      expect(
        mockFlexMessageService.buildVoteReminderMessage,
      ).toHaveBeenCalledWith('Test Event', [
        { lineUserId: 'line-user-1', displayName: 'User 1' },
        { lineUserId: 'line-user-2', displayName: 'User 2' },
      ]);
      expect(mockLineApiService.pushMessages).toHaveBeenCalledWith(
        'line-group-123',
        [mockReminderMessage],
      );
      expect(
        mockPrismaService.eventExpectedParticipant.updateMany,
      ).toHaveBeenCalled();
    });

    it('should throw error if group not found', async () => {
      mockPrismaService.lineGroup.findUnique.mockResolvedValue(null);

      await expect(
        service.sendVoteReminder('event-1', 'non-existent', ['user-1']),
      ).rejects.toThrow('Group not found');
    });

    it('should throw error if event not found', async () => {
      mockPrismaService.lineGroup.findUnique.mockResolvedValue({
        id: 'db-group-id',
        lineGroupId: 'line-group-123',
      } as any);
      mockPrismaService.lineGroupMember.findMany.mockResolvedValue([
        { displayName: 'User 1' },
      ] as any);
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(
        service.sendVoteReminder('non-existent', 'db-group-id', ['user-1']),
      ).rejects.toThrow('Event not found');
    });

    it('should skip if no unvoted members found', async () => {
      mockPrismaService.lineGroup.findUnique.mockResolvedValue({
        id: 'db-group-id',
        lineGroupId: 'line-group-123',
      } as any);

      mockPrismaService.lineGroupMember.findMany.mockResolvedValue([]);

      await service.sendVoteReminder('event-1', 'db-group-id', ['line-user-1']);

      expect(mockLineApiService.pushMessage).not.toHaveBeenCalled();
    });
  });

  describe('linkUserToGroupMembers', () => {
    it('should delegate to LineGroupService', async () => {
      mockLineGroupService.linkUserToMembers.mockResolvedValue(undefined);

      await service.linkUserToGroupMembers('user-id', 'line-user-id');

      expect(mockLineGroupService.linkUserToMembers).toHaveBeenCalledWith(
        'user-id',
        'line-user-id',
      );
    });
  });
});
