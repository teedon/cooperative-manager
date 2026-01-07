import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { pollsApi, Poll, CreatePollData, GetPollsQuery } from '../../api/pollsApi';
import { getThunkErrorMessage } from '../../utils/errorHandler';

interface PollsState {
  polls: Poll[];
  currentPoll: Poll | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: PollsState = {
  polls: [],
  currentPoll: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

// Thunks
export const fetchPolls = createAsyncThunk(
  'polls/fetchPolls',
  async ({ cooperativeId, query }: { cooperativeId: string; query?: GetPollsQuery }, { rejectWithValue }) => {
    try {
      const response = await pollsApi.getAll(cooperativeId, query);
      return response;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const fetchPollById = createAsyncThunk(
  'polls/fetchPollById',
  async (pollId: string, { rejectWithValue }) => {
    try {
      const response = await pollsApi.getById(pollId);
      return response.data;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const createPoll = createAsyncThunk(
  'polls/createPoll',
  async (data: CreatePollData, { rejectWithValue }) => {
    try {
      const response = await pollsApi.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const votePoll = createAsyncThunk(
  'polls/votePoll',
  async ({ pollId, optionId }: { pollId: string; optionId: string }, { rejectWithValue }) => {
    try {
      const response = await pollsApi.vote(pollId, optionId);
      return response.data;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const closePoll = createAsyncThunk(
  'polls/closePoll',
  async (pollId: string, { rejectWithValue }) => {
    try {
      const response = await pollsApi.close(pollId);
      return response.data;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const pinPoll = createAsyncThunk(
  'polls/pinPoll',
  async (pollId: string, { rejectWithValue }) => {
    try {
      const response = await pollsApi.pin(pollId);
      return response.data;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const unpinPoll = createAsyncThunk(
  'polls/unpinPoll',
  async (pollId: string, { rejectWithValue }) => {
    try {
      const response = await pollsApi.unpin(pollId);
      return response.data;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const deletePoll = createAsyncThunk(
  'polls/deletePoll',
  async (pollId: string, { rejectWithValue }) => {
    try {
      await pollsApi.delete(pollId);
      return pollId;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

const pollsSlice = createSlice({
  name: 'polls',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPoll: (state) => {
      state.currentPoll = null;
    },
    updatePollInList: (state, action: PayloadAction<Poll>) => {
      const index = state.polls.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.polls[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch polls
    builder
      .addCase(fetchPolls.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPolls.fulfilled, (state, action) => {
        state.isLoading = false;
        state.polls = action.payload.polls;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPolls.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch poll by ID
    builder
      .addCase(fetchPollById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPollById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPoll = action.payload;
      })
      .addCase(fetchPollById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create poll
    builder
      .addCase(createPoll.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPoll.fulfilled, (state, action) => {
        state.isLoading = false;
        state.polls.unshift(action.payload);
      })
      .addCase(createPoll.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Vote poll
    builder
      .addCase(votePoll.pending, (state) => {
        state.error = null;
      })
      .addCase(votePoll.fulfilled, (state, action) => {
        // Update poll in list
        const index = state.polls.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.polls[index] = action.payload;
        }
        // Update current poll if it's the same
        if (state.currentPoll?.id === action.payload.id) {
          state.currentPoll = action.payload;
        }
      })
      .addCase(votePoll.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Close poll
    builder
      .addCase(closePoll.fulfilled, (state, action) => {
        const index = state.polls.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.polls[index] = action.payload;
        }
        if (state.currentPoll?.id === action.payload.id) {
          state.currentPoll = action.payload;
        }
      });

    // Pin poll
    builder
      .addCase(pinPoll.fulfilled, (state, action) => {
        const index = state.polls.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.polls[index] = action.payload;
        }
      });

    // Unpin poll
    builder
      .addCase(unpinPoll.fulfilled, (state, action) => {
        const index = state.polls.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.polls[index] = action.payload;
        }
      });

    // Delete poll
    builder
      .addCase(deletePoll.fulfilled, (state, action) => {
        state.polls = state.polls.filter((p) => p.id !== action.payload);
        if (state.currentPoll?.id === action.payload) {
          state.currentPoll = null;
        }
      });
  },
});

export const { clearError, clearCurrentPoll, updatePollInList } = pollsSlice.actions;
export default pollsSlice.reducer;
