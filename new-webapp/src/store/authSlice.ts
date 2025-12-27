import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface LoginCredentials {
  email: string
  password: string
}

interface SignupData {
  firstName: string
  lastName: string
  email: string
  password: string
}

interface AuthResponse {
  user: User
  accessToken: string
  refreshToken?: string
}

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// Configure axios for auth requests
const authAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Real API calls
const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    console.log('Attempting login with:', { email: credentials.email })
    const response = await authAxios.post('/auth/login', credentials)
    console.log('Login response:', response.data)
    const { user, token, refreshToken } = response.data.data
    return {
      user,
      accessToken: token,
      refreshToken
    }
  },

  signup: async (data: SignupData): Promise<AuthResponse> => {
    console.log('Attempting signup with:', { email: data.email, firstName: data.firstName })
    const response = await authAxios.post('/auth/register', data)
    console.log('Signup response:', response.data)
    const { user, token, refreshToken } = response.data.data
    return {
      user,
      accessToken: token,
      refreshToken
    }
  },

  logout: async (): Promise<void> => {
    // Optional: call logout endpoint if needed
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        await authAxios.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch (error) {
        console.error('Logout API call failed:', error)
      }
    }
  }
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
  token: localStorage.getItem('auth_token'),
  refreshToken: localStorage.getItem('auth_refresh_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,
}

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials)
      
      // Store in localStorage with consistent keys
      localStorage.setItem('token', response.accessToken)
      localStorage.setItem('auth_token', response.accessToken)
      localStorage.setItem('auth_user', JSON.stringify(response.user))
      if (response.refreshToken) {
        localStorage.setItem('auth_refresh_token', response.refreshToken)
      }
      
      console.log('Login successful, tokens stored')
      return response
    } catch (error: any) {
      console.error('Login error:', error)
      console.error('Error response:', error.response)
      const errorMessage = error.response?.data?.message || error.message || 'Login failed'
      return rejectWithValue(errorMessage)
    }
  }
)

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (data: SignupData, { rejectWithValue }) => {
    try {
      const response = await authAPI.signup(data)
      
      // Store in localStorage with consistent keys
      localStorage.setItem('token', response.accessToken)
      localStorage.setItem('auth_token', response.accessToken)
      localStorage.setItem('auth_user', JSON.stringify(response.user))
      if (response.refreshToken) {
        localStorage.setItem('auth_refresh_token', response.refreshToken)
      }
      
      console.log('Signup successful, tokens stored')
      return response
    } catch (error: any) {
      console.error('Signup error:', error)
      console.error('Error response:', error.response)
      const errorMessage = error.response?.data?.message || error.message || 'Signup failed'
      return rejectWithValue(errorMessage)
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout()
      
      // Clear localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_refresh_token')
      
      return true
    } catch (error: any) {
      // Clear localStorage even if API fails
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_refresh_token')
      
      return rejectWithValue(error.message || 'Logout failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearAuth: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_refresh_token')
    }
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken || null
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

    // Signup
    builder
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken || null
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.error = null
        state.isLoading = false
      })
  }
})

export const { clearError, clearAuth } = authSlice.actions
export default authSlice.reducer