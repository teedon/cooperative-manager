import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CooperativesModule } from './cooperatives/cooperatives.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ActivitiesModule } from './activities/activities.module';
import { ContributionsModule } from './contributions/contributions.module';
import { LoansModule } from './loans/loans.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ExpensesModule } from './expenses/expenses.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    CooperativesModule,
    ActivitiesModule,
    ContributionsModule,
    LoansModule,
    NotificationsModule,
    SubscriptionsModule,
    ExpensesModule,
  ],
})
export class AppModule {}
