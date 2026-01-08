import apiClient from './client';
import { GroupBuy, GroupBuyOrder, ApiResponse } from '../models';

// TEMPORARILY DISABLED - Group Buy functionality
export const groupBuyApi = {
  getAll: async (cooperativeId: string): Promise<ApiResponse<GroupBuy[]>> => {
    // const response = await apiClient.get<ApiResponse<GroupBuy[]>>(
    //   `/cooperatives/${cooperativeId}/group-buys`
    // );
    // return response.data;
    return { success: true, data: [], message: 'Group Buy feature temporarily disabled' };
  },

  getById: async (id: string): Promise<ApiResponse<GroupBuy>> => {
    // const response = await apiClient.get<ApiResponse<GroupBuy>>(`/group-buys/${id}`);
    // return response.data;
    throw new Error('Group Buy feature temporarily disabled');
  },

  create: async (
    cooperativeId: string,
    groupBuy: Partial<GroupBuy>
  ): Promise<ApiResponse<GroupBuy>> => {
    // const response = await apiClient.post<ApiResponse<GroupBuy>>(
    //   `/cooperatives/${cooperativeId}/group-buys`,
    //   groupBuy
    // );
    // return response.data;
    throw new Error('Group Buy feature temporarily disabled');
  },

  update: async (id: string, groupBuy: Partial<GroupBuy>): Promise<ApiResponse<GroupBuy>> => {
    // const response = await apiClient.put<ApiResponse<GroupBuy>>(`/group-buys/${id}`, groupBuy);
    // return response.data;
    throw new Error('Group Buy feature temporarily disabled');
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    // const response = await apiClient.delete<ApiResponse<void>>(`/group-buys/${id}`);
    // return response.data;
    throw new Error('Group Buy feature temporarily disabled');
  },

  indicateInterest: async (
    groupBuyId: string,
    quantity: number
  ): Promise<ApiResponse<GroupBuyOrder>> => {
    // const response = await apiClient.post<ApiResponse<GroupBuyOrder>>(
    //   `/group-buys/${groupBuyId}/orders`,
    //   { quantity }
    // );
    // return response.data;
    throw new Error('Group Buy feature temporarily disabled');
  },

  updateOrder: async (orderId: string, quantity: number): Promise<ApiResponse<GroupBuyOrder>> => {
    // const response = await apiClient.put<ApiResponse<GroupBuyOrder>>(
    //   `/group-buy-orders/${orderId}`,
    //   { quantity }
    // );
    // return response.data;
    throw new Error('Group Buy feature temporarily disabled');
  },

  cancelOrder: async (orderId: string): Promise<ApiResponse<void>> => {
    // const response = await apiClient.delete<ApiResponse<void>>(`/group-buy-orders/${orderId}`);
    // return response.data;
    throw new Error('Group Buy feature temporarily disabled');
  },

  finalize: async (groupBuyId: string): Promise<ApiResponse<GroupBuy>> => {
    // const response = await apiClient.post<ApiResponse<GroupBuy>>(
    //   `/group-buys/${groupBuyId}/finalize`
    // );
    // return response.data;
    throw new Error('Group Buy feature temporarily disabled');
  },

  getOrders: async (groupBuyId: string): Promise<ApiResponse<GroupBuyOrder[]>> => {
    // const response = await apiClient.get<ApiResponse<GroupBuyOrder[]>>(
    //   `/group-buys/${groupBuyId}/orders`
    // );
    // return response.data;
    throw new Error('Group Buy feature temporarily disabled');
  },

  allocate: async (
    groupBuyId: string,
    allocations: { orderId: string; quantity: number }[]
  ): Promise<ApiResponse<GroupBuyOrder[]>> => {
    // const response = await apiClient.post<ApiResponse<GroupBuyOrder[]>>(
    //   `/group-buys/${groupBuyId}/allocate`,
    //   { allocations }
    // );
    // return response.data;
    throw new Error('Group Buy feature temporarily disabled');
  },
};
