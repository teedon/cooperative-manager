import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LoanRequest, LoanRepayment } from '../../models';
import { loanApi } from '../../api/loanApi';

interface LoanState {
  loans: LoanRequest[];
  currentLoan: LoanRequest | null;
  pendingLoans: LoanRequest[];
  repayments: LoanRepayment[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LoanState = {
  loans: [],
  currentLoan: null,
  pendingLoans: [],
  repayments: [],
  isLoading: false,
  error: null,
};

export const fetchLoans = createAsyncThunk(
  'loan/fetchAll',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await loanApi.getAll(cooperativeId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchLoan = createAsyncThunk(
  'loan/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await loanApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const requestLoan = createAsyncThunk(
  'loan/request',
  async (
    { cooperativeId, loan }: { cooperativeId: string; loan: Partial<LoanRequest> },
    { rejectWithValue }
  ) => {
    try {
      const response = await loanApi.request(cooperativeId, loan);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
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
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchPendingLoans = createAsyncThunk(
  'loan/fetchPending',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await loanApi.getPending(cooperativeId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchRepayments = createAsyncThunk(
  'loan/fetchRepayments',
  async (loanId: string, { rejectWithValue }) => {
    try {
      const response = await loanApi.getRepayments(loanId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
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
    resetLoan: () => initialState,
  },
  extraReducers: (builder) => {
    builder
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
      // Review loan
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
      // Fetch repayments
      .addCase(fetchRepayments.fulfilled, (state, action) => {
        state.repayments = action.payload;
      });
  },
});

export const { clearError, setCurrentLoan, resetLoan } = loanSlice.actions;
export default loanSlice.reducer;
