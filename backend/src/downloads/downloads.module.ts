import { Module } from '@nestjs/common';
import { DownloadsController } from './downloads.controller';
import { DownloadsService } from './downloads.service';
import { PushNotificationService } from './push-notification.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DownloadsController],
  providers: [DownloadsService, PushNotificationService],
  exports: [DownloadsService, PushNotificationService],
})
export class DownloadsModule {}
