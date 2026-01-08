import { Module } from '@nestjs/common';
import { EsusuController } from './esusu.controller';
import { EsusuService } from './esusu.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [PrismaModule, NotificationsModule, ActivitiesModule],
  controllers: [EsusuController],
  providers: [EsusuService],
  exports: [EsusuService],
})
export class EsusuModule {}
