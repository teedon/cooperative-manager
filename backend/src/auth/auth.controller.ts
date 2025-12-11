import { Body, Controller, Post, Request, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';

type ApiResponse<T> = { success: boolean; data: T; message?: string };

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @Post('signup')
  async register(@Body() dto: CreateUserDto) {
    const result = await this.auth.register(dto);
    // result: { user, accessToken, refreshToken }
    const resp: ApiResponse<any> = { success: true, data: { user: result.user, token: result.accessToken, refreshToken: result.refreshToken } };
    return resp;
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.auth.validateUser(body.email, body.password);
    if (!user) return { success: false, data: null, message: 'Invalid credentials' } as ApiResponse<null>;
    const tokens = await this.auth.login(user);
    const resp: ApiResponse<any> = { success: true, data: { user, token: tokens.accessToken, refreshToken: tokens.refreshToken } };
    return resp;
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    const tokens = await this.auth.refresh(body.refreshToken);
    // frontend expects ApiResponse<{ token: string }>
    const resp: ApiResponse<any> = { success: true, data: { token: tokens.accessToken, refreshToken: tokens.refreshToken } };
    return resp;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Request() req: any) {
    const user = req.user;
    const data = await this.auth.me(user.id);
    return { success: true, data } as ApiResponse<any>;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Request() req: any) {
    const user = req.user;
    await this.auth.logout(user.id);
    return { success: true, data: { success: true } } as ApiResponse<any>;
  }
}
