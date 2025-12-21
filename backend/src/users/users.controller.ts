import { Body, Controller, Get, Put, Post, Delete, Request, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto, DeleteAccountDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    try {
      const user = await this.usersService.findById(req.user.id);
      if (!user) {
        throw new HttpException(
          { success: false, message: 'User not found', data: null },
          HttpStatus.NOT_FOUND,
        );
      }
      // Don't return password
      const { password, refreshToken, ...userData } = user;
      return { success: true, message: 'Profile retrieved successfully', data: userData };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { success: false, message: error.message || 'Failed to get profile', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('profile')
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    try {
      const user = await this.usersService.updateProfile(req.user.id, dto);
      return { success: true, message: 'Profile updated successfully', data: user };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update profile', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('change-password')
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    try {
      const result = await this.usersService.changePassword(req.user.id, dto);
      return { success: true, message: result.message, data: null };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to change password', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('account')
  async deleteAccount(@Request() req: any, @Body() dto: DeleteAccountDto) {
    try {
      const result = await this.usersService.deleteAccount(req.user.id, dto.password, dto.reason);
      return { success: true, message: result.message, data: null };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to delete account', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
