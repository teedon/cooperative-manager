import React from 'react';
import { render } from '@testing-library/react-native';
import LedgerRow from '../../src/components/ledger/LedgerRow';
import { LedgerEntry } from '../../src/models';

const mockEntry: LedgerEntry = {
  id: 'ledger-1',
  cooperativeId: 'coop-1',
  memberId: 'member-1',
  type: 'contribution_in',
  amount: 500,
  balanceAfter: 2500,
  referenceId: 'record-1',
  referenceType: 'contribution',
  description: 'Monthly contribution - June 2024',
  createdBy: 'system',
  createdAt: '2024-06-11T10:00:00Z',
};

describe('LedgerRow', () => {
  it('renders correctly with entry data', () => {
    const { getByText } = render(<LedgerRow entry={mockEntry} />);
    expect(getByText('Contribution')).toBeTruthy();
    expect(getByText('Monthly contribution - June 2024')).toBeTruthy();
  });

  it('shows positive amount with plus sign', () => {
    const { getByText } = render(<LedgerRow entry={mockEntry} />);
    expect(getByText('+$500.00')).toBeTruthy();
  });

  it('shows balance after transaction', () => {
    const { getByText } = render(<LedgerRow entry={mockEntry} />);
    expect(getByText('Balance: $2500.00')).toBeTruthy();
  });

  it('shows negative amount without plus sign', () => {
    const negativeEntry: LedgerEntry = {
      ...mockEntry,
      type: 'groupbuy_outlay',
      amount: -200,
      balanceAfter: 2300,
      description: 'Group buy purchase',
    };
    const { getByText } = render(<LedgerRow entry={negativeEntry} />);
    expect(getByText('-$200.00')).toBeTruthy();
    expect(getByText('Group Buy')).toBeTruthy();
  });

  it('renders different entry types correctly', () => {
    const loanEntry: LedgerEntry = {
      ...mockEntry,
      type: 'loan_disbursement',
      amount: -1000,
      description: 'Loan disbursement',
    };
    const { getByText } = render(<LedgerRow entry={loanEntry} />);
    expect(getByText('Loan Disbursement')).toBeTruthy();
  });
});
