import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { CreateExpenseDto, UpdateExpenseDto, ApproveExpenseDto } from './dto/create-expense.dto';
import { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from './dto/create-category.dto';
import { PERMISSIONS, Permission, hasPermission, parsePermissions } from '../common/permissions';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
  ) {}

  // Default expense categories
  private readonly defaultCategories = [
    { name: 'Office Supplies', description: 'Stationery, printing, etc.', color: '#3B82F6', icon: 'file-text' },
    { name: 'Utilities', description: 'Electricity, water, internet', color: '#10B981', icon: 'zap' },
    { name: 'Rent', description: 'Office or meeting space rent', color: '#F59E0B', icon: 'home' },
    { name: 'Transportation', description: 'Travel and transport costs', color: '#8B5CF6', icon: 'car' },
    { name: 'Food & Refreshments', description: 'Meeting refreshments, catering', color: '#EF4444', icon: 'coffee' },
    { name: 'Equipment', description: 'Office equipment and furniture', color: '#06B6D4', icon: 'monitor' },
    { name: 'Professional Services', description: 'Legal, accounting, consulting', color: '#EC4899', icon: 'briefcase' },
    { name: 'Maintenance', description: 'Repairs and maintenance', color: '#84CC16', icon: 'wrench' },
    { name: 'Marketing', description: 'Advertising and promotions', color: '#F97316', icon: 'megaphone' },
    { name: 'Miscellaneous', description: 'Other expenses', color: '#6B7280', icon: 'more-horizontal' },
  ];

  // Get member with permissions
  private async getMemberWithPermissions(cooperativeId: string, userId: string) {
    const member = await this.prisma.member.findFirst({
      where: {
        cooperativeId,
        userId,
        status: 'active',
      },
      select: {
        id: true,
        role: true,
        permissions: true,
        userId: true,
        cooperativeId: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this cooperative');
    }

    return {
      ...member,
      parsedPermissions: parsePermissions(member.permissions),
    };
  }

  // Check if member has a specific permission
  private checkPermission(
    member: { role: string; parsedPermissions: string[] },
    requiredPermission: Permission,
  ): boolean {
    return hasPermission(member.role, member.parsedPermissions, requiredPermission);
  }

  // Verify member has permission or throw
  private requirePermission(
    member: { role: string; parsedPermissions: string[] },
    requiredPermission: Permission,
    errorMessage?: string,
  ) {
    if (!this.checkPermission(member, requiredPermission)) {
      throw new ForbiddenException(
        errorMessage || 'You do not have permission to perform this action',
      );
    }
  }

  // ==================== CATEGORY OPERATIONS ====================

  // Initialize default categories for a cooperative
  async initializeDefaultCategories(cooperativeId: string, userId: string) {
    const existingCategories = await this.prisma.expenseCategory.findMany({
      where: { cooperativeId },
    });

    if (existingCategories.length > 0) {
      return existingCategories;
    }

    const categories = await this.prisma.$transaction(
      this.defaultCategories.map((cat) =>
        this.prisma.expenseCategory.create({
          data: {
            cooperativeId,
            name: cat.name,
            description: cat.description,
            color: cat.color,
            icon: cat.icon,
            isDefault: true,
            createdBy: userId,
          },
        }),
      ),
    );

    return categories;
  }

  // Get all categories for a cooperative
  async getCategories(cooperativeId: string, userId: string) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.EXPENSES_VIEW, 'You do not have permission to view expenses');

    // Initialize default categories if none exist
    await this.initializeDefaultCategories(cooperativeId, userId);

    return this.prisma.expenseCategory.findMany({
      where: { cooperativeId, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });
  }

  // Create a new category
  async createCategory(cooperativeId: string, dto: CreateExpenseCategoryDto, userId: string) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.EXPENSES_MANAGE_CATEGORIES, 'You do not have permission to manage expense categories');

    // Check if category name already exists
    const existing = await this.prisma.expenseCategory.findUnique({
      where: {
        cooperativeId_name: {
          cooperativeId,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('A category with this name already exists');
    }

    const category = await this.prisma.expenseCategory.create({
      data: {
        cooperativeId,
        name: dto.name,
        description: dto.description,
        color: dto.color || '#6B7280',
        icon: dto.icon || 'folder',
        createdBy: userId,
      },
    });

    await this.activitiesService.log(
      userId,
      'expense.category_create',
      `Created expense category "${dto.name}"`,
      cooperativeId,
      { categoryId: category.id },
    );

    return category;
  }

  // Update a category
  async updateCategory(cooperativeId: string, categoryId: string, dto: UpdateExpenseCategoryDto, userId: string) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.EXPENSES_MANAGE_CATEGORIES, 'You do not have permission to manage expense categories');

    const category = await this.prisma.expenseCategory.findFirst({
      where: { id: categoryId, cooperativeId },
    });

    if (!category) {
      throw new NotFoundException('Expense category not found');
    }

    // Check for name conflict if name is being changed
    if (dto.name && dto.name !== category.name) {
      const existing = await this.prisma.expenseCategory.findUnique({
        where: {
          cooperativeId_name: {
            cooperativeId,
            name: dto.name,
          },
        },
      });

      if (existing) {
        throw new BadRequestException('A category with this name already exists');
      }
    }

    const updated = await this.prisma.expenseCategory.update({
      where: { id: categoryId },
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color,
        icon: dto.icon,
      },
    });

    await this.activitiesService.log(
      userId,
      'expense.category_update',
      `Updated expense category "${updated.name}"`,
      cooperativeId,
      { categoryId },
    );

    return updated;
  }

  // Delete a category (soft delete - deactivate)
  async deleteCategory(cooperativeId: string, categoryId: string, userId: string) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.EXPENSES_MANAGE_CATEGORIES, 'You do not have permission to manage expense categories');

    const category = await this.prisma.expenseCategory.findFirst({
      where: { id: categoryId, cooperativeId },
    });

    if (!category) {
      throw new NotFoundException('Expense category not found');
    }

    // Check if category has expenses
    const expenseCount = await this.prisma.expense.count({
      where: { categoryId },
    });

    if (expenseCount > 0) {
      // Soft delete - just deactivate
      await this.prisma.expenseCategory.update({
        where: { id: categoryId },
        data: { isActive: false },
      });
    } else {
      // Hard delete if no expenses
      await this.prisma.expenseCategory.delete({
        where: { id: categoryId },
      });
    }

    await this.activitiesService.log(
      userId,
      'expense.category_delete',
      `Deleted expense category "${category.name}"`,
      cooperativeId,
      { categoryId },
    );

    return { success: true, message: 'Category deleted successfully' };
  }

  // ==================== EXPENSE OPERATIONS ====================

  // Create a new expense
  async createExpense(cooperativeId: string, dto: CreateExpenseDto, userId: string) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.EXPENSES_CREATE, 'You do not have permission to create expenses');

    // Validate category if provided
    if (dto.categoryId) {
      const category = await this.prisma.expenseCategory.findFirst({
        where: { id: dto.categoryId, cooperativeId, isActive: true },
      });

      if (!category) {
        throw new BadRequestException('Invalid expense category');
      }
    }

    const expense = await this.prisma.expense.create({
      data: {
        cooperativeId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        expenseDate: new Date(dto.expenseDate),
        vendorName: dto.vendorName,
        vendorContact: dto.vendorContact,
        receiptUrl: dto.receiptUrl,
        receiptNumber: dto.receiptNumber,
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.paymentReference,
        status: 'pending',
        createdBy: userId,
      },
      include: {
        category: true,
      },
    });

    await this.activitiesService.log(
      userId,
      'expense.create',
      `Recorded expense "${dto.title}" for ₦${dto.amount.toLocaleString()}`,
      cooperativeId,
      { expenseId: expense.id, amount: dto.amount },
    );

    return expense;
  }

  // Get all expenses for a cooperative
  async getExpenses(
    cooperativeId: string,
    userId: string,
    options?: {
      status?: string;
      categoryId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.EXPENSES_VIEW, 'You do not have permission to view expenses');

    const where: any = { cooperativeId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options?.startDate || options?.endDate) {
      where.expenseDate = {};
      if (options?.startDate) {
        where.expenseDate.gte = new Date(options.startDate);
      }
      if (options?.endDate) {
        where.expenseDate.lte = new Date(options.endDate);
      }
    }

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expenseDate: 'desc' },
        include: {
          category: true,
        },
      }),
      this.prisma.expense.count({ where }),
    ]);

    // Fetch user info for createdBy and approvedBy
    const userIds = new Set<string>();
    expenses.forEach((expense) => {
      if (expense.createdBy) userIds.add(expense.createdBy);
      if (expense.approvedBy) userIds.add(expense.approvedBy);
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, firstName: true, lastName: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const expensesWithUsers = expenses.map((expense) => ({
      ...expense,
      createdByUser: expense.createdBy ? userMap.get(expense.createdBy) : null,
      approvedByUser: expense.approvedBy ? userMap.get(expense.approvedBy) : null,
    }));

    return {
      expenses: expensesWithUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get a single expense
  async getExpense(cooperativeId: string, expenseId: string, userId: string) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.EXPENSES_VIEW, 'You do not have permission to view expenses');

    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, cooperativeId },
      include: {
        category: true,
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Fetch user info for createdBy and approvedBy
    const userIds = [expense.createdBy, expense.approvedBy].filter(Boolean) as string[];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      ...expense,
      createdByUser: expense.createdBy ? userMap.get(expense.createdBy) : null,
      approvedByUser: expense.approvedBy ? userMap.get(expense.approvedBy) : null,
    };
  }

  // Update an expense
  async updateExpense(cooperativeId: string, expenseId: string, dto: UpdateExpenseDto, userId: string) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.EXPENSES_EDIT, 'You do not have permission to edit expenses');

    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, cooperativeId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Cannot edit approved expenses
    if (expense.status === 'approved') {
      throw new BadRequestException('Cannot edit an approved expense');
    }

    // Validate category if provided
    if (dto.categoryId) {
      const category = await this.prisma.expenseCategory.findFirst({
        where: { id: dto.categoryId, cooperativeId, isActive: true },
      });

      if (!category) {
        throw new BadRequestException('Invalid expense category');
      }
    }

    const updated = await this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        categoryId: dto.categoryId,
        vendorName: dto.vendorName,
        vendorContact: dto.vendorContact,
        receiptUrl: dto.receiptUrl,
        receiptNumber: dto.receiptNumber,
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.paymentReference,
      },
      include: {
        category: true,
      },
    });

    await this.activitiesService.log(
      userId,
      'expense.update',
      `Updated expense "${updated.title}"`,
      cooperativeId,
      { expenseId },
    );

    return updated;
  }

  // Delete an expense
  async deleteExpense(cooperativeId: string, expenseId: string, userId: string) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.EXPENSES_DELETE, 'You do not have permission to delete expenses');

    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, cooperativeId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Cannot delete approved expenses
    if (expense.status === 'approved') {
      throw new BadRequestException('Cannot delete an approved expense');
    }

    await this.prisma.expense.delete({
      where: { id: expenseId },
    });

    await this.activitiesService.log(
      userId,
      'expense.delete',
      `Deleted expense "${expense.title}"`,
      cooperativeId,
      { expenseId, amount: expense.amount },
    );

    return { success: true, message: 'Expense deleted successfully' };
  }

  // Approve or reject an expense
  async approveExpense(cooperativeId: string, expenseId: string, dto: ApproveExpenseDto, userId: string) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.EXPENSES_APPROVE, 'You do not have permission to approve expenses');

    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, cooperativeId },
      include: { category: true },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.status !== 'pending') {
      throw new BadRequestException(`This expense has already been ${expense.status}`);
    }

    if (dto.status === 'rejected' && !dto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    let ledgerEntry = null;

    if (dto.status === 'approved') {
      // Create ledger entry and update cooperative totals
      await this.prisma.$transaction(async (tx) => {
        // Get current cooperative totals
        const cooperative = await tx.cooperative.findUnique({
          where: { id: cooperativeId },
        });

        if (!cooperative) {
          throw new NotFoundException('Cooperative not found');
        }

        // Create ledger entry for the expense
        ledgerEntry = await tx.ledgerEntry.create({
          data: {
            cooperativeId,
            memberId: null, // Cooperative-level expense
            type: 'expense',
            amount: -expense.amount, // Negative for expense
            balanceAfter: cooperative.totalContributions - cooperative.totalExpenses - expense.amount,
            referenceId: expense.id,
            referenceType: 'expense',
            description: `Expense: ${expense.title}${expense.category ? ` (${expense.category.name})` : ''}`,
            createdBy: userId,
          },
        });

        // Update expense with approval details
        await tx.expense.update({
          where: { id: expenseId },
          data: {
            status: 'approved',
            approvedBy: userId,
            approvedAt: new Date(),
            ledgerEntryId: ledgerEntry.id,
          },
        });

        // Update cooperative's total expenses
        await tx.cooperative.update({
          where: { id: cooperativeId },
          data: {
            totalExpenses: {
              increment: expense.amount,
            },
          },
        });
      });
    } else {
      // Just update the expense status for rejection
      await this.prisma.expense.update({
        where: { id: expenseId },
        data: {
          status: 'rejected',
          rejectionReason: dto.rejectionReason,
        },
      });
    }

    await this.activitiesService.log(
      userId,
      dto.status === 'approved' ? 'expense.approve' : 'expense.reject',
      `${dto.status === 'approved' ? 'Approved' : 'Rejected'} expense "${expense.title}" for ₦${expense.amount.toLocaleString()}`,
      cooperativeId,
      { expenseId, status: dto.status, amount: expense.amount },
    );

    return this.getExpense(cooperativeId, expenseId, userId);
  }

  // Get expense summary/statistics
  async getExpenseSummary(
    cooperativeId: string,
    userId: string,
    options?: { startDate?: string; endDate?: string },
  ) {
    const member = await this.getMemberWithPermissions(cooperativeId, userId);
    this.requirePermission(member, PERMISSIONS.EXPENSES_VIEW, 'You do not have permission to view expenses');

    const where: any = { cooperativeId, status: 'approved' };

    if (options?.startDate || options?.endDate) {
      where.expenseDate = {};
      if (options?.startDate) {
        where.expenseDate.gte = new Date(options.startDate);
      }
      if (options?.endDate) {
        where.expenseDate.lte = new Date(options.endDate);
      }
    }

    // Get total approved expenses
    const totalApproved = await this.prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    // Get pending expenses count and amount
    const pendingWhere = { ...where, status: 'pending' };
    delete pendingWhere.status;
    const totalPending = await this.prisma.expense.aggregate({
      where: { cooperativeId, status: 'pending' },
      _sum: { amount: true },
      _count: true,
    });

    // Get expenses by category
    const byCategory = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // Get category names
    const categories = await this.prisma.expenseCategory.findMany({
      where: { cooperativeId },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const expensesByCategory = byCategory.map((item) => ({
      categoryId: item.categoryId,
      categoryName: item.categoryId ? categoryMap.get(item.categoryId)?.name : 'Uncategorized',
      categoryColor: item.categoryId ? categoryMap.get(item.categoryId)?.color : '#6B7280',
      totalAmount: item._sum.amount || 0,
      count: item._count,
    }));

    // Get monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyExpenses = await this.prisma.expense.findMany({
      where: {
        cooperativeId,
        status: 'approved',
        expenseDate: { gte: sixMonthsAgo },
      },
      select: {
        amount: true,
        expenseDate: true,
      },
    });

    // Group by month
    const monthlyTrend: { [key: string]: number } = {};
    monthlyExpenses.forEach((expense) => {
      const monthKey = expense.expenseDate.toISOString().substring(0, 7); // YYYY-MM
      monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + expense.amount;
    });

    return {
      totalApprovedAmount: totalApproved._sum.amount || 0,
      totalApprovedCount: totalApproved._count,
      totalPendingAmount: totalPending._sum.amount || 0,
      totalPendingCount: totalPending._count,
      expensesByCategory,
      monthlyTrend: Object.entries(monthlyTrend)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };
  }
}
