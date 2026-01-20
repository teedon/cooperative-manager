import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [PrismaModule, AdminAuthModule],
  controllers: [AdminUsersController],
})
export class AdminUsersModule {}