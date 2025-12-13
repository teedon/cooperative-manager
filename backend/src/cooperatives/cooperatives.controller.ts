import { Body, Controller, Get, Param, Post, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CooperativesService } from './cooperatives.service';
import { CreateCooperativeDto } from './dto/create-cooperative.dto';

@Controller('cooperatives')
export class CooperativesController {
  constructor(private readonly service: CooperativesService) {}

  @Get()
  async findAll() {
    try {
      const data = await this.service.findAll();
      return { success: true, message: 'Cooperatives retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch cooperatives', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.service.findOne(id);
      if (!data) {
        throw new HttpException(
          { success: false, message: 'Cooperative not found', data: null },
          HttpStatus.NOT_FOUND,
        );
      }
      return { success: true, message: 'Cooperative retrieved successfully', data };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch cooperative', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Request() req: any, @Body() dto: CreateCooperativeDto) {
    try {
      const user = req.user;
      const data = await this.service.create(dto, user?.id);
      return { success: true, message: 'Cooperative created successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to create cooperative', data: null },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('join')
  async joinByCode(@Request() req: any, @Body() body: { code: string }) {
    try {
      const user = req.user;
      const data = await this.service.joinByCode(body.code, user.id);
      return { success: true, message: 'Join request submitted successfully. Please wait for admin approval.', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to join cooperative', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/pending-members')
  async getPendingMembers(@Param('id') id: string, @Request() req: any) {
    try {
      const user = req.user;
      const data = await this.service.getPendingMembers(id, user.id);
      return { success: true, message: 'Pending members retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch pending members', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  //Let's get all the members for the cooperative
  @UseGuards(AuthGuard('jwt'))
  @Get(':id/members')
  async getMembers(@Param('id') id: string, @Request() req: any) {
    try {
      const user = req.user;
      const data = await this.service.getMembers(id, user.id);
      return { success: true, message: 'Members retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch members', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('members/:memberId/approve')
  async approveMember(@Param('memberId') memberId: string, @Request() req: any) {
    try {
      const user = req.user;
      const data = await this.service.approveMember(memberId, user.id);
      return { success: true, message: 'Member approved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to approve member', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('members/:memberId/reject')
  async rejectMember(@Param('memberId') memberId: string, @Request() req: any) {
    try {
      const user = req.user;
      const data = await this.service.rejectMember(memberId, user.id);
      return { success: true, message: 'Member request rejected', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to reject member', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
