import apiClient from './client';
import type { ApiResponse, PageResponse, ConnectionRequest } from '../types';

export const connectionsApi = {
  submit: (payload: {
    candidateId: string;
    roleTitle: string;
    opportunitySummary: string;
    workType?: string;
    location?: string;
    expectedStart?: string;
  }) =>
    apiClient.post<ApiResponse<ConnectionRequest>>('/connection-requests', payload),

  getMyRequests: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<ConnectionRequest>>>('/connection-requests', { params: { page, size } }),

  getCandidateRequests: () =>
    apiClient.get<ApiResponse<ConnectionRequest[]>>('/connection-requests/candidate'),

  getAdminQueue: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<PageResponse<ConnectionRequest>>>('/admin/connection-requests', { params }),

  updateStatus: (id: string, toStatus: string, adminNote?: string) =>
    apiClient.patch<ApiResponse<ConnectionRequest>>(`/admin/connection-requests/${id}/status`, { toStatus, adminNote }),
};
