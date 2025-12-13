import { Controller, Get, Query, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActivitiesService } from './activities.service';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getMyActivities(@Request() req: any, @Query('limit') limit?: string) {
    try {
      const user = req.user;
      const limitNum = limit ? parseInt(limit, 10) : 20;
      const data = await this.service.findByUser(user.id, limitNum);
      return { success: true, message: 'Activities retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch activities', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('recent')
  async getRecentActivities(@Request() req: any, @Query('limit') limit?: string) {
    try {
      const user = req.user;
      const limitNum = limit ? parseInt(limit, 10) : 10;
      const data = await this.service.findRecentForUser(user.id, limitNum);
      return { success: true, message: 'Recent activities retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch recent activities', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('cooperative/:cooperativeId')
  async getCooperativeActivities(
    @Request() req: any,
    @Query('cooperativeId') cooperativeId: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 20;
      const data = await this.service.findByCooperative(cooperativeId, limitNum);
      return { success: true, message: 'Cooperative activities retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch cooperative activities', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
