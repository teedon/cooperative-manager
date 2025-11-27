import contributionReducer, {
  clearError,
  setCurrentPlan,
  setCurrentPeriod,
} from '../../src/store/slices/contributionSlice';
import { ContributionPlan, ContributionPeriod } from '../../src/models';

describe('contributionSlice', () => {
  const initialState = {
    plans: [],
    currentPlan: null,
    periods: [],
    currentPeriod: null,
    records: [],
    pendingVerifications: [],
    isLoading: false,
    error: null,
  };

  const mockPlan: ContributionPlan = {
    id: 'plan-1',
    cooperativeId: 'coop-1',
    name: 'Monthly Savings',
    type: 'fixed',
    amount: 500,
    frequency: 'monthly',
    duration: 'continuous',
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockPeriod: ContributionPeriod = {
    id: 'period-1',
    planId: 'plan-1',
    periodNumber: 1,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    dueDate: '2024-02-05',
    expectedAmount: 2500,
    collectedAmount: 2000,
    status: 'active',
  };

  it('should return the initial state', () => {
    expect(contributionReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle clearError', () => {
    const stateWithError = { ...initialState, error: 'Some error' };
    expect(contributionReducer(stateWithError, clearError())).toEqual(initialState);
  });

  it('should handle setCurrentPlan', () => {
    const result = contributionReducer(initialState, setCurrentPlan(mockPlan));
    expect(result.currentPlan).toEqual(mockPlan);
  });

  it('should handle setCurrentPlan to null', () => {
    const stateWithPlan = { ...initialState, currentPlan: mockPlan };
    const result = contributionReducer(stateWithPlan, setCurrentPlan(null));
    expect(result.currentPlan).toBeNull();
  });

  it('should handle setCurrentPeriod', () => {
    const result = contributionReducer(initialState, setCurrentPeriod(mockPeriod));
    expect(result.currentPeriod).toEqual(mockPeriod);
  });

  it('should handle setCurrentPeriod to null', () => {
    const stateWithPeriod = { ...initialState, currentPeriod: mockPeriod };
    const result = contributionReducer(stateWithPeriod, setCurrentPeriod(null));
    expect(result.currentPeriod).toBeNull();
  });
});
