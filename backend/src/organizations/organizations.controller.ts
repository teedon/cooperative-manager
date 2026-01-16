import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/create-organization.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('organizations')
@UseGuards(AuthGuard('jwt'))
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  async create(@Body() createDto: CreateOrganizationDto, @Request() req: any) {
    return {
      success: true,
      message: 'Organization created successfully',
      data: await this.organizationsService.create(createDto, req.user.id),
    };
  }

  @Get()
  async findAll(@Request() req: any) {
    return {
      success: true,
      data: await this.organizationsService.findAll(req.user.id),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return {
      success: true,
      data: await this.organizationsService.findOne(id, req.user.id),
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganizationDto,
    @Request() req: any,
  ) {
    return {
      success: true,
      message: 'Organization updated successfully',
      data: await this.organizationsService.update(id, updateDto, req.user.id),
    };
  }

  @Patch(':id/settings')
  async updateSettings(
    @Param('id') id: string,
    @Body('settings') settings: any,
    @Request() req: any,
  ) {
    return {
      success: true,
      message: 'Settings updated successfully',
      data: await this.organizationsService.updateSettings(id, settings, req.user.id),
    };
  }

  @Patch(':id/collection-settings')
  async updateCollectionSettings(
    @Param('id') id: string,
    @Body() settings: any,
    @Request() req: any,
  ) {
    return {
      success: true,
      message: 'Collection settings updated successfully',
      data: await this.organizationsService.updateCollectionSettings(
        id,
        settings,
        req.user.id,
      ),
    };
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string, @Request() req: any) {
    return {
      success: true,
      data: await this.organizationsService.getStats(id, req.user.id),
    };
  }
}
