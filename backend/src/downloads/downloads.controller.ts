import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Res,
  Req,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { DownloadsService } from './downloads.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminJwtAuthGuard } from '../admin-auth/admin-jwt-auth.guard';

@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  /**
   * Public endpoint - Download app file
   * Tracks downloads with IP and user agent
   */
  @Get('app/:platform')
  async downloadApp(
    @Param('platform') platform: 'android' | 'ios' | 'web',
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { filePath, fileName } = await this.downloadsService.getAppFile(
      platform,
      ipAddress,
      userAgent,
    );

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Stream the file
    return res.sendFile(filePath);
  }

  /**
   * Public endpoint - Get download statistics
   */
  @Get('stats')
  async getStats(@Query('platform') platform?: string) {
    return this.downloadsService.getDownloadStats(platform);
  }

  /**
   * Protected endpoint - Upload app file
   * Only system admins can upload app binaries
   */
  @Post('upload/:platform')
  @UseGuards(AdminJwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
    fileFilter: (_req, file, cb) => {
      const allowed = [
        'application/vnd.android.package-archive', // .apk
        'application/octet-stream',                // generic binary (.apk / .ipa)
        'application/zip',                         // .zip (web build)
        'application/x-zip-compressed',
      ];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed: apk, ipa, zip`), false);
      }
    },
  }))
  @HttpCode(HttpStatus.OK)
  async uploadApp(
    @Param('platform') platform: 'android' | 'ios' | 'web',
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.downloadsService.uploadAppFile(platform, file);
  }

  /**
   * Protected endpoint - Delete app file
   * Only system admins can delete app binaries
   */
  @Delete('app/:platform')
  @UseGuards(AdminJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteApp(@Param('platform') platform: 'android' | 'ios' | 'web') {
    return this.downloadsService.deleteAppFile(platform);
  }

  /**
   * Protected endpoint - List all available files
   * Only system admins can view uploaded file list
   */
  @Get('files')
  @UseGuards(AdminJwtAuthGuard)
  async listFiles() {
    return this.downloadsService.listAvailableFiles();
  }

  @Get('check-update/:platform')
  async checkForUpdates(
    @Param('platform') platform: 'android' | 'ios',
    @Query('currentVersion') currentVersion: string,
  ) {
    if (!currentVersion) {
      throw new BadRequestException('currentVersion query parameter is required');
    }
    
    if (!['android', 'ios'].includes(platform)) {
      throw new BadRequestException('Platform must be android or ios');
    }

    return this.downloadsService.checkForUpdates(platform, currentVersion);
  }

  @Post('notify-update/:platform')
  @UseGuards(AuthGuard('jwt'))
  async notifyUpdate(
    @Param('platform') platform: 'android' | 'ios' | 'all',
    @Query('version') version: string,
    @Query('forceUpdate') forceUpdate?: string,
  ) {
    if (!version) {
      throw new BadRequestException('version query parameter is required');
    }
    
    if (!['android', 'ios', 'all'].includes(platform)) {
      throw new BadRequestException('Platform must be android, ios, or all');
    }

    const isForceUpdate = forceUpdate === 'true';
    return this.downloadsService.notifyUpdate(platform, version, isForceUpdate);
  }
}
