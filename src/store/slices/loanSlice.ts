import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LoanRequest, LoanRepayment, LoanType, LoanRepaymentSchedule } from '../../models';
import { loanApi, RequestLoanData, InitiateLoanData, ApproveLoanData, CreateLoanTypeData } from '../../api/loanApi';

interface LoanState {
  loans: LoanRequest[];
  currentLoan: LoanRequest | null;
  pendingLoans: LoanRequest[];
  repayments: LoanRepaymentSchedule[];
  repaymentSchedule: LoanRepaymentSchedule[];
  loanTypes: LoanType[];
  selectedLoanType: LoanType | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LoanState = {
  loans: [],
  currentLoan: null,
  pendingLoans: [],
  repayments: [],
  repaymentSchedule: [],
  loanTypes: [],
  selectedLoanType: null,
  isLoading: false,
  error: null,
};

// ==================== LOAN TYPES ====================

export const fetchLoanTypes = createAsyncThunk(
  'loan/fetchLoanTypes',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await loanApi.getLoanTypes(cooperativeId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createLoanType = createAsyncThunk(
  'loan/createLoanType',
  async ({ cooperativeId, data }: { cooperativeId: string; data: CreateLoanTypeData }, { rejectWithValue }) => {
    try {
      const response = await loanApi.createLoanType(cooperativeId, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateLoanType = createAsyncThunk(
  'loan/updateLoanType',
  async (
    { cooperativeId, loanTypeId, data }: { cooperativeId: string; loanTypeId: string; data: Partial<CreateLoanTypeData> },
    { rejectWithValue }
  ) => {
    try {
      const response = await loanApi.updateLoanType(cooperativeId, loanTypeId, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteLoanType = createAsyncThunk(
  'loan/deleteLoanType',
  async ({ cooperativeId, loanTypeId }: { cooperativeId: string; loanTypeId: string }, { rejectWithValue }) => {
    try {
      await loanApi.deleteLoanType(cooperativeId, loanTypeId);
      return loanTypeId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ==================== LOANS ====================

export const fetchLoans = createAsyncThunk(
  'loan/fetchAll',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await loanApi.getAll(cooperativeId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchLoan = createAsyncThunk(
  'loan/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await loanApi.getById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const requestLoan = createAsyncThunk(
  'loan/request',
  async (
    { cooperativeId, data }: { cooperativeId: string; data: RequestLoanData },
    { rejectWithValue }
  ) => {
    try {
      const response = await loanApi.request(cooperativeId, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const initiateLoan = createAsyncThunk(
  'loan/initiate',
  async (
    { cooperativeId, data }: { cooperativeId: string; data: InitiateLoanData },
    { rejectWithValue }
  ) => {
    try {
      const response = await loanApi.initiate(cooperativeId, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const approveLoan = createAsyncThunk(
  'loan/approve',
  async ({ loanId, data }: { loanId: string; data?: ApproveLoanData }, { rejectWithValue }) => {
    try {
      const response = await loanApi.approve(loanId, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const rejectLoan = createAsyncThunk(
  'loan/reject',
  async ({ loanId, reason }: { loanId: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await loanApi.reject(loanId, reason);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const reviewLoan = createAsyncThunk(
  'loan/review',
  async (
    { loanId, approved, reason }: { loanId: string; approved: boolean; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await loanApi.review(loanId, approved, reason);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const disburseLoan = createAsyncThunk(
  'loan/disburse',
  async (loanId: string, { rejectWithValue }) => {
    try {
      const response = await loanApi.disburse(loanId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchPendingLoans = createAsyncThunk(
  'loan/fetchPending',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await loanApi.getPending(cooperativeId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchRepaymentSchedule = createAsyncThunk(
  'loan/fetchRepaymentSchedule',
  async (loanId: string, { rejectWithValue }) => {
    try {
      const response = await loanApi.getRepayments(loanId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchRepayments = createAsyncThunk(
  'loan/fetchRepayments',
  async (loanId: string, { rejectWithValue }) => {
    try {
      const response = await loanApi.getRepayments(loanId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const recordRepayment = createAsyncThunk(
  'loan/recordRepayment',
  async (
    { loanId, amount, paymentMethod, paymentReference, notes }: {
      loanId: string;
      amount: number;
      paymentMethod?: string;
      paymentReference?: string;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await loanApi.recordRepayment(loanId, amount, paymentMethod, paymentReference, notes);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const loanSlice = createSlice({
  name: 'loan',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentLoan: (state, action: PayloadAction<LoanRequest | null>) => {
      state.currentLoan = action.payload;
    },
    setSelectedLoanType: (state, action: PayloadAction<LoanType | null>) => {
      state.selectedLoanType = action.payload;
    },
    resetLoan: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch loan types
      .addCase(fetchLoanTypes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLoanTypes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loanTypes = action.payload;
      })
      .addCase(fetchLoanTypes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create loan type
      .addCase(createLoanType.fulfilled, (state, action) => {
        state.loanTypes.push(action.payload);
      })
      // Update loan type
      .addCase(updateLoanType.fulfilled, (state, action) => {
        const index = state.loanTypes.findIndex((lt) => lt.id === action.payload.id);
        if (index !== -1) {
          state.loanTypes[index] = action.payload;
        }
        if (state.selectedLoanType?.id === action.payload.id) {
          state.selectedLoanType = action.payload;
        }
      })
      // Delete loan type
      .addCase(deleteLoanType.fulfilled, (state, action) => {
        state.loanTypes = state.loanTypes.filter((lt) => lt.id !== action.payload);
        if (state.selectedLoanType?.id === action.payload) {
          state.selectedLoanType = null;
        }
      })
      // Fetch all loans
      .addCase(fetchLoans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLoans.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loans = action.payload;
      })
      .addCase(fetchLoans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch single loan
      .addCase(fetchLoan.fulfilled, (state, action) => {
        state.currentLoan = action.payload;
      })
      // Request loan
      .addCase(requestLoan.fulfilled, (state, action) => {
        state.loans.push(action.payload);
        state.currentLoan = action.payload;
      })
      // Initiate loan (admin)
      .addCase(initiateLoan.fulfilled, (state, action) => {
        state.loans.push(action.payload);
        state.currentLoan = action.payload;
      })
      // Approve loan
      .addCase(approveLoan.fulfilled, (state, action) => {
        const loanIndex = state.loans.findIndex((l) => l.id === action.payload.id);
        if (loanIndex !== -1) {
          state.loans[loanIndex] = action.payload;
        }
        const pendingIndex = state.pendingLoans.findIndex((l) => l.id === action.payload.id);
        if (pendingIndex !== -1) {
          state.pendingLoans.splice(pendingIndex, 1);
        }
        state.currentLoan = action.payload;
      })
      // Reject loan
      .addCase(rejectLoan.fulfilled, (state, action) => {
        const loanIndex = state.loans.findIndex((l) => l.id === action.payload.id);
        if (loanIndex !== -1) {
          state.loans[loanIndex] = action.payload;
        }
        const pendingIndex = state.pendingLoans.findIndex((l) => l.id === action.payload.id);
        if (pendingIndex !== -1) {
          state.pendingLoans.splice(pendingIndex, 1);
        }
        state.currentLoan = action.payload;
      })
      // Review loan (legacy)
      .addCase(reviewLoan.fulfilled, (state, action) => {
        const loanIndex = state.loans.findIndex((l) => l.id === action.payload.id);
        if (loanIndex !== -1) {
          state.loans[loanIndex] = action.payload;
        }
        const pendingIndex = state.pendingLoans.findIndex((l) => l.id === action.payload.id);
        if (pendingIndex !== -1) {
          state.pendingLoans.splice(pendingIndex, 1);
        }
        state.currentLoan = action.payload;
      })
      // Fetch pending loans
      .addCase(fetchPendingLoans.fulfilled, (state, action) => {
        state.pendingLoans = action.payload;
      })
      // Fetch repayment schedule
      .addCase(fetchRepaymentSchedule.fulfilled, (state, action) => {
        state.repaymentSchedule = action.payload;
      })
      // Fetch repayments
      .addCase(fetchRepayments.fulfilled, (state, action) => {
        state.repayments = action.payload;
      })
      // Record repayment
      .addCase(recordRepayment.fulfilled, (state, action) => {
        // Update the loan in the list
        const loanIndex = state.loans.findIndex((l) => l.id === action.payload.id);
        if (loanIndex !== -1) {
          state.loans[loanIndex] = action.payload;
        }
        if (state.currentLoan?.id === action.payload.id) {
          state.currentLoan = action.payload;
        }
      });
  },
});

export const { clearError, setCurrentLoan, setSelectedLoanType, resetLoan } = loanSlice.actions;
export default loanSlice.reducer;
