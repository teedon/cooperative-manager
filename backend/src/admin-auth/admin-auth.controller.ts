import { Controller, Post, Body, UseGuards, Get, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';

class LoginDto {
  email!: string;
  password!: string;
}

class RefreshTokenDto {
  refreshToken!: string;
}

class ChangePasswordDto {
  currentPassword!: string;
  newPassword!: string;
}

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const admin = await this.adminAuthService.validateAdmin(loginDto.email, loginDto.password);
    if (!admin) {
      return {
        statusCode: 401,
        message: 'Invalid email or password',
      };
    }
    const tokens = await this.adminAuthService.login(admin);
    return {
      admin,
      ...tokens,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtAuthGuard)
  async refreshTokens(@Request() req: any, @Body() refreshDto: RefreshTokenDto) {
    return this.adminAuthService.refreshTokens(req.user.id, refreshDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtAuthGuard)
  async logout(@Request() req: any) {
    return this.adminAuthService.logout(req.user.id);
  }

  @Get('profile')
  @UseGuards(AdminJwtAuthGuard)
  async getProfile(@Request() req: any) {
    return this.adminAuthService.getProfile(req.user.id);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminJwtAuthGuard)
  async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    return this.adminAuthService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }
}
