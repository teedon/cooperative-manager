import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoanCard from '../../src/components/loans/LoanCard';
import { LoanRequest } from '../../src/models';

const mockLoan: LoanRequest = {
  id: 'loan-1',
  cooperativeId: 'coop-1',
  memberId: 'member-1',
  member: {
    id: 'member-1',
    cooperativeId: 'coop-1',
    userId: 'user-1',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    role: 'member',
    joinedAt: '2024-01-01T00:00:00Z',
    virtualBalance: 5000,
    status: 'active',
  },
  amount: 2000,
  purpose: 'Emergency medical expenses',
  duration: 6,
  interestRate: 5,
  monthlyRepayment: 350,
  totalRepayment: 2100,
  status: 'pending',
  requestedAt: '2024-04-01T10:00:00Z',
  createdAt: '2024-04-01T10:00:00Z',
  updatedAt: '2024-04-01T10:00:00Z',
};

describe('LoanCard', () => {
  it('renders correctly with loan data', () => {
    const { getByText } = render(<LoanCard loan={mockLoan} />);
    expect(getByText('$2,000')).toBeTruthy();
    expect(getByText('Emergency medical expenses')).toBeTruthy();
    expect(getByText('pending')).toBeTruthy();
  });

  it('shows loan details', () => {
    const { getByText } = render(<LoanCard loan={mockLoan} />);
    expect(getByText('6 months')).toBeTruthy();
    expect(getByText('5%')).toBeTruthy();
    expect(getByText('$350.00')).toBeTruthy();
  });

  it('shows total repayment', () => {
    const { getByText } = render(<LoanCard loan={mockLoan} />);
    expect(getByText('Total Repayment')).toBeTruthy();
    expect(getByText('$2100.00')).toBeTruthy();
  });

  it('shows member name when showMember is true', () => {
    const { getByText } = render(<LoanCard loan={mockLoan} showMember />);
    expect(getByText('John Doe')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <LoanCard loan={mockLoan} onPress={onPress} testID="loan-card" />
    );
    fireEvent.press(getByTestId('loan-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders different status badges correctly', () => {
    const approvedLoan = { ...mockLoan, status: 'approved' as const };
    const { getByText } = render(<LoanCard loan={approvedLoan} />);
    expect(getByText('approved')).toBeTruthy();
  });
});
