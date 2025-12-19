import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  subscriptionApi, 
  SubscriptionPlan, 
  Subscription, 
  SubscriptionUsage,
  InitializePaymentResponse,
} from '../../api/subscriptionApi';

interface SubscriptionState {
  plans: SubscriptionPlan[];
  currentSubscription: Subscription | null;
  usage: SubscriptionUsage | null;
  paystackPublicKey: string | null;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  plans: [],
  currentSubscription: null,
  usage: null,
  paystackPublicKey: null,
  isLoading: false,
  isInitializing: false,
  error: null,
};

// Async thunks
export const fetchPlans = createAsyncThunk(
  'subscription/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await subscriptionApi.getPlans();
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to fetch plans');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch plans');
    }
  }
);

export const fetchPaystackPublicKey = createAsyncThunk(
  'subscription/fetchPaystackPublicKey',
  async (_, { rejectWithValue }) => {
    try {
      const response = await subscriptionApi.getPaystackPublicKey();
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to fetch public key');
      }
      return response.data.publicKey;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch public key');
    }
  }
);

export const fetchSubscription = createAsyncThunk(
  'subscription/fetchSubscription',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await subscriptionApi.getSubscription(cooperativeId);
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to fetch subscription');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch subscription');
    }
  }
);

export const fetchUsage = createAsyncThunk(
  'subscription/fetchUsage',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await subscriptionApi.getUsage(cooperativeId);
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to fetch usage');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch usage');
    }
  }
);

export const initializeSubscription = createAsyncThunk(
  'subscription/initialize',
  async (
    params: {
      cooperativeId: string;
      planId: string;
      billingCycle?: 'monthly' | 'yearly';
      callbackUrl?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await subscriptionApi.initializeSubscription(params);
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to initialize subscription');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize subscription');
    }
  }
);

export const verifyPayment = createAsyncThunk(
  'subscription/verifyPayment',
  async (reference: string, { rejectWithValue }) => {
    try {
      const response = await subscriptionApi.verifyPayment(reference);
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to verify payment');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to verify payment');
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  'subscription/cancel',
  async (
    { cooperativeId, reason, cancelImmediately }: {
      cooperativeId: string;
      reason?: string;
      cancelImmediately?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await subscriptionApi.cancelSubscription(cooperativeId, {
        reason,
        cancelImmediately,
      });
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to cancel subscription');
      }
      return { cooperativeId };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel subscription');
    }
  }
);

export const checkLimit = createAsyncThunk(
  'subscription/checkLimit',
  async (
    { cooperativeId, limitType }: {
      cooperativeId: string;
      limitType: 'members' | 'contributionPlans' | 'groupBuys' | 'loans';
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await subscriptionApi.checkLimit(cooperativeId, limitType);
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to check limit');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check limit');
    }
  }
);

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSubscription: (state) => {
      state.currentSubscription = null;
      state.usage = null;
    },
    resetSubscription: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch plans
      .addCase(fetchPlans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans = action.payload;
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Paystack public key
      .addCase(fetchPaystackPublicKey.fulfilled, (state, action) => {
        state.paystackPublicKey = action.payload;
      })

      // Fetch subscription
      .addCase(fetchSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSubscription = action.payload;
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch usage
      .addCase(fetchUsage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUsage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.usage = action.payload;
      })
      .addCase(fetchUsage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Initialize subscription
      .addCase(initializeSubscription.pending, (state) => {
        state.isInitializing = true;
        state.error = null;
      })
      .addCase(initializeSubscription.fulfilled, (state, action) => {
        state.isInitializing = false;
        // If it's a free plan, the subscription is included
        if ('subscription' in action.payload) {
          state.currentSubscription = action.payload.subscription || null;
        }
      })
      .addCase(initializeSubscription.rejected, (state, action) => {
        state.isInitializing = false;
        state.error = action.payload as string;
      })

      // Verify payment
      .addCase(verifyPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSubscription = action.payload.subscription;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Cancel subscription
      .addCase(cancelSubscription.fulfilled, (state) => {
        if (state.currentSubscription) {
          state.currentSubscription.status = 'cancelled';
          state.currentSubscription.cancelledAt = new Date().toISOString();
        }
      });
  },
});

export const { clearError, clearSubscription, resetSubscription } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
