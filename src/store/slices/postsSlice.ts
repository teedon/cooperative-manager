import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Post,
  Comment,
  PostsState,
  ReactionType,
} from '../../models';
import {
  postsApi,
  CreatePostData,
  UpdatePostData,
  CreateCommentData,
  AddReactionData,
  GetPostsQuery,
} from '../../api/postsApi';
import { getThunkErrorMessage } from '../../utils/errorHandler';

const initialState: PostsState = {
  posts: [],
  currentPost: null,
  comments: [],
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
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async ({ cooperativeId, query }: { cooperativeId: string; query?: GetPostsQuery }, { rejectWithValue }) => {
    try {
      const response = await postsApi.getAll(cooperativeId, query);
      return response;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const fetchPostById = createAsyncThunk(
  'posts/fetchPostById',
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await postsApi.getById(postId);
      return response.data;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (data: CreatePostData, { rejectWithValue }) => {
    try {
      const response = await postsApi.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ id, data }: { id: string; data: UpdatePostData }, { rejectWithValue }) => {
    try {
      const response = await postsApi.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (id: string, { rejectWithValue }) => {
    try {
      await postsApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const pinPost = createAsyncThunk(
  'posts/pinPost',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await postsApi.pin(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const unpinPost = createAsyncThunk(
  'posts/unpinPost',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await postsApi.unpin(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const approvePost = createAsyncThunk(
  'posts/approvePost',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await postsApi.approve(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const addReaction = createAsyncThunk(
  'posts/addReaction',
  async ({ postId, reactionType }: { postId: string; reactionType: ReactionType }, { rejectWithValue }) => {
    try {
      const response = await postsApi.addReaction(postId, { reactionType });
      return { postId, reactionType };
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const removeReaction = createAsyncThunk(
  'posts/removeReaction',
  async (postId: string, { rejectWithValue }) => {
    try {
      await postsApi.removeReaction(postId);
      return postId;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ postId, data }: { postId: string; data: CreateCommentData }, { rejectWithValue }) => {
    try {
      const response = await postsApi.addComment(postId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const fetchComments = createAsyncThunk(
  'posts/fetchComments',
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await postsApi.getComments(postId);
      return response.data;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const deleteComment = createAsyncThunk(
  'posts/deleteComment',
  async (commentId: string, { rejectWithValue }) => {
    try {
      await postsApi.deleteComment(commentId);
      return commentId;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const addCommentReaction = createAsyncThunk(
  'posts/addCommentReaction',
  async ({ commentId, reactionType }: { commentId: string; reactionType: ReactionType }, { rejectWithValue }) => {
    try {
      await postsApi.addCommentReaction(commentId, { reactionType });
      return { commentId, reactionType };
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const removeCommentReaction = createAsyncThunk(
  'posts/removeCommentReaction',
  async (commentId: string, { rejectWithValue }) => {
    try {
      await postsApi.removeCommentReaction(commentId);
      return commentId;
    } catch (error) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
      state.comments = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch posts
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload.posts;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch post by ID
    builder
      .addCase(fetchPostById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPost = action.payload;
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create post
    builder
      .addCase(createPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update post
    builder
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = { ...state.posts[index], ...action.payload };
        }
        if (state.currentPost?.id === action.payload.id) {
          state.currentPost = { ...state.currentPost, ...action.payload };
        }
      });

    // Delete post
    builder
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p.id !== action.payload);
        if (state.currentPost?.id === action.payload) {
          state.currentPost = null;
        }
      });

    // Pin post
    builder
      .addCase(pinPost.fulfilled, (state, action) => {
        const index = state.posts.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
      });

    // Unpin post
    builder
      .addCase(unpinPost.fulfilled, (state, action) => {
        const index = state.posts.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
      });

    // Approve post
    builder
      .addCase(approvePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
      });

    // Add reaction
    builder
      .addCase(addReaction.fulfilled, (state, action) => {
        const { postId, reactionType } = action.payload;
        const post = state.posts.find((p) => p.id === postId);
        if (post) {
          post.userReaction = reactionType;
          if (!post.reactionCounts) {
            post.reactionCounts = {} as Record<ReactionType, number>;
          }
          post.reactionCounts[reactionType] = (post.reactionCounts[reactionType] || 0) + 1;
        }
        if (state.currentPost?.id === postId) {
          state.currentPost.userReaction = reactionType;
          if (!state.currentPost.reactionCounts) {
            state.currentPost.reactionCounts = {} as Record<ReactionType, number>;
          }
          state.currentPost.reactionCounts[reactionType] = 
            (state.currentPost.reactionCounts[reactionType] || 0) + 1;
        }
      });

    // Remove reaction
    builder
      .addCase(removeReaction.fulfilled, (state, action) => {
        const postId = action.payload;
        const post = state.posts.find((p) => p.id === postId);
        if (post && post.userReaction) {
          const reactionType = post.userReaction;
          if (post.reactionCounts[reactionType]) {
            post.reactionCounts[reactionType] = Math.max(0, post.reactionCounts[reactionType] - 1);
          }
          post.userReaction = null;
        }
        if (state.currentPost?.id === postId && state.currentPost.userReaction) {
          const reactionType = state.currentPost.userReaction;
          if (state.currentPost.reactionCounts[reactionType]) {
            state.currentPost.reactionCounts[reactionType] = 
              Math.max(0, state.currentPost.reactionCounts[reactionType] - 1);
          }
          state.currentPost.userReaction = null;
        }
      });

    // Fetch comments
    builder
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.comments = action.payload;
      });

    // Add comment
    builder
      .addCase(addComment.fulfilled, (state, action) => {
        state.comments.unshift(action.payload);
      });

    // Delete comment
    builder
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.comments = state.comments.filter((c) => c.id !== action.payload);
      });
  },
});

export const { clearError, clearCurrentPost } = postsSlice.actions;
export default postsSlice.reducer;
