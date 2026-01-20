import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';

type TokenPair = { accessToken: string; refreshToken: string };

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async validateAdmin(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (!admin) return null;
    if (!admin.isActive) return null;
    
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) return null;
    
    const { password: _, refreshToken: __, ...safe } = admin;
    return safe;
  }

  async login(admin: any) {
    const payload = { sub: admin.id, email: admin.email, role: admin.role, type: 'admin' };
    const accessToken = this.jwt.sign(payload, { expiresIn: '8h' });
    const refreshToken = randomBytes(64).toString('hex');
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { 
        refreshToken: hashedRefreshToken,
        lastLoginAt: new Date(),
      },
    });

    return { accessToken, refreshToken } as TokenPair;
  }

  async refreshTokens(adminId: string, refreshToken: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin || !admin.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(refreshToken, admin.refreshToken);
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = { sub: admin.id, email: admin.email, role: admin.role, type: 'admin' };
    const newAccessToken = this.jwt.sign(payload, { expiresIn: '8h' });
    const newRefreshToken = randomBytes(64).toString('hex');
    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(adminId: string) {
    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  async getProfile(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async changePassword(adminId: string, currentPassword: string, newPassword: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password changed successfully' };
  }

  // Used for seeding default admin
  async createAdmin(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) {
    const existing = await this.prisma.adminUser.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new BadRequestException('Admin with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const admin = await this.prisma.adminUser.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'admin',
      },
    });

    const { password: _, ...safe } = admin;
    return safe;
  }

  // Method to create default admin if none exists
  async ensureDefaultAdmin() {
    const adminCount = await this.prisma.adminUser.count();
    
    if (adminCount === 0) {
      console.log('Creating default admin user...');
      const defaultAdmin = await this.createAdmin({
        email: 'admin@coopmanager.com',
        password: 'Admin@123!',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
      });
      console.log('Default admin created:', defaultAdmin.email);
      return defaultAdmin;
    }
    
    return null;
  }
}
