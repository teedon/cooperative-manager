import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import seedData from './data/seed.json';

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Types for the data store
interface ContributionRecord {
  id: string;
  periodId: string;
  memberId: string;
  amount: number;
  paymentDate: string;
  paymentReference: string;
  receiptUrl: string;
  notes: string;
  status: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface Loan {
  id: string;
  cooperativeId: string;
  memberId: string;
  amount: number;
  purpose: string;
  duration: number;
  interestRate: number;
  monthlyRepayment: number;
  totalRepayment: number;
  status: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  disbursedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface DataStore {
  users: typeof seedData.users;
  cooperatives: typeof seedData.cooperatives;
  members: typeof seedData.members;
  contributionPlans: typeof seedData.contributionPlans;
  contributionPeriods: typeof seedData.contributionPeriods;
  contributionRecords: ContributionRecord[];
  groupBuys: typeof seedData.groupBuys;
  groupBuyOrders: typeof seedData.groupBuyOrders;
  loans: Loan[];
  loanRepayments: typeof seedData.loanRepayments;
  ledgerEntries: typeof seedData.ledgerEntries;
}

const data: DataStore = JSON.parse(JSON.stringify(seedData));

// Helper to generate IDs
const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Simple auth middleware (mock - just checks for Bearer token)
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For mock server, allow unauthenticated requests but set default user
    (req as unknown as { userId: string }).userId = 'user-1';
  } else {
    // Extract user from token (in real app, would verify JWT)
    (req as unknown as { userId: string }).userId = 'user-1';
  }
  next();
};

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== AUTH ====================
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = data.users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token: `mock-jwt-token-${user.id}`,
    },
  });
});

app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone } = req.body;

  if (data.users.find((u) => u.email === email)) {
    return res.status(400).json({ success: false, error: 'Email already exists' });
  }

  const newUser = {
    id: generateId('user'),
    email,
    password,
    firstName,
    lastName,
    phone: phone || '',
    avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.users.push(newUser);

  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({
    success: true,
    data: {
      user: userWithoutPassword,
      token: `mock-jwt-token-${newUser.id}`,
    },
  });
});

app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as unknown as { userId: string }).userId;
  const user = data.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({ success: true, data: userWithoutPassword });
});

// ==================== COOPERATIVES ====================
app.get('/api/cooperatives', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as unknown as { userId: string }).userId;
  const userMemberships = data.members.filter((m) => m.userId === userId && m.status === 'active');
  const coopIds = userMemberships.map((m) => m.cooperativeId);
  const cooperatives = data.cooperatives.filter((c) => coopIds.includes(c.id));

  res.json({ success: true, data: cooperatives });
});

app.get('/api/cooperatives/:id', authMiddleware, (req: Request, res: Response) => {
  const cooperative = data.cooperatives.find((c) => c.id === req.params.id);

  if (!cooperative) {
    return res.status(404).json({ success: false, error: 'Cooperative not found' });
  }

  res.json({ success: true, data: cooperative });
});

