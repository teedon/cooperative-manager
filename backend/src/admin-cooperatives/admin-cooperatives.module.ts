import { Module } from '@nestjs/common';
import { AdminCooperativesController } from './admin-cooperatives.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminCooperativesController],
})
export class AdminCooperativesModule {}