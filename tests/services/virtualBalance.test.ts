import { VirtualBalance, LedgerEntry, LedgerEntryType } from '../../src/models';

describe('Virtual Balance Calculation', () => {
  const createEntry = (
    type: LedgerEntryType,
    amount: number,
    balanceAfter: number
  ): LedgerEntry => ({
    id: `ledger-${Date.now()}`,
    cooperativeId: 'coop-1',
    memberId: 'member-1',
    type,
    amount,
    balanceAfter,
    description: `Test ${type}`,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  });

  const calculateBalance = (entries: LedgerEntry[]): VirtualBalance => {
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
      memberId: 'member-1',
      cooperativeId: 'coop-1',
      totalContributions,
      totalLoanDisbursements,
      totalLoanRepayments,
      totalGroupBuyOutlays,
      totalGroupBuyRepayments,
      manualAdjustments,
      currentBalance,
      lastUpdated: new Date().toISOString(),
    };
  };

  it('should calculate balance with only contributions', () => {
    const entries = [
      createEntry('contribution_in', 500, 500),
      createEntry('contribution_in', 500, 1000),
      createEntry('contribution_in', 500, 1500),
    ];

    const balance = calculateBalance(entries);

    expect(balance.totalContributions).toBe(1500);
    expect(balance.currentBalance).toBe(1500);
  });

  it('should calculate balance with loan disbursement', () => {
    const entries = [
      createEntry('contribution_in', 1000, 1000),
      createEntry('loan_disbursement', -2000, -1000),
    ];

    const balance = calculateBalance(entries);

    expect(balance.totalContributions).toBe(1000);
    expect(balance.totalLoanDisbursements).toBe(2000);
    expect(balance.currentBalance).toBe(-1000);
  });

  it('should calculate balance with loan repayment', () => {
    const entries = [
      createEntry('contribution_in', 1000, 1000),
      createEntry('loan_disbursement', -2000, -1000),
      createEntry('loan_repayment', 500, -500),
    ];

    const balance = calculateBalance(entries);

    expect(balance.totalLoanRepayments).toBe(500);
    expect(balance.currentBalance).toBe(-500);
  });

  it('should calculate balance with group buy outlay', () => {
    const entries = [
      createEntry('contribution_in', 2000, 2000),
      createEntry('groupbuy_outlay', -500, 1500),
    ];

    const balance = calculateBalance(entries);

    expect(balance.totalContributions).toBe(2000);
    expect(balance.totalGroupBuyOutlays).toBe(500);
    expect(balance.currentBalance).toBe(1500);
  });

  it('should calculate balance with manual adjustments', () => {
    const entries = [
      createEntry('contribution_in', 1000, 1000),
      createEntry('manual_credit', 100, 1100),
      createEntry('manual_debit', -50, 1050),
    ];

    const balance = calculateBalance(entries);

    expect(balance.manualAdjustments).toBe(50); // 100 - 50
    expect(balance.currentBalance).toBe(1050);
  });

  it('should calculate complex balance correctly', () => {
    const entries = [
      createEntry('contribution_in', 5000, 5000),
      createEntry('loan_disbursement', -2000, 3000),
      createEntry('loan_repayment', 500, 3500),
      createEntry('groupbuy_outlay', -300, 3200),
      createEntry('manual_credit', 100, 3300),
    ];

    const balance = calculateBalance(entries);

    // 5000 + 500 + 100 - 2000 - 300 = 3300
    expect(balance.currentBalance).toBe(3300);
    expect(balance.totalContributions).toBe(5000);
    expect(balance.totalLoanDisbursements).toBe(2000);
    expect(balance.totalLoanRepayments).toBe(500);
    expect(balance.totalGroupBuyOutlays).toBe(300);
    expect(balance.manualAdjustments).toBe(100);
  });
});
