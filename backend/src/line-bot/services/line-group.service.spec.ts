/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { LineGroupService } from './line-group.service';
import { LineApiService } from './line-api.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('LineGroupService', () => {
  let service: LineGroupService;

  const mockPrismaService = {
    lineGroup: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    lineGroupMember: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    authIdentity: {
      findUnique: jest.fn(),
    },
    eventExpectedParticipant: {
      updateMany: jest.fn(),
    },
  };

  const mockLineApiService = {
    getGroupSummary: jest.fn(),
    getGroupMemberProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineGroupService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LineApiService, useValue: mockLineApiService },
      ],
    }).compile();

    service = module.get<LineGroupService>(LineGroupService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsertGroup', () => {
    it('should create or update a group with fetched name', async () => {
      mockLineApiService.getGroupSummary.mockResolvedValue({
        groupId: 'line-group-123',
        groupName: 'Test Group',
      });

      mockPrismaService.lineGroup.upsert.mockResolvedValue({
        id: 'db-group-id',
        lineGroupId: 'line-group-123',
        groupName: 'Test Group',
        isActive: true,
      } as any);

      const result = await service.upsertGroup('line-group-123', true);

      expect(mockLineApiService.getGroupSummary).toHaveBeenCalledWith(
        'line-group-123',
      );
      expect(mockPrismaService.lineGroup.upsert).toHaveBeenCalledWith({
        where: { lineGroupId: 'line-group-123' },
        update: expect.objectContaining({
          isActive: true,
          groupName: 'Test Group',
        }),
        create: expect.objectContaining({
          lineGroupId: 'line-group-123',
          groupName: 'Test Group',
        }),
      });
      expect(result.groupName).toBe('Test Group');
    });

    it('should handle getGroupSummary failure gracefully', async () => {
      mockLineApiService.getGroupSummary.mockRejectedValue(
        new Error('API Error'),
      );

      mockPrismaService.lineGroup.upsert.mockResolvedValue({
        id: 'db-group-id',
        lineGroupId: 'line-group-123',
        groupName: undefined,
        isActive: true,
      } as any);

      const result = await service.upsertGroup('line-group-123', true);

      expect(result).toBeDefined();
    });

    it('should set isActive to false when deactivating', async () => {
      mockLineApiService.getGroupSummary.mockResolvedValue(null);

      mockPrismaService.lineGroup.upsert.mockResolvedValue({
        id: 'db-group-id',
        lineGroupId: 'line-group-123',
        isActive: false,
      } as any);

      await service.upsertGroup('line-group-123', false);

      expect(mockPrismaService.lineGroup.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            isActive: false,
          }),
        }),
      );
    });
  });

  describe('deactivateGroup', () => {
    it('should mark group as inactive', async () => {
      mockPrismaService.lineGroup.updateMany.mockResolvedValue({
        count: 1,
      } as any);

      await service.deactivateGroup('line-group-123');

      expect(mockPrismaService.lineGroup.updateMany).toHaveBeenCalledWith({
        where: { lineGroupId: 'line-group-123' },
        data: expect.objectContaining({
          isActive: false,
        }),
      });
    });
  });

  describe('ensureGroupExists', () => {
    it('should return existing group', async () => {
      const existingGroup = {
        id: 'db-group-id',
        lineGroupId: 'line-group-123',
      };

      mockPrismaService.lineGroup.findUnique.mockResolvedValue(
        existingGroup as any,
      );

      const result = await service.ensureGroupExists('line-group-123');

      expect(result).toEqual(existingGroup);
      expect(mockPrismaService.lineGroup.upsert).not.toHaveBeenCalled();
    });

    it('should create new group if not exists', async () => {
      mockPrismaService.lineGroup.findUnique.mockResolvedValue(null);
      mockLineApiService.getGroupSummary.mockResolvedValue({
        groupId: 'line-group-123',
        groupName: 'New Group',
      });

      const newGroup = {
        id: 'new-db-group-id',
        lineGroupId: 'line-group-123',
        groupName: 'New Group',
      };

      mockPrismaService.lineGroup.upsert.mockResolvedValue(newGroup as any);

      const result = await service.ensureGroupExists('line-group-123');

      expect(result).toEqual(newGroup);
    });
  });

  describe('upsertMember', () => {
    it('should create or update member with fetched profile', async () => {
      mockPrismaService.lineGroup.findUnique.mockResolvedValue({
        lineGroupId: 'line-group-123',
      } as any);

      mockLineApiService.getGroupMemberProfile.mockResolvedValue({
        userId: 'line-user-123',
        displayName: 'Test User',
        pictureUrl: 'https://example.com/avatar.jpg',
      });

      mockPrismaService.authIdentity.findUnique.mockResolvedValue(null);

      mockPrismaService.lineGroupMember.upsert.mockResolvedValue({
        id: 'member-id',
        lineUserId: 'line-user-123',
        displayName: 'Test User',
      } as any);

      const result = await service.upsertMember(
        'db-group-id',
        'line-user-123',
        true,
      );

      expect(mockLineApiService.getGroupMemberProfile).toHaveBeenCalledWith(
        'line-group-123',
        'line-user-123',
      );
      expect(result.displayName).toBe('Test User');
    });

    it('should link to existing user if OAuth identity exists', async () => {
      mockPrismaService.lineGroup.findUnique.mockResolvedValue({
        lineGroupId: 'line-group-123',
      } as any);

      mockLineApiService.getGroupMemberProfile.mockResolvedValue({
        userId: 'line-user-123',
        displayName: 'Test User',
      });

      mockPrismaService.authIdentity.findUnique.mockResolvedValue({
        userId: 'linked-user-id',
      } as any);

      mockPrismaService.lineGroupMember.upsert.mockResolvedValue({
        id: 'member-id',
        lineUserId: 'line-user-123',
        userId: 'linked-user-id',
      } as any);

      await service.upsertMember('db-group-id', 'line-user-123', true);

      expect(mockPrismaService.lineGroupMember.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            userId: 'linked-user-id',
          }),
          create: expect.objectContaining({
            userId: 'linked-user-id',
          }),
        }),
      );
    });

    it('should skip profile fetch when fetchProfile is false', async () => {
      mockPrismaService.authIdentity.findUnique.mockResolvedValue(null);

      mockPrismaService.lineGroupMember.upsert.mockResolvedValue({
        id: 'member-id',
        lineUserId: 'line-user-123',
      } as any);

      await service.upsertMember('db-group-id', 'line-user-123', false);

      expect(mockLineApiService.getGroupMemberProfile).not.toHaveBeenCalled();
    });
  });

  describe('deactivateMembers', () => {
    it('should mark members as inactive', async () => {
      mockPrismaService.lineGroupMember.updateMany.mockResolvedValue({
        count: 2,
      } as any);

      await service.deactivateMembers('db-group-id', ['user-1', 'user-2']);

      expect(mockPrismaService.lineGroupMember.updateMany).toHaveBeenCalledWith(
        {
          where: {
            lineGroupId: 'db-group-id',
            lineUserId: { in: ['user-1', 'user-2'] },
          },
          data: expect.objectContaining({
            isActive: false,
          }),
        },
      );
    });
  });

  describe('getGroupsForUser', () => {
    it('should return active groups that include the current user', async () => {
      const mockGroups = [
        {
          id: 'group-1',
          lineGroupId: 'line-group-1',
          isActive: true,
          _count: { members: 1 },
        },
      ];

      mockPrismaService.lineGroup.findMany.mockResolvedValue(mockGroups as any);

      const result = await service.getGroupsForUser('user-1');

      expect(mockPrismaService.lineGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            members: {
              some: {
                userId: 'user-1',
                isActive: true,
              },
            },
          },
        }),
      );
      expect(result).toEqual(mockGroups);
    });
  });

  describe('getGroupMembersForUser', () => {
    it('should return active members of a group the current user belongs to', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          lineUserId: 'line-user-1',
          displayName: 'User 1',
          isActive: true,
          user: { id: 'user-1', displayName: 'Linked User' },
        },
      ];

      mockPrismaService.lineGroupMember.findMany.mockResolvedValue(
        mockMembers as any,
      );

      mockPrismaService.lineGroupMember.findFirst.mockResolvedValue({
        id: 'membership-1',
      } as any);

      const result = await service.getGroupMembersForUser(
        'user-1',
        'db-group-id',
      );

      expect(mockPrismaService.lineGroupMember.findFirst).toHaveBeenCalledWith({
        where: {
          lineGroupId: 'db-group-id',
          userId: 'user-1',
          isActive: true,
          lineGroup: {
            isActive: true,
          },
        },
        select: { id: true },
      });

      expect(mockPrismaService.lineGroupMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            lineGroupId: 'db-group-id',
            isActive: true,
            lineGroup: {
              isActive: true,
            },
          },
        }),
      );
      expect(result).toEqual(mockMembers);
    });
  });

  describe('getGroupByLineGroupId', () => {
    it('should return group with active members', async () => {
      const mockGroup = {
        id: 'db-group-id',
        lineGroupId: 'line-group-123',
        members: [
          {
            id: 'member-1',
            isActive: true,
            user: { id: 'user-1', displayName: 'User' },
          },
        ],
      };

      mockPrismaService.lineGroup.findUnique.mockResolvedValue(
        mockGroup as any,
      );

      const result = await service.getGroupByLineGroupId('line-group-123');

      expect(mockPrismaService.lineGroup.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { lineGroupId: 'line-group-123' },
        }),
      );
      expect(result).toEqual(mockGroup);
    });

    it('should return null for non-existent group', async () => {
      mockPrismaService.lineGroup.findUnique.mockResolvedValue(null);

      const result = await service.getGroupByLineGroupId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('linkUserToMembers', () => {
    it('should update all group members and expected participants', async () => {
      mockPrismaService.lineGroupMember.updateMany.mockResolvedValue({
        count: 2,
      } as any);
      mockPrismaService.eventExpectedParticipant.updateMany.mockResolvedValue({
        count: 1,
      } as any);

      await service.linkUserToMembers('user-id', 'line-user-id');

      expect(mockPrismaService.lineGroupMember.updateMany).toHaveBeenCalledWith(
        {
          where: { lineUserId: 'line-user-id' },
          data: { userId: 'user-id' },
        },
      );

      expect(
        mockPrismaService.eventExpectedParticipant.updateMany,
      ).toHaveBeenCalledWith({
        where: { lineUserId: 'line-user-id' },
        data: { userId: 'user-id' },
      });
    });
  });
});
