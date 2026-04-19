import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivitiesModule } from '../activities/activities.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SupabaseService } from '../services/supabase.service';

@Module({
  imports: [PrismaModule, ActivitiesModule, NotificationsModule],
  controllers: [PostsController],
  providers: [PostsService, SupabaseService],
  exports: [PostsService],
})
export class PostsModule {}
