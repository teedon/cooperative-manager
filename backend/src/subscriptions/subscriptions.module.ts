import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { PaystackService } from './paystack.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivitiesModule } from '../activities/activities.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, ActivitiesModule, NotificationsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, PaystackService],
  exports: [SubscriptionsService, PaystackService],
})
export class SubscriptionsModule {}
