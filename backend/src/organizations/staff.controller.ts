import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto, AssignStaffToGroupDto } from './dto/create-staff.dto';
import { AuthGuard } from '@nestjs/passport';
import { StaffPermission } from './enums/staff-permissions.enum';

@Controller('organizations/:organizationId/staff')
@UseGuards(AuthGuard('jwt'))
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  async create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateStaffDto,
    @Request() req: any,
  ) {
    return {
      success: true,
      message: 'Staff member added successfully',
      data: await this.staffService.create(organizationId, createDto, req.user.id),
    };
  }

  @Get()
  async findAll(
    @Param('organizationId') organizationId: string,
    @Query('isActive') isActive?: string,
    @Query('role') role?: string,
  ) {
    const filters: any = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    if (role) {
      filters.role = role;
    }

    return {
      success: true,
      data: await this.staffService.findAll(organizationId, filters),
    };
  }

  @Get(':staffId')
  async findOne(
    @Param('organizationId') organizationId: string,
    @Param('staffId') staffId: string,
  ) {
    return {
      success: true,
      data: await this.staffService.findOne(organizationId, staffId),
    };
  }

  @Patch(':staffId')
  async update(
    @Param('organizationId') organizationId: string,
    @Param('staffId') staffId: string,
    @Body() updateDto: UpdateStaffDto,
  ) {
    return {
      success: true,
      message: 'Staff member updated successfully',
      data: await this.staffService.update(organizationId, staffId, updateDto),
    };
  }

  @Patch(':staffId/permissions')
  async updatePermissions(
    @Param('organizationId') organizationId: string,
    @Param('staffId') staffId: string,
    @Body('permissions') permissions: StaffPermission[],
  ) {
    return {
      success: true,
      message: 'Permissions updated successfully',
      data: await this.staffService.updatePermissions(organizationId, staffId, permissions),
    };
  }

  @Delete(':staffId')
  async remove(
    @Param('organizationId') organizationId: string,
    @Param('staffId') staffId: string,
  ) {
    return {
      success: true,
      ...(await this.staffService.remove(organizationId, staffId)),
    };
  }

  @Post(':staffId/assign-groups')
  async assignToGroups(
    @Param('organizationId') organizationId: string,
    @Param('staffId') staffId: string,
    @Body() assignDto: AssignStaffToGroupDto,
    @Request() req: any,
  ) {
    return {
      success: true,
      message: 'Staff assigned to groups successfully',
      data: await this.staffService.assignToGroups(
        organizationId,
        staffId,
        assignDto,
        req.user.id,
      ),
    };
  }

  @Get(':staffId/assignments')
  async getAssignments(
    @Param('organizationId') organizationId: string,
    @Param('staffId') staffId: string,
  ) {
    return {
      success: true,
      data: await this.staffService.getAssignments(organizationId, staffId),
    };
  }

  @Delete(':staffId/assignments/:cooperativeId')
  async removeAssignment(
    @Param('organizationId') organizationId: string,
    @Param('staffId') staffId: string,
    @Param('cooperativeId') cooperativeId: string,
  ) {
    return {
      success: true,
      ...(await this.staffService.removeAssignment(organizationId, staffId, cooperativeId)),
    };
  }
}
