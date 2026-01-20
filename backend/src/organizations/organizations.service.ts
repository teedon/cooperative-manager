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
        organization: {
          include: {
            _count: {
              select: {
                staff: true,
                cooperatives: true,
              },
            },
          },
        },
      },
    });

    return staff.map((s: any) => ({
      ...s.organization,
      staffCount: s.organization._count.staff,
      cooperativesCount: s.organization._count.cooperatives,
      totalRevenue: 0, // Calculate this based on actual business logic
      userRole: s.role,
      userPermissions: s.permissions,
    }));
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

    // If userId provided, verify user has access and get their role
    let userRole = null;
    let userPermissions = null;
    
    if (userId) {
      const userStaff = organization.staff.find((s: { userId: string }) => s.userId === userId);
      if (!userStaff) {
        throw new NotFoundException('Organization not found');
      }
      userRole = (userStaff as any).role;
      userPermissions = (userStaff as any).permissions;
    }

    return {
      ...organization,
      staffCount: organization._count.staff,
      cooperativesCount: organization._count.cooperatives,
      totalRevenue: 0, // Calculate based on actual collections
      userRole,
      userPermissions,
    };
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
  async getStaff(organizationId: string, userId: string, page: number = 1, limit: number = 10) {
    // Verify user has access to this organization
    await this.verifyAdminAccess(organizationId, userId);

    const skip = (page - 1) * limit;

    const [staff, total] = await Promise.all([
      this.prisma.staff.findMany({
        where: {
          organizationId: organizationId,
        },
        skip,
        take: limit,
        orderBy: {
          hiredAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            }
          }
        }
      }),
      this.prisma.staff.count({
        where: {
          organizationId: organizationId
        }
      })
    ]);

    const formattedStaff = staff.map(member => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      permissions: Array.isArray(member.permissions) ? member.permissions : [],
      employeeCode: member.employeeCode || undefined,
      isActive: member.isActive,
      hiredAt: member.hiredAt.toISOString(),
      user: member.user
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      staff: formattedStaff,
      total,
      totalPages,
      currentPage: page,
    };
  }

  async addStaff(organizationId: string, userId: string, addStaffDto: { userId: string; role: string; permissions: string[]; employeeCode?: string }) {
    // Verify user has admin access to this organization
    await this.verifyAdminAccess(organizationId, userId);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: addStaffDto.userId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already staff in this organization
    const existingStaff = await this.prisma.staff.findFirst({
      where: {
        organizationId: organizationId,
        userId: addStaffDto.userId
      }
    });

    if (existingStaff) {
      throw new BadRequestException('User is already a staff member of this organization');
    }

    // Create staff record
    const staff = await this.prisma.staff.create({
      data: {
        organizationId: organizationId,
        userId: addStaffDto.userId,
        role: addStaffDto.role,
        permissions: addStaffDto.permissions,
        employeeCode: addStaffDto.employeeCode,
        isActive: true,
        hiredAt: new Date()
      }
    });

    return {
      id: staff.id,
      userId: staff.userId,
      role: staff.role,
      permissions: staff.permissions,
      employeeCode: staff.employeeCode,
      isActive: staff.isActive,
      hiredAt: staff.hiredAt.toISOString(),
      user: user
    };
  }

  async removeStaff(organizationId: string, staffId: string, userId: string) {
    // Verify user has admin access to this organization
    await this.verifyAdminAccess(organizationId, userId);

    // Find the staff member
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        organizationId: organizationId
      }
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Don't allow removing the last admin
    if (staff.role === 'admin') {
      const adminCount = await this.prisma.staff.count({
        where: {
          organizationId: organizationId,
          role: 'admin',
          isActive: true
        }
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin from the organization');
      }
    }

    // Soft delete by setting isActive to false
    await this.prisma.staff.update({
      where: { id: staffId },
      data: { isActive: false }
    });

    return { success: true };
  }
  private async verifyAdminAccess(organizationId: string, userId: string) {
    const staff = await this.verifyAccess(organizationId, userId);

    if (staff.role !== 'admin') {
      throw new BadRequestException('Admin access required');
    }

    return staff;
  }
}
