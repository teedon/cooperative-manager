import { Module } from '@nestjs/common';
import { AdminOrganizationsController } from './admin-organizations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminOrganizationsController],
})
export class AdminOrganizationsModule {}