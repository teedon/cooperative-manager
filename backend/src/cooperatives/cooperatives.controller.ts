import { Body, Controller, Get, Param, Post, Put, Patch, Delete, UseGuards, Request, HttpException, HttpStatus, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CooperativesService } from './cooperatives.service';
import { CreateCooperativeDto } from './dto/create-cooperative.dto';
import { UpdateCooperativeDto } from './dto/update-cooperative.dto';
import { UpdateMemberRoleDto, UpdateMemberPermissionsDto } from './dto/update-member.dto';
import { CreateOfflineMemberDto, UpdateOfflineMemberDto } from './dto/offline-member.dto';
import { getAllPredefinedRoles } from '../common/permissions';

@Controller('cooperatives')
export class CooperativesController {
  constructor(private readonly service: CooperativesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Request() req: any) {
    try {
      const user = req.user;
      const data = await this.service.findAll(user?.id);
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
  @Patch(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateCooperativeDto) {
    try {
      const user = req.user;
      const data = await this.service.update(id, dto, user.id);
      return { success: true, message: 'Cooperative updated successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update cooperative', data: null },
        error.status || HttpStatus.BAD_REQUEST,
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

  // ==================== ADMIN MANAGEMENT ENDPOINTS ====================

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/admins')
  async getAdmins(@Param('id') id: string, @Request() req: any) {
    try {
      const user = req.user;
      const data = await this.service.getAdmins(id, user.id);
      return { success: true, message: 'Admins retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch admins', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':cooperativeId/members/:memberId/role')
  async updateMemberRole(
    @Param('cooperativeId') cooperativeId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      const data = await this.service.updateMemberRole(
        cooperativeId,
        memberId,
        dto.role,
        dto.permissions,
        user.id,
        dto.roleTitle,
      );
      return { success: true, message: 'Member role updated successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update member role', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':cooperativeId/members/:memberId/permissions')
  async updateMemberPermissions(
    @Param('cooperativeId') cooperativeId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberPermissionsDto,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      const data = await this.service.updateMemberPermissions(
        cooperativeId,
        memberId,
        dto.permissions,
        user.id,
      );
      return { success: true, message: 'Member permissions updated successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update member permissions', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':cooperativeId/members/:memberId/remove-admin')
  async removeAdmin(
    @Param('cooperativeId') cooperativeId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      const data = await this.service.removeAdmin(cooperativeId, memberId, user.id);
      return { success: true, message: 'Admin status removed successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to remove admin status', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('permissions/available')
  async getAvailablePermissions() {
    const data = this.service.getAvailablePermissions();
    return { success: true, message: 'Permissions retrieved successfully', data };
  }

  @Get('roles/predefined')
  async getPredefinedRoles() {
    const data = getAllPredefinedRoles();
    return { success: true, message: 'Predefined roles retrieved successfully', data };
  }

  // ==================== Offline Member Endpoints ====================

  @UseGuards(AuthGuard('jwt'))
  @Get(':cooperativeId/offline-members')
  async getOfflineMembers(
    @Param('cooperativeId') cooperativeId: string,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      const data = await this.service.getOfflineMembers(cooperativeId, user.id);
      return { success: true, message: 'Offline members retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to fetch offline members', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':cooperativeId/offline-members')
  async createOfflineMember(
    @Param('cooperativeId') cooperativeId: string,
    @Body() createDto: CreateOfflineMemberDto,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      const data = await this.service.createOfflineMember(cooperativeId, createDto, user.id);
      return { success: true, message: 'Offline member created successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to create offline member', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':cooperativeId/offline-members/bulk')
  async bulkCreateOfflineMembers(
    @Param('cooperativeId') cooperativeId: string,
    @Body() body: { members: CreateOfflineMemberDto[] },
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      const data = await this.service.bulkCreateOfflineMembers(cooperativeId, body.members, user.id);
      return { 
        success: true, 
        message: `Successfully added ${data.successCount} of ${data.totalProcessed} members`, 
        data 
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to bulk create offline members', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':cooperativeId/offline-members/:memberId')
  async updateOfflineMember(
    @Param('cooperativeId') cooperativeId: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateOfflineMemberDto,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      const data = await this.service.updateOfflineMember(cooperativeId, memberId, updateDto, user.id);
      return { success: true, message: 'Offline member updated successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update offline member', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':cooperativeId/offline-members/:memberId')
  async deleteOfflineMember(
    @Param('cooperativeId') cooperativeId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      const data = await this.service.deleteOfflineMember(cooperativeId, memberId, user.id);
      return { success: true, message: 'Offline member deleted successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to delete offline member', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':cooperativeId/offline-members/:memberId/subscribe/:planId')
  async subscribeOfflineMemberToPlan(
    @Param('cooperativeId') cooperativeId: string,
    @Param('memberId') memberId: string,
    @Param('planId') planId: string,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      const data = await this.service.subscribeOfflineMemberToPlan(cooperativeId, memberId, planId, user.id);
      return { success: true, message: 'Offline member subscribed to plan successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to subscribe offline member to plan', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':cooperativeId/members/:memberId/balance')
  async getMemberBalance(
    @Param('cooperativeId') cooperativeId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      const data = await this.service.getMemberBalance(cooperativeId, memberId, user.id);
      return { success: true, message: 'Member balance retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to get member balance', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':cooperativeId/balances')
  async getAllMemberBalances(
    @Param('cooperativeId') cooperativeId: string,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      const data = await this.service.getAllMemberBalances(cooperativeId, user.id);
      return { success: true, message: 'All member balances retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to get member balances', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':cooperativeId/ledger')
  async getLedgerEntries(
    @Param('cooperativeId') cooperativeId: string,
    @Query('memberId') memberId: string,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      const data = await this.service.getLedgerEntries(cooperativeId, user.id, memberId);
      return { success: true, message: 'Ledger entries retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to get ledger entries', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':cooperativeId/ledger')
  async addManualLedgerEntry(
    @Param('cooperativeId') cooperativeId: string,
    @Body() dto: { memberId: string; type: 'manual_credit' | 'manual_debit'; amount: number; description: string },
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      const data = await this.service.addManualLedgerEntry(cooperativeId, dto, user.id);
      return { success: true, message: 'Ledger entry added successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to add ledger entry', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':cooperativeId/ledger/report')
  async getLedgerReport(
    @Param('cooperativeId') cooperativeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    try {
      const user = req.user;
      const data = await this.service.getLedgerReport(cooperativeId, user.id, startDate, endDate);
      return { success: true, message: 'Ledger report retrieved successfully', data };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to get ledger report', data: null },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
