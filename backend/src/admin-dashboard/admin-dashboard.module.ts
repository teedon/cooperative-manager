import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminDashboardController],
})
export class AdminDashboardModule {}