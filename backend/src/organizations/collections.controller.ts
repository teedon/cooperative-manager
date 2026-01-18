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
import { CollectionsService } from './collections.service';
import {
  CreateCollectionDto,
  AddTransactionDto,
  UpdateTransactionDto,
  ApproveCollectionDto,
  RejectCollectionDto,
} from './dto/collection.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('organizations/:organizationId/collections')
@UseGuards(AuthGuard('jwt'))
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  // Create a new daily collection
  @Post()
  async create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateCollectionDto,
    @Request() req: any,
  ) {
    // Get staff ID from user
    const staff = await this.collectionsService.getStaffByUserId(req.user.id, organizationId);

    if (!staff) {
      return {
        success: false,
        message: 'You are not a staff member of this organization',
      };
    }

    return {
      success: true,
      message: 'Collection created successfully',
      data: await this.collectionsService.create(organizationId, staff.id, createDto),
    };
  }

  // List collections with filters
  @Get()
  async findAll(
    @Param('organizationId') organizationId: string,
    @Query('staffId') staffId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('cooperativeId') cooperativeId?: string,
  ) {
    return {
      success: true,
      data: await this.collectionsService.findAll(organizationId, {
        staffId,
        status,
        startDate,
        endDate,
        cooperativeId,
      }),
    };
  }

  // Get pending approvals
  @Get('pending')
  async getPendingApprovals(
    @Param('organizationId') organizationId: string,
    @Query('staffId') staffId?: string,
  ) {
    return {
      success: true,
      data: await this.collectionsService.getPendingApprovals(organizationId, staffId),
    };
  }

  // Get collection statistics
  @Get('stats')
  async getStats(
    @Param('organizationId') organizationId: string,
    @Query('staffId') staffId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return {
      success: true,
      data: await this.collectionsService.getStats(organizationId, staffId, startDate, endDate),
    };
  }

  // Get single collection details
  @Get(':collectionId')
  async findOne(
    @Param('organizationId') organizationId: string,
    @Param('collectionId') collectionId: string,
  ) {
    return {
      success: true,
      data: await this.collectionsService.findOne(collectionId, organizationId),
    };
  }

  // Submit collection for approval
  @Post(':collectionId/submit')
  async submit(
    @Param('organizationId') organizationId: string,
    @Param('collectionId') collectionId: string,
    @Request() req: any,
  ) {
    const staff = await this.collectionsService.getStaffByUserId(req.user.id, organizationId);

    if (!staff) {
      return {
        success: false,
        message: 'You are not a staff member of this organization',
      };
    }

    return {
      success: true,
      message: 'Collection submitted for approval',
      data: await this.collectionsService.submit(collectionId, organizationId, staff.id),
    };
  }

  // Approve collection
  @Post(':collectionId/approve')
  async approve(
    @Param('organizationId') organizationId: string,
    @Param('collectionId') collectionId: string,
    @Body() approveDto: ApproveCollectionDto,
    @Request() req: any,
  ) {
    return {
      success: true,
      message: 'Collection approved successfully',
      data: await this.collectionsService.approve(
        collectionId,
        organizationId,
        req.user.id,
        approveDto,
      ),
    };
  }

  // Reject collection
  @Post(':collectionId/reject')
  async reject(
    @Param('organizationId') organizationId: string,
    @Param('collectionId') collectionId: string,
    @Body() rejectDto: RejectCollectionDto,
    @Request() req: any,
  ) {
    return {
      success: true,
      message: 'Collection rejected',
      data: await this.collectionsService.reject(
        collectionId,
        organizationId,
        req.user.id,
        rejectDto,
      ),
    };
  }

  // Add transaction to collection
  @Post(':collectionId/transactions')
  async addTransaction(
    @Param('organizationId') organizationId: string,
    @Param('collectionId') collectionId: string,
    @Body() transactionDto: AddTransactionDto,
    @Request() req: any,
  ) {
    const staff = await this.collectionsService.getStaffByUserId(req.user.id, organizationId);

    if (!staff) {
      return {
        success: false,
        message: 'You are not a staff member of this organization',
      };
    }

    return {
      success: true,
      message: 'Transaction added successfully',
      data: await this.collectionsService.addTransaction(
        collectionId,
        organizationId,
        staff.id,
        transactionDto,
      ),
    };
  }

  // Update transaction
  @Patch(':collectionId/transactions/:transactionId')
  async updateTransaction(
    @Param('organizationId') organizationId: string,
    @Param('collectionId') collectionId: string,
    @Param('transactionId') transactionId: string,
    @Body() updateDto: UpdateTransactionDto,
    @Request() req: any,
  ) {
    const staff = await this.collectionsService.getStaffByUserId(req.user.id, organizationId);

    if (!staff) {
      return {
        success: false,
        message: 'You are not a staff member of this organization',
      };
    }

    return {
      success: true,
      message: 'Transaction updated successfully',
      data: await this.collectionsService.updateTransaction(
        transactionId,
        collectionId,
        staff.id,
        updateDto,
      ),
    };
  }

  // Delete transaction
  @Delete(':collectionId/transactions/:transactionId')
  async deleteTransaction(
    @Param('organizationId') organizationId: string,
    @Param('collectionId') collectionId: string,
    @Param('transactionId') transactionId: string,
    @Request() req: any,
  ) {
    const staff = await this.collectionsService.getStaffByUserId(req.user.id, organizationId);

    if (!staff) {
      return {
        success: false,
        message: 'You are not a staff member of this organization',
      };
    }

    return {
      success: true,
      ...(await this.collectionsService.deleteTransaction(
        transactionId,
        collectionId,
        staff.id,
      )),
    };
  }
}
