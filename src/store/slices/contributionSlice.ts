import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ContributionPlan, ContributionPeriod, ContributionRecord } from '../../models';
import { contributionApi } from '../../api/contributionApi';

interface ContributionState {
  plans: ContributionPlan[];
  currentPlan: ContributionPlan | null;
  periods: ContributionPeriod[];
  currentPeriod: ContributionPeriod | null;
  records: ContributionRecord[];
  pendingVerifications: ContributionRecord[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ContributionState = {
  plans: [],
  currentPlan: null,
  periods: [],
  currentPeriod: null,
  records: [],
  pendingVerifications: [],
  isLoading: false,
  error: null,
};

export const fetchPlans = createAsyncThunk(
  'contribution/fetchPlans',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await contributionApi.getPlans(cooperativeId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createPlan = createAsyncThunk(
  'contribution/createPlan',
  async (
    { cooperativeId, plan }: { cooperativeId: string; plan: Partial<ContributionPlan> },
    { rejectWithValue }
  ) => {
    try {
      const response = await contributionApi.createPlan(cooperativeId, plan);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchPeriods = createAsyncThunk(
  'contribution/fetchPeriods',
  async (planId: string, { rejectWithValue }) => {
    try {
      const response = await contributionApi.getPeriods(planId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const recordPayment = createAsyncThunk(
  'contribution/recordPayment',
  async (
    { periodId, record }: { periodId: string; record: Partial<ContributionRecord> },
    { rejectWithValue }
  ) => {
    try {
      const response = await contributionApi.recordPayment(periodId, record);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const verifyPayment = createAsyncThunk(
  'contribution/verifyPayment',
  async (
    { recordId, approved, reason }: { recordId: string; approved: boolean; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await contributionApi.verifyPayment(recordId, approved, reason);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchPendingVerifications = createAsyncThunk(
  'contribution/fetchPending',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await contributionApi.getPendingVerifications(cooperativeId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const contributionSlice = createSlice({
  name: 'contribution',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPlan: (state, action: PayloadAction<ContributionPlan | null>) => {
      state.currentPlan = action.payload;
    },
    setCurrentPeriod: (state, action: PayloadAction<ContributionPeriod | null>) => {
      state.currentPeriod = action.payload;
    },
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
      // Create plan
      .addCase(createPlan.fulfilled, (state, action) => {
        state.plans.push(action.payload);
        state.currentPlan = action.payload;
      })
      // Fetch periods
      .addCase(fetchPeriods.fulfilled, (state, action) => {
        state.periods = action.payload;
      })
      // Record payment
      .addCase(recordPayment.fulfilled, (state, action) => {
        state.records.push(action.payload);
      })
      // Verify payment
      .addCase(verifyPayment.fulfilled, (state, action) => {
        const index = state.pendingVerifications.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.pendingVerifications.splice(index, 1);
        }
      })
      // Fetch pending verifications
      .addCase(fetchPendingVerifications.fulfilled, (state, action) => {
        state.pendingVerifications = action.payload;
      });
  },
});

export const { clearError, setCurrentPlan, setCurrentPeriod } = contributionSlice.actions;
export default contributionSlice.reducer;
