import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Cooperative, CooperativeMember } from '../../models';
import { cooperativeApi, UpdateCooperativeData } from '../../api/cooperativeApi';
import logger from '../../utils/logger';

interface CooperativeState {
  cooperatives: Cooperative[];
  currentCooperative: Cooperative | null;
  members: CooperativeMember[];
  pendingMembers: CooperativeMember[];
  currentMember: CooperativeMember | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CooperativeState = {
  cooperatives: [],
  currentCooperative: null,
  members: [],
  pendingMembers: [],
  currentMember: null,
  isLoading: false,
  error: null,
};

export const fetchCooperatives = createAsyncThunk(
  'cooperative/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cooperativeApi.getAll();
      if (!response || !response.success) {
        return rejectWithValue(response?.message || 'Failed to fetch cooperatives');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch cooperatives');
    }
  }
);

export const fetchCooperative = createAsyncThunk(
  'cooperative/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await cooperativeApi.getById(id);
      if (!response || !response.success) {
        return rejectWithValue(response?.message || 'Failed to fetch cooperative');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch cooperative');
    }
  }
);

export const createCooperative = createAsyncThunk(
  'cooperative/create',
  async (data: Partial<Cooperative>, { rejectWithValue }) => {
    const op = 'store.cooperative.create';
    logger.info(op, 'dispatch', { payload: data });
    try {
      const requestId = `ui-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      logger.debug(op, 'requestId', { requestId });
      const response = await cooperativeApi.create(data, requestId);
      logger.info(op, 'fulfilled', { cooperativeId: response.data?.id, requestId });
      return response.data;
    } catch (error: any) {
      logger.error(op, 'rejected', { message: error?.message, payload: data, response: error?.response?.data });
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateCooperative = createAsyncThunk(
  'cooperative/update',
  async ({ id, data }: { id: string; data: UpdateCooperativeData }, { rejectWithValue }) => {
    const op = 'store.cooperative.update';
    logger.info(op, 'dispatch', { id, payload: data });
    try {
      const response = await cooperativeApi.update(id, data);
      if (!response || !response.success) {
        return rejectWithValue(response?.message || 'Failed to update cooperative');
      }
      logger.info(op, 'fulfilled', { cooperativeId: response.data?.id });
      return response.data;
    } catch (error: any) {
      logger.error(op, 'rejected', { message: error?.message, id, payload: data, response: error?.response?.data });
      return rejectWithValue(error?.response?.data?.message || error?.message || 'Failed to update cooperative');
    }
  }
);

export const fetchMembers = createAsyncThunk(
  'cooperative/fetchMembers',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await cooperativeApi.getMembers(cooperativeId);
      if (!response || !response.success) {
        return rejectWithValue(response?.message || 'Failed to fetch members');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch members');
    }
  }
);

export const joinCooperativeByCode = createAsyncThunk(
  'cooperative/joinByCode',
  async (code: string, { rejectWithValue }) => {
    try {
      const response = await cooperativeApi.joinByCode(code);
      if (!response || !response.success) {
        return rejectWithValue(response?.message || 'Failed to join cooperative');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to join cooperative');
    }
  }
);

export const fetchPendingMembers = createAsyncThunk(
  'cooperative/fetchPendingMembers',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await cooperativeApi.getPendingMembers(cooperativeId);
      if (!response || !response.success) {
        return rejectWithValue(response?.message || 'Failed to fetch pending members');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch pending members');
    }
  }
);

export const approveMember = createAsyncThunk(
  'cooperative/approveMember',
  async (memberId: string, { rejectWithValue }) => {
    try {
      const response = await cooperativeApi.approveMember(memberId);
      if (!response || !response.success) {
        return rejectWithValue(response?.message || 'Failed to approve member');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to approve member');
    }
  }
);

export const rejectMember = createAsyncThunk(
  'cooperative/rejectMember',
  async (memberId: string, { rejectWithValue }) => {
    try {
      const response = await cooperativeApi.rejectMember(memberId);
      return { memberId };
    } catch (error) {
      return rejectWithValue((error as Error).message);
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
    setCurrentMember: (state, action: PayloadAction<CooperativeMember | null>) => {
      state.currentMember = action.payload;
    },
    resetCooperative: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch all cooperatives
      .addCase(fetchCooperatives.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCooperatives.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cooperatives = action.payload || [];
      })
      .addCase(fetchCooperatives.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch single cooperative
      .addCase(fetchCooperative.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCooperative.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCooperative = action.payload;
      })
      .addCase(fetchCooperative.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create cooperative
      .addCase(createCooperative.fulfilled, (state, action) => {
        if (!state.cooperatives) {
          state.cooperatives = [];
        }
        state.cooperatives.push(action.payload);
        state.currentCooperative = action.payload;
      })
      // Update cooperative
      .addCase(updateCooperative.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCooperative.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCooperative = action.payload;
        // Also update in the cooperatives list
        const index = state.cooperatives.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.cooperatives[index] = action.payload;
        }
      })
      .addCase(updateCooperative.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch members
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.members = action.payload;
      })
      // Join cooperative by code
      .addCase(joinCooperativeByCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinCooperativeByCode.fulfilled, (state, action) => {
        state.isLoading = false;
        // Note: The user joins with 'pending' status, so we don't add the cooperative
        // to the list yet. They need to be approved by an admin first.
        // The cooperative will appear in their list after approval and they refetch.
      })
      .addCase(joinCooperativeByCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch pending members
      .addCase(fetchPendingMembers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPendingMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingMembers = action.payload;
      })
      .addCase(fetchPendingMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Approve member
      .addCase(approveMember.fulfilled, (state, action) => {
        // Remove from pending and add to members
        const index = state.pendingMembers.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) {
          state.pendingMembers.splice(index, 1);
        }
        state.members.push(action.payload);
      })
      // Reject member
      .addCase(rejectMember.fulfilled, (state, action) => {
        // Remove from pending
        const index = state.pendingMembers.findIndex((m) => m.id === action.payload.memberId);
        if (index !== -1) {
          state.pendingMembers.splice(index, 1);
        }
      });
  },
});

export const { clearError, setCurrentCooperative, setCurrentMember, resetCooperative } = cooperativeSlice.actions;
export default cooperativeSlice.reducer;
