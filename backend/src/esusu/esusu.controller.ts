import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EsusuService } from './esusu.service';
import {
  CreateEsusuDto,
  UpdateEsusuDto,
  RespondToInvitationDto,
  SetOrderDto,
  RecordContributionDto,
  ProcessCollectionDto,
  EsusuSettingsDto,
} from './dto/esusu.dto';

@Controller('esusu')
@UseGuards(AuthGuard('jwt'))
export class EsusuController {
  constructor(private readonly esusuService: EsusuService) {}

  // Settings
  @Get('cooperatives/:cooperativeId/settings')
  getSettings(@Param('cooperativeId') cooperativeId: string) {
    return this.esusuService.getSettings(cooperativeId);
  }

  @Put('cooperatives/:cooperativeId/settings')
  updateSettings(
    @Param('cooperativeId') cooperativeId: string,
    @Req() req: any,
    @Body() dto: EsusuSettingsDto,
  ) {
    return this.esusuService.updateSettings(cooperativeId, req.user.id, dto);
  }

  // Esusu CRUD
  @Post('cooperatives/:cooperativeId')
  create(
    @Param('cooperativeId') cooperativeId: string,
    @Req() req: any,
    @Body() dto: CreateEsusuDto,
  ) {
    return this.esusuService.create(cooperativeId, req.user.id, dto);
  }

  @Get('cooperatives/:cooperativeId')
  findAll(@Param('cooperativeId') cooperativeId: string, @Req() req: any) {
    return this.esusuService.findAll(cooperativeId, req.user.id);
  }

  @Get(':esusuId')
  findOne(@Param('esusuId') esusuId: string, @Req() req: any) {
    return this.esusuService.findOne(esusuId, req.user.id);
  }

  @Put(':esusuId')
  update(@Param('esusuId') esusuId: string, @Req() req: any, @Body() dto: UpdateEsusuDto) {
    return this.esusuService.update(esusuId, req.user.id, dto);
  }

  // Invitation
  @Post(':esusuId/respond')
  respondToInvitation(
    @Param('esusuId') esusuId: string,
    @Req() req: any,
    @Body() dto: RespondToInvitationDto,
  ) {
    return this.esusuService.respondToInvitation(esusuId, req.user.id, dto);
  }

  // Order determination
  @Post(':esusuId/determine-order')
  determineOrder(@Param('esusuId') esusuId: string, @Req() req: any) {
    return this.esusuService.determineOrder(esusuId, req.user.id);
  }

  @Put(':esusuId/set-order')
  setOrder(@Param('esusuId') esusuId: string, @Req() req: any, @Body() dto: SetOrderDto) {
    return this.esusuService.setOrder(esusuId, req.user.id, dto);
  }

  // Contributions
  @Post(':esusuId/contributions')
  recordContribution(
    @Param('esusuId') esusuId: string,
    @Req() req: any,
    @Body() dto: RecordContributionDto,
  ) {
    return this.esusuService.recordContribution(esusuId, req.user.id, dto);
  }

  // Collection
  @Post(':esusuId/collect')
  processCollection(
    @Param('esusuId') esusuId: string,
    @Req() req: any,
    @Body() dto: ProcessCollectionDto,
  ) {
    return this.esusuService.processCollection(esusuId, req.user.id, dto);
  }

  // Status & Reports
  @Get(':esusuId/cycle-status')
  getCycleStatus(@Param('esusuId') esusuId: string, @Req() req: any) {
    return this.esusuService.getCycleStatus(esusuId, req.user.id);
  }

  @Get(':esusuId/members/:memberId/statement')
  getMemberStatement(
    @Param('esusuId') esusuId: string,
    @Param('memberId') memberId: string,
    @Req() req: any,
  ) {
    return this.esusuService.getMemberStatement(esusuId, memberId, req.user.id);
  }

  @Get('my/pending-invitations')
  getPendingInvitations(@Req() req: any) {
    return this.esusuService.getPendingInvitations(req.user.id);
  }
}
