import apiClient from "./client";
import type { ApiResponse, CompanyProfile, CompanyContact } from "../types";

export const companiesApi = {
  getMyProfile: () =>
    apiClient.get<ApiResponse<CompanyProfile>>("/companies/me"),

  updateMyProfile: (data: Partial<CompanyProfile>) =>
    apiClient.put<ApiResponse<CompanyProfile>>("/companies/me", data),

  addContact: (data: Partial<CompanyContact>) =>
    apiClient.post<ApiResponse<CompanyContact>>("/companies/me/contacts", data),

  deleteContact: (contactId: string) =>
    apiClient.delete(`/companies/me/contacts/${contactId}`),
};
