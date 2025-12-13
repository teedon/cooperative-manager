import { Body, Controller, Post, Request, UseGuards, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';

type ApiResponse<T> = { success: boolean; data: T; message: string };

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @Post('signup')
  async register(@Body() dto: CreateUserDto) {
    try {
      const result = await this.auth.register(dto);
      return {
        success: true,
        message: 'Registration successful',
        data: { user: result.user, token: result.accessToken, refreshToken: result.refreshToken },
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Registration failed', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    try {
      const user = await this.auth.validateUser(body.email, body.password);
      if (!user) {
        throw new HttpException(
          { success: false, message: 'Invalid email or password', data: null },
          HttpStatus.UNAUTHORIZED,
        );
      }
      const tokens = await this.auth.login(user);
      return {
        success: true,
        message: 'Login successful',
        data: { user, token: tokens.accessToken, refreshToken: tokens.refreshToken },
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { success: false, message: error.message || 'Login failed', data: null },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    try {
      const tokens = await this.auth.refresh(body.refreshToken);
      return {
        success: true,
        message: 'Token refreshed successfully',
        data: { token: tokens.accessToken, refreshToken: tokens.refreshToken },
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Token refresh failed', data: null },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Request() req: any) {
    try {
      const user = req.user;
      const data = await this.auth.me(user.id);
      return { success: true, message: 'User retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to get user', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Request() req: any) {
    try {
      const user = req.user;
      await this.auth.logout(user.id);
      return { success: true, message: 'Logged out successfully', data: null };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Logout failed', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
