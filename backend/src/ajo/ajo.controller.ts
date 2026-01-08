import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AjoService } from './ajo.service';
import {
  CreateAjoDto,
  UpdateAjoDto,
  RespondToAjoDto,
  RecordAjoPaymentDto,
  AjoSettingsDto,
} from './dto/ajo.dto';

@Controller('ajo')
@UseGuards(AuthGuard('jwt'))
export class AjoController {
  constructor(private readonly ajoService: AjoService) {}

  // Get Ajo settings for a cooperative
  @Get('cooperatives/:cooperativeId/settings')
  getSettings(@Param('cooperativeId') cooperativeId: string) {
    return this.ajoService.getSettings(cooperativeId);
  }

  // Update Ajo settings
  @Put('cooperatives/:cooperativeId/settings')
  updateSettings(
    @Param('cooperativeId') cooperativeId: string,
    @Request() req: any,
    @Body() dto: AjoSettingsDto,
  ) {
    return this.ajoService.updateSettings(cooperativeId, req.user.id, dto);
  }

  // Create a new Ajo
  @Post('cooperatives/:cooperativeId')
  create(
    @Param('cooperativeId') cooperativeId: string,
    @Request() req: any,
    @Body() dto: CreateAjoDto,
  ) {
    return this.ajoService.create(cooperativeId, req.user.id, dto);
  }

  // Get all Ajos for a cooperative
  @Get('cooperatives/:cooperativeId')
  findAll(@Param('cooperativeId') cooperativeId: string, @Request() req: any) {
    return this.ajoService.findAll(cooperativeId, req.user.id);
  }

  // Get a single Ajo
  @Get(':ajoId')
  findOne(@Param('ajoId') ajoId: string, @Request() req: any) {
    return this.ajoService.findOne(ajoId, req.user.id);
  }

  // Update an Ajo
  @Put(':ajoId')
  update(
    @Param('ajoId') ajoId: string,
    @Request() req: any,
    @Body() dto: UpdateAjoDto,
  ) {
    return this.ajoService.update(ajoId, req.user.id, dto);
  }

  // Respond to Ajo invitation
  @Post(':ajoId/respond')
  respondToInvitation(
    @Param('ajoId') ajoId: string,
    @Request() req: any,
    @Body() dto: RespondToAjoDto,
  ) {
    return this.ajoService.respondToInvitation(
      ajoId,
      req.user.id,
      dto.status as 'accepted' | 'declined',
    );
  }

  // Record a payment
  @Post(':ajoId/payments')
  recordPayment(
    @Param('ajoId') ajoId: string,
    @Request() req: any,
    @Body() dto: RecordAjoPaymentDto,
  ) {
    return this.ajoService.recordPayment(ajoId, req.user.id, dto);
  }

  // Get member statement
  @Get(':ajoId/members/:memberId/statement')
  getMemberStatement(
    @Param('ajoId') ajoId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.ajoService.getMemberStatement(ajoId, memberId, req.user.id);
  }

  // Get user's pending invitations
  @Get('my/pending-invitations')
  getPendingInvitations(@Request() req: any) {
    return this.ajoService.getPendingInvitations(req.user.id);
  }
}
