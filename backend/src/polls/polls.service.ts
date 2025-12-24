import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PollsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // Check if user is a member of the cooperative
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

  async create(createPollDto: CreatePollDto, userId: string) {
    const { cooperativeId, question, description, options, allowMultipleVotes, isAnonymous, endsAt } = createPollDto;

    // Verify user is a member
    const member = await this.getMemberInfo(userId, cooperativeId);

    // Get author name
    const authorName = member.user
      ? `${member.user.firstName} ${member.user.lastName}`
      : member.isOfflineMember
        ? `${member.firstName} ${member.lastName}`
        : 'A member';

    // Create poll with options
    const poll = await this.prisma.poll.create({
      data: {
        cooperativeId,
        createdByUserId: userId,
        createdByName: authorName,
        question,
        description,
        allowMultipleVotes: allowMultipleVotes ?? false,
        isAnonymous: isAnonymous ?? false,
        endsAt: endsAt ? new Date(endsAt) : null,
        options: {
          create: options.map((opt, index) => ({
            text: opt.text,
            sortOrder: index,
          })),
        },
      },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
        },
        cooperative: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Send notification to all cooperative members
    await this.notificationsService.notifyCooperativeMembers(
      cooperativeId,
      'poll_created',
      `📊 New Poll in ${poll.cooperative.name}`,
      `${authorName} created a poll: ${question}`,
      {
        pollId: poll.id,
        authorName,
      },
      [userId], // Exclude creator
      'MessageWall',
      { cooperativeId },
    );

    return this.formatPollResponse(poll, userId);
  }

  async findAll(cooperativeId: string, userId: string, query: any = {}) {
    const { page = 1, limit = 20, activeOnly = true } = query;

    // Convert to integers
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 20;

    // Verify user is a member
    await this.getMemberInfo(userId, cooperativeId);

    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      cooperativeId,
      isDeleted: false,
    };

    if (activeOnly === true || activeOnly === 'true') {
      where.isActive = true;
      // Also exclude polls that have ended
      where.OR = [
        { endsAt: null },
        { endsAt: { gt: new Date() } },
      ];
    }

    const [polls, total] = await Promise.all([
      this.prisma.poll.findMany({
        where,
        include: {
          options: {
            orderBy: { sortOrder: 'asc' },
            include: {
              votes: true,
            },
          },
          votes: {
            where: { userId },
          },
          _count: {
            select: {
              votes: true,
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limitNum,
      }),
      this.prisma.poll.count({ where }),
    ]);

    return {
      polls: polls.map((poll) => this.formatPollResponse(poll, userId)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(pollId: string, userId: string) {
    const poll = await this.prisma.poll.findFirst({
      where: {
        id: pollId,
        isDeleted: false,
      },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
          include: {
            votes: true,
          },
        },
        votes: {
          where: { userId },
        },
        cooperative: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Verify user is a member
    await this.getMemberInfo(userId, poll.cooperativeId);

    return this.formatPollResponse(poll, userId);
  }

  async castVote(pollId: string, castVoteDto: CastVoteDto, userId: string) {
    const { optionId } = castVoteDto;

    // Get poll with options
    const poll = await this.prisma.poll.findFirst({
      where: {
        id: pollId,
        isDeleted: false,
      },
      include: {
        options: true,
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Verify user is a member
    await this.getMemberInfo(userId, poll.cooperativeId);

    // Check if poll is still active
    if (!poll.isActive) {
      throw new BadRequestException('This poll is no longer active');
    }

    // Check if poll has ended
    if (poll.endsAt && new Date() > poll.endsAt) {
      throw new BadRequestException('This poll has ended');
    }

    // Check if option belongs to this poll
    const option = poll.options.find((opt) => opt.id === optionId);
    if (!option) {
      throw new BadRequestException('Invalid option for this poll');
    }

    // Check existing votes
    const existingVotes = await this.prisma.pollVote.findMany({
      where: {
        pollId,
        userId,
      },
    });

    // If not allowing multiple votes and user has already voted
    if (!poll.allowMultipleVotes && existingVotes.length > 0) {
      // Check if voting for same option (toggle off)
      if (existingVotes[0].optionId === optionId) {
        // Remove the vote
        await this.prisma.pollVote.delete({
          where: { id: existingVotes[0].id },
        });
        return this.findOne(pollId, userId);
      }
      // Change vote to new option
      await this.prisma.pollVote.update({
        where: { id: existingVotes[0].id },
        data: { optionId },
      });
      return this.findOne(pollId, userId);
    }

    // For multiple votes, check if already voted for this option
    const existingVoteForOption = existingVotes.find((v) => v.optionId === optionId);
    if (existingVoteForOption) {
      // Toggle off - remove vote
      await this.prisma.pollVote.delete({
        where: { id: existingVoteForOption.id },
      });
      return this.findOne(pollId, userId);
    }

    // Cast new vote
    await this.prisma.pollVote.create({
      data: {
        pollId,
        optionId,
        userId,
      },
    });

    return this.findOne(pollId, userId);
  }

  async closePoll(pollId: string, userId: string) {
    const poll = await this.prisma.poll.findFirst({
      where: {
        id: pollId,
        isDeleted: false,
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Verify user is admin or poll creator
    const member = await this.getMemberInfo(userId, poll.cooperativeId);
    if (member.role !== 'admin' && poll.createdByUserId !== userId) {
      throw new ForbiddenException('Only admins or the poll creator can close the poll');
    }

    await this.prisma.poll.update({
      where: { id: pollId },
      data: { isActive: false },
    });

    return this.findOne(pollId, userId);
  }

  async deletePoll(pollId: string, userId: string) {
    const poll = await this.prisma.poll.findFirst({
      where: {
        id: pollId,
        isDeleted: false,
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Verify user is admin or poll creator
    const member = await this.getMemberInfo(userId, poll.cooperativeId);
    if (member.role !== 'admin' && poll.createdByUserId !== userId) {
      throw new ForbiddenException('Only admins or the poll creator can delete the poll');
    }

    await this.prisma.poll.update({
      where: { id: pollId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { success: true };
  }

  async pinPoll(pollId: string, userId: string) {
    const poll = await this.prisma.poll.findFirst({
      where: {
        id: pollId,
        isDeleted: false,
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Only admins can pin
    const member = await this.getMemberInfo(userId, poll.cooperativeId);
    if (member.role !== 'admin') {
      throw new ForbiddenException('Only admins can pin polls');
    }

    await this.prisma.poll.update({
      where: { id: pollId },
      data: {
        isPinned: true,
        pinnedAt: new Date(),
      },
    });

    return this.findOne(pollId, userId);
  }

  async unpinPoll(pollId: string, userId: string) {
    const poll = await this.prisma.poll.findFirst({
      where: {
        id: pollId,
        isDeleted: false,
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Only admins can unpin
    const member = await this.getMemberInfo(userId, poll.cooperativeId);
    if (member.role !== 'admin') {
      throw new ForbiddenException('Only admins can unpin polls');
    }

    await this.prisma.poll.update({
      where: { id: pollId },
      data: {
        isPinned: false,
        pinnedAt: null,
      },
    });

    return this.findOne(pollId, userId);
  }

  private formatPollResponse(poll: any, userId: string) {
    const totalVotes = poll.options?.reduce(
      (sum: number, opt: any) => sum + (opt.votes?.length || 0),
      0,
    ) || poll._count?.votes || 0;

    // Get unique voters count
    const uniqueVoterIds = new Set<string>();
    poll.options?.forEach((opt: any) => {
      opt.votes?.forEach((vote: any) => {
        uniqueVoterIds.add(vote.userId);
      });
    });
    const totalVoters = uniqueVoterIds.size;

    // Check if poll has ended
    const hasEnded = poll.endsAt ? new Date() > new Date(poll.endsAt) : false;

    // User's votes
    const userVotedOptionIds = poll.votes?.map((v: any) => v.optionId) || [];

    return {
      id: poll.id,
      cooperativeId: poll.cooperativeId,
      createdByUserId: poll.createdByUserId,
      createdByName: poll.createdByName,
      question: poll.question,
      description: poll.description,
      allowMultipleVotes: poll.allowMultipleVotes,
      isAnonymous: poll.isAnonymous,
      endsAt: poll.endsAt,
      isActive: poll.isActive && !hasEnded,
      isPinned: poll.isPinned,
      hasEnded,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      totalVotes,
      totalVoters,
      userVotedOptionIds,
      hasVoted: userVotedOptionIds.length > 0,
      options: poll.options?.map((opt: any) => {
        const voteCount = opt.votes?.length || 0;
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

        return {
          id: opt.id,
          text: opt.text,
          sortOrder: opt.sortOrder,
          voteCount,
          percentage,
          isSelected: userVotedOptionIds.includes(opt.id),
          // Only include voters if not anonymous
          voters: poll.isAnonymous
            ? []
            : opt.votes?.map((v: any) => v.userId) || [],
        };
      }),
    };
  }
}
