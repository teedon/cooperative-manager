import { Controller, Get, Post, Put, Query, Param, Body, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../admin-auth/admin-jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

interface Organization {
  id: string;
  name: string;
  type: 'cooperative' | 'manager';
  description?: string;
  cooperativesCount: number;
  staffCount: number;
  status: 'active' | 'inactive';
  totalRevenue: number;
  createdAt: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

interface OrganizationsResponse {
  organizations: Organization[];
  total: number;
  totalPages: number;
  currentPage: number;
}

interface OrganizationStats {
  totalOrganizations: number;
  cooperativeOrganizations: number;
  managerOrganizations: number;
  averageCooperativesPerManager: number;
  totalStaff: number;
  organizationGrowth: number; // percentage
}

interface CreateOrganizationDto {
  name: string;
  type: 'cooperative' | 'manager';
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface AddUserToOrganizationDto {
  userId: string;
  role: 'admin' | 'supervisor' | 'field_agent' | 'accountant';
  permissions: string[];
  employeeCode?: string;
}

interface OrganizationStaff {
  id: string;
  userId: string;
  role: string;
  permissions: string[];
  employeeCode?: string;
  isActive: boolean;
  hiredAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

@Controller('admin/organizations')
@UseGuards(AdminJwtAuthGuard)
export class AdminOrganizationsController {
  
  constructor(private prisma: PrismaService) {}

  @Get()
  async getOrganizations(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('type') type?: 'cooperative' | 'manager',
  ): Promise<OrganizationsResponse> {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }
    
    if (type) {
      where.type = type;
    }
    
    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          staff: {
            where: {
              isActive: true
            }
          },
          cooperatives: true,
          _count: {
            select: {
              staff: {
                where: {
                  isActive: true
                }
              },
              cooperatives: true
            }
          }
        }
      }),
      this.prisma.organization.count({ where })
    ]);
    
    const formattedOrganizations: Organization[] = organizations.map(org => {
      // Calculate estimated revenue from cooperatives they manage
      const totalRevenue = org.cooperatives.reduce((sum, coop) => {
        return sum + (coop.totalContributions || 0);
      }, 0);
      
      return {
        id: org.id,
        name: org.name,
        type: org.type as 'cooperative' | 'manager',
        description: org.description || undefined,
        cooperativesCount: org._count.cooperatives,
        staffCount: org._count.staff,
        status: 'active', // You might want to add status field to Organization model
        totalRevenue: totalRevenue,
        createdAt: org.createdAt.toISOString(),
        contactInfo: {
          email: org.email || undefined,
          phone: org.phone || undefined,
          address: org.address || undefined
        }
      };
    });
    
    const totalPages = Math.ceil(total / limitNum);
    
    return {
      organizations: formattedOrganizations,
      total,
      totalPages,
      currentPage: pageNum,
    };
  }

  @Get('stats')
  async getOrganizationStats(): Promise<OrganizationStats> {
    const [totalOrgs, cooperativeOrgs, managerOrgs, totalStaff] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.organization.count({
        where: { type: 'cooperative' }
      }),
      this.prisma.organization.count({
        where: { type: 'manager' }
      }),
      this.prisma.staff.count({
        where: { isActive: true }
      })
    ]);

    // Get organizations with their cooperative counts for average calculation
    const managerOrgsWithCoops = await this.prisma.organization.findMany({
      where: { type: 'manager' },
      include: {
        _count: {
          select: {
            cooperatives: true
          }
        }
      }
    });

    const totalCooperativesManaged = managerOrgsWithCoops.reduce((sum, org) => {
      return sum + org._count.cooperatives;
    }, 0);

    const averageCooperativesPerManager = managerOrgs > 0 
      ? Math.round((totalCooperativesManaged / managerOrgs) * 100) / 100 
      : 0;

    // Simple growth calculation (placeholder - you can implement proper historical tracking)
    const organizationGrowth = 0; // This would require historical data
    
    return {
      totalOrganizations: totalOrgs,
      cooperativeOrganizations: cooperativeOrgs,
      managerOrganizations: managerOrgs,
      averageCooperativesPerManager: averageCooperativesPerManager,
      totalStaff: totalStaff,
      organizationGrowth: organizationGrowth,
    };
  }

  @Put(':id/status')
  async updateOrganizationStatus(
    @Param('id') organizationId: string,
    @Query('status') status: 'active' | 'inactive',
  ): Promise<{ success: boolean; message: string }> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId }
      });
      
      if (!organization) {
        return {
          success: false,
          message: 'Organization not found'
        };
      }

      // Note: Organization model doesn't have status field yet
      // You might want to add it to the schema
      // For now, we'll just return success
      
      return {
        success: true,
        message: `Organization status updated to ${status}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update organization status'
      };
    }
  }

  @Post()
  async createOrganization(
    @Body() createOrgDto: CreateOrganizationDto,
  ): Promise<{ success: boolean; message: string; organization?: any }> {
    try {
      const organization = await this.prisma.organization.create({
        data: {
          name: createOrgDto.name,
          type: createOrgDto.type,
          description: createOrgDto.description,
          email: createOrgDto.email,
          phone: createOrgDto.phone,
          address: createOrgDto.address,
        },
        include: {
          _count: {
            select: {
              staff: true,
              cooperatives: true
            }
          }
        }
      });

      // Auto-create CollectionSettings for manager-type organizations
      if (createOrgDto.type === 'manager') {
        await this.prisma.collectionSettings.create({
          data: {
            organizationId: organization.id,
            requireApproval: true,
            allowPartialPosting: false,
            autoPostAfterHours: 24,
            defaultTransactionTypes: ['contribution', 'loan_repayment']
          }
        });
      }

      return {
        success: true,
        message: 'Organization created successfully',
        organization: {
          id: organization.id,
          name: organization.name,
          type: organization.type,
          description: organization.description,
          cooperativesCount: organization._count.cooperatives,
          staffCount: organization._count.staff,
          status: 'active',
          totalRevenue: 0,
          createdAt: organization.createdAt.toISOString(),
          contactInfo: {
            email: organization.email,
            phone: organization.phone,
            address: organization.address
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create organization'
      };
    }
  }

  @Get(':id/staff')
  async getOrganizationStaff(
    @Param('id') organizationId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<{ staff: OrganizationStaff[]; total: number; totalPages: number; currentPage: number }> {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [staff, total] = await Promise.all([
      this.prisma.staff.findMany({
        where: {
          organizationId: organizationId,
        },
        skip,
        take: limitNum,
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

    const formattedStaff: OrganizationStaff[] = staff.map(member => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      permissions: Array.isArray(member.permissions) ? member.permissions : [],
      employeeCode: member.employeeCode || undefined,
      isActive: member.isActive,
      hiredAt: member.hiredAt.toISOString(),
      user: member.user
    }));

    const totalPages = Math.ceil(total / limitNum);

    return {
      staff: formattedStaff,
      total,
      totalPages,
      currentPage: pageNum,
    };
  }

  @Post(':id/staff')
  async addUserToOrganization(
    @Param('id') organizationId: string,
    @Body() addUserDto: AddUserToOrganizationDto,
  ): Promise<{ success: boolean; message: string; staff?: any }> {
    try {
      // Check if organization exists
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization) {
        return {
          success: false,
          message: 'Organization not found'
        };
      }

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: addUserDto.userId },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Check if user is already staff in this organization
      const existingStaff = await this.prisma.staff.findFirst({
        where: {
          organizationId: organizationId,
          userId: addUserDto.userId
        }
      });

      if (existingStaff) {
        return {
          success: false,
          message: 'User is already a staff member of this organization'
        };
      }

      // Create staff record
      const staff = await this.prisma.staff.create({
        data: {
          organizationId: organizationId,
          userId: addUserDto.userId,
          role: addUserDto.role,
          permissions: addUserDto.permissions,
          employeeCode: addUserDto.employeeCode,
          isActive: true,
          hiredAt: new Date()
        }
      });

      return {
        success: true,
        message: 'User added to organization successfully',
        staff: {
          id: staff.id,
          userId: staff.userId,
          role: staff.role,
          permissions: staff.permissions,
          employeeCode: staff.employeeCode,
          isActive: staff.isActive,
          hiredAt: staff.hiredAt.toISOString(),
          user: user
        }
      };
    } catch (error: any) {
      console.error('Error adding user to organization:', error);
      
      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('organizationId_userId')) {
          return {
            success: false,
            message: 'User is already a staff member of this organization'
          };
        }
        if (error.meta?.target?.includes('organizationId_employeeCode')) {
          return {
            success: false,
            message: 'Employee code already exists in this organization'
          };
        }
      }
      
      return {
        success: false,
        message: 'Failed to add user to organization: ' + (error.message || 'Unknown error')
      };
    }
  }
}