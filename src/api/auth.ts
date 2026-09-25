import apiClient from './client';
import type { ApiResponse, AuthTokens } from '../types';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: 'CANDIDATE' | 'COMPANY';
  companyName?: string;
  website?: string;
  linkedinUrl?: string;
  industry?: string;
  companySize?: string;
  country?: string;
  city?: string;
  description?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient.post<ApiResponse<AuthTokens>>('/auth/register', payload),

  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<AuthTokens>>('/auth/login', payload),

  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),

  me: () =>
    apiClient.get<ApiResponse<AuthTokens>>('/auth/me'),

  /** Step 1 - Send 6-digit OTP to given email */
  forgotPasswordSendOtp: (email: string) =>
    apiClient.post<ApiResponse<void>>('/auth/password/send-otp', { email }),

  /** Step 2 - Verify OTP and receive a short-lived reset token */
  forgotPasswordVerifyOtp: (email: string, otp: string) =>
    apiClient.post<ApiResponse<{ resetToken: string }>>('/auth/password/verify-otp', { email, otp }),

  /** Step 3 - Reset password with the reset token */
  resetPassword: (email: string, token: string, newPassword: string) =>
    apiClient.post<ApiResponse<void>>('/auth/password/reset', { email, token, newPassword }),
};
