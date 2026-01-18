import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationType } from './enums/organization-type.enum';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateOrganizationDto, createdBy: string) {
    const organization = await this.prisma.organization.create({
      data: {
        ...createDto,
        settings: {},
      },
    });

    // Automatically add the creator as an admin staff member
    await this.prisma.staff.create({
      data: {
        organizationId: organization.id,
        userId: createdBy,
        role: 'admin',
        permissions: [
          'create_collection',
          'submit_collection',
          'approve_collection',
          'view_reports',
          'manage_staff',
          'manage_settings',
        ],
        isActive: true,
      },
    });

    // If it's a manager organization, create default collection settings
    if (createDto.type === OrganizationType.MANAGER) {
      await this.prisma.collectionSettings.create({
        data: {
          organizationId: organization.id,
          requireApproval: true,
          allowPartialPosting: false,
          minApprovers: 1,
          requireSupervisor: true,
        },
      });
    }

    return organization;
  }

  async findAll(userId: string) {
    // Find organizations where user is a staff member
    const staff = await this.prisma.staff.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });

    return staff.map((s: { organization: any }) => s.organization);
  }

  async findOne(id: string, userId?: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        collectionSettings: true,
        staff: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        cooperatives: {
          select: {
            id: true,
            name: true,
            code: true,
            memberCount: true,
          },
        },
        _count: {
          select: {
            staff: true,
            cooperatives: true,
            dailyCollections: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // If userId provided, verify user has access
    if (userId) {
      const hasAccess = organization.staff.some((s: { userId: string }) => s.userId === userId);
      if (!hasAccess) {
        throw new NotFoundException('Organization not found');
      }
    }

    return organization;
  }

  async update(id: string, updateDto: UpdateOrganizationDto, userId: string) {
    // Verify user has admin access to this organization
    await this.verifyAdminAccess(id, userId);

    const organization = await this.prisma.organization.update({
      where: { id },
      data: updateDto,
      include: {
        collectionSettings: true,
      },
    });

    return organization;
  }

  async updateSettings(
    id: string,
    settings: any,
    userId: string,
  ) {
    await this.verifyAdminAccess(id, userId);

    const organization = await this.prisma.organization.update({
      where: { id },
      data: { settings },
    });

    return organization;
  }

  async updateCollectionSettings(
    id: string,
    settings: {
      requireApproval?: boolean;
      allowPartialPosting?: boolean;
      autoPostAfterHours?: number;
      minApprovers?: number;
      requireSupervisor?: boolean;
    },
    userId: string,
  ) {
    await this.verifyAdminAccess(id, userId);

    const collectionSettings = await this.prisma.collectionSettings.upsert({
      where: { organizationId: id },
      create: {
        organizationId: id,
        ...settings,
      },
      update: settings,
    });

    return collectionSettings;
  }

  async getStats(id: string, userId: string) {
    await this.verifyAccess(id, userId);

    const [
      totalStaff,
      activeStaff,
      totalCooperatives,
      totalCollections,
      pendingCollections,
    ] = await Promise.all([
      this.prisma.staff.count({ where: { organizationId: id } }),
      this.prisma.staff.count({ where: { organizationId: id, isActive: true } }),
      this.prisma.cooperative.count({ where: { organizationId: id } }),
      this.prisma.dailyCollection.count({ where: { organizationId: id } }),
      this.prisma.dailyCollection.count({
        where: { organizationId: id, status: 'submitted' },
      }),
    ]);

    return {
      totalStaff,
      activeStaff,
      totalCooperatives,
      totalCollections,
      pendingCollections,
    };
  }

  // Helper methods
  private async verifyAccess(organizationId: string, userId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        organizationId,
        userId,
        isActive: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Organization not found or access denied');
    }

    return staff;
  }

  private async verifyAdminAccess(organizationId: string, userId: string) {
    const staff = await this.verifyAccess(organizationId, userId);

    if (staff.role !== 'admin') {
      throw new BadRequestException('Admin access required');
    }

    return staff;
  }
}
