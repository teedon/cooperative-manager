import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        firstName: dto.firstName ?? '',
        lastName: dto.lastName ?? '',
        phone: dto.phone ?? null,
        avatarUrl: dto.avatarUrl ?? null,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async setRefreshToken(userId: string, refreshTokenHash: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { refreshToken: refreshTokenHash } });
  }

  async clearRefreshToken(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
  }
}
