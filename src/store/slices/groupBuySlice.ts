import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GroupBuy, GroupBuyOrder } from '../../models';
import { groupBuyApi } from '../../api/groupBuyApi';

interface GroupBuyState {
  groupBuys: GroupBuy[];
  currentGroupBuy: GroupBuy | null;
  orders: GroupBuyOrder[];
  myOrders: GroupBuyOrder[];
  isLoading: boolean;
  error: string | null;
}

const initialState: GroupBuyState = {
  groupBuys: [],
  currentGroupBuy: null,
  orders: [],
  myOrders: [],
  isLoading: false,
  error: null,
};

export const fetchGroupBuys = createAsyncThunk(
  'groupBuy/fetchAll',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await groupBuyApi.getAll(cooperativeId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchGroupBuy = createAsyncThunk(
  'groupBuy/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await groupBuyApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createGroupBuy = createAsyncThunk(
  'groupBuy/create',
  async (
    { cooperativeId, groupBuy }: { cooperativeId: string; groupBuy: Partial<GroupBuy> },
    { rejectWithValue }
  ) => {
    try {
      const response = await groupBuyApi.create(cooperativeId, groupBuy);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const indicateInterest = createAsyncThunk(
  'groupBuy/indicateInterest',
  async (
    { groupBuyId, quantity }: { groupBuyId: string; quantity: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await groupBuyApi.indicateInterest(groupBuyId, quantity);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const finalizeGroupBuy = createAsyncThunk(
  'groupBuy/finalize',
  async (groupBuyId: string, { rejectWithValue }) => {
    try {
      const response = await groupBuyApi.finalize(groupBuyId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchOrders = createAsyncThunk(
  'groupBuy/fetchOrders',
  async (groupBuyId: string, { rejectWithValue }) => {
    try {
      const response = await groupBuyApi.getOrders(groupBuyId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const groupBuySlice = createSlice({
  name: 'groupBuy',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentGroupBuy: (state, action: PayloadAction<GroupBuy | null>) => {
      state.currentGroupBuy = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all group buys
      .addCase(fetchGroupBuys.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGroupBuys.fulfilled, (state, action) => {
        state.isLoading = false;
        state.groupBuys = action.payload;
      })
      .addCase(fetchGroupBuys.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch single group buy
      .addCase(fetchGroupBuy.fulfilled, (state, action) => {
        state.currentGroupBuy = action.payload;
      })
      // Create group buy
      .addCase(createGroupBuy.fulfilled, (state, action) => {
        state.groupBuys.push(action.payload);
        state.currentGroupBuy = action.payload;
      })
      // Indicate interest
      .addCase(indicateInterest.fulfilled, (state, action) => {
        state.myOrders.push(action.payload);
      })
      // Finalize
      .addCase(finalizeGroupBuy.fulfilled, (state, action) => {
        const index = state.groupBuys.findIndex((g) => g.id === action.payload.id);
        if (index !== -1) {
          state.groupBuys[index] = action.payload;
        }
        state.currentGroupBuy = action.payload;
      })
      // Fetch orders
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
      });
  },
});

export const { clearError, setCurrentGroupBuy } = groupBuySlice.actions;
export default groupBuySlice.reducer;
