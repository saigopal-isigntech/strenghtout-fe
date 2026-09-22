import apiClient from './client';
import type { ApiResponse, PageResponse, CandidateProfile, Evidence, RoleCatalogItem, SkillCatalogItem, CandidateRoleInterest, CandidateExperience } from '../types';

export const candidatesApi = {
  search: (params: Record<string, any>) =>
    apiClient.get<ApiResponse<PageResponse<CandidateProfile>>>('/discovery/candidates', { params }),

  getProfile: (id: string) =>
    apiClient.get<ApiResponse<CandidateProfile>>(`/discovery/candidates/${id}`),

  getMyProfile: () =>
    apiClient.get<ApiResponse<CandidateProfile>>('/candidates/me'),

  updateMyProfile: (data: Partial<CandidateProfile>) =>
    apiClient.put<ApiResponse<CandidateProfile>>('/candidates/me', data),

  updateProfile: (data: Partial<CandidateProfile>) =>
    apiClient.put<ApiResponse<CandidateProfile>>('/candidates/me', data),

  createProfile: (data: Partial<CandidateProfile>) =>
    apiClient.put<ApiResponse<CandidateProfile>>('/candidates/me', data),

  getCompletion: () =>
    apiClient.get<ApiResponse<any>>('/candidates/me/completion'),

  publishProfile: () =>
    apiClient.post<ApiResponse<CandidateProfile>>('/candidates/me/publish'),

  unpublishProfile: () =>
    apiClient.post<ApiResponse<CandidateProfile>>('/candidates/me/unpublish'),

  addSkill: (data: { skillId: string; proficiency?: string; yearsMonths?: number; isPrimary?: boolean }) =>
    apiClient.post<ApiResponse<any>>('/candidates/me/skills', data),

  updateSkill: (skillId: string, data: { skillId: string; proficiency?: string; yearsMonths?: number; isPrimary?: boolean }) =>
    apiClient.put<ApiResponse<any>>(`/candidates/me/skills/${skillId}`, data),

  removeSkill: (skillId: string) =>
    apiClient.delete<ApiResponse<any>>(`/candidates/me/skills/${skillId}`),

  addRoleInterest: (data: { roleId?: string; roleName?: string; priority?: number; workType?: string; preferredLocation?: string }) =>
    apiClient.post<ApiResponse<CandidateRoleInterest>>('/candidates/me/role-interests', data),

  removeRoleInterest: (roleInterestId: string) =>
    apiClient.delete<ApiResponse<any>>(`/candidates/me/role-interests/${roleInterestId}`),

  addEducation: (data: { institution: string; qualification: string; fieldOfStudy?: string; startYear?: number; endYear?: number; courseType?: string }) =>
    apiClient.post<ApiResponse<any>>('/candidates/me/education', data),

  updateEducation: (id: string, data: { institution: string; qualification: string; fieldOfStudy?: string; startYear?: number; endYear?: number; courseType?: string }) =>
    apiClient.put<ApiResponse<any>>(`/candidates/me/education/${id}`, data),


  addExperience: (data: { companyName: string; title: string; startDate: string; endDate?: string; isCurrent?: boolean; description?: string }) =>
    apiClient.post<ApiResponse<CandidateExperience>>('/candidates/me/experiences', data),

  updateExperience: (id: string, data: { companyName: string; title: string; startDate: string; endDate?: string; isCurrent?: boolean; description?: string }) =>
    apiClient.put<ApiResponse<CandidateExperience>>(`/candidates/me/experiences/${id}`, data),

  deleteExperience: (id: string) =>
    apiClient.delete<ApiResponse<any>>(`/candidates/me/experiences/${id}`),

  deleteEducation: (id: string) =>
    apiClient.delete<ApiResponse<any>>(`/candidates/me/education/${id}`),

  addProject: (data: { name: string; summary?: string; responsibilities?: string; githubUrl?: string; demoUrl?: string; startDate?: string; endDate?: string; startDateStr?: string; endDateStr?: string; clientCompany?: string; workType?: string; skillIds?: string[] }) =>
    apiClient.post<ApiResponse<any>>('/candidates/me/projects', data),

  updateProject: (id: string, data: { name: string; summary?: string; responsibilities?: string; githubUrl?: string; demoUrl?: string; startDate?: string; endDate?: string; startDateStr?: string; endDateStr?: string; clientCompany?: string; workType?: string; skillIds?: string[] }) =>
    apiClient.put<ApiResponse<any>>(`/candidates/me/projects/${id}`, data),

  deleteProject: (id: string) =>
    apiClient.delete<ApiResponse<any>>(`/candidates/me/projects/${id}`),

  getMyEvidence: () =>
    apiClient.get<ApiResponse<Evidence[]>>('/candidates/me/evidence'),

  getRolesCatalog: () =>
    apiClient.get<ApiResponse<RoleCatalogItem[]>>('/catalogs/roles'),

  getSkillsCatalog: () =>
    apiClient.get<ApiResponse<SkillCatalogItem[]>>('/catalogs/skills'),
};

export const candidateApi = candidatesApi;
