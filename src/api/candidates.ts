import apiClient from './client';
import type { ApiResponse, PageResponse, CandidateProfile, Evidence } from '../types';

export const candidatesApi = {
  search: (params: Record<string, string | number>) =>
    apiClient.get<ApiResponse<PageResponse<CandidateProfile>>>('/discovery/candidates', { params }),

  getProfile: (id: string) =>
    apiClient.get<ApiResponse<CandidateProfile>>(`/candidates/${id}`),

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

  addSkill: (data: { skillName: string; category?: string; proficiency?: string; yearsMonths?: number; isPrimary?: boolean }) =>
    apiClient.post<ApiResponse<any>>('/candidates/me/skills', data),

  removeSkill: (skillId: string) =>
    apiClient.delete<ApiResponse<any>>(`/candidates/me/skills/${skillId}`),

  addEducation: (data: { institution: string; qualification: string; fieldOfStudy?: string; startYear?: number; endYear?: number }) =>
    apiClient.post<ApiResponse<any>>('/candidates/me/education', data),

  deleteEducation: (id: string) =>
    apiClient.delete<ApiResponse<any>>(`/candidates/me/education/${id}`),

  addProject: (data: { name: string; summary?: string; responsibilities?: string; githubUrl?: string; demoUrl?: string; startDate?: string; endDate?: string; technologies?: string[] }) =>
    apiClient.post<ApiResponse<any>>('/candidates/me/projects', data),

  deleteProject: (id: string) =>
    apiClient.delete<ApiResponse<any>>(`/candidates/me/projects/${id}`),

  getEvidences: (candidateId: string) =>
    apiClient.get<ApiResponse<Evidence[]>>(`/candidates/${candidateId}/evidences`),

  addEvidence: (data: Partial<Evidence>) =>
    apiClient.post<ApiResponse<Evidence>>('/candidates/me/evidences', data),

  deleteEvidence: (evidenceId: string) =>
    apiClient.delete(`/candidates/me/evidences/${evidenceId}`),
};

export const candidateApi = candidatesApi;