app.post('/api/cooperatives', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { name, description, imageUrl } = req.body;

  const newCoop = {
    id: generateId('coop'),
    name,
    description: description || '',
    imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/400/200`,
    status: 'active' as const,
    memberCount: 1,
    totalContributions: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.cooperatives.push(newCoop);

  // Add creator as admin member
  const newMember = {
    id: generateId('member'),
    cooperativeId: newCoop.id,
    userId,
    role: 'admin' as const,
    joinedAt: new Date().toISOString(),
    virtualBalance: 0,
    status: 'active' as const,
  };

  data.members.push(newMember);

  res.status(201).json({ success: true, data: newCoop });
});

// ==================== MEMBERS ====================
app.get(
  '/api/cooperatives/:cooperativeId/members',
  authMiddleware,
  (req: Request, res: Response) => {
    const members = data.members.filter((m) => m.cooperativeId === req.params.cooperativeId);

    // Enrich with user data
    const enrichedMembers = members.map((member) => {
      const user = data.users.find((u) => u.id === member.userId);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        return { ...member, user: userWithoutPassword };
      }
      return member;
    });

    res.json({ success: true, data: enrichedMembers });
  }
);

// ==================== CONTRIBUTION PLANS ====================
app.get(
  '/api/cooperatives/:cooperativeId/contribution-plans',
  authMiddleware,
  (req: Request, res: Response) => {
    const plans = data.contributionPlans.filter(
      (p) => p.cooperativeId === req.params.cooperativeId
    );
    res.json({ success: true, data: plans });
  }
);

app.post(
  '/api/cooperatives/:cooperativeId/contribution-plans',
  authMiddleware,
  (req: Request, res: Response) => {
    const { cooperativeId } = req.params;
    const planData = req.body;

    const newPlan = {
      id: generateId('plan'),
      cooperativeId,
      ...planData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.contributionPlans.push(newPlan);

    // Generate initial periods if it's a fixed_period plan
    if (planData.duration === 'fixed_period' && planData.startDate && planData.endDate) {
      // Simplified period generation - in production this would be more sophisticated
      const periods = [];
      const startDate = new Date(planData.startDate);
      const endDate = new Date(planData.endDate);
      let periodNumber = 1;
      let currentStart = new Date(startDate);

      while (currentStart < endDate) {
        const currentEnd = new Date(currentStart);
        switch (planData.frequency) {
          case 'weekly':
            currentEnd.setDate(currentEnd.getDate() + 7);
            break;
          case 'biweekly':
            currentEnd.setDate(currentEnd.getDate() + 14);
            break;
          case 'monthly':
            currentEnd.setMonth(currentEnd.getMonth() + 1);
            break;
          case 'quarterly':
            currentEnd.setMonth(currentEnd.getMonth() + 3);
            break;
          case 'annually':
            currentEnd.setFullYear(currentEnd.getFullYear() + 1);
            break;
        }

        if (currentEnd > endDate) break;

        const dueDate = new Date(currentEnd);
        dueDate.setDate(dueDate.getDate() + 5);

        periods.push({
          id: generateId('period'),
          planId: newPlan.id,
          periodNumber,
          startDate: currentStart.toISOString().split('T')[0],
          endDate: currentEnd.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          expectedAmount: planData.amount || 0,
          collectedAmount: 0,
          status: periodNumber === 1 ? 'active' : ('upcoming' as const),
        });

        currentStart = currentEnd;
        periodNumber++;
      }

      data.contributionPeriods.push(...periods);
    }

    res.status(201).json({ success: true, data: newPlan });
  }
);

app.get('/api/contribution-plans/:planId', authMiddleware, (req: Request, res: Response) => {
  const plan = data.contributionPlans.find((p) => p.id === req.params.planId);

  if (!plan) {
    return res.status(404).json({ success: false, error: 'Plan not found' });
  }

  res.json({ success: true, data: plan });
});

// ==================== CONTRIBUTION PERIODS ====================
app.get(
  '/api/contribution-plans/:planId/periods',
  authMiddleware,
  (req: Request, res: Response) => {
    const periods = data.contributionPeriods.filter((p) => p.planId === req.params.planId);
    res.json({ success: true, data: periods });
  }
);

app.get('/api/contribution-periods/:periodId', authMiddleware, (req: Request, res: Response) => {
  const period = data.contributionPeriods.find((p) => p.id === req.params.periodId);

  if (!period) {
    return res.status(404).json({ success: false, error: 'Period not found' });
  }

  res.json({ success: true, data: period });
});

// ==================== CONTRIBUTION RECORDS ====================
app.get(
  '/api/contribution-periods/:periodId/records',
  authMiddleware,
  (req: Request, res: Response) => {
    const records = data.contributionRecords.filter((r) => r.periodId === req.params.periodId);

    // Enrich with member data
    const enrichedRecords = records.map((record) => {
      const member = data.members.find((m) => m.id === record.memberId);
      if (member) {
        const user = data.users.find((u) => u.id === member.userId);
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          return { ...record, member: { ...member, user: userWithoutPassword } };
        }
      }
      return record;
    });

    res.json({ success: true, data: enrichedRecords });
  }
);

app.post(
  '/api/contribution-periods/:periodId/records',
  authMiddleware,
  (req: Request, res: Response) => {
    const userId = (req as unknown as { userId: string }).userId;
    const { periodId } = req.params;
    const { amount, paymentDate, paymentReference, receiptUrl, notes } = req.body;

    // Find member for this user in the cooperative
    const period = data.contributionPeriods.find((p) => p.id === periodId);
    if (!period) {
      return res.status(404).json({ success: false, error: 'Period not found' });
    }

    const plan = data.contributionPlans.find((p) => p.id === period.planId);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    const member = data.members.find(
      (m) => m.cooperativeId === plan.cooperativeId && m.userId === userId
    );
    if (!member) {
      return res.status(403).json({ success: false, error: 'Not a member of this cooperative' });
    }

    const newRecord = {
      id: generateId('record'),
      periodId,
      memberId: member.id,
      amount,
      paymentDate,
      paymentReference: paymentReference || '',
      receiptUrl: receiptUrl || '',
      notes: notes || '',
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.contributionRecords.push(newRecord);

    res.status(201).json({ success: true, data: newRecord });
  }
);

app.post(
  '/api/contribution-records/:recordId/verify',
  authMiddleware,
  (req: Request, res: Response) => {
    const userId = (req as unknown as { userId: string }).userId;
    const { recordId } = req.params;
    const { approved, reason } = req.body;

    const recordIndex = data.contributionRecords.findIndex((r) => r.id === recordId);
    if (recordIndex === -1) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    const record = data.contributionRecords[recordIndex];

    if (approved) {
      data.contributionRecords[recordIndex] = {
        ...record,
        status: 'verified',
        verifiedBy: userId,
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update period collected amount
      const periodIndex = data.contributionPeriods.findIndex((p) => p.id === record.periodId);
      if (periodIndex !== -1) {
        data.contributionPeriods[periodIndex].collectedAmount += record.amount;
      }

      // Find member and cooperative for ledger entry
      const member = data.members.find((m) => m.id === record.memberId);
      if (member) {
        // Update member virtual balance
        const memberIndex = data.members.findIndex((m) => m.id === record.memberId);
        data.members[memberIndex].virtualBalance += record.amount;

        // Create ledger entry
        const newEntry = {
          id: generateId('ledger'),
          cooperativeId: member.cooperativeId,
          memberId: record.memberId,
          type: 'contribution_in' as const,
          amount: record.amount,
          balanceAfter: data.members[memberIndex].virtualBalance,
          referenceId: record.id,
          referenceType: 'contribution' as const,
          description: `Contribution verified - ${record.paymentDate}`,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
        };

        data.ledgerEntries.push(newEntry);
      }
    } else {
      data.contributionRecords[recordIndex] = {
        ...record,
        status: 'rejected',
        rejectionReason: reason,
        verifiedBy: userId,
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    res.json({ success: true, data: data.contributionRecords[recordIndex] });
  }
);

app.get(
  '/api/cooperatives/:cooperativeId/pending-verifications',
  authMiddleware,
  (req: Request, res: Response) => {
    const { cooperativeId } = req.params;

    // Get all plans for this cooperative
    const planIds = data.contributionPlans
      .filter((p) => p.cooperativeId === cooperativeId)
      .map((p) => p.id);

    // Get all periods for these plans
    const periodIds = data.contributionPeriods
      .filter((p) => planIds.includes(p.planId))
      .map((p) => p.id);

    // Get pending records for these periods
    const pendingRecords = data.contributionRecords.filter(
      (r) => periodIds.includes(r.periodId) && r.status === 'pending'
    );

    // Enrich with member data
    const enrichedRecords = pendingRecords.map((record) => {
      const member = data.members.find((m) => m.id === record.memberId);
      if (member) {
        const user = data.users.find((u) => u.id === member.userId);
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          return { ...record, member: { ...member, user: userWithoutPassword } };
        }
      }
      return record;
    });

    res.json({ success: true, data: enrichedRecords });
  }
);

// ==================== GROUP BUYS ====================
app.get(
  '/api/cooperatives/:cooperativeId/group-buys',
  authMiddleware,
  (req: Request, res: Response) => {
    const groupBuys = data.groupBuys.filter((g) => g.cooperativeId === req.params.cooperativeId);
    res.json({ success: true, data: groupBuys });
  }
);

app.post(
  '/api/cooperatives/:cooperativeId/group-buys',
  authMiddleware,
  (req: Request, res: Response) => {
    const userId = (req as unknown as { userId: string }).userId;
    const { cooperativeId } = req.params;
    const groupBuyData = req.body;

    const newGroupBuy = {
      id: generateId('gb'),
      cooperativeId,
      ...groupBuyData,
      availableUnits: groupBuyData.totalUnits,
      interestRate: groupBuyData.interestRate || 5,
      allocationMethod: groupBuyData.allocationMethod || 'first_come',
      status: 'open' as const,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.groupBuys.push(newGroupBuy);

    res.status(201).json({ success: true, data: newGroupBuy });
  }
);

app.get('/api/group-buys/:id', authMiddleware, (req: Request, res: Response) => {
  const groupBuy = data.groupBuys.find((g) => g.id === req.params.id);

  if (!groupBuy) {
    return res.status(404).json({ success: false, error: 'Group buy not found' });
  }

  res.json({ success: true, data: groupBuy });
});

app.get('/api/group-buys/:groupBuyId/orders', authMiddleware, (req: Request, res: Response) => {
  const orders = data.groupBuyOrders.filter((o) => o.groupBuyId === req.params.groupBuyId);

  // Enrich with member data
  const enrichedOrders = orders.map((order) => {
    const member = data.members.find((m) => m.id === order.memberId);
    if (member) {
      const user = data.users.find((u) => u.id === member.userId);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        return { ...order, member: { ...member, user: userWithoutPassword } };
      }
    }
    return order;
  });

  res.json({ success: true, data: enrichedOrders });
});

app.post('/api/group-buys/:groupBuyId/orders', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { groupBuyId } = req.params;
  const { quantity } = req.body;

  const groupBuy = data.groupBuys.find((g) => g.id === groupBuyId);
  if (!groupBuy) {
    return res.status(404).json({ success: false, error: 'Group buy not found' });
  }

  if (groupBuy.status !== 'open') {
    return res.status(400).json({ success: false, error: 'Group buy is not open for orders' });
  }

  const member = data.members.find(
    (m) => m.cooperativeId === groupBuy.cooperativeId && m.userId === userId
  );
  if (!member) {
    return res.status(403).json({ success: false, error: 'Not a member of this cooperative' });
  }

  // Calculate liability
  const interestAmount = (groupBuy.unitPrice * quantity * groupBuy.interestRate) / 100;
  const totalLiability = groupBuy.unitPrice * quantity + interestAmount;

  const newOrder = {
    id: generateId('gbo'),
    groupBuyId,
    memberId: member.id,
    requestedQuantity: quantity,
    allocatedQuantity: quantity,
    unitPrice: groupBuy.unitPrice,
    interestAmount,
    totalLiability,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.groupBuyOrders.push(newOrder);

  // Update available units
  const gbIndex = data.groupBuys.findIndex((g) => g.id === groupBuyId);
  data.groupBuys[gbIndex].availableUnits -= quantity;
  data.groupBuys[gbIndex].updatedAt = new Date().toISOString();

  res.status(201).json({ success: true, data: newOrder });
});

app.post('/api/group-buys/:groupBuyId/finalize', authMiddleware, (req: Request, res: Response) => {
  const { groupBuyId } = req.params;

  const gbIndex = data.groupBuys.findIndex((g) => g.id === groupBuyId);
  if (gbIndex === -1) {
    return res.status(404).json({ success: false, error: 'Group buy not found' });
  }

  const groupBuy = data.groupBuys[gbIndex];

  // Update status
  data.groupBuys[gbIndex] = {
    ...groupBuy,
    status: 'finalized',
    updatedAt: new Date().toISOString(),
  };

  // Confirm all pending orders and create ledger entries
  const orders = data.groupBuyOrders.filter((o) => o.groupBuyId === groupBuyId);
  orders.forEach((order, index) => {
    if (order.status === 'pending') {
      const orderIndex = data.groupBuyOrders.findIndex((o) => o.id === order.id);
      data.groupBuyOrders[orderIndex] = {
        ...order,
        status: 'allocated',
        updatedAt: new Date().toISOString(),
      };

      // Create ledger entry for outlay
      const member = data.members.find((m) => m.id === order.memberId);
      if (member) {
        const memberIndex = data.members.findIndex((m) => m.id === order.memberId);
        data.members[memberIndex].virtualBalance -= order.totalLiability;

        const newEntry = {
          id: generateId('ledger'),
          cooperativeId: groupBuy.cooperativeId,
          memberId: order.memberId,
          type: 'groupbuy_outlay' as const,
          amount: -order.totalLiability,
          balanceAfter: data.members[memberIndex].virtualBalance,
          referenceId: order.id,
          referenceType: 'groupbuy' as const,
          description: `Group buy allocation: ${groupBuy.title} (${order.allocatedQuantity} units)`,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
        };

        data.ledgerEntries.push(newEntry);
      }
    }
  });

  res.json({ success: true, data: data.groupBuys[gbIndex] });
});

// ==================== LOANS ====================
app.get('/api/cooperatives/:cooperativeId/loans', authMiddleware, (req: Request, res: Response) => {
  const loans = data.loans.filter((l) => l.cooperativeId === req.params.cooperativeId);

  // Enrich with member data
  const enrichedLoans = loans.map((loan) => {
    const member = data.members.find((m) => m.id === loan.memberId);
    if (member) {
      const user = data.users.find((u) => u.id === member.userId);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        return { ...loan, member: { ...member, user: userWithoutPassword } };
      }
    }
    return loan;
  });

  res.json({ success: true, data: enrichedLoans });
});

app.post(
  '/api/cooperatives/:cooperativeId/loans',
  authMiddleware,
  (req: Request, res: Response) => {
    const userId = (req as unknown as { userId: string }).userId;
    const { cooperativeId } = req.params;
    const { amount, purpose, duration } = req.body;

    const member = data.members.find(
      (m) => m.cooperativeId === cooperativeId && m.userId === userId
    );
    if (!member) {
      return res.status(403).json({ success: false, error: 'Not a member of this cooperative' });
    }

    const interestRate = 5; // Default 5%
    const totalRepayment = amount * (1 + interestRate / 100);
    const monthlyRepayment = totalRepayment / duration;

    const newLoan = {
      id: generateId('loan'),
      cooperativeId,
      memberId: member.id,
      amount,
      purpose,
      duration,
      interestRate,
      monthlyRepayment,
      totalRepayment,
      status: 'pending' as const,
      requestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.loans.push(newLoan);

    res.status(201).json({ success: true, data: newLoan });
  }
);

app.get('/api/loans/:loanId', authMiddleware, (req: Request, res: Response) => {
  const loan = data.loans.find((l) => l.id === req.params.loanId);

  if (!loan) {
    return res.status(404).json({ success: false, error: 'Loan not found' });
  }

  // Enrich with member data
  const member = data.members.find((m) => m.id === loan.memberId);
  if (member) {
    const user = data.users.find((u) => u.id === member.userId);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return res.json({
        success: true,
        data: { ...loan, member: { ...member, user: userWithoutPassword } },
      });
    }
  }

  res.json({ success: true, data: loan });
});

app.post('/api/loans/:loanId/review', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { loanId } = req.params;
  const { approved, reason } = req.body;

  const loanIndex = data.loans.findIndex((l) => l.id === loanId);
  if (loanIndex === -1) {
    return res.status(404).json({ success: false, error: 'Loan not found' });
  }

  const loan = data.loans[loanIndex];

  if (approved) {
    data.loans[loanIndex] = {
      ...loan,
      status: 'approved',
      reviewedBy: userId,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } else {
    data.loans[loanIndex] = {
      ...loan,
      status: 'rejected',
      rejectionReason: reason,
      reviewedBy: userId,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  res.json({ success: true, data: data.loans[loanIndex] });
});

app.post('/api/loans/:loanId/disburse', authMiddleware, (req: Request, res: Response) => {
  const { loanId } = req.params;

  const loanIndex = data.loans.findIndex((l) => l.id === loanId);
  if (loanIndex === -1) {
    return res.status(404).json({ success: false, error: 'Loan not found' });
  }

  const loan = data.loans[loanIndex];

  if (loan.status !== 'approved') {
    return res
      .status(400)
      .json({ success: false, error: 'Loan must be approved before disbursement' });
  }

  data.loans[loanIndex] = {
    ...loan,
    status: 'disbursed',
    disbursedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Update member balance and create ledger entry
  const memberIndex = data.members.findIndex((m) => m.id === loan.memberId);
  if (memberIndex !== -1) {
    data.members[memberIndex].virtualBalance -= loan.amount;

    const newEntry = {
      id: generateId('ledger'),
      cooperativeId: loan.cooperativeId,
      memberId: loan.memberId,
      type: 'loan_disbursement' as const,
      amount: -loan.amount,
      balanceAfter: data.members[memberIndex].virtualBalance,
      referenceId: loan.id,
      referenceType: 'loan' as const,
      description: `Loan disbursement - ${loan.purpose}`,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
    };

    data.ledgerEntries.push(newEntry);
  }

  // Generate repayment schedule
  const now = new Date();
  for (let i = 1; i <= loan.duration; i++) {
    const dueDate = new Date(now);
    dueDate.setMonth(dueDate.getMonth() + i);

    const principalAmount = loan.amount / loan.duration;
    const interestAmount = (loan.amount * (loan.interestRate / 100)) / loan.duration;

    const repayment = {
      id: generateId('repay'),
      loanId: loan.id,
      dueDate: dueDate.toISOString().split('T')[0],
      principalAmount,
      interestAmount,
      totalAmount: principalAmount + interestAmount,
      paidAmount: 0,
      status: 'pending' as const,
    };

    data.loanRepayments.push(repayment);
  }

  res.json({ success: true, data: data.loans[loanIndex] });
});

app.get(
  '/api/cooperatives/:cooperativeId/loans/pending',
  authMiddleware,
  (req: Request, res: Response) => {
    const loans = data.loans.filter(
      (l) => l.cooperativeId === req.params.cooperativeId && l.status === 'pending'
    );

    res.json({ success: true, data: loans });
  }
);

app.get('/api/loans/:loanId/repayments', authMiddleware, (req: Request, res: Response) => {
  const repayments = data.loanRepayments.filter((r) => r.loanId === req.params.loanId);
  res.json({ success: true, data: repayments });
});

// ==================== LEDGER ====================
app.get(
  '/api/cooperatives/:cooperativeId/ledger',
  authMiddleware,
  (req: Request, res: Response) => {
    const { cooperativeId } = req.params;
    const { memberId } = req.query;

    let entries = data.ledgerEntries.filter((e) => e.cooperativeId === cooperativeId);

    if (memberId) {
      entries = entries.filter((e) => e.memberId === memberId);
    }

    // Sort by date descending
    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, data: entries });
  }
);

app.get(
  '/api/cooperatives/:cooperativeId/members/:memberId/balance',
  authMiddleware,
  (req: Request, res: Response) => {
    const { cooperativeId, memberId } = req.params;

    const entries = data.ledgerEntries.filter(
      (e) => e.cooperativeId === cooperativeId && e.memberId === memberId
    );

    const totalContributions = entries
      .filter((e) => e.type === 'contribution_in')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalLoanDisbursements = entries
      .filter((e) => e.type === 'loan_disbursement')
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    const totalLoanRepayments = entries
      .filter((e) => e.type === 'loan_repayment')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalGroupBuyOutlays = entries
      .filter((e) => e.type === 'groupbuy_outlay')
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    const totalGroupBuyRepayments = entries
      .filter((e) => e.type === 'groupbuy_repayment')
      .reduce((sum, e) => sum + e.amount, 0);

    const manualAdjustments = entries
      .filter((e) => e.type === 'manual_credit' || e.type === 'manual_debit')
      .reduce((sum, e) => sum + e.amount, 0);

    const currentBalance =
      totalContributions +
      totalLoanRepayments +
      totalGroupBuyRepayments +
      manualAdjustments -
      totalLoanDisbursements -
      totalGroupBuyOutlays;

    res.json({
      success: true,
      data: {
        memberId,
        cooperativeId,
        totalContributions,
        totalLoanDisbursements,
        totalLoanRepayments,
        totalGroupBuyOutlays,
        totalGroupBuyRepayments,
        manualAdjustments,
        currentBalance,
        lastUpdated: new Date().toISOString(),
      },
    });
  }
);

app.get(
  '/api/cooperatives/:cooperativeId/balances',
  authMiddleware,
  (req: Request, res: Response) => {
    const { cooperativeId } = req.params;

    const members = data.members.filter((m) => m.cooperativeId === cooperativeId);

    const balances = members.map((member) => {
      const entries = data.ledgerEntries.filter(
        (e) => e.cooperativeId === cooperativeId && e.memberId === member.id
      );

      const totalContributions = entries
        .filter((e) => e.type === 'contribution_in')
        .reduce((sum, e) => sum + e.amount, 0);

      const totalLoanDisbursements = entries
        .filter((e) => e.type === 'loan_disbursement')
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);

      const totalLoanRepayments = entries
        .filter((e) => e.type === 'loan_repayment')
        .reduce((sum, e) => sum + e.amount, 0);

      const totalGroupBuyOutlays = entries
        .filter((e) => e.type === 'groupbuy_outlay')
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);

      const totalGroupBuyRepayments = entries
        .filter((e) => e.type === 'groupbuy_repayment')
        .reduce((sum, e) => sum + e.amount, 0);

      const manualAdjustments = entries
        .filter((e) => e.type === 'manual_credit' || e.type === 'manual_debit')
        .reduce((sum, e) => sum + e.amount, 0);

      const currentBalance =
        totalContributions +
        totalLoanRepayments +
        totalGroupBuyRepayments +
        manualAdjustments -
        totalLoanDisbursements -
        totalGroupBuyOutlays;

      return {
        memberId: member.id,
        cooperativeId,
        totalContributions,
        totalLoanDisbursements,
        totalLoanRepayments,
        totalGroupBuyOutlays,
        totalGroupBuyRepayments,
        manualAdjustments,
        currentBalance,
        lastUpdated: new Date().toISOString(),
      };
    });

    res.json({ success: true, data: balances });
  }
);

// ==================== MEDIA UPLOAD (mock) ====================
app.post('/api/media/upload', authMiddleware, (req: Request, res: Response) => {
  // Mock file upload - return a fake URL
  const mockUrl = `https://example.com/receipts/receipt-${Date.now()}.jpg`;

  res.status(201).json({
    success: true,
    data: {
      url: mockUrl,
      filename: `receipt-${Date.now()}.jpg`,
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
