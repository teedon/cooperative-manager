import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PeriodCard from '../../src/components/contributions/PeriodCard';
import { ContributionPeriod } from '../../src/models';

const mockPeriod: ContributionPeriod = {
  id: 'period-1',
  planId: 'plan-1',
  periodNumber: 1,
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  dueDate: '2024-02-05',
  expectedAmount: 2500,
  collectedAmount: 1500,
  status: 'active',
};

describe('PeriodCard', () => {
  it('renders correctly with period data', () => {
    const { getByText } = render(<PeriodCard period={mockPeriod} expectedAmount={2500} />);
    expect(getByText('Period 1')).toBeTruthy();
    expect(getByText('active')).toBeTruthy();
    expect(getByText('$1,500')).toBeTruthy();
  });

  it('shows progress bar based on collected amount', () => {
    const { getByText } = render(<PeriodCard period={mockPeriod} expectedAmount={2500} />);
    expect(getByText('of $2,500')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <PeriodCard period={mockPeriod} onPress={onPress} testID="period-card" />
    );
    fireEvent.press(getByTestId('period-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows due date', () => {
    const { getByText } = render(<PeriodCard period={mockPeriod} />);
    expect(getByText('Due Date')).toBeTruthy();
  });

  it('renders different status badges correctly', () => {
    const completedPeriod = { ...mockPeriod, status: 'completed' as const };
    const { getByText } = render(<PeriodCard period={completedPeriod} />);
    expect(getByText('completed')).toBeTruthy();
  });
});
