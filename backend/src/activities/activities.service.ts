import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateActivityDto {
  userId: string;
  cooperativeId?: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateActivityDto) {
    return this.prisma.activity.create({
      data: {
        userId: dto.userId,
        cooperativeId: dto.cooperativeId ?? null,
        action: dto.action,
        description: dto.description,
        metadata: dto.metadata ?? Prisma.JsonNull,
      },
    });
  }

  async findByUser(userId: string, limit = 20) {
    return this.prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        cooperative: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async findByCooperative(cooperativeId: string, limit = 20) {
    return this.prisma.activity.findMany({
      where: { cooperativeId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findRecentForUser(userId: string, limit = 10) {
    // Get activities for this user and activities from cooperatives they belong to
    const userMemberships = await this.prisma.member.findMany({
      where: { userId, status: 'active' },
      select: { cooperativeId: true },
    });

    const cooperativeIds = userMemberships.map((m) => m.cooperativeId);

    return this.prisma.activity.findMany({
      where: {
        OR: [
          { userId },
          { cooperativeId: { in: cooperativeIds } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        cooperative: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  // Helper method to log activities - can be called from other services
  async log(
    userId: string,
    action: string,
    description: string,
    cooperativeId?: string,
    metadata?: Record<string, any>,
  ) {
    return this.create({
      userId,
      cooperativeId,
      action,
      description,
      metadata,
    });
  }
}
