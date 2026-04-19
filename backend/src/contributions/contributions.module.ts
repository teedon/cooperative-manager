import { Module } from '@nestjs/common';
import { ContributionsController } from './contributions.controller';
import { ContributionsService } from './contributions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivitiesModule } from '../activities/activities.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SupabaseService } from '../services/supabase.service';

@Module({
  imports: [PrismaModule, ActivitiesModule, NotificationsModule],
  controllers: [ContributionsController],
  providers: [ContributionsService, SupabaseService],
  exports: [ContributionsService],
})
export class ContributionsModule {}
