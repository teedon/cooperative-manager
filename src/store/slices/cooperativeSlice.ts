import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Cooperative, CooperativeMember } from '../../models';
import { cooperativeApi } from '../../api/cooperativeApi';
import logger from '../../utils/logger';

interface CooperativeState {
  cooperatives: Cooperative[];
  currentCooperative: Cooperative | null;
  members: CooperativeMember[];
  currentMember: CooperativeMember | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CooperativeState = {
  cooperatives: [],
  currentCooperative: null,
  members: [],
  currentMember: null,
  isLoading: false,
  error: null,
};

export const fetchCooperatives = createAsyncThunk(
  'cooperative/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cooperativeApi.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchCooperative = createAsyncThunk(
  'cooperative/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await cooperativeApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
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

export const fetchMembers = createAsyncThunk(
  'cooperative/fetchMembers',
  async (cooperativeId: string, { rejectWithValue }) => {
    try {
      const response = await cooperativeApi.getMembers(cooperativeId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const joinCooperativeByCode = createAsyncThunk(
  'cooperative/joinByCode',
  async (code: string, { rejectWithValue }) => {
    try {
      const response = await cooperativeApi.joinByCode(code);
      return response.data;
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
        state.cooperatives = action.payload;
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
        state.cooperatives.push(action.payload);
        state.currentCooperative = action.payload;
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
        state.cooperatives.push(action.payload);
      })
      .addCase(joinCooperativeByCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentCooperative, setCurrentMember } = cooperativeSlice.actions;
export default cooperativeSlice.reducer;
