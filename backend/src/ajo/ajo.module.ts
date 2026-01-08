import { Module } from '@nestjs/common';
import { AjoController } from './ajo.controller';
import { AjoService } from './ajo.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [PrismaModule, NotificationsModule, ActivitiesModule],
  controllers: [AjoController],
  providers: [AjoService],
  exports: [AjoService],
})
export class AjoModule {}
