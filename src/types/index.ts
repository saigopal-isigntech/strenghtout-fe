export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  correlationId: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst?: boolean;
  isLast?: boolean;
  first?: boolean;
  last?: boolean;
}

export type UserRole = 'ROLE_SUPER_ADMIN' | 'ROLE_ADMIN' | 'ROLE_COMPANY' | 'ROLE_CANDIDATE';

export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  accountType?: string;
  role: UserRole;
  roles?: UserRole[];
}

export interface AuthResponseData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
  userId: string;
  email: string;
  accountType: string;
  roles: UserRole[];
  candidateProfileId: string | null;
  companyId: string | null;
  displayName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  user?: AuthUser;
}

export interface PlatformOverview {
  totalUsers: number;
  candidateCount: number;
  companyCount: number;
  totalConnectionRequests: number;
  pendingReviewRequests: number;
  approvedRequests: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  accountType: string;
  status: string;
  emailVerified: boolean;
  roles: string[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminAuditItem {
  id: string;
  actorUserId?: string;
  eventType: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadataJson?: string;
  createdAt: string;
}

export interface CandidateSkillItem {
  id?: string;
  skillId?: string;
  skillName: string;
  category?: string;
  proficiency?: string;
  yearsMonths?: number;
  isPrimary?: boolean;
}

export interface CandidateEducation {
  id?: string;
  qualification: string;
  institution: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  courseType?: string;
}

export interface CandidateProject {
  id?: string;
  name: string;
  clientCompany?: string;
  workType?: string;
  summary?: string;
  responsibilities?: string;
  githubUrl?: string;
  demoUrl?: string;
  startDate?: string;
  endDate?: string;
  technologies?: string[];
}

export interface CandidateProfile {
  id: string;
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  headline?: string;
  bio?: string;
  summary?: string;
  phone?: string;
  location?: string;
  currentLocation?: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  totalExperienceYears?: number;
  totalExperienceMonths?: number;
  experienceStatus?: string;
  noticePeriod?: string;
  availability?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  resumeUrl?: string;
  resumeName?: string;
  resumeUploadedDate?: string;
  disabilityStatus?: string;
  gender?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  permanentAddress?: string;
  languages?: string[];
  visibilityStatus?: string;
  completionPct?: number;
  overallStrengthScore?: number;
  skills: any[];
  evidences: Evidence[];
  experiences?: any[];
  education?: CandidateEducation[];
  projects?: CandidateProject[];
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface Evidence {
  id: string;
  title: string;
  description: string;
  type: string;
  mediaUrl?: string;
  externalLink?: string;
  skillTags: string[];
  strengthScore?: number;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface CompanyContact {
  id: string;
  name: string;
  jobTitle?: string;
  email: string;
  phone?: string;
  isPrimary: boolean;
}

export interface CompanyProfile {
  id: string;
  userId?: string;
  email?: string;
  companyName?: string;
  legalName?: string;
  displayName?: string;
  industry?: string;
  description?: string;
  websiteUrl?: string;
  website?: string;
  logoUrl?: string;
  companySize?: string;
  country?: string;
  city?: string;
  headquartersCity?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  contacts?: CompanyContact[];
}

export interface ConnectionRequest {
  id: string;
  companyId: string;
  companyDisplayName: string;
  companyIndustry?: string;
  companyCity?: string;
  candidateId: string;
  candidateFullName: string;
  candidateHeadline?: string;
  candidateLocation?: string;
  candidateExperienceMonths?: number;
  roleTitle: string;
  opportunitySummary: string;
  workType: string;
  location?: string;
  expectedStart?: string;
  status: string;
  submittedAt: string;
  closedAt?: string;
  version?: number;
  allowedNextStatuses?: string[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

