import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, PrismaService, ActivitiesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
