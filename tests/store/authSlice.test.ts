import authReducer, {
  clearError,
  setUser,
  setToken,
  resetAuth,
} from '../../src/store/slices/authSlice';
import { User } from '../../src/models';

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle clearError', () => {
    const stateWithError = { ...initialState, error: 'Some error' };
    expect(authReducer(stateWithError, clearError())).toEqual(initialState);
  });

  it('should handle setUser', () => {
    const result = authReducer(initialState, setUser(mockUser));
    expect(result.user).toEqual(mockUser);
  });

  it('should handle setToken', () => {
    const token = 'test-token-123';
    const result = authReducer(initialState, setToken(token));
    expect(result.token).toEqual(token);
    expect(result.isAuthenticated).toBe(true);
  });

  it('should handle resetAuth', () => {
    const loggedInState = {
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    };
    expect(authReducer(loggedInState, resetAuth())).toEqual(initialState);
  });
});
