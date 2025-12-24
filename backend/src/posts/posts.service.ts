import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AddReactionDto } from './dto/add-reaction.dto';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
    private notificationsService: NotificationsService,
  ) {}

  // Sanitize HTML content to prevent XSS
  private sanitizeContent(content: string): string {
    // Remove potentially dangerous HTML tags and scripts
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  // Check if user is admin in cooperative
  private async isUserAdmin(userId: string, cooperativeId: string): Promise<boolean> {
    const member = await this.prisma.member.findFirst({
      where: {
        userId,
        cooperativeId,
        status: 'active',
      },
    });
    return member?.role === 'admin';
  }

  // Get member info for user in cooperative
  private async getMemberInfo(userId: string, cooperativeId: string) {
    const member = await this.prisma.member.findFirst({
      where: {
        userId,
        cooperativeId,
        status: 'active',
      },
      include: {
        user: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    return member;
  }

  async create(createPostDto: CreatePostDto, userId: string) {
    const { cooperativeId, title, content, imageUrl, postType, requiresApproval } = createPostDto;

    // Verify user is a member of the cooperative
    const member = await this.getMemberInfo(userId, cooperativeId);

    // Sanitize content
    const sanitizedContent = this.sanitizeContent(content);
    const sanitizedTitle = title ? this.sanitizeContent(title) : undefined;

    // Determine if post requires approval (non-admins may need approval)
    const needsApproval = member.role !== 'admin' && (requiresApproval ?? false);

    // Create post
    const post = await this.prisma.post.create({
      data: {
        cooperativeId,
        authorId: member.id,
        authorType: member.role,
        authorUserId: userId,
        title: sanitizedTitle,
        content: sanitizedContent,
        imageUrl,
        postType: postType || 'member_post',
        requiresApproval: needsApproval,
        isApproved: !needsApproval,
      },
      include: {
        cooperative: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create activity log
    await this.activitiesService.create({
      userId,
      cooperativeId,
      action: 'post.create',
      description: `Created a new post: ${title || 'Untitled'}`,
      metadata: { postId: post.id },
    });

    return post;
  }

  async findAll(cooperativeId: string, userId: string, query: any) {
    const { page = 1, limit = 20, search, includeUnpinned = true } = query;

    // Verify user is a member
    const member = await this.getMemberInfo(userId, cooperativeId);
    const isAdmin = member.role === 'admin';

    const skip = (page - 1) * limit;

    const where: any = {
      cooperativeId,
      isDeleted: false,
      // Show only approved posts to non-admins
      ...(isAdmin ? {} : { isApproved: true }),
    };

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get pinned posts separately
    const pinnedPosts = await this.prisma.post.findMany({
      where: {
        ...where,
        isPinned: true,
      },
      include: {
        reactions: {
          select: {
            id: true,
            userId: true,
            reactionType: true,
          },
        },
        comments: {
          where: {
            isDeleted: false,
            parentCommentId: null,
          },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
      orderBy: {
        pinnedAt: 'desc',
      },
    });

    // Get regular posts if requested
    let regularPosts: any[] = [];
    let total = pinnedPosts.length;

    if (includeUnpinned) {
      regularPosts = await this.prisma.post.findMany({
        where: {
          ...where,
          isPinned: false,
        },
        include: {
          reactions: {
            select: {
              id: true,
              userId: true,
              reactionType: true,
            },
          },
          comments: {
            where: {
              isDeleted: false,
              parentCommentId: null,
            },
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              reactions: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      });

      const regularTotal = await this.prisma.post.count({
        where: {
          ...where,
          isPinned: false,
        },
      });

      total = pinnedPosts.length + regularTotal;
    }

    // Combine results: pinned posts first, then regular posts
    const posts = [...pinnedPosts, ...regularPosts];

    // Enhance posts with author information
    const enhancedPosts = await Promise.all(
      posts.map(async (post) => {
        let authorName = 'Unknown';
        let authorAvatar = null;

        if (post.authorUserId) {
          const member = await this.prisma.member.findFirst({
            where: {
              userId: post.authorUserId,
              cooperativeId,
            },
            include: {
              user: true,
            },
          });

          if (member) {
            if (member.user) {
              authorName = `${member.user.firstName} ${member.user.lastName}`;
              authorAvatar = member.user.avatarUrl;
            } else if (member.isOfflineMember) {
              authorName = `${member.firstName} ${member.lastName}`;
            }
          }
        }

        return {
          ...post,
          authorName,
          authorAvatar,
          userReaction: post.reactions.find((r: any) => r.userId === userId)?.reactionType || null,
          reactionCounts: this.aggregateReactions(post.reactions),
        };
      }),
    );

    return {
      posts: enhancedPosts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private aggregateReactions(reactions: any[]) {
    const counts: Record<string, number> = {};
    reactions.forEach((r) => {
      counts[r.reactionType] = (counts[r.reactionType] || 0) + 1;
    });
    return counts;
  }

  async findOne(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        cooperative: {
          select: {
            id: true,
            name: true,
          },
        },
        reactions: {
          select: {
            id: true,
            userId: true,
            reactionType: true,
          },
        },
        comments: {
          where: {
            isDeleted: false,
          },
          include: {
            reactions: true,
            replies: {
              where: {
                isDeleted: false,
              },
              include: {
                reactions: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundException('Post not found');
    }

    // Verify user is a member
    await this.getMemberInfo(userId, post.cooperativeId);

    // Get author information
    let authorName = 'Unknown';
    let authorAvatar = null;

    if (post.authorUserId) {
      const member = await this.prisma.member.findFirst({
        where: {
          userId: post.authorUserId,
          cooperativeId: post.cooperativeId,
        },
        include: {
          user: true,
        },
      });

      if (member) {
        if (member.user) {
          authorName = `${member.user.firstName} ${member.user.lastName}`;
          authorAvatar = member.user.avatarUrl;
        } else if (member.isOfflineMember) {
          authorName = `${member.firstName} ${member.lastName}`;
        }
      }
    }

    return {
      ...post,
      authorName,
      authorAvatar,
      userReaction: post.reactions.find((r) => r.userId === userId)?.reactionType || null,
      reactionCounts: this.aggregateReactions(post.reactions),
    };
  }

  async update(id: string, updatePostDto: UpdatePostDto, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundException('Post not found');
    }

    // Only the author or an admin can edit
    const isAdmin = await this.isUserAdmin(userId, post.cooperativeId);
    if (post.authorUserId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    // Sanitize content
    const updates: any = {};
    if (updatePostDto.title) {
      updates.title = this.sanitizeContent(updatePostDto.title);
    }
    if (updatePostDto.content) {
      updates.content = this.sanitizeContent(updatePostDto.content);
    }
    if (updatePostDto.imageUrl !== undefined) {
      updates.imageUrl = updatePostDto.imageUrl;
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: updates,
    });

    return updatedPost;
  }

  async delete(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundException('Post not found');
    }

    // Only the author or an admin can delete
    const isAdmin = await this.isUserAdmin(userId, post.cooperativeId);
    if (post.authorUserId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    // Soft delete
    await this.prisma.post.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return { success: true, message: 'Post deleted successfully' };
  }

  async pin(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundException('Post not found');
    }

    // Only admins can pin posts
    const isAdmin = await this.isUserAdmin(userId, post.cooperativeId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can pin posts');
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        isPinned: true,
        pinnedAt: new Date(),
        pinnedBy: userId,
      },
    });

    return updatedPost;
  }

  async unpin(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundException('Post not found');
    }

    // Only admins can unpin posts
    const isAdmin = await this.isUserAdmin(userId, post.cooperativeId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can unpin posts');
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        isPinned: false,
        pinnedAt: null,
        pinnedBy: null,
      },
    });

    return updatedPost;
  }

  async approve(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundException('Post not found');
    }

    // Only admins can approve posts
    const isAdmin = await this.isUserAdmin(userId, post.cooperativeId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can approve posts');
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        isApproved: true,
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    // Notify the post author
    if (post.authorUserId && post.authorUserId !== userId) {
      await this.notificationsService.createNotification({
        userId: post.authorUserId,
        cooperativeId: post.cooperativeId,
        type: 'announcement',
        title: 'Post Approved',
        body: 'Your post has been approved and is now visible to all members',
        actionType: 'view',
        actionRoute: 'MessageWall',
        actionParams: { postId: post.id },
      });
    }

    return updatedPost;
  }

  // Reactions
  async addReaction(postId: string, addReactionDto: AddReactionDto, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundException('Post not found');
    }

    // Verify user is a member
    await this.getMemberInfo(userId, post.cooperativeId);

    // Check if reaction already exists
    const existingReaction = await this.prisma.reaction.findFirst({
      where: {
        postId,
        userId,
        reactionType: addReactionDto.reactionType,
      },
    });

    if (existingReaction) {
      return existingReaction;
    }

    // Remove any other reaction types from this user on this post
    await this.prisma.reaction.deleteMany({
      where: {
        postId,
        userId,
      },
    });

    // Add new reaction
    const reaction = await this.prisma.reaction.create({
      data: {
        postId,
        userId,
        reactionType: addReactionDto.reactionType,
      },
    });

    return reaction;
  }

  async removeReaction(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundException('Post not found');
    }

    // Remove all reactions from this user on this post
    await this.prisma.reaction.deleteMany({
      where: {
        postId,
        userId,
      },
    });

    return { success: true, message: 'Reaction removed' };
  }

  // Comments
  async addComment(postId: string, createCommentDto: CreateCommentDto, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundException('Post not found');
    }

    // Verify user is a member
    const member = await this.getMemberInfo(userId, post.cooperativeId);

    // Get author name
    let authorName = 'Unknown';
    if (member.user) {
      authorName = `${member.user.firstName} ${member.user.lastName}`;
    } else if (member.isOfflineMember) {
      authorName = `${member.firstName} ${member.lastName}`;
    }

    // Sanitize content
    const sanitizedContent = this.sanitizeContent(createCommentDto.content);

    // Validate parent comment if provided
    if (createCommentDto.parentCommentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: createCommentDto.parentCommentId },
      });

      if (!parentComment || parentComment.postId !== postId || parentComment.isDeleted) {
        throw new BadRequestException('Invalid parent comment');
      }
    }

    // Create comment
    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorUserId: userId,
        authorName,
        content: sanitizedContent,
        parentCommentId: createCommentDto.parentCommentId,
      },
      include: {
        reactions: true,
      },
    });

    return comment;
  }

  async getComments(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundException('Post not found');
    }

    // Verify user is a member
    await this.getMemberInfo(userId, post.cooperativeId);

    // Get all top-level comments with their replies
    const comments = await this.prisma.comment.findMany({
      where: {
        postId,
        parentCommentId: null,
        isDeleted: false,
      },
      include: {
        reactions: {
          select: {
            id: true,
            userId: true,
            reactionType: true,
          },
        },
        replies: {
          where: {
            isDeleted: false,
          },
          include: {
            reactions: {
              select: {
                id: true,
                userId: true,
                reactionType: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return comments;
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: true,
      },
    });

    if (!comment || comment.isDeleted) {
      throw new NotFoundException('Comment not found');
    }

    // Only the author or an admin can delete
    const isAdmin = await this.isUserAdmin(userId, comment.post.cooperativeId);
    if (comment.authorUserId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Soft delete
    await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return { success: true, message: 'Comment deleted successfully' };
  }

  async addCommentReaction(commentId: string, addReactionDto: AddReactionDto, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: true,
      },
    });

    if (!comment || comment.isDeleted) {
      throw new NotFoundException('Comment not found');
    }

    // Verify user is a member
    await this.getMemberInfo(userId, comment.post.cooperativeId);

    // Check if reaction already exists
    const existingReaction = await this.prisma.reaction.findFirst({
      where: {
        commentId,
        userId,
        reactionType: addReactionDto.reactionType,
      },
    });

    if (existingReaction) {
      return existingReaction;
    }

    // Remove any other reaction types from this user on this comment
    await this.prisma.reaction.deleteMany({
      where: {
        commentId,
        userId,
      },
    });

    // Add new reaction
    const reaction = await this.prisma.reaction.create({
      data: {
        commentId,
        userId,
        reactionType: addReactionDto.reactionType,
      },
    });

    return reaction;
  }

  async removeCommentReaction(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: true,
      },
    });

    if (!comment || comment.isDeleted) {
      throw new NotFoundException('Comment not found');
    }

    // Remove all reactions from this user on this comment
    await this.prisma.reaction.deleteMany({
      where: {
        commentId,
        userId,
      },
    });

    return { success: true, message: 'Reaction removed' };
  }
}
