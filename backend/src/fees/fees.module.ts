import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';

@Module({
  imports: [PrismaModule, ActivitiesModule],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService],
})
export class FeesModule {}
