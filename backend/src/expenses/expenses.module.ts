import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, PrismaService, ActivitiesService, NotificationsService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
