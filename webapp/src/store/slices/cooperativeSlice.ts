import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { cooperativeApi } from '../../api/cooperativeApi';
import type { Cooperative, Member, CreateCooperativeData, JoinCooperativeData } from '../../api/cooperativeApi';

interface CooperativeState {
  cooperatives: Cooperative[];
  currentCooperative: Cooperative | null;
  currentMembership: Member | null;
  members: Member[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CooperativeState = {
  cooperatives: [],
  currentCooperative: null,
  currentMembership: null,
  members: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchCooperatives = createAsyncThunk(
  'cooperative/fetchCooperatives',
  async (_, { rejectWithValue }) => {
    try {
      const cooperatives = await cooperativeApi.getAll();
      return cooperatives;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cooperatives');
    }
  }
);

export const fetchCooperativeById = createAsyncThunk(
  'cooperative/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const cooperative = await cooperativeApi.getById(id);
      return cooperative;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cooperative');
    }
  }
);

export const createCooperative = createAsyncThunk(
  'cooperative/create',
  async (data: CreateCooperativeData, { rejectWithValue }) => {
    try {
      const cooperative = await cooperativeApi.create(data);
      return cooperative;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create cooperative');
    }
  }
);

export const joinCooperative = createAsyncThunk(
  'cooperative/join',
  async (data: JoinCooperativeData, { rejectWithValue }) => {
    try {
      const result = await cooperativeApi.join(data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join cooperative');
    }
  }
);

export const fetchMembers = createAsyncThunk(
  'cooperative/fetchMembers',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const members = await cooperativeApi.getMembers(cooperativeId);
      return members;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch members');
    }
  }
);

export const fetchMyMembership = createAsyncThunk(
  'cooperative/fetchMyMembership',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const membership = await cooperativeApi.getMyMembership(cooperativeId);
      return membership;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch membership');
    }
  }
);

const cooperativeSlice = createSlice({
  name: 'cooperative',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentCooperative: (state, action: PayloadAction<Cooperative | null>) => {
      state.currentCooperative = action.payload;
    },
    clearCurrentCooperative: (state) => {
      state.currentCooperative = null;
      state.currentMembership = null;
      state.members = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch cooperatives
    builder
      .addCase(fetchCooperatives.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCooperatives.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cooperatives = action.payload;
      })
      .addCase(fetchCooperatives.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch cooperative by ID
    builder
      .addCase(fetchCooperativeById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCooperativeById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCooperative = action.payload;
      })
      .addCase(fetchCooperativeById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create cooperative
    builder
      .addCase(createCooperative.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCooperative.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cooperatives.push(action.payload);
        state.currentCooperative = action.payload;
      })
      .addCase(createCooperative.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Join cooperative
    builder
      .addCase(joinCooperative.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinCooperative.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cooperatives.push(action.payload.cooperative);
        state.currentCooperative = action.payload.cooperative;
        state.currentMembership = action.payload.member;
      })
      .addCase(joinCooperative.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch members
    builder
      .addCase(fetchMembers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.members = action.payload;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch my membership
    builder
      .addCase(fetchMyMembership.fulfilled, (state, action) => {
        state.currentMembership = action.payload;
      });
  },
});

export const { clearError, setCurrentCooperative, clearCurrentCooperative } = cooperativeSlice.actions;
export default cooperativeSlice.reducer;
