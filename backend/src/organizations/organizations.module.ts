import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { CollectionAuditController } from './controllers/collection-audit.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CollectionAuditService } from './services/collection-audit.service';
import { CollectionAutoPostScheduler } from './schedulers/collection-auto-post.scheduler';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [
    OrganizationsController,
    StaffController,
    CollectionsController,
    CollectionAuditController,
  ],
  providers: [
    OrganizationsService,
    StaffService,
    CollectionsService,
    CollectionAuditService,
    CollectionAutoPostScheduler,
  ],
  exports: [
    OrganizationsService,
    StaffService,
    CollectionsService,
    CollectionAuditService,
  ],
})
export class OrganizationsModule {}
