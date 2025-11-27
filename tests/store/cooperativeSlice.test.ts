import cooperativeReducer, {
  clearError,
  setCurrentCooperative,
  setCurrentMember,
} from '../../src/store/slices/cooperativeSlice';
import { Cooperative, CooperativeMember, User } from '../../src/models';

describe('cooperativeSlice', () => {
  const initialState = {
    cooperatives: [],
    currentCooperative: null,
    members: [],
    currentMember: null,
    isLoading: false,
    error: null,
  };

  const mockCooperative: Cooperative = {
    id: 'coop-1',
    name: 'Test Cooperative',
    description: 'A test cooperative',
    status: 'active',
    memberCount: 5,
    totalContributions: 10000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockMember: CooperativeMember = {
    id: 'member-1',
    cooperativeId: 'coop-1',
    userId: 'user-1',
    user: mockUser,
    role: 'admin',
    joinedAt: '2024-01-01T00:00:00Z',
    virtualBalance: 5000,
    status: 'active',
  };

  it('should return the initial state', () => {
    expect(cooperativeReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle clearError', () => {
    const stateWithError = { ...initialState, error: 'Some error' };
    expect(cooperativeReducer(stateWithError, clearError())).toEqual(initialState);
  });

  it('should handle setCurrentCooperative', () => {
    const result = cooperativeReducer(initialState, setCurrentCooperative(mockCooperative));
    expect(result.currentCooperative).toEqual(mockCooperative);
  });

  it('should handle setCurrentCooperative to null', () => {
    const stateWithCoop = { ...initialState, currentCooperative: mockCooperative };
    const result = cooperativeReducer(stateWithCoop, setCurrentCooperative(null));
    expect(result.currentCooperative).toBeNull();
  });

  it('should handle setCurrentMember', () => {
    const result = cooperativeReducer(initialState, setCurrentMember(mockMember));
    expect(result.currentMember).toEqual(mockMember);
  });

  it('should handle setCurrentMember to null', () => {
    const stateWithMember = { ...initialState, currentMember: mockMember };
    const result = cooperativeReducer(stateWithMember, setCurrentMember(null));
    expect(result.currentMember).toBeNull();
  });
});
