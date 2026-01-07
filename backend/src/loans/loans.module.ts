import { Module } from '@nestjs/common';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivitiesModule } from '../activities/activities.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SupabaseService } from '../services/supabase.service';

@Module({
  imports: [PrismaModule, ActivitiesModule, NotificationsModule],
  controllers: [LoansController],
  providers: [LoansService, SupabaseService],
  exports: [LoansService],
})
export class LoansModule {}
