import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState, LoginCredentials, SignupData } from '../../models';
import { authApi } from '../../api/authApi';

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const signup = createAsyncThunk(
  'auth/signup',
  async (data: SignupData, { rejectWithValue }) => {
    try {
      const response = await authApi.signup(data);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authApi.logout();
  } catch (error) {
    // Even if backend logout fails, we should clear local storage
    console.warn('Backend logout failed, clearing local storage anyway');
  }
  // Clear ALL user-related local storage including onboarding state
  // This ensures new users see onboarding when signing up on same device
  await AsyncStorage.multiRemove([
    'auth_token',
    'auth_user',
    'auth_refresh',
    'hasSeenOnboarding',
  ]);
  return true; // Signal successful logout
});

export const restoreSession = createAsyncThunk('auth/restoreSession', async (_, { rejectWithValue }) => {
  const token = await AsyncStorage.getItem('auth_token');
  const userJson = await AsyncStorage.getItem('auth_user');
  const refresh = await AsyncStorage.getItem('auth_refresh');

  if (!token || !userJson) {
    throw new Error('No session found');
  }

  try {
    // Validate token by calling /auth/me - this will auto-refresh if needed
    const response = await authApi.getCurrentUser();
    if (response.success && response.data) {
      // Update stored user data with fresh data from server
      await AsyncStorage.setItem('auth_user', JSON.stringify(response.data));
      // Get potentially refreshed token
      const currentToken = await AsyncStorage.getItem('auth_token');
      const currentRefresh = await AsyncStorage.getItem('auth_refresh');
      return { token: currentToken!, user: response.data, refreshToken: currentRefresh };
    }
    throw new Error('Failed to validate session');
  } catch (error) {
    // If validation fails even after refresh attempt, clear everything
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    await AsyncStorage.removeItem('auth_refresh');
    throw new Error('Session expired');
  }
});

export const refreshTokens = createAsyncThunk(
  'auth/refreshTokens',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = await AsyncStorage.getItem('auth_refresh');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      const response = await authApi.refreshToken(refreshToken);
      if (response.success && response.data) {
        // Save new tokens
        await AsyncStorage.setItem('auth_token', response.data.token);
        if (response.data.refreshToken) {
          await AsyncStorage.setItem('auth_refresh', response.data.refreshToken);
        }
        return response.data;
      }
      throw new Error('Token refresh failed');
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
    },
    updateTokens: (state, action: PayloadAction<{ token: string; refreshToken?: string }>) => {
      state.token = action.payload.token;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
    },
    forceLogout: (state) => {
      // Used when token refresh fails in the interceptor
      AsyncStorage.multiRemove(['auth_token', 'auth_user', 'auth_refresh', 'hasSeenOnboarding']);
      return initialState;
    },
    resetAuth: () => {
      // Clear persisted auth data when resetting
      AsyncStorage.multiRemove(['auth_token', 'auth_user', 'auth_refresh', 'hasSeenOnboarding']);
      return initialState;
    },
    clearAllData: () => {
      // Clear everything for a complete fresh start
      AsyncStorage.multiRemove(['auth_token', 'auth_user', 'auth_refresh', 'hasSeenOnboarding']);
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = (action.payload as any).refreshToken ?? null;
        // Persist auth data
        AsyncStorage.setItem('auth_token', action.payload.token);
        AsyncStorage.setItem('auth_user', JSON.stringify(action.payload.user));
        if ((action.payload as any).refreshToken) {
          AsyncStorage.setItem('auth_refresh', (action.payload as any).refreshToken);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Signup
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = (action.payload as any).refreshToken ?? null;
        // Persist auth data
        AsyncStorage.setItem('auth_token', action.payload.token);
        AsyncStorage.setItem('auth_user', JSON.stringify(action.payload.user));
        if ((action.payload as any).refreshToken) {
          AsyncStorage.setItem('auth_refresh', (action.payload as any).refreshToken);
        }
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.fulfilled, () => {
        // Clear persisted auth data
        AsyncStorage.removeItem('auth_token');
        AsyncStorage.removeItem('auth_user');
        AsyncStorage.removeItem('auth_refresh');
        return initialState;
      })
      // Restore Session
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = (action.payload as any).refreshToken ?? null;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isAuthenticated = false;
      })
      // Refresh Tokens
      .addCase(refreshTokens.fulfilled, (state, action) => {
        state.token = action.payload.token;
        if (action.payload.refreshToken) {
          state.refreshToken = action.payload.refreshToken;
        }
      })
      .addCase(refreshTokens.rejected, (state) => {
        // If refresh fails, log user out
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      });
  },
});

export const { clearError, setUser, setToken, updateTokens, forceLogout, resetAuth, clearAllData } = authSlice.actions;
export default authSlice.reducer;
