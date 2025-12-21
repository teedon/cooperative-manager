import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto, ApproveExpenseDto } from './dto/create-expense.dto';
import { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from './dto/create-category.dto';

@Controller('expenses')
@UseGuards(AuthGuard('jwt'))
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // ==================== CATEGORY ENDPOINTS ====================

  @Get('cooperatives/:cooperativeId/categories')
  async getCategories(
    @Param('cooperativeId') cooperativeId: string,
    @Request() req: any,
  ) {
    const categories = await this.expensesService.getCategories(cooperativeId, req.user.id);
    return { success: true, data: categories };
  }

  @Post('cooperatives/:cooperativeId/categories')
  async createCategory(
    @Param('cooperativeId') cooperativeId: string,
    @Body() dto: CreateExpenseCategoryDto,
    @Request() req: any,
  ) {
    const category = await this.expensesService.createCategory(cooperativeId, dto, req.user.id);
    return { success: true, data: category };
  }

  @Put('cooperatives/:cooperativeId/categories/:categoryId')
  async updateCategory(
    @Param('cooperativeId') cooperativeId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateExpenseCategoryDto,
    @Request() req: any,
  ) {
    const category = await this.expensesService.updateCategory(cooperativeId, categoryId, dto, req.user.id);
    return { success: true, data: category };
  }

  @Delete('cooperatives/:cooperativeId/categories/:categoryId')
  async deleteCategory(
    @Param('cooperativeId') cooperativeId: string,
    @Param('categoryId') categoryId: string,
    @Request() req: any,
  ) {
    const result = await this.expensesService.deleteCategory(cooperativeId, categoryId, req.user.id);
    return result;
  }

  // ==================== EXPENSE ENDPOINTS ====================

  @Get('cooperatives/:cooperativeId')
  async getExpenses(
    @Param('cooperativeId') cooperativeId: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    const result = await this.expensesService.getExpenses(cooperativeId, req.user.id, {
      status,
      categoryId,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return { success: true, data: result.expenses, pagination: result.pagination };
  }

  @Get('cooperatives/:cooperativeId/summary')
  async getExpenseSummary(
    @Param('cooperativeId') cooperativeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: any,
  ) {
    const summary = await this.expensesService.getExpenseSummary(cooperativeId, req.user.id, {
      startDate,
      endDate,
    });
    return { success: true, data: summary };
  }

  @Get('cooperatives/:cooperativeId/:expenseId')
  async getExpense(
    @Param('cooperativeId') cooperativeId: string,
    @Param('expenseId') expenseId: string,
    @Request() req: any,
  ) {
    const expense = await this.expensesService.getExpense(cooperativeId, expenseId, req.user.id);
    return { success: true, data: expense };
  }

  @Post('cooperatives/:cooperativeId')
  async createExpense(
    @Param('cooperativeId') cooperativeId: string,
    @Body() dto: CreateExpenseDto,
    @Request() req: any,
  ) {
    const expense = await this.expensesService.createExpense(cooperativeId, dto, req.user.id);
    return { success: true, data: expense };
  }

  @Put('cooperatives/:cooperativeId/:expenseId')
  async updateExpense(
    @Param('cooperativeId') cooperativeId: string,
    @Param('expenseId') expenseId: string,
    @Body() dto: UpdateExpenseDto,
    @Request() req: any,
  ) {
    const expense = await this.expensesService.updateExpense(cooperativeId, expenseId, dto, req.user.id);
    return { success: true, data: expense };
  }

  @Delete('cooperatives/:cooperativeId/:expenseId')
  async deleteExpense(
    @Param('cooperativeId') cooperativeId: string,
    @Param('expenseId') expenseId: string,
    @Request() req: any,
  ) {
    const result = await this.expensesService.deleteExpense(cooperativeId, expenseId, req.user.id);
    return result;
  }

  @Put('cooperatives/:cooperativeId/:expenseId/approve')
  async approveExpense(
    @Param('cooperativeId') cooperativeId: string,
    @Param('expenseId') expenseId: string,
    @Body() dto: ApproveExpenseDto,
    @Request() req: any,
  ) {
    const expense = await this.expensesService.approveExpense(cooperativeId, expenseId, dto, req.user.id);
    return { success: true, data: expense };
  }
}
