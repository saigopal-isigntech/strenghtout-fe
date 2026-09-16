import apiClient from "./client";
import type {
  ApiResponse,
  PageResponse,
  PlatformOverview,
  AdminUserItem,
  AdminAuditItem,
  CompanyProfile,
  CandidateProfile,
} from "../types";

export const adminApi = {
  getOverview: () =>
    apiClient.get<ApiResponse<PlatformOverview>>("/admin/overview"),

  getUsers: (params: { page?: number; size?: number } = {}) =>
    apiClient.get<ApiResponse<PageResponse<AdminUserItem>>>("/admin/users", { params }),

  updateUserStatus: (id: string, status: "ACTIVE" | "SUSPENDED" | "INACTIVE") =>
    apiClient.patch<ApiResponse<AdminUserItem>>(`/admin/users/${id}/status`, { status }),

  getAuditLogs: (params: { page?: number; size?: number } = {}) =>
    apiClient.get<ApiResponse<PageResponse<AdminAuditItem>>>("/admin/audit-logs", { params }),

  getCompanies: (params: { page?: number; size?: number; search?: string } = {}) =>
    apiClient.get<ApiResponse<PageResponse<CompanyProfile>>>("/admin/companies", { params }),

  getCompanyDetail: (companyId: string) =>
    apiClient.get<ApiResponse<CompanyProfile>>(`/admin/companies/${companyId}`),

  getCandidates: (params: { page?: number; size?: number; search?: string } = {}) =>
    apiClient.get<ApiResponse<PageResponse<CandidateProfile>>>("/admin/candidates", { params }),

  getCandidateDetail: (candidateId: string) =>
    apiClient.get<ApiResponse<CandidateProfile>>(`/admin/candidates/${candidateId}`),
};
