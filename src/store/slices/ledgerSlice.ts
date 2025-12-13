import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { LedgerEntry, VirtualBalance } from '../../models';
import { ledgerApi } from '../../api/ledgerApi';

interface LedgerState {
  entries: LedgerEntry[];
  virtualBalance: VirtualBalance | null;
  memberBalances: VirtualBalance[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LedgerState = {
  entries: [],
  virtualBalance: null,
  memberBalances: [],
  isLoading: false,
  error: null,
};

export const fetchLedger = createAsyncThunk(
  'ledger/fetch',
  async (
    { cooperativeId, memberId }: { cooperativeId: string; memberId?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await ledgerApi.getEntries(cooperativeId, memberId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchVirtualBalance = createAsyncThunk(
  'ledger/fetchBalance',
  async (
    { cooperativeId, memberId }: { cooperativeId: string; memberId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await ledgerApi.getVirtualBalance(cooperativeId, memberId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchAllMemberBalances = createAsyncThunk(
  'ledger/fetchAllBalances',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await ledgerApi.getAllBalances(cooperativeId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const ledgerSlice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearLedger: (state) => {
      state.entries = [];
      state.virtualBalance = null;
    },
    resetLedger: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch ledger entries
      .addCase(fetchLedger.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLedger.fulfilled, (state, action) => {
        state.isLoading = false;
        state.entries = action.payload;
      })
      .addCase(fetchLedger.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch virtual balance
      .addCase(fetchVirtualBalance.fulfilled, (state, action) => {
        state.virtualBalance = action.payload;
      })
      // Fetch all member balances
      .addCase(fetchAllMemberBalances.fulfilled, (state, action) => {
        state.memberBalances = action.payload;
      });
  },
});

export const { clearError, clearLedger, resetLedger } = ledgerSlice.actions;
export default ledgerSlice.reducer;
