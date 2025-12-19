import { Module } from '@nestjs/common';
import { CooperativesService } from './cooperatives.service';
import { CooperativesController } from './cooperatives.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivitiesModule } from '../activities/activities.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, ActivitiesModule, NotificationsModule],
  controllers: [CooperativesController],
  providers: [CooperativesService],
})
export class CooperativesModule {}
