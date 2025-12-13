import { Module } from '@nestjs/common';
import { CooperativesService } from './cooperatives.service';
import { CooperativesController } from './cooperatives.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [PrismaModule, ActivitiesModule],
  controllers: [CooperativesController],
  providers: [CooperativesService],
})
export class CooperativesModule {}
