import apiClient from './client';
import { GroupBuy, GroupBuyOrder, ApiResponse } from '../models';

export const groupBuyApi = {
  getAll: async (cooperativeId: string): Promise<ApiResponse<GroupBuy[]>> => {
    const response = await apiClient.get<ApiResponse<GroupBuy[]>>(
      `/cooperatives/${cooperativeId}/group-buys`
    );
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<GroupBuy>> => {
    const response = await apiClient.get<ApiResponse<GroupBuy>>(`/group-buys/${id}`);
    return response.data;
  },

  create: async (
    cooperativeId: string,
    groupBuy: Partial<GroupBuy>
  ): Promise<ApiResponse<GroupBuy>> => {
    const response = await apiClient.post<ApiResponse<GroupBuy>>(
      `/cooperatives/${cooperativeId}/group-buys`,
      groupBuy
    );
    return response.data;
  },

  update: async (id: string, groupBuy: Partial<GroupBuy>): Promise<ApiResponse<GroupBuy>> => {
    const response = await apiClient.put<ApiResponse<GroupBuy>>(`/group-buys/${id}`, groupBuy);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/group-buys/${id}`);
    return response.data;
  },

  indicateInterest: async (
    groupBuyId: string,
    quantity: number
  ): Promise<ApiResponse<GroupBuyOrder>> => {
    const response = await apiClient.post<ApiResponse<GroupBuyOrder>>(
      `/group-buys/${groupBuyId}/orders`,
      { quantity }
    );
    return response.data;
  },

  updateOrder: async (orderId: string, quantity: number): Promise<ApiResponse<GroupBuyOrder>> => {
    const response = await apiClient.put<ApiResponse<GroupBuyOrder>>(
      `/group-buy-orders/${orderId}`,
      { quantity }
    );
    return response.data;
  },

  cancelOrder: async (orderId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/group-buy-orders/${orderId}`);
    return response.data;
  },

  finalize: async (groupBuyId: string): Promise<ApiResponse<GroupBuy>> => {
    const response = await apiClient.post<ApiResponse<GroupBuy>>(
      `/group-buys/${groupBuyId}/finalize`
    );
    return response.data;
  },

  getOrders: async (groupBuyId: string): Promise<ApiResponse<GroupBuyOrder[]>> => {
    const response = await apiClient.get<ApiResponse<GroupBuyOrder[]>>(
      `/group-buys/${groupBuyId}/orders`
    );
    return response.data;
  },

  allocate: async (
    groupBuyId: string,
    allocations: { orderId: string; quantity: number }[]
  ): Promise<ApiResponse<GroupBuyOrder[]>> => {
    const response = await apiClient.post<ApiResponse<GroupBuyOrder[]>>(
      `/group-buys/${groupBuyId}/allocate`,
      { allocations }
    );
    return response.data;
  },
};
