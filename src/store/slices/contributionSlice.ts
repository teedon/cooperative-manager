import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ContributionPlan, ContributionPeriod, ContributionRecord, ContributionSubscription, ContributionPayment, DuePayment, PaymentSchedule } from '../../models';
import { contributionApi, CreateContributionPlanData, SubscribeData, UpdateSubscriptionData, RecordPaymentData, ApprovePaymentData } from '../../api/contributionApi';

interface ContributionState {
  plans: ContributionPlan[];
  currentPlan: ContributionPlan | null;
  mySubscriptions: ContributionSubscription[];
  planSubscriptions: ContributionSubscription[];
  periods: ContributionPeriod[];
  currentPeriod: ContributionPeriod | null;
  records: ContributionRecord[];
  pendingVerifications: ContributionRecord[];
  // Payment related state
  myPayments: ContributionPayment[];
  subscriptionPayments: ContributionPayment[];
  pendingPayments: ContributionPayment[];
  duePayments: DuePayment[];
  // Schedule related state
  mySchedules: PaymentSchedule[];
  subscriptionSchedules: PaymentSchedule[];
  overdueSchedules: PaymentSchedule[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ContributionState = {
  plans: [],
  currentPlan: null,
  mySubscriptions: [],
  planSubscriptions: [],
  periods: [],
  currentPeriod: null,
  records: [],
  pendingVerifications: [],
  // Payment related state
  myPayments: [],
  subscriptionPayments: [],
  pendingPayments: [],
  duePayments: [],
  // Schedule related state
  mySchedules: [],
  subscriptionSchedules: [],
  overdueSchedules: [],
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

export const fetchPlan = createAsyncThunk(
  'contribution/fetchPlan',
  async (planId: string, { rejectWithValue }) => {
    try {
      const response = await contributionApi.getPlan(planId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createPlan = createAsyncThunk(
  'contribution/createPlan',
  async (
    { cooperativeId, plan }: { cooperativeId: string; plan: CreateContributionPlanData },
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

export const updatePlan = createAsyncThunk(
  'contribution/updatePlan',
  async (
    { planId, plan }: { planId: string; plan: Partial<CreateContributionPlanData> },
    { rejectWithValue }
  ) => {
    try {
      const response = await contributionApi.updatePlan(planId, plan);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deletePlan = createAsyncThunk(
  'contribution/deletePlan',
  async (planId: string, { rejectWithValue }) => {
    try {
      await contributionApi.deletePlan(planId);
      return planId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Subscriptions
export const subscribeToPlan = createAsyncThunk(
  'contribution/subscribeToPlan',
  async (
    { planId, data }: { planId: string; data: SubscribeData },
    { rejectWithValue }
  ) => {
    try {
      const response = await contributionApi.subscribeToPlan(planId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateSubscription = createAsyncThunk(
  'contribution/updateSubscription',
  async (
    { subscriptionId, data }: { subscriptionId: string; data: UpdateSubscriptionData },
    { rejectWithValue }
  ) => {
    try {
      const response = await contributionApi.updateSubscription(subscriptionId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchMySubscriptions = createAsyncThunk(
  'contribution/fetchMySubscriptions',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await contributionApi.getMySubscriptions(cooperativeId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchPlanSubscriptions = createAsyncThunk(
  'contribution/fetchPlanSubscriptions',
  async (planId: string, { rejectWithValue }) => {
    try {
      const response = await contributionApi.getPlanSubscriptions(planId);
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

// ==================== PAYMENT THUNKS ====================

export const recordSubscriptionPayment = createAsyncThunk(
  'contribution/recordSubscriptionPayment',
  async (
    { subscriptionId, data }: { subscriptionId: string; data: RecordPaymentData },
    { rejectWithValue }
  ) => {
    try {
      const response = await contributionApi.recordSubscriptionPayment(subscriptionId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchSubscriptionPayments = createAsyncThunk(
  'contribution/fetchSubscriptionPayments',
  async (subscriptionId: string, { rejectWithValue }) => {
    try {
      const response = await contributionApi.getSubscriptionPayments(subscriptionId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchMyPayments = createAsyncThunk(
  'contribution/fetchMyPayments',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await contributionApi.getMyPayments(cooperativeId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchDuePayments = createAsyncThunk(
  'contribution/fetchDuePayments',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await contributionApi.getDuePayments(cooperativeId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchPendingPayments = createAsyncThunk(
  'contribution/fetchPendingPayments',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await contributionApi.getPendingPayments(cooperativeId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const approvePayment = createAsyncThunk(
  'contribution/approvePayment',
  async (
    { paymentId, data }: { paymentId: string; data: ApprovePaymentData },
    { rejectWithValue }
  ) => {
    try {
      const response = await contributionApi.approvePayment(paymentId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// ==================== SCHEDULE THUNKS ====================

export const fetchMySchedules = createAsyncThunk(
  'contribution/fetchMySchedules',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await contributionApi.getMySchedules(cooperativeId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchSubscriptionSchedules = createAsyncThunk(
  'contribution/fetchSubscriptionSchedules',
  async (subscriptionId: string, { rejectWithValue }) => {
    try {
      const response = await contributionApi.getSubscriptionSchedules(subscriptionId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchOverdueSchedules = createAsyncThunk(
  'contribution/fetchOverdueSchedules',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await contributionApi.getOverdueSchedules(cooperativeId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const recordSchedulePayment = createAsyncThunk(
  'contribution/recordSchedulePayment',
  async (
    { scheduleId, data }: { scheduleId: string; data: RecordPaymentData },
    { rejectWithValue }
  ) => {
    try {
      const response = await contributionApi.recordSchedulePayment(scheduleId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const extendSchedules = createAsyncThunk(
  'contribution/extendSchedules',
  async (subscriptionId: string, { rejectWithValue }) => {
    try {
      const response = await contributionApi.extendSchedules(subscriptionId);
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
    resetContribution: () => initialState,
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
      // Fetch single plan
      .addCase(fetchPlan.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPlan.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPlan = action.payload;
      })
      .addCase(fetchPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create plan
      .addCase(createPlan.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPlan.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans.push(action.payload);
        state.currentPlan = action.payload;
      })
      .addCase(createPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update plan
      .addCase(updatePlan.fulfilled, (state, action) => {
        const index = state.plans.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.plans[index] = action.payload;
        }
        if (state.currentPlan?.id === action.payload.id) {
          state.currentPlan = action.payload;
        }
      })
      // Delete plan
      .addCase(deletePlan.fulfilled, (state, action) => {
        state.plans = state.plans.filter((p) => p.id !== action.payload);
        if (state.currentPlan?.id === action.payload) {
          state.currentPlan = null;
        }
      })
      // Subscribe to plan
      .addCase(subscribeToPlan.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(subscribeToPlan.fulfilled, (state, action) => {
        state.isLoading = false;
        state.mySubscriptions.push(action.payload);
      })
      .addCase(subscribeToPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update subscription
      .addCase(updateSubscription.fulfilled, (state, action) => {
        const myIndex = state.mySubscriptions.findIndex((s) => s.id === action.payload.id);
        if (myIndex !== -1) {
          state.mySubscriptions[myIndex] = action.payload;
        }
        const planIndex = state.planSubscriptions.findIndex((s) => s.id === action.payload.id);
        if (planIndex !== -1) {
          state.planSubscriptions[planIndex] = action.payload;
        }
      })
      // Fetch my subscriptions
      .addCase(fetchMySubscriptions.fulfilled, (state, action) => {
        state.mySubscriptions = action.payload;
      })
      // Fetch plan subscriptions
      .addCase(fetchPlanSubscriptions.fulfilled, (state, action) => {
        state.planSubscriptions = action.payload;
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
      })
      // ==================== PAYMENT REDUCERS ====================
      // Record subscription payment
      .addCase(recordSubscriptionPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(recordSubscriptionPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscriptionPayments.unshift(action.payload);
        state.myPayments.unshift(action.payload);
      })
      .addCase(recordSubscriptionPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch subscription payments
      .addCase(fetchSubscriptionPayments.fulfilled, (state, action) => {
        state.subscriptionPayments = action.payload;
      })
      // Fetch my payments
      .addCase(fetchMyPayments.fulfilled, (state, action) => {
        state.myPayments = action.payload;
      })
      // Fetch due payments
      .addCase(fetchDuePayments.fulfilled, (state, action) => {
        state.duePayments = action.payload;
      })
      // Fetch pending payments (admin)
      .addCase(fetchPendingPayments.fulfilled, (state, action) => {
        state.pendingPayments = action.payload;
      })
      // Approve/reject payment
      .addCase(approvePayment.fulfilled, (state, action) => {
        // Remove from pending payments
        const index = state.pendingPayments.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.pendingPayments.splice(index, 1);
        }
        // Update in my payments if exists
        const myIndex = state.myPayments.findIndex((p) => p.id === action.payload.id);
        if (myIndex !== -1) {
          state.myPayments[myIndex] = action.payload;
        }
        // Update in subscription payments if exists
        const subIndex = state.subscriptionPayments.findIndex((p) => p.id === action.payload.id);
        if (subIndex !== -1) {
          state.subscriptionPayments[subIndex] = action.payload;
        }
      })
      // ==================== SCHEDULE REDUCERS ====================
      // Fetch my schedules
      .addCase(fetchMySchedules.fulfilled, (state, action) => {
        state.mySchedules = action.payload;
      })
      // Fetch subscription schedules
      .addCase(fetchSubscriptionSchedules.fulfilled, (state, action) => {
        state.subscriptionSchedules = action.payload;
      })
      // Fetch overdue schedules (admin)
      .addCase(fetchOverdueSchedules.fulfilled, (state, action) => {
        state.overdueSchedules = action.payload;
      })
      // Record schedule payment
      .addCase(recordSchedulePayment.fulfilled, (state, action) => {
        // Find and update the schedule status
        const scheduleIndex = state.subscriptionSchedules.findIndex(
          (s) => s.paymentId === action.payload.id
        );
        if (scheduleIndex !== -1) {
          // Payment is pending approval, schedule status will update on approval
        }
        // Add to my payments
        state.myPayments.unshift(action.payload);
      });
  },
});

export const { clearError, setCurrentPlan, setCurrentPeriod, resetContribution } = contributionSlice.actions;
export default contributionSlice.reducer;
