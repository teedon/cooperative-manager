import apiClient from './client';
import { Post, Comment, Reaction, ApiResponse, ReactionType, PostType } from '../models';

export interface CreatePostData {
  cooperativeId: string;
  title?: string;
  content: string;
  imageUrl?: string;
  postType?: PostType;
  requiresApproval?: boolean;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  imageUrl?: string;
}

export interface CreateCommentData {
  content: string;
  parentCommentId?: string;
}

export interface AddReactionData {
  reactionType: ReactionType;
}

export interface GetPostsQuery {
  page?: number;
  limit?: number;
  search?: string;
  includeUnpinned?: boolean;
}

export interface PostsResponse {
  success: boolean;
  message?: string;
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const postsApi = {
  // Posts
  create: async (data: CreatePostData): Promise<ApiResponse<Post>> => {
    const response = await apiClient.post<ApiResponse<Post>>('/posts', data);
    return response.data;
  },

  getAll: async (cooperativeId: string, query?: GetPostsQuery): Promise<PostsResponse> => {
    const response = await apiClient.get<PostsResponse>(`/posts/cooperative/${cooperativeId}`, {
      params: query,
    });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Post>> => {
    const response = await apiClient.get<ApiResponse<Post>>(`/posts/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdatePostData): Promise<ApiResponse<Post>> => {
    const response = await apiClient.put<ApiResponse<Post>>(`/posts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete<ApiResponse<any>>(`/posts/${id}`);
    return response.data;
  },

  pin: async (id: string): Promise<ApiResponse<Post>> => {
    const response = await apiClient.post<ApiResponse<Post>>(`/posts/${id}/pin`);
    return response.data;
  },

  unpin: async (id: string): Promise<ApiResponse<Post>> => {
    const response = await apiClient.post<ApiResponse<Post>>(`/posts/${id}/unpin`);
    return response.data;
  },

  approve: async (id: string): Promise<ApiResponse<Post>> => {
    const response = await apiClient.post<ApiResponse<Post>>(`/posts/${id}/approve`);
    return response.data;
  },

  // Reactions
  addReaction: async (postId: string, data: AddReactionData): Promise<ApiResponse<Reaction>> => {
    const response = await apiClient.post<ApiResponse<Reaction>>(
      `/posts/${postId}/reactions`,
      data,
    );
    return response.data;
  },

  removeReaction: async (postId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete<ApiResponse<any>>(`/posts/${postId}/reactions`);
    return response.data;
  },

  // Comments
  addComment: async (postId: string, data: CreateCommentData): Promise<ApiResponse<Comment>> => {
    const response = await apiClient.post<ApiResponse<Comment>>(`/posts/${postId}/comments`, data);
    return response.data;
  },

  getComments: async (postId: string): Promise<ApiResponse<Comment[]>> => {
    const response = await apiClient.get<ApiResponse<Comment[]>>(`/posts/${postId}/comments`);
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete<ApiResponse<any>>(`/posts/comments/${commentId}`);
    return response.data;
  },

  addCommentReaction: async (
    commentId: string,
    data: AddReactionData,
  ): Promise<ApiResponse<Reaction>> => {
    const response = await apiClient.post<ApiResponse<Reaction>>(
      `/posts/comments/${commentId}/reactions`,
      data,
    );
    return response.data;
  },

  removeCommentReaction: async (commentId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/posts/comments/${commentId}/reactions`,
    );
    return response.data;
  },
};
