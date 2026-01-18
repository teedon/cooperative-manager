import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto, UpdateStaffDto, AssignStaffToGroupDto } from './dto/create-staff.dto';
import { StaffPermission, STAFF_ROLE_PERMISSIONS } from './enums/staff-permissions.enum';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createDto: CreateStaffDto, createdBy: string) {
    // Verify the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already staff in this organization
    const existingStaff = await this.prisma.staff.findFirst({
      where: {
        organizationId,
        userId: createDto.userId,
      },
    });

    if (existingStaff) {
      throw new ConflictException('User is already a staff member in this organization');
    }

    // Get default permissions for role if not provided
    const permissions = createDto.permissions || 
      STAFF_ROLE_PERMISSIONS[createDto.role as keyof typeof STAFF_ROLE_PERMISSIONS] || 
      [];

    const staff = await this.prisma.staff.create({
      data: {
        organizationId,
        userId: createDto.userId,
        role: createDto.role,
        permissions,
        employeeCode: createDto.employeeCode,
        commission: createDto.commission || 0,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    return staff;
  }

  async findAll(organizationId: string, filters?: { isActive?: boolean; role?: string }) {
    const where: any = { organizationId };
    
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    
    if (filters?.role) {
      where.role = filters.role;
    }

    const staff = await this.prisma.staff.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        groupAssignments: {
          where: { isActive: true },
          include: {
            cooperative: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        _count: {
          select: {
            groupAssignments: true,
            dailyCollections: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return staff;
  }

  async findOne(organizationId: string, staffId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        groupAssignments: {
          where: { isActive: true },
          include: {
            cooperative: {
              select: {
                id: true,
                name: true,
                code: true,
                memberCount: true,
              },
            },
          },
        },
        dailyCollections: {
          take: 10,
          orderBy: { collectionDate: 'desc' },
          select: {
            id: true,
            collectionDate: true,
            totalAmount: true,
            transactionCount: true,
            status: true,
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    return staff;
  }

  async update(organizationId: string, staffId: string, updateDto: UpdateStaffDto) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        organizationId,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // If updating role and no permissions provided, use role defaults
    let permissions = updateDto.permissions;
    if (updateDto.role && !updateDto.permissions) {
      permissions = STAFF_ROLE_PERMISSIONS[updateDto.role as keyof typeof STAFF_ROLE_PERMISSIONS] || staff.permissions;
    }

    const updated = await this.prisma.staff.update({
      where: { id: staffId },
      data: {
        ...updateDto,
        permissions,
        ...(updateDto.isActive === false && { terminatedAt: new Date() }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    return updated;
  }

  async updatePermissions(
    organizationId: string,
    staffId: string,
    permissions: StaffPermission[],
  ) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        organizationId,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const updated = await this.prisma.staff.update({
      where: { id: staffId },
      data: { permissions },
    });

    return updated;
  }

  async remove(organizationId: string, staffId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        organizationId,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Check if staff has pending collections
    const pendingCollections = await this.prisma.dailyCollection.count({
      where: {
        staffId,
        status: { in: ['draft', 'submitted'] },
      },
    });

    if (pendingCollections > 0) {
      throw new BadRequestException(
        'Cannot remove staff member with pending collections. Please resolve all pending collections first.',
      );
    }

    // Deactivate instead of delete to preserve history
    await this.prisma.staff.update({
      where: { id: staffId },
      data: {
        isActive: false,
        terminatedAt: new Date(),
      },
    });

    // Deactivate all group assignments
    await this.prisma.staffGroupAssignment.updateMany({
      where: { staffId },
      data: { isActive: false },
    });

    return { message: 'Staff member removed successfully' };
  }

  async assignToGroups(
    organizationId: string,
    staffId: string,
    assignDto: AssignStaffToGroupDto,
    assignedBy: string,
  ) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        organizationId,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Verify all cooperatives belong to the organization
    const cooperatives = await this.prisma.cooperative.findMany({
      where: {
        id: { in: assignDto.cooperativeIds },
        organizationId,
      },
    });

    if (cooperatives.length !== assignDto.cooperativeIds.length) {
      throw new BadRequestException('Some cooperatives not found or do not belong to this organization');
    }

    // Create assignments (upsert to handle existing ones)
    const assignments = await Promise.all(
      assignDto.cooperativeIds.map(cooperativeId =>
        this.prisma.staffGroupAssignment.upsert({
          where: {
            staffId_cooperativeId: {
              staffId,
              cooperativeId,
            },
          },
          create: {
            staffId,
            cooperativeId,
            assignedBy,
            startDate: assignDto.startDate ? new Date(assignDto.startDate) : undefined,
            endDate: assignDto.endDate ? new Date(assignDto.endDate) : undefined,
            isActive: true,
          },
          update: {
            isActive: true,
            startDate: assignDto.startDate ? new Date(assignDto.startDate) : undefined,
            endDate: assignDto.endDate ? new Date(assignDto.endDate) : undefined,
          },
          include: {
            cooperative: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        }),
      ),
    );

    return assignments;
  }

  async getAssignments(organizationId: string, staffId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        organizationId,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const assignments = await this.prisma.staffGroupAssignment.findMany({
      where: {
        staffId,
        isActive: true,
      },
      include: {
        cooperative: {
          select: {
            id: true,
            name: true,
            code: true,
            memberCount: true,
            totalContributions: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    return assignments;
  }

  async removeAssignment(organizationId: string, staffId: string, cooperativeId: string) {
    const assignment = await this.prisma.staffGroupAssignment.findFirst({
      where: {
        staffId,
        cooperativeId,
        staff: {
          organizationId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    await this.prisma.staffGroupAssignment.update({
      where: { id: assignment.id },
      data: { isActive: false },
    });

    return { message: 'Assignment removed successfully' };
  }

  async hasPermission(staffId: string, permission: StaffPermission): Promise<boolean> {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      select: { permissions: true, role: true, isActive: true },
    });

    if (!staff || !staff.isActive) {
      return false;
    }

    // Admins have all permissions
    if (staff.role === 'admin') {
      return true;
    }

    return staff.permissions.includes(permission);
  }

  async getAssignedCooperativeIds(staffId: string): Promise<string[]> {
    const assignments = await this.prisma.staffGroupAssignment.findMany({
      where: {
        staffId,
        isActive: true,
      },
      select: {
        cooperativeId: true,
      },
    });

    return assignments.map((a: { cooperativeId: string }) => a.cooperativeId);
  }

  // Public methods for guards to use (avoid bracket notation anti-pattern)
  async findByUserAndOrg(userId: string, organizationId: string) {
    return this.prisma.staff.findFirst({
      where: {
        userId,
        organizationId,
        isActive: true,
      },
    });
  }

  async findAssignment(staffId: string, cooperativeId: string) {
    return this.prisma.staffGroupAssignment.findFirst({
      where: {
        staffId,
        cooperativeId,
        isActive: true,
      },
    });
  }
}
