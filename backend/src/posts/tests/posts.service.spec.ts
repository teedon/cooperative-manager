import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from '../posts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivitiesService } from '../../activities/activities.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    member: {
      findFirst: jest.fn(),
    },
    reaction: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockActivitiesService = {
    create: jest.fn(),
  };

  const mockNotificationsService = {
    createNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a post for an admin member', async () => {
      const mockMember = {
        id: 'member-1',
        userId: 'user-1',
        cooperativeId: 'coop-1',
        role: 'admin',
        status: 'active',
        user: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const mockPost = {
        id: 'post-1',
        cooperativeId: 'coop-1',
        authorId: 'member-1',
        authorType: 'admin',
        authorUserId: 'user-1',
        title: 'Test Post',
        content: 'This is a test post',
        postType: 'member_post',
        isApproved: true,
        requiresApproval: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        cooperative: {
          id: 'coop-1',
          name: 'Test Cooperative',
        },
      };

      mockPrismaService.member.findFirst.mockResolvedValue(mockMember);
      mockPrismaService.post.create.mockResolvedValue(mockPost);

      const result = await service.create(
        {
          cooperativeId: 'coop-1',
          title: 'Test Post',
          content: 'This is a test post',
        },
        'user-1',
      );

      expect(result).toEqual(mockPost);
      expect(mockPrismaService.member.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          cooperativeId: 'coop-1',
          status: 'active',
        },
        include: {
          user: true,
        },
      });
      expect(mockPrismaService.post.create).toHaveBeenCalled();
      expect(mockActivitiesService.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.member.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          {
            cooperativeId: 'coop-1',
            content: 'Test',
          },
          'user-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should sanitize post content', async () => {
      const mockMember = {
        id: 'member-1',
        userId: 'user-1',
        cooperativeId: 'coop-1',
        role: 'admin',
        status: 'active',
        user: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      mockPrismaService.member.findFirst.mockResolvedValue(mockMember);
      mockPrismaService.post.create.mockResolvedValue({
        id: 'post-1',
        content: 'Safe content',
      });

      await service.create(
        {
          cooperativeId: 'coop-1',
          content: '<script>alert("XSS")</script>Safe content',
        },
        'user-1',
      );

      const createCall = mockPrismaService.post.create.mock.calls[0][0];
      expect(createCall.data.content).not.toContain('<script>');
    });
  });

  describe('findAll', () => {
    it('should return posts with pagination', async () => {
      const mockMember = {
        id: 'member-1',
        userId: 'user-1',
        cooperativeId: 'coop-1',
        role: 'member',
        status: 'active',
      };

      const mockPosts = [
        {
          id: 'post-1',
          content: 'Test post',
          reactions: [],
          comments: [],
          _count: { reactions: 0, comments: 0 },
        },
      ];

      mockPrismaService.member.findFirst.mockResolvedValue(mockMember);
      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);
      mockPrismaService.post.count.mockResolvedValue(1);

      const result = await service.findAll('coop-1', 'user-1', {
        page: 1,
        limit: 20,
      });

      expect(result.posts).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('addReaction', () => {
    it('should add a reaction to a post', async () => {
      const mockPost = {
        id: 'post-1',
        cooperativeId: 'coop-1',
        isDeleted: false,
      };

      const mockMember = {
        id: 'member-1',
        userId: 'user-1',
      };

      const mockReaction = {
        id: 'reaction-1',
        postId: 'post-1',
        userId: 'user-1',
        reactionType: 'like',
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.member.findFirst.mockResolvedValue(mockMember);
      mockPrismaService.reaction.findFirst.mockResolvedValue(null);
      mockPrismaService.reaction.create.mockResolvedValue(mockReaction);

      const result = await service.addReaction(
        'post-1',
        { reactionType: 'like' as any },
        'user-1',
      );

      expect(result).toEqual(mockReaction);
      expect(mockPrismaService.reaction.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.reaction.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException for deleted post', async () => {
      const mockPost = {
        id: 'post-1',
        isDeleted: true,
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await expect(
        service.addReaction('post-1', { reactionType: 'like' as any }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('pin', () => {
    it('should allow admin to pin a post', async () => {
      const mockPost = {
        id: 'post-1',
        cooperativeId: 'coop-1',
        isDeleted: false,
      };

      const mockMember = {
        id: 'member-1',
        userId: 'user-1',
        role: 'admin',
        status: 'active',
      };

      const mockUpdatedPost = {
        ...mockPost,
        isPinned: true,
        pinnedAt: new Date(),
        pinnedBy: 'user-1',
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.member.findFirst.mockResolvedValue(mockMember);
      mockPrismaService.post.update.mockResolvedValue(mockUpdatedPost);

      const result = await service.pin('post-1', 'user-1');

      expect(result.isPinned).toBe(true);
      expect(mockPrismaService.post.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if non-admin tries to pin', async () => {
      const mockPost = {
        id: 'post-1',
        cooperativeId: 'coop-1',
        isDeleted: false,
      };

      const mockMember = {
        id: 'member-1',
        userId: 'user-1',
        role: 'member',
        status: 'active',
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.member.findFirst.mockResolvedValue(mockMember);

      await expect(service.pin('post-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
