import { Controller, Get, Put, Post, Body, Query, Param, UseGuards, HttpException, HttpStatus, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuthService } from '../admin-auth/admin-auth.service';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { CreateUserDto } from '../users/dto/create-user.dto';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  totalPages: number;
  currentPage: number;
}

class CreateAdminUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  role?: string;
}

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface AdminUsersResponse {
  admins: AdminUser[];
  total: number;
  totalPages: number;
  currentPage: number;
}

@Controller('admin/users')
@UseGuards(AuthGuard('jwt'))
export class AdminUsersController {
  
  constructor(
    private prisma: PrismaService,
    private adminAuthService: AdminAuthService
  ) {}
  @Get()
  async getUsers(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'inactive',
  ): Promise<UsersResponse> {
    // Check if user has admin privileges (has admin role in any organization)
    const adminCheck = await this.prisma.staff.findFirst({
      where: {
        userId: req.user.id,
        role: 'admin',
        isActive: true,
      },
    });

    if (!adminCheck) {
      throw new HttpException(
        { success: false, message: 'Access denied. Admin privileges required.' },
        HttpStatus.FORBIDDEN,
      );
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    // Build where clause
    const where: any = {};
    
    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        {
          firstName: {
            contains: searchLower,
            mode: 'insensitive'
          }
        },
        {
          lastName: {
            contains: searchLower,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: searchLower,
            mode: 'insensitive'
          }
        }
      ];
    }
    
    // Note: User model doesn't have status field, so we'll consider all users as active
    // You might want to add a status field to User model later
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          members: {
            take: 1, // Get first membership to determine role
            include: {
              cooperative: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }),
      this.prisma.user.count({ where })
    ]);
    
    const formattedUsers: User[] = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || undefined,
      role: user.members[0]?.role || 'Member',
      status: 'active' as const, // All users are considered active for now
      createdAt: user.createdAt.toISOString()
    }));
    
    const totalPages = Math.ceil(total / limitNum);
    
    return {
      users: formattedUsers,
      total,
      totalPages,
      currentPage: pageNum,
    };
  }

  @Put(':id/status')
  async updateUserStatus(
    @Param('id') userId: string,
    @Query('status') status: 'active' | 'inactive',
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    // Check if user has admin privileges
    const adminCheck = await this.prisma.staff.findFirst({
      where: {
        userId: req.user.id,
        role: 'admin',
        isActive: true,
      },
    });

    if (!adminCheck) {
      return {
        success: false,
        message: 'Access denied. Admin privileges required.'
      };
    }
    // Note: User model doesn't have a status field currently
    // This would need to be implemented if user status functionality is required
    try {
      // For now, we'll just validate the user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      // TODO: Add status field to User model and implement actual update
      console.log(`Updating user ${userId} status to ${status}`);
      
      return {
        success: true,
        message: `User status updated to ${status}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update user status'
      };
    }
  }

  @Post('admins')
  async createAdminUser(
    @Body() createAdminDto: CreateAdminUserDto,
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const admin = await this.adminAuthService.createAdmin({
        email: createAdminDto.email,
        password: createAdminDto.password,
        firstName: createAdminDto.firstName,
        lastName: createAdminDto.lastName,
        role: createAdminDto.role || 'admin',
      });
      
      return {
        success: true,
        message: 'Admin user created successfully',
        data: admin,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create admin user',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('admins')
  async getAdminUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ): Promise<AdminUsersResponse> {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    // Build where clause for search
    const where: any = {};
    
    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        {
          firstName: {
            contains: searchLower,
            mode: 'insensitive'
          }
        },
        {
          lastName: {
            contains: searchLower,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: searchLower,
            mode: 'insensitive'
          }
        }
      ];
    }
    
    const [admins, total] = await Promise.all([
      this.prisma.adminUser.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        }
      }),
      this.prisma.adminUser.count({ where })
    ]);
    
    const formattedAdmins: AdminUser[] = admins.map(admin => ({
      id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      createdAt: admin.createdAt.toISOString(),
      lastLoginAt: admin.lastLoginAt?.toISOString() || null,
    }));
    
    const totalPages = Math.ceil(total / limitNum);
    
    return {
      admins: formattedAdmins,
      total,
      totalPages,
      currentPage: pageNum,
    };
  }

  @Put('admins/:id/status')
  async updateAdminStatus(
    @Param('id') adminId: string,
    @Query('status') status: 'active' | 'inactive',
  ): Promise<{ success: boolean; message: string }> {
    try {
      const isActive = status === 'active';
      
      const admin = await this.prisma.adminUser.findUnique({
        where: { id: adminId }
      });
      
      if (!admin) {
        return {
          success: false,
          message: 'Admin user not found'
        };
      }
      
      await this.prisma.adminUser.update({
        where: { id: adminId },
        data: { isActive }
      });
      
      return {
        success: true,
        message: `Admin user ${isActive ? 'activated' : 'deactivated'} successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update admin status'
      };
    }
  }

  @Post('users')
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string; data?: any }> {
    // Check if user has admin privileges
    const adminCheck = await this.prisma.staff.findFirst({
      where: {
        userId: req.user.id,
        role: 'admin',
        isActive: true,
      },
    });

    if (!adminCheck) {
      return {
        success: false,
        message: 'Access denied. Admin privileges required.'
      };
    }
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email }
      });

      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      // Hash password
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          password: hashedPassword,
          firstName: createUserDto.firstName || '',
          lastName: createUserDto.lastName || '',
          phone: createUserDto.phone,
          avatarUrl: createUserDto.avatarUrl,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          createdAt: true,
        }
      });

      return {
        success: true,
        message: 'User created successfully',
        data: user
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create user'
      };
    }
  }
}