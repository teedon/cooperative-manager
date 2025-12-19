import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { RegisterFcmTokenDto, UpdatePreferencesDto } from './dto/notifications.dto';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async getAll(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    try {
      const data = await this.service.getAll(
        req.user.id,
        parseInt(page, 10),
        parseInt(limit, 10),
      );
      return { success: true, message: 'Notifications retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch notifications', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    try {
      const data = await this.service.getUnreadCount(req.user.id);
      return { success: true, message: 'Unread count retrieved', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to get unread count', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    try {
      const data = await this.service.markAsRead(id, req.user.id);
      return { success: true, message: 'Notification marked as read', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to mark as read', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    try {
      const data = await this.service.markAllAsRead(req.user.id);
      return { success: true, message: 'All notifications marked as read', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to mark all as read', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    try {
      await this.service.delete(id, req.user.id);
      return { success: true, message: 'Notification deleted', data: null };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to delete notification', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete()
  async clearAll(@Request() req: any) {
    try {
      const data = await this.service.clearAll(req.user.id);
      return { success: true, message: 'All notifications cleared', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to clear notifications', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('register-token')
  async registerFcmToken(@Request() req: any, @Body() dto: RegisterFcmTokenDto) {
    try {
      await this.service.registerFcmToken(req.user.id, dto.token, dto.platform);
      return { success: true, message: 'FCM token registered', data: null };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to register token', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('unregister-token')
  async unregisterFcmToken(@Body() body: { token: string }) {
    try {
      await this.service.unregisterFcmToken(body.token);
      return { success: true, message: 'FCM token unregistered', data: null };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to unregister token', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('preferences')
  async getPreferences(@Request() req: any) {
    try {
      const data = await this.service.getPreferences(req.user.id);
      return { success: true, message: 'Preferences retrieved', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to get preferences', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch('preferences')
  async updatePreferences(@Request() req: any, @Body() dto: UpdatePreferencesDto) {
    try {
      const data = await this.service.updatePreferences(req.user.id, dto);
      return { success: true, message: 'Preferences updated', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update preferences', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
