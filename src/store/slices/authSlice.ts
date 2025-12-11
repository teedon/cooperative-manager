import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState, LoginCredentials, SignupData } from '../../models';
import { authApi } from '../../api/authApi';

const initialState: AuthState = {
  user: null,
  token: null,
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

export const logout = createAsyncThunk('auth/logout', async () => {
  await authApi.logout();
});

export const restoreSession = createAsyncThunk('auth/restoreSession', async () => {
  const token = await AsyncStorage.getItem('auth_token');
  const userJson = await AsyncStorage.getItem('auth_user');

  if (token && userJson) {
    const user = JSON.parse(userJson);
    return { token, user };
  }

  throw new Error('No session found');
});

// export const restoreSession = createAsyncThunk('auth/restoreSession', async () => {
//   const token = await AsyncStorage.getItem('auth_token');
//   const userJson = await AsyncStorage.getItem('auth_user');

//   if (token && userJson) {
//     const user = JSON.parse(userJson);
//     return { token, user };
//   }

//   throw new Error('No session found');
// });

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
    resetAuth: () => initialState,
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
        // Persist auth data
        AsyncStorage.setItem('auth_token', action.payload.token);
        AsyncStorage.setItem('auth_user', JSON.stringify(action.payload.user));
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
        // Persist auth data
        AsyncStorage.setItem('auth_token', action.payload.token);
        AsyncStorage.setItem('auth_user', JSON.stringify(action.payload.user));
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
        return initialState;
      })
      // Restore Session
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setUser, setToken, resetAuth } = authSlice.actions;
export default authSlice.reducer;
