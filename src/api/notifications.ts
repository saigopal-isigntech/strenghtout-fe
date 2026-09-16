import apiClient from './client';
import type { ApiResponse, PageResponse, Notification } from '../types';

export const notificationsApi = {
  getAll: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<Notification>>>('/notifications', { params: { page, size } }),

  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch('/notifications/read-all'),

  getUnreadCount: () =>
    apiClient.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count'),
};

