import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCooperativeDto } from './dto/create-cooperative.dto';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class CooperativesService {
  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
  ) {}

  // Generate a unique 6-character alphanumeric code
  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Ensure generated code is unique
  private async generateUniqueCode(): Promise<string> {
    let code = this.generateCode();
    let exists = await this.prisma.cooperative.findUnique({ where: { code } });
    while (exists) {
      code = this.generateCode();
      exists = await this.prisma.cooperative.findUnique({ where: { code } });
    }
    return code;
  }

  async findAll() {
    return this.prisma.cooperative.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const coop = await this.prisma.cooperative.findUnique({ where: { id } });
    if (!coop) throw new NotFoundException('Cooperative not found');
    return coop;
  }

  async findByCode(code: string) {
    const coop = await this.prisma.cooperative.findUnique({ where: { code: code.toUpperCase() } });
    if (!coop) throw new NotFoundException('Cooperative not found with this code');
    return coop;
  }

  async create(dto: CreateCooperativeDto, createdBy?: string) {
    const code = await this.generateUniqueCode();
    
    const created = await this.prisma.cooperative.create({
      data: {
        name: dto.name,
        code,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
        status: dto.status ?? 'active',
        createdBy: createdBy ?? null,
        memberCount: createdBy ? 1 : 0,
      },
    });

    // Add the creator as an admin member if createdBy is provided
    if (createdBy) {
      await this.prisma.member.create({
        data: {
          cooperativeId: created.id,
          userId: createdBy,
          role: 'admin',
          joinedAt: new Date(),
          status: 'active',
          virtualBalance: 0,
        },
      });

      // Log activity
      await this.activitiesService.log(
        createdBy,
        'cooperative.create',
        `Created cooperative "${created.name}"`,
        created.id,
        { cooperativeName: created.name, code: created.code },
      );
    }

    return created;
  }

  async joinByCode(code: string, userId: string) {
    const coop = await this.findByCode(code);

    // Check if user is already a member
    const existingMember = await this.prisma.member.findFirst({
      where: { cooperativeId: coop.id, userId },
    });

    if (existingMember) {
      if (existingMember.status === 'pending') {
        throw new ConflictException('You have already requested to join this cooperative. Please wait for admin approval.');
      }
      throw new ConflictException('You are already a member of this cooperative');
    }

    // Create member with pending status
    const member = await this.prisma.member.create({
      data: {
        cooperativeId: coop.id,
        userId,
        role: 'member',
        joinedAt: new Date(),
        status: 'pending',
        virtualBalance: 0,
      },
    });

    // Log activity
    await this.activitiesService.log(
      userId,
      'cooperative.join_request',
      `Requested to join cooperative "${coop.name}"`,
      coop.id,
      { cooperativeName: coop.name, code: coop.code },
    );

    return { cooperative: coop, member };
  }

  async approveMember(memberId: string, adminUserId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: { cooperative: true, user: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Check if the requesting user is an admin of this cooperative
    const adminMember = await this.prisma.member.findFirst({
      where: {
        cooperativeId: member.cooperativeId,
        userId: adminUserId,
        role: 'admin',
        status: 'active',
      },
    });

    if (!adminMember) {
      throw new BadRequestException('You are not authorized to approve members for this cooperative');
    }

    if (member.status !== 'pending') {
      throw new BadRequestException('This member is not pending approval');
    }

    // Update member status to active and increment member count
    const [updatedMember] = await this.prisma.$transaction([
      this.prisma.member.update({
        where: { id: memberId },
        data: { status: 'active' },
      }),
      this.prisma.cooperative.update({
        where: { id: member.cooperativeId },
        data: { memberCount: { increment: 1 } },
      }),
    ]);

    // Log activity for admin
    await this.activitiesService.log(
      adminUserId,
      'member.approve',
      `Approved ${member.user.firstName} ${member.user.lastName}'s membership`,
      member.cooperativeId,
      { memberName: `${member.user.firstName} ${member.user.lastName}`, memberId: member.userId },
    );

    // Log activity for the approved member
    await this.activitiesService.log(
      member.userId,
      'member.approved',
      `Your membership to "${member.cooperative.name}" was approved`,
      member.cooperativeId,
      { cooperativeName: member.cooperative.name },
    );

    return updatedMember;
  }

  async rejectMember(memberId: string, adminUserId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: { cooperative: true, user: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Check if the requesting user is an admin of this cooperative
    const adminMember = await this.prisma.member.findFirst({
      where: {
        cooperativeId: member.cooperativeId,
        userId: adminUserId,
        role: 'admin',
        status: 'active',
      },
    });

    if (!adminMember) {
      throw new BadRequestException('You are not authorized to reject members for this cooperative');
    }

    if (member.status !== 'pending') {
      throw new BadRequestException('This member is not pending approval');
    }

    // Delete the pending member request
    await this.prisma.member.delete({
      where: { id: memberId },
    });

    // Log activity for admin
    await this.activitiesService.log(
      adminUserId,
      'member.reject',
      `Rejected ${member.user.firstName} ${member.user.lastName}'s membership request`,
      member.cooperativeId,
      { memberName: `${member.user.firstName} ${member.user.lastName}`, memberId: member.userId },
    );

    // Log activity for the rejected member
    await this.activitiesService.log(
      member.userId,
      'member.rejected',
      `Your membership request to "${member.cooperative.name}" was rejected`,
      member.cooperativeId,
      { cooperativeName: member.cooperative.name },
    );

    return { message: 'Member request rejected' };
  }

  async getPendingMembers(cooperativeId: string, adminUserId: string) {
    // Check if the requesting user is an admin of this cooperative
    const adminMember = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId: adminUserId,
        role: 'admin',
        status: 'active',
      },
    });

    if (!adminMember) {
      throw new BadRequestException('You are not authorized to view pending members for this cooperative');
    }

    return this.prisma.member.findMany({
      where: {
        cooperativeId,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  //implement getMembers
  async getMembers(cooperativeId: string, adminUserId: string) {
    // Check if the requesting user is an admin of this cooperative
    const adminMember = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId: adminUserId,
        role: 'admin',
        status: 'active',
      },
    });

    if (!adminMember) {
      throw new BadRequestException('You are not authorized to view members for this cooperative');
    }

    return this.prisma.member.findMany({
      where: {
        cooperativeId,
        status: 'active',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }
}
