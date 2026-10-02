// Helper to format external URLs with protocol to prevent relative route issues
const normalizeExternalUrl = (url?: string | null): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { connectionsApi } from '../../api/connections';
import { useAuth } from '../../context/AuthContext';
import { candidatesApi } from '../../api/candidates';
import {
  validateRequired,
  validatePhone,
  validateUrl,
  validateYearRange,
  isValidUserAvatar,
} from '../../utils/validators';
import './Profile.css';
import {
  FiEdit3,
  FiMapPin,
  FiBriefcase,
  FiCalendar,
  FiPhone,
  FiMail,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiDownload,
  FiEye,
  FiTrash2,
  FiGithub,
  FiPlus,
  FiX,
  FiArrowLeft,
  FiCamera,
  FiVideo,
  FiUploadCloud,
  FiFileText,
  FiAward,
  FiUser,
  FiUserPlus,
  FiBookOpen,
  FiExternalLink,
  FiGlobe,
  FiHeart,
  FiMonitor,
  FiLayers,
  FiPlay,
  FiCode,
  FiTarget,
} from 'react-icons/fi';
import type { CandidateProfile, CandidateEducation, CandidateProject, CandidateRoleInterest, Evidence, RoleCatalogItem, CandidateExperience } from '../../types';

interface CandidateProfilePageProps {
  initialMode?: 'profile' | 'edit';
}

const CandidateProfilePage: React.FC<CandidateProfilePageProps> = ({ initialMode }) => {
  const { user, isAuthenticated, updateUserAvatar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeCandidateId } = useParams<{ id?: string }>();

  // External view check: when viewed by Company or Admin via /candidates/:id or /candidate/:id
  const isExternalView = Boolean(routeCandidateId);
  const isReadOnly = isExternalView || user?.role !== 'ROLE_CANDIDATE';


  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [connectForm, setConnectForm] = useState({
    roleTitle: '',
    opportunitySummary: '',
    workType: 'REMOTE',
    location: '',
    salaryRange: '',
    workTimings: '',
    experienceRequired: '',
    openingsCount: '1' as string | number,
    expectedStart: '',
  });
  const [connectError, setConnectError] = useState('');
  const [connectSending, setConnectSending] = useState(false);

  // URL-driven view routing: /profile/edit vs /profile
  const isEditRoute = location.pathname === '/profile/edit' || initialMode === 'edit';
  const view: 'profile' | 'edit' = isEditRoute ? 'edit' : 'profile';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Form input refs for modals (auto-focus and direct input management)
  const basicFirstInputRef = useRef<HTMLInputElement>(null);
  const basicLastNameRef = useRef<HTMLInputElement>(null);
  const basicPhoneRef = useRef<HTMLInputElement>(null);
  const basicLocationRef = useRef<HTMLInputElement>(null);
  
  const skillInputRef = useRef<HTMLInputElement>(null);
  const educationSchoolRef = useRef<HTMLInputElement>(null);
  const projectTitleRef = useRef<HTMLInputElement>(null);
  
  const roleSelectRef = useRef<HTMLSelectElement>(null);
  const personalGenderRef = useRef<HTMLSelectElement>(null);



  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  // Auto-dismiss notification popup after 3 seconds (3000ms)
  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => {
        setAlertMsg(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);


  // View is derived from URL route (/profile vs /profile/edit)
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Auto-scroll to section if hash exists in URL on edit page
  useEffect(() => {
    if (isEditRoute && location.hash) {
      const timer = setTimeout(() => {
        const el = document.querySelector(location.hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isEditRoute, location.hash]);

  // Prevent background scrolling when any modal / popup is open
  useEffect(() => {
    if (activeModal || showPhotoModal || showConnectModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activeModal, showPhotoModal, showConnectModal]);

  // Auto-focus the primary input ref when any modal opens
  useEffect(() => {
    if (!activeModal) return;
    const timer = setTimeout(() => {
      if (activeModal === 'basic') basicFirstInputRef.current?.focus();
      else if (activeModal === 'skills') skillInputRef.current?.focus();
      else if (activeModal === 'education') educationSchoolRef.current?.focus();
      else if (activeModal === 'project') projectTitleRef.current?.focus();
      else if (activeModal === 'internship') setInternshipErrors({});
      else if (activeModal === 'roles') roleSelectRef.current?.focus();
      else if (activeModal === 'personal') personalGenderRef.current?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, [activeModal]);
  const [saving, setSaving] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [rolesCatalog, setRolesCatalog] = useState<RoleCatalogItem[]>([]);
  const [roleInterests, setRoleInterests] = useState<CandidateRoleInterest[]>([]);
  const [evidencesList, setEvidencesList] = useState<Evidence[]>([]);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const isCompanyView = user?.role === 'ROLE_COMPANY' || previewMode;
  const [publishing, setPublishing] = useState<boolean>(false);

  const [roleForm, setRoleForm] = useState({
    roleId: '',
    roleName: '',
    priority: 1,
    workType: 'REMOTE',
    preferredLocation: '',
  });
  const [roleError, setRoleError] = useState('');

  // ---- Live display state (Clean empty initial state, populated exclusively from backend DB) ----
  const [displayData, setDisplayData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentLocation: '',
    experienceStatus: '',
    noticePeriod: '',
    headline: '',
    summary: '',
    skills: [] as string[],
    education: [] as CandidateEducation[],
    projects: [] as CandidateProject[],
    experiences: [] as CandidateExperience[],
    gender: '',
    dateOfBirth: '',
    maritalStatus: '',
    permanentAddress: '',
    strengths: '',
    languages: '',
    linkedinUrl: '',
    portfolioUrl: '',
    avatarUrl: '',
    completionPct: 0,
    resumeName: '',
    resumeDate: '',
    resumeUrl: '',
    videoName: '',
    videoDate: '',
    videoUrl: '',
    updatedAt: '',
    visibilityStatus: 'DRAFT',
  });

  // Dynamically compute profile completeness based on total available fields vs fields filled by candidate
  const completionStats = React.useMemo(() => {
    const fields = [
      { name: 'Profile Photo', filled: Boolean(displayData.avatarUrl) },
      { name: 'Headline', filled: Boolean(displayData.headline && displayData.headline.trim()) },
      { name: 'Summary / Bio', filled: Boolean(displayData.summary && displayData.summary.trim()) },
      { name: 'Phone Number', filled: Boolean(displayData.phone && displayData.phone.trim()) },
      { name: 'Current Location', filled: Boolean(displayData.currentLocation && displayData.currentLocation.trim()) },
      { name: 'Video Profile', filled: Boolean(displayData.videoUrl) },
      { name: 'Accomplishments & Strengths', filled: Boolean(displayData.strengths && displayData.strengths.trim()) },
      { name: 'Key Technical Skills', filled: Boolean(displayData.skills && displayData.skills.length > 0) },
      { name: 'Education Details', filled: Boolean(displayData.education && displayData.education.length > 0) },
      { name: 'Portfolio Projects', filled: Boolean(displayData.projects && displayData.projects.length > 0) },
      { name: 'Internships & Experience', filled: Boolean(displayData.experiences && displayData.experiences.length > 0) },
      { name: 'Resume Document', filled: Boolean(displayData.resumeUrl) },
    ];

    const totalCount = fields.length;
    const filledCount = fields.filter(f => f.filled).length;
    const missingFields = fields.filter(f => !f.filled).map(f => f.name);
    const percentage = Math.round((filledCount / totalCount) * 100);

    return { totalCount, filledCount, missingFields, percentage };
  }, [displayData]);

  // ---- Modal form states & validation errors ----
  const [basicForm, setBasicForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    currentLocation: '',
    experienceStatus: '',
    noticePeriod: '',
  });
  const [basicErrors, setBasicErrors] = useState<Record<string, string>>({});

  
  

  
  

  const [skillInput, setSkillInput] = useState('');
  const [skillError, setSkillError] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [strengthsList, setStrengthsList] = useState<string[]>([]);
  const [strengthInput, setStrengthInput] = useState('');
  const [strengthError, setStrengthError] = useState('');

  const [eduForm, setEduForm] = useState({
    qualification: '',
    institution: '',
    fieldOfStudy: '',
    startYear: '',
    endYear: '',
    courseType: 'Full Time',
  });
  const [eduErrors, setEduErrors] = useState<Record<string, string>>({});
  const [editingEduId, setEditingEduId] = useState<string | null>(null);

  const openAddEducation = () => {
    setEditingEduId(null);
    setEduForm({
      qualification: '',
      institution: '',
      fieldOfStudy: '',
      startYear: '',
      endYear: '',
      courseType: 'Full Time',
    });
    setEduErrors({});
    setActiveModal('education');
  };

  const openEditEducation = (edu: CandidateEducation) => {
    setEditingEduId(edu.id || null);
    setEduForm({
      qualification: edu.qualification || '',
      institution: edu.institution || '',
      fieldOfStudy: edu.fieldOfStudy || '',
      startYear: edu.startYear ? String(edu.startYear) : '',
      endYear: edu.endYear ? String(edu.endYear) : '',
      courseType: edu.courseType || 'Full Time',
    });
    setEduErrors({});
    setActiveModal('education');
  };

  const [projForm, setProjForm] = useState({
    name: '',
    clientCompany: '',
    workType: 'Full Time',
    summary: '',
    githubUrl: '',
    demoUrl: '',
    startDate: '',
    endDate: '',
  });
  const [projErrors, setProjErrors] = useState<Record<string, string>>({});
  const [editingProjId, setEditingProjId] = useState<string | null>(null);

  const openAddProject = () => {
    setEditingProjId(null);
    setProjForm({
      name: '',
      clientCompany: '',
      workType: 'Full Time',
      summary: '',
      githubUrl: '',
      demoUrl: '',
      startDate: '',
      endDate: '',
    });
    setProjErrors({});
    setActiveModal('project');
  };

  const openEditProject = (proj: CandidateProject) => {
    setEditingProjId(proj.id || null);
    setProjForm({
      name: proj.name || '',
      clientCompany: proj.clientCompany || '',
      workType: proj.workType || 'Full Time',
      summary: proj.summary || '',
      githubUrl: proj.githubUrl || '',
      demoUrl: proj.demoUrl || '',
      startDate: proj.startDate || '',
      endDate: proj.endDate || '',
    });
    setProjErrors({});
    setActiveModal('project');
  };

  
  // ---- Internship modal states & handlers ----
  const [internshipForm, setInternshipForm] = useState({
    companyName: '',
    title: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
  });
  const [internshipErrors, setInternshipErrors] = useState<Record<string, string>>({});
  const [editingInternshipId, setEditingInternshipId] = useState<string | null>(null);

  const openAddInternship = () => {
    setEditingInternshipId(null);
    setInternshipForm({
      companyName: '',
      title: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
    });
    setInternshipErrors({});
    setActiveModal('internship');
  };

  const openEditInternship = (exp: CandidateExperience) => {
    setEditingInternshipId(exp.id || null);
    setInternshipForm({
      companyName: exp.companyName || '',
      title: exp.title || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      isCurrent: exp.isCurrent || false,
      description: exp.description || '',
    });
    setInternshipErrors({});
    setActiveModal('internship');
  };

  const handleSaveInternship = async () => {
    const errs: Record<string, string> = {};
    if (!internshipForm.companyName.trim()) {
      errs.companyName = 'Company / Organization name is required.';
    }
    if (!internshipForm.title.trim()) {
      errs.title = 'Internship role or title is required.';
    }
    if (!internshipForm.startDate) {
      errs.startDate = 'Start date is required.';
    }
    if (!internshipForm.isCurrent && internshipForm.endDate && internshipForm.startDate) {
      if (new Date(internshipForm.endDate) < new Date(internshipForm.startDate)) {
        errs.endDate = 'End date cannot be earlier than start date.';
      }
    }
    if (Object.keys(errs).length > 0) {
      setInternshipErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        companyName: internshipForm.companyName.trim(),
        title: internshipForm.title.trim(),
        startDate: internshipForm.startDate,
        endDate: internshipForm.isCurrent ? undefined : (internshipForm.endDate || undefined),
        isCurrent: internshipForm.isCurrent,
        description: internshipForm.description.trim() || undefined,
      };

      if (editingInternshipId) {
        const res = await candidatesApi.updateExperience(editingInternshipId, payload);
        const updated = res.data?.data;
        setDisplayData(prev => ({
          ...prev,
          experiences: prev.experiences.map(e => (e.id === editingInternshipId ? (updated || { ...e, ...payload }) : e)),
        }));
        setAlertMsg({ type: 'success', text: 'Internship details updated successfully!' });
      } else {
        const res = await candidatesApi.addExperience(payload);
        const created = res.data?.data || { ...payload, id: String(Date.now()) };
        setDisplayData(prev => ({
          ...prev,
          experiences: [created, ...prev.experiences],
        }));
        setAlertMsg({ type: 'success', text: 'Internship details added successfully!' });
      }
      closeModal();
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to save internship details. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInternship = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this internship record?')) return;
    setSaving(true);
    try {
      await candidatesApi.deleteExperience(id);
      setDisplayData(prev => ({
        ...prev,
        experiences: prev.experiences.filter(e => e.id !== id),
      }));
      setAlertMsg({ type: 'success', text: 'Internship record removed successfully.' });
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to delete internship. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const [personalForm, setPersonalForm] = useState({
    gender: '',
    dateOfBirth: '',
    maritalStatus: '',
    permanentAddress: '',
    languages: '',
  });
  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({});

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      let p: CandidateProfile;

      if (routeCandidateId) {
        if (user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPER_ADMIN') {
          try {
            const adminRes = await adminApi.getCandidateDetail(routeCandidateId);
            p = adminRes.data && (adminRes.data as any).data ? (adminRes.data as any).data : (adminRes.data as any);
          } catch {
            const discRes = await candidatesApi.getProfile(routeCandidateId);
            p = discRes.data && (discRes.data as any).data ? (discRes.data as any).data : (discRes.data as any);
          }
        } else {
          const discRes = await candidatesApi.getProfile(routeCandidateId);
          p = discRes.data && (discRes.data as any).data ? (discRes.data as any).data : (discRes.data as any);
        }
      } else {
        const res = await candidatesApi.getMyProfile();
        p = res.data && (res.data as any).data ? (res.data as any).data : (res.data as any);
      }

      if (!p) {
        throw new Error('Candidate profile details could not be loaded.');
      }

      const pFirstName = p.firstName || (p.fullName ? p.fullName.split(' ')[0] : '');
      const pLastName = p.lastName || (p.fullName ? p.fullName.split(' ').slice(1).join(' ') : '');
      const userFirstName = isExternalView ? pFirstName : (user?.fullName ? user.fullName.split(' ')[0] : '');
      const userLastName = isExternalView ? pLastName : (user?.fullName ? user.fullName.split(' ').slice(1).join(' ') : '');

      const pSkills =
        Array.isArray(p.skills) && p.skills.length
          ? p.skills.map((s: any) => (typeof s === 'string' ? s : s.skillName || s.name))
          : [];

      const pEducation =
        Array.isArray(p.education) && p.education.length
          ? p.education.map((e: any) => ({
              id: e.id ? String(e.id) : undefined,
              qualification: e.qualification || '',
              institution: e.institution || '',
              fieldOfStudy: e.fieldOfStudy || '',
              startYear: e.startYear,
              endYear: e.endYear,
              courseType: e.courseType || 'Full Time',
            }))
          : [];

      const pProjects =
        Array.isArray(p.projects) && p.projects.length
          ? p.projects.map((pr: any) => ({
              id: pr.id ? String(pr.id) : undefined,
              name: pr.name || '',
              clientCompany: pr.clientCompany || '',
              workType: pr.workType || 'Full Time',
              summary: pr.summary || '',
              githubUrl: pr.githubUrl || '',
              demoUrl: pr.demoUrl || '',
              startDate: pr.startDateStr || (typeof pr.startDate === 'string' ? pr.startDate : ''),
              endDate: pr.endDateStr || (typeof pr.endDate === 'string' ? pr.endDate : ''),
              startDateStr: pr.startDateStr || (typeof pr.startDate === 'string' ? pr.startDate : ''),
              endDateStr: pr.endDateStr || (typeof pr.endDate === 'string' ? pr.endDate : ''),
            }))
          : [];

      const parsedLanguages = Array.isArray(p.languages)
        ? p.languages.join(', ')
        : (p.languages as string) || '';

      setDisplayData({
        firstName: p.firstName || userFirstName,
        lastName: p.lastName || userLastName,
        email: p.email || (p as any).user?.email || (isExternalView ? '' : (user?.email || '')),
        phone: p.phone || '',
        currentLocation: p.currentLocation || p.location || '',
        experienceStatus: p.experienceStatus || '',
        noticePeriod: p.noticePeriod || p.availability || '',
        headline: p.headline || '',
        summary: p.summary || p.bio || '',
        skills: pSkills,
        education: pEducation,
        projects: pProjects,
        experiences: Array.isArray(p.experiences) ? p.experiences : [],
        gender: p.gender || '',
        dateOfBirth: p.dateOfBirth || '',
        maritalStatus: p.maritalStatus || '',
        permanentAddress: p.permanentAddress || '',
        strengths: p.strengths || '',
        languages: parsedLanguages,
        linkedinUrl: p.linkedinUrl || '',
        portfolioUrl: p.portfolioUrl || '',
        avatarUrl: p.avatarUrl || '',
        completionPct: p.completionPct ?? 0,
        resumeName: p.resumeName || '',
        resumeDate: p.resumeUploadedDate || '',
        resumeUrl: p.resumeUrl || '',
        videoName: p.videoName || '',
        videoDate: p.videoUploadedDate || '',
        videoUrl: p.videoUrl || '',
        updatedAt: p.updatedAt || '',
        visibilityStatus: p.visibilityStatus || 'DRAFT',
      });

      if (!isExternalView) {
        if (isValidUserAvatar(p.avatarUrl)) {
          updateUserAvatar(p.avatarUrl);
        } else {
          updateUserAvatar('');
        }
      }

      setSkillsList(pSkills);
      const pStrengths = p.strengths
        ? p.strengths.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
      setStrengthsList(pStrengths);
      if (Array.isArray(p.roleInterests)) {
        setRoleInterests(p.roleInterests);
      }
      if (Array.isArray((p as any).evidence)) {
        setEvidencesList((p as any).evidence);
      } else if (Array.isArray((p as any).evidences)) {
        setEvidencesList((p as any).evidences);
      } else if (!isExternalView) {
        candidatesApi.getMyEvidence().then(res => {
          if (res.data?.data) setEvidencesList(res.data.data);
        }).catch(() => {});
      }
      if (!isExternalView) {
        candidatesApi.getRolesCatalog().then(res => {
          if (res.data?.data) setRolesCatalog(res.data.data);
        }).catch(() => {});
      }
    } catch {
      setSkillsList([]);
      setDisplayData(prev => ({
        ...prev,
        skills: [],
        education: [],
        projects: [],
      }));
    } finally {
      setLoading(false);
    }
  }, [routeCandidateId, isExternalView, user?.role, user?.userId, user?.fullName, updateUserAvatar]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    // Allow Company, Admin, and Super Admin to view candidate profile via route /candidates/:id
    // Block edit mode for company and admin
    if (isReadOnly && isEditRoute) {
      if (routeCandidateId) {
        navigate(`/candidates/${routeCandidateId}`);
      } else if (user.role === 'ROLE_COMPANY') {
        navigate('/discover');
      } else if (user.role?.includes('ADMIN')) {
        navigate('/admin/users');
      } else {
        navigate('/dashboard');
      }
      return;
    }

    if (!routeCandidateId && user.role !== 'ROLE_CANDIDATE') {
      if (user.role === 'ROLE_COMPANY') {
        navigate('/discover');
      } else if (user.role?.includes('ADMIN')) {
        navigate('/admin/users');
      } else {
        navigate('/dashboard');
      }
      return;
    }

    fetchProfile();
  }, [isAuthenticated, user?.userId, user?.role, routeCandidateId, fetchProfile, navigate]);

  // ---- Photo Change & Upload Handler ----
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setAlertMsg({ type: 'error', text: 'Please select a valid image file (PNG, JPG, JPEG, WEBP).' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setAlertMsg({ type: 'error', text: 'Image size must be less than 5MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setDisplayData(prev => ({ ...prev, avatarUrl: base64 }));
        updateUserAvatar(base64);
        window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: { avatarUrl: base64 } }));
        try {
          await candidatesApi.updateMyProfile({ avatarUrl: base64 });
          setAlertMsg({ type: 'success', text: 'Profile photo updated and saved successfully!' });
          setShowPhotoModal(false);
        } catch {
          setAlertMsg({ type: 'error', text: 'Failed to save photo to server.' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    setDisplayData(prev => ({ ...prev, avatarUrl: '' }));
    updateUserAvatar('');
    window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: { avatarUrl: '' } }));
    try {
      await candidatesApi.updateMyProfile({ avatarUrl: '' });
      setAlertMsg({ type: 'success', text: 'Profile photo removed successfully!' });
      setShowPhotoModal(false);
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to remove photo on server.' });
    }
  };

  
  // ---- Resume Upload & Delete Handler ----
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validExtensions = ['.pdf', '.doc', '.docx', '.rtf'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(fileExt)) {
        setAlertMsg({ type: 'error', text: 'Invalid file format. Please upload PDF, DOC, DOCX, or RTF.' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setAlertMsg({ type: 'error', text: 'Resume file size must be less than 10MB.' });
        return;
      }
      const uploadDate = `Uploaded on ${new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })}`;

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setDisplayData(prev => ({
          ...prev,
          resumeName: file.name,
          resumeDate: uploadDate,
          resumeUrl: base64,
        }));
        try {
          await candidatesApi.updateMyProfile({
            resumeName: file.name,
            resumeUploadedDate: uploadDate,
            resumeUrl: base64,
          });
          setAlertMsg({ type: 'success', text: `Resume "${file.name}" saved successfully!` });
        } catch {
          setAlertMsg({ type: 'error', text: 'Failed to save resume to server.' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteResume = async () => {
    setDisplayData(prev => ({ ...prev, resumeName: '', resumeDate: '', resumeUrl: '' }));
    try {
      await candidatesApi.updateMyProfile({
        resumeName: '',
        resumeUploadedDate: '',
        resumeUrl: '',
      });
      setAlertMsg({ type: 'info', text: 'Resume removed from your profile.' });
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to delete resume.' });
    }
  };

  const handleViewResume = () => {
    if (displayData.resumeUrl) {
      const win = window.open();
      if (win) {
        win.document.write(
          `<iframe src="${displayData.resumeUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      }
    }
  };

  // ---- Video Profile Upload Handler ----
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(fileExt)) {
        setAlertMsg({
          type: 'error',
          text: 'Invalid video format. Please upload MP4, WEBM, OGG, or MOV format.',
        });
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setAlertMsg({ type: 'error', text: 'Video file size must be less than 50MB.' });
        return;
      }

      setVideoUploading(true);
      const uploadDate = `Uploaded on ${new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })}`;

      const reader = new FileReader();
      reader.onload = async () => {
        const videoBase64 = reader.result as string;
        setDisplayData(prev => ({
          ...prev,
          videoName: file.name,
          videoDate: uploadDate,
          videoUrl: videoBase64,
        }));
        try {
          await candidatesApi.updateMyProfile({
            videoName: file.name,
            videoUploadedDate: uploadDate,
            videoUrl: videoBase64,
          });
          setAlertMsg({
            type: 'success',
            text: `Introduction video "${file.name}" uploaded and saved successfully!`,
          });
        } catch {
          setAlertMsg({ type: 'error', text: 'Failed to save video to server.' });
        } finally {
          setVideoUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteVideo = async () => {
    setDisplayData(prev => ({ ...prev, videoName: '', videoDate: '', videoUrl: '' }));
    try {
      await candidatesApi.updateMyProfile({
        videoName: '',
        videoUploadedDate: '',
        videoUrl: '',
      });
      setAlertMsg({ type: 'info', text: 'Introduction video removed from your profile.' });
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to remove video from server.' });
    }
  };

  // ---- Navigation ----
  const goToEdit = (sectionId?: string | React.MouseEvent) => {
    setSkillsList([...displayData.skills]);
    
    
    setBasicForm({
      firstName: displayData.firstName,
      lastName: displayData.lastName,
      phone: displayData.phone,
      currentLocation: displayData.currentLocation,
      experienceStatus: displayData.experienceStatus,
      noticePeriod: displayData.noticePeriod,
    });
    setPersonalForm({
      gender: displayData.gender,
      dateOfBirth: displayData.dateOfBirth,
      maritalStatus: displayData.maritalStatus,
      permanentAddress: displayData.permanentAddress,
      languages: displayData.languages,
    });
    const targetId = typeof sectionId === 'string' ? sectionId : '';
    navigate('/profile/edit' + (targetId ? `#${targetId}` : ''));
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  const toggleProjectExpand = (id: string) => {
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const closeModal = () => {
    setActiveModal(null);
    setBasicErrors({});
    
    
    setSkillError('');
    setEduErrors({});
    setProjErrors({});
  };

  // Automatically focus input when modal opens
  useEffect(() => {
    if (!activeModal) return;
    const timer = setTimeout(() => {
      const modalEl = document.querySelector('.modal-content');
      if (!modalEl) return;
      const targetInput = modalEl.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
      );
      if (targetInput) {
        targetInput.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeModal]);

  // ---- Save handlers with Database Persistence ----
  
  const handlePublish = async () => {
    if (completionStats.percentage < 50) {
      setAlertMsg({ type: 'error', text: 'Profile must be at least 50% complete before publishing to recruiters.' });
      return;
    }
    setPublishing(true);
    try {
      await candidatesApi.publishProfile();
      setDisplayData(prev => ({ ...prev, visibilityStatus: 'PUBLISHED' }));
      setAlertMsg({ type: 'success', text: 'Your profile has been published! Verified companies can now discover your capabilities.' });
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to publish profile.' });
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setPublishing(true);
    try {
      await candidatesApi.unpublishProfile();
      setDisplayData(prev => ({ ...prev, visibilityStatus: 'DRAFT' }));
      setAlertMsg({ type: 'info', text: 'Profile reverted to Draft. It is no longer visible in public discovery.' });
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to unpublish profile.' });
    } finally {
      setPublishing(false);
    }
  };

    const openAddRoleModal = () => {
    if (isReadOnly) return;
    setRoleForm({ roleId: '', roleName: '', priority: 1, workType: 'REMOTE', preferredLocation: '' });
    setRoleError('');
    setActiveModal('roles');
  };

  const handleSaveRoleInterest = async () => {
    if (!roleForm.roleName.trim()) {
      setRoleError('Please enter a target role title.');
      return;
    }
    setSaving(true);
    try {
      const trimmedName = roleForm.roleName.trim();
      const matched = rolesCatalog.find(r => r.roleName.toLowerCase() === trimmedName.toLowerCase());
      const res = await candidatesApi.addRoleInterest({
        roleId: matched?.id || (roleForm.roleId ? roleForm.roleId : undefined),
        roleName: trimmedName,
        priority: roleForm.priority,
        workType: roleForm.workType,
        preferredLocation: roleForm.preferredLocation,
      });
      const returnedData = res.data?.data;
      const newInterest: CandidateRoleInterest = {
        id: returnedData?.id || 'role-' + Date.now(),
        roleId: returnedData?.roleId || matched?.id || '',
        roleName: returnedData?.roleName || trimmedName,
        priority: roleForm.priority,
        workType: roleForm.workType,
        preferredLocation: roleForm.preferredLocation,
      };
      setRoleInterests(prev => [
        ...prev.filter(r => (r.id && newInterest.id ? r.id !== newInterest.id : true) && (r.roleName ? r.roleName.toLowerCase() !== trimmedName.toLowerCase() : true)),
        newInterest
      ]);
      setAlertMsg({ type: 'success', text: 'Target role preference saved!' });
      closeModal();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to save role preference.';
      setAlertMsg({ type: 'error', text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRoleInterest = async (roleInterestId?: string) => {
    if (!roleInterestId) return;
    try {
      await candidatesApi.removeRoleInterest(roleInterestId);
      setRoleInterests(prev => prev.filter(r => r.id !== roleInterestId));
      setAlertMsg({ type: 'success', text: 'Role preference removed.' });
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to remove role preference.' });
    }
  };

  const handleSaveBasic = async () => {
    const errors: Record<string, string> = {};
    const fnErr = validateRequired(basicForm.firstName, 'First name', 2);
    if (fnErr) errors.firstName = fnErr;

    const lnErr = validateRequired(basicForm.lastName, 'Last name', 1);
    if (lnErr) errors.lastName = lnErr;

    const phErr = basicForm.phone ? validatePhone(basicForm.phone, 'Mobile phone') : null;
    if (phErr) errors.phone = phErr;

    if (Object.keys(errors).length > 0) {
      setBasicErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const res = await candidatesApi.updateMyProfile({
        firstName: basicForm.firstName.trim(),
        lastName: basicForm.lastName.trim(),
        phone: basicForm.phone.trim(),
        currentLocation: basicForm.currentLocation.trim(),
        experienceStatus: basicForm.experienceStatus.trim(),
        noticePeriod: basicForm.noticePeriod.trim(),
      });
      const updated = res.data?.data;
      setDisplayData(prev => ({
        ...prev,
        firstName: basicForm.firstName.trim(),
        lastName: basicForm.lastName.trim(),
        phone: basicForm.phone.trim(),
        currentLocation: basicForm.currentLocation.trim(),
        experienceStatus: basicForm.experienceStatus.trim(),
        noticePeriod: basicForm.noticePeriod.trim(),
        completionPct: (updated && typeof updated.completionPct === 'number') ? updated.completionPct : prev.completionPct,
      }));
      setAlertMsg({ type: 'success', text: 'Basic profile details saved successfully!' });
      closeModal();
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to update basic details.' });
    } finally {
      setSaving(false);
    }
  };

  
  const handleAddStrength = async (strengthToAdd?: string) => {
    const trimmed = (strengthToAdd || strengthInput).trim();
    if (!trimmed) {
      setStrengthError('Strength or accomplishment cannot be empty.');
      return;
    }
    if (strengthsList.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setStrengthError('This strength is already added.');
      return;
    }

    const updated = [...strengthsList, trimmed];
    setStrengthsList(updated);
    setDisplayData(prev => ({ ...prev, strengths: updated.join(', ') }));
    setStrengthInput('');
    setStrengthError('');
    try {
      await candidatesApi.updateMyProfile({ strengths: updated.join(', ') });
      setAlertMsg({ type: 'success', text: `Strength "${trimmed}" added and saved!` });
    } catch {
      /* silent */
    }
  };

  const handleRemoveStrength = async (strengthToRemove: string) => {
    const updated = strengthsList.filter(s => s !== strengthToRemove);
    setStrengthsList(updated);
    setDisplayData(prev => ({ ...prev, strengths: updated.join(', ') }));
    try {
      await candidatesApi.updateMyProfile({ strengths: updated.join(', ') });
      setAlertMsg({ type: 'success', text: `Strength "${strengthToRemove}" removed.` });
    } catch {
      /* silent */
    }
  };

  const handleAddSkill = async () => {
    const trimmed = skillInput.trim();
    if (!trimmed) {
      setSkillError('Skill name cannot be empty.');
      return;
    }
    if (skillsList.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillError('This skill is already added.');
      return;
    }

    const updated = [...skillsList, trimmed];
    setSkillsList(updated);
    setDisplayData(prev => ({ ...prev, skills: updated }));
    setSkillInput('');
    setSkillError('');
    try {
      const res = await candidatesApi.updateMyProfile({ skills: updated });
      const updatedProfile = res.data?.data;
      if (typeof updatedProfile?.completionPct === 'number') {
        const newPct = updatedProfile.completionPct;
        setDisplayData(prev => ({ ...prev, completionPct: newPct }));
      }
      setAlertMsg({ type: 'success', text: `Skill "${trimmed}" added and saved!` });
    } catch {
      /* silent */
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const updated = skillsList.filter(s => s !== skillToRemove);
    setSkillsList(updated);
    setDisplayData(prev => ({ ...prev, skills: updated }));
    try {
      const res = await candidatesApi.updateMyProfile({ skills: updated });
      const updatedProfile = res.data?.data;
      if (typeof updatedProfile?.completionPct === 'number') {
        const newPct = updatedProfile.completionPct;
        setDisplayData(prev => ({ ...prev, completionPct: newPct }));
      }
      setAlertMsg({ type: 'success', text: `Skill "${skillToRemove}" removed.` });
    } catch {
      /* silent */
    }
  };

  const handleSaveEducation = async () => {
    const errors: Record<string, string> = {};
    const qErr = validateRequired(eduForm.qualification, 'Qualification / Degree', 2);
    if (qErr) errors.qualification = qErr;

    const iErr = validateRequired(eduForm.institution, 'School / University', 2);
    if (iErr) errors.institution = iErr;

    if (eduForm.startYear && eduForm.endYear) {
      const yrErr = validateYearRange(Number(eduForm.startYear), Number(eduForm.endYear));
      if (yrErr) errors.years = yrErr;
    }

    if (Object.keys(errors).length > 0) {
      setEduErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const res = await candidatesApi.addEducation({
        qualification: eduForm.qualification.trim(),
        institution: eduForm.institution.trim(),
        fieldOfStudy: eduForm.fieldOfStudy.trim(),
        startYear: Number(eduForm.startYear) || undefined,
        endYear: Number(eduForm.endYear) || undefined,
        courseType: eduForm.courseType,
      });

      const newEdu: CandidateEducation = {
        id: res.data?.data?.id ? String(res.data.data.id) : `edu-${Date.now()}`,
        qualification: eduForm.qualification.trim(),
        institution: eduForm.institution.trim(),
        fieldOfStudy: eduForm.fieldOfStudy.trim(),
        startYear: Number(eduForm.startYear) || undefined,
        endYear: Number(eduForm.endYear) || undefined,
        courseType: eduForm.courseType,
      };

      setDisplayData(prev => ({ ...prev, education: [...prev.education, newEdu] }));
      setAlertMsg({ type: 'success', text: 'Education record added and saved successfully!' });
      closeModal();
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to save education record.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEducation = async (id?: string) => {
    if (!id) return;
    try {
      await candidatesApi.deleteEducation(id);
      setDisplayData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }));
      setAlertMsg({ type: 'success', text: 'Education record deleted.' });
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to delete education record.' });
    }
  };

  const handleSaveProject = async () => {
    const errors: Record<string, string> = {};
    const nErr = validateRequired(projForm.name, 'Project title', 2);
    if (nErr) errors.name = nErr;

    const sErr = validateRequired(projForm.summary, 'Project summary', 8);
    if (sErr) errors.summary = sErr;

    const gErr = validateUrl(projForm.githubUrl, 'GitHub URL');
    if (gErr) errors.githubUrl = gErr;

    const dErr = validateUrl(projForm.demoUrl, 'Demo URL');
    if (dErr) errors.demoUrl = dErr;

    if (Object.keys(errors).length > 0) {
      setProjErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const res = await candidatesApi.addProject({
        name: projForm.name.trim(),
        summary: projForm.summary.trim(),
        githubUrl: normalizeExternalUrl(projForm.githubUrl),
        demoUrl: normalizeExternalUrl(projForm.demoUrl),
        startDate: projForm.startDate || '',
        endDate: projForm.endDate || '',
        clientCompany: projForm.clientCompany.trim(),
        workType: projForm.workType,
      });

      const newProj: CandidateProject = {
        id: res.data?.data?.id ? String(res.data.data.id) : `proj-${Date.now()}`,
        name: projForm.name.trim(),
        clientCompany: projForm.clientCompany.trim(),
        workType: projForm.workType,
        summary: projForm.summary.trim(),
        githubUrl: projForm.githubUrl.trim(),
        demoUrl: projForm.demoUrl.trim(),
        startDate: projForm.startDate || '',
        endDate: projForm.endDate || '',
      };

      setDisplayData(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
      setAlertMsg({ type: 'success', text: 'Project record added and saved successfully!' });
      closeModal();
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to save project record.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id?: string) => {
    if (!id) return;
    try {
      await candidatesApi.deleteProject(id);
      setDisplayData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
      setAlertMsg({ type: 'success', text: 'Project deleted.' });
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to delete project.' });
    }
  };

  const handleSavePersonal = async () => {
    const today = new Date().toLocaleDateString('en-CA');
    if (personalForm.dateOfBirth && personalForm.dateOfBirth > today) {
      setPersonalErrors(err => ({ ...err, dateOfBirth: 'Date of birth cannot be in the future' }));
      setAlertMsg({ type: 'error', text: 'Date of birth cannot be in the future.' });
      return;
    }
    setSaving(true);
    try {
      const langStr = Array.isArray(personalForm.languages)
        ? personalForm.languages.join(', ')
        : personalForm.languages.trim();

      await candidatesApi.updateMyProfile({
        gender: personalForm.gender,
        dateOfBirth: personalForm.dateOfBirth,
        maritalStatus: personalForm.maritalStatus,
        permanentAddress: personalForm.permanentAddress.trim(),
        languages: langStr,
      });

      setDisplayData(prev => ({
        ...prev,
        gender: personalForm.gender,
        dateOfBirth: personalForm.dateOfBirth,
        maritalStatus: personalForm.maritalStatus,
        permanentAddress: personalForm.permanentAddress.trim(),
        languages: langStr,
      }));
      setAlertMsg({ type: 'success', text: 'Personal details updated and saved successfully!' });
      closeModal();
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to save personal details.' });
    } finally {
      setSaving(false);
    }
  };

  const fullName =
    `${displayData.firstName} ${displayData.lastName}`.trim() || user?.fullName || 'Candidate Profile';
  const emailText = displayData.email || (isExternalView ? '' : (user?.email || ''));
  const candidateInitials = displayData.firstName
    ? `${displayData.firstName.charAt(0).toUpperCase()}${displayData.lastName ? displayData.lastName.charAt(0).toUpperCase() : ''}`
    : user?.fullName
    ? user.fullName.split(' ').map((n: string) => n.charAt(0).toUpperCase()).slice(0, 2).join('')
    : 'U';

  const lastUpdatedDisplay = displayData.updatedAt
    ? `Profile last updated - ${new Date(displayData.updatedAt).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`
    : 'New Profile Setup';

  if (loading) {
    return (
      <div className="profile-loading-screen">
        <div className="spinner-lg" />
      </div>
    );
  }

  // ========================
  // ========================
  // ========================
  // PROFILE VIEW (Clean Modern Reference Design)
  // ========================
  const renderProfileView = () => {
    // Determine candidate headline & bio
    const headline = (roleInterests.length > 0 ? roleInterests[0].roleName : '') || displayData.experienceStatus || 'Aspiring Full Stack Developer';
    const candidateBio = 'Motivated and enthusiastic computer science graduate with a strong interest in full stack development.';

    // Helper to get class name for tech skill badge
    const getSkillClass = (skillName: string) => {
      const s = skillName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (s.includes('reactnative')) return 'react-native';
      if (s.includes('react')) return 'react';
      if (s.includes('angular')) return 'angular';
      if (s.includes('springboot') || s.includes('spring')) return 'springboot';
      if (s.includes('javascript') || s === 'js') return 'javascript';
      if (s.includes('typescript') || s === 'ts') return 'typescript';
      if (s.includes('docker')) return 'docker';
      if (s.includes('html')) return 'html';
      if (s.includes('css')) return 'css';
      if (s.includes('java')) return 'java';
      return '';
    };

    return (
      <div className="profile-page-wrapper">
        <div className="profile-container">
          {/* Top Preview Bar */}
          {previewMode && (
            <div style={{ background: '#2563eb', color: '#ffffff', padding: '0.85rem 1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>
                💡 <strong>Company-Facing Preview Mode:</strong> This is how registered recruiters and companies view your verified profile.
              </span>
              <button
                onClick={() => setPreviewMode(false)}
                style={{ background: '#ffffff', color: '#1d4ed8', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Exit Preview
              </button>
            </div>
          )}

          {isExternalView && (
            <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-pv-company-preview"
                onClick={() => {
                  if (user?.role === 'ROLE_COMPANY') navigate('/discover');
                  else if (user?.role?.includes('ADMIN')) navigate('/admin/users');
                  else navigate(-1);
                }}
              >
                <FiArrowLeft size={16} />
                {user?.role === 'ROLE_COMPANY' ? 'Back to Discover' : 'Back to Candidates'}
              </button>

              {user?.role === 'ROLE_COMPANY' && (
                <button
                  type="button"
                  className="btn-pv-edit-profile"
                  onClick={() => setShowConnectModal(true)}
                >
                  <FiUserPlus size={16} />
                  Connect with Candidate
                </button>
              )}
            </div>
          )}

          {alertMsg && (
            <div className={`profile-alert ${alertMsg.type} profile-toast-professional`}>
              <div className="profile-alert-content">
                {alertMsg.type === 'success' && <FiCheckCircle className="profile-alert-icon success" />}
                {alertMsg.type === 'error' && <FiAlertCircle className="profile-alert-icon error" />}
                {alertMsg.type === 'info' && <FiInfo className="profile-alert-icon info" />}
                <span className="profile-alert-text">{alertMsg.text}</span>
              </div>
              <button onClick={() => setAlertMsg(null)} className="btn-alert-close" title="Dismiss">
                <FiX size={16} />
              </button>
              <div className="profile-alert-progress" />
            </div>
          )}

          {/* ================================================================= */}
          {/* HEADER CARD (Matching Reference Design)                           */}
          {/* ================================================================= */}
          <div className="pv-header-card">
            <div className="pv-header-left-col">
              <div className="pv-avatar-wrapper">
                <div
                  className="pv-avatar-ring"
                  style={{ '--progress': `${completionStats.percentage}%` } as React.CSSProperties}
                >
                  {displayData.avatarUrl ? (
                    <img
                      src={displayData.avatarUrl}
                      alt={fullName}
                      className="pv-avatar-img-inner"
                    />
                  ) : (
                    <div className="pv-avatar-placeholder-inner">
                      {candidateInitials}
                    </div>
                  )}
                </div>
                <div className="pv-avatar-cam-badge">
                  <FiCamera size={13} />
                </div>
              </div>

              <div className="pv-header-meta-col">
                <div className="pv-name-row">
                  <h1 className="pv-name-heading">{fullName}</h1>
                  <FiCheckCircle size={22} className="pv-verified-badge" />
                </div>
                <p className="pv-headline-text">{headline}</p>
                <p className="pv-bio-text">{candidateBio}</p>

                <div className="pv-pills-row">
                  <span className="pv-info-pill">
                    <FiMapPin size={14} /> {displayData.currentLocation || 'Narsingi, Hyderabad'}
                  </span>
                  <span className="pv-info-pill">
                    <FiPhone size={14} /> {isCompanyView ? 'Available upon connection' : (displayData.phone || '9685741452')}
                  </span>
                  <span className="pv-info-pill">
                    <FiMail size={14} /> {isCompanyView ? 'Available upon connection' : emailText}
                  </span>
                  <span className="pv-info-pill">
                    <FiBriefcase size={14} /> {displayData.experienceStatus || 'Fresher'}
                  </span>
                  <span className="pv-info-pill">
                    <FiCalendar size={14} /> {displayData.noticePeriod || 'Available to join in 15 Days'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pv-header-right-col">
              {!isExternalView && (
                <div className="pv-top-actions-row">
                  <button
                    type="button"
                    className={`btn-pv-toggle-publish ${displayData.visibilityStatus === 'PUBLISHED' ? 'published' : 'draft'}`}
                    onClick={displayData.visibilityStatus === 'PUBLISHED' ? handleUnpublish : handlePublish}
                    disabled={publishing || (displayData.visibilityStatus !== 'PUBLISHED' && completionStats.percentage < 50)}
                    title={
                      displayData.visibilityStatus === 'PUBLISHED'
                        ? 'Click to Unpublish profile from Discovery'
                        : completionStats.percentage < 50
                        ? 'Complete at least 50% of your profile to publish'
                        : 'Click to Publish profile to Discovery'
                    }
                  >
                    {publishing ? (
                      <span>Updating...</span>
                    ) : displayData.visibilityStatus === 'PUBLISHED' ? (
                      <>
                        <FiCheckCircle size={14} />
                        <span>Unpublish</span>
                      </>
                    ) : (
                      <>
                        <FiGlobe size={14} />
                        <span>Publish</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-pv-company-preview"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    <FiEye size={15} /> {previewMode ? 'Back to Editor' : 'Company Preview'}
                  </button>
                  <button
                    type="button"
                    className="btn-pv-edit-profile"
                    onClick={goToEdit}
                  >
                    <FiEdit3 size={15} /> Edit Profile
                  </button>
                </div>
              )}

              <div className="pv-completeness-box">
                <div className="pv-completeness-header">
                  <span>Profile Completeness</span>
                  <span className="pv-completeness-pct">{completionStats.percentage}%</span>
                </div>
                <div className="pv-completeness-bar">
                  <div
                    className="pv-completeness-fill"
                    style={{ width: `${completionStats.percentage}%` }}
                  />
                </div>
                <p className="pv-completeness-subtext">
                  {completionStats.percentage === 100
                    ? '🎉 Profile 100% complete! Maximum visibility to top hiring companies.'
                    : `${completionStats.filledCount} of ${completionStats.totalCount} completed. Missing: ${completionStats.missingFields.slice(0, 2).join(', ')}.`}
                </p>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 2-COLUMN CARDS GRID (Matching Reference Layout)                   */}
          {/* ================================================================= */}
          <div className="pv-two-col-grid">
            {/* -------------------- LEFT COLUMN -------------------- */}
            <div className="pv-col-stack">
              {/* 1. Myself / Introduction Video */}
              <div className="pv-card">
                <div className="pv-card-head">
                  <div className="pv-card-title-group">
                    <div className="pv-card-icon-badge">
                      <FiVideo size={18} />
                    </div>
                    <h2 className="pv-card-title-text">Myself / Introduction Video</h2>
                  </div>
                </div>

                {displayData.videoUrl ? (
                  <div className="pv-video-layout">
                    <div className="pv-video-player-box">
                      <video
                        controls
                        src={displayData.videoUrl}
                        key={displayData.videoUrl}
                      >
                        Your browser does not support the video tag.
                      </video>
                      <span className="pv-video-duration-tag">2:36</span>
                    </div>
                    <div className="pv-video-details-box">
                      <h4 className="pv-video-filename">{displayData.videoName || '4030752185-preview.mp4'}</h4>
                      <span className="pv-video-uploaddate">
                        <FiCalendar size={12} /> Uploaded on {displayData.videoDate || 'Sep 21, 2026'}
                      </span>
                      <p className="pv-video-desc">
                        A short introduction about myself, my skills, and my career aspirations.
                      </p>
                      <button
                        type="button"
                        className="btn-pv-watch-video"
                        onClick={() => {
                          const v = document.querySelector('.pv-video-player-box video') as HTMLVideoElement;
                          if (v) { v.scrollIntoView({ behavior: 'smooth', block: 'center' }); v.play(); }
                        }}
                      >
                        <FiPlay size={12} /> Watch Video
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                    <FiVideo size={28} color="#94a3b8" style={{ marginBottom: '0.4rem' }} />
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 700, color: '#334155', fontSize: '0.92rem' }}>No Introduction Video Uploaded</p>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>The candidate has not uploaded an introduction video yet.</p>
                  </div>
                )}
              </div>

              {/* 2. Education */}
              <div className="pv-card">
                <div className="pv-card-head">
                  <div className="pv-card-title-group">
                    <div className="pv-card-icon-badge">
                      <FiBookOpen size={18} />
                    </div>
                    <h2 className="pv-card-title-text">Education</h2>
                  </div>
                </div>

                {displayData.education.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {displayData.education.map((edu, idx) => (
                      <div key={edu.id || idx} className="pv-edu-card-item">
                        <div className="pv-edu-left-group">
                          <span className="pv-edu-year-pill">
                            {edu.startYear ? edu.startYear : ''}{edu.endYear ? ` - ${edu.endYear}` : ''}
                          </span>
                          <div className="pv-edu-info">
                            <span className="pv-edu-degree-title">{edu.qualification}</span>
                            <span className="pv-edu-school-name">{edu.institution}</span>
                            <span className="pv-edu-meta-text">
                              {edu.courseType || 'Full Time'}{(edu as any).cgpa ? ` | CGPA: ${(edu as any).cgpa}` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="pv-edu-cap-badge">
                          <FiBookOpen size={20} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                    No education details added yet.
                  </p>
                )}
              </div>

              {/* 3. Projects */}
              <div className="pv-card">
                <div className="pv-card-head">
                  <div className="pv-card-title-group">
                    <div className="pv-card-icon-badge">
                      <FiCode size={18} />
                    </div>
                    <h2 className="pv-card-title-text">Projects</h2>
                  </div>
                </div>

                {displayData.projects.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {displayData.projects.map((proj, idx) => {
                      const repoUrl = normalizeExternalUrl(proj.githubUrl) || `https://github.com/search?q=${encodeURIComponent(proj.name || 'project')}`;

                      return (
                        <div key={proj.id || idx} className="pv-proj-card-item">
                          <div className="pv-proj-info">
                            <div className="pv-proj-title-row">
                              <h4 className="pv-proj-name-text">{proj.name}</h4>
                              <a
                                href={repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pv-proj-repo-link"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(repoUrl, '_blank', 'noopener,noreferrer');
                                }}
                                title="Navigate to GitHub Repository"
                              >
                                <FiGithub size={14} />
                                <span>GitHub Repository</span>
                                <FiExternalLink size={13} />
                              </a>
                            </div>
                            <p className="pv-proj-desc-text">
                              {expandedProjects[proj.id || proj.name] || !proj.summary || proj.summary.length <= 120
                                ? proj.summary
                                : proj.summary.substring(0, 120) + '... '}
                              {proj.summary && proj.summary.length > 120 && (
                                <button
                                  type="button"
                                  style={{ background: 'transparent', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', padding: 0, marginLeft: '4px' }}
                                  onClick={() => toggleProjectExpand(proj.id || proj.name)}
                                >
                                  {expandedProjects[proj.id || proj.name] ? 'Less' : 'More'}
                                </button>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                    No projects added yet.
                  </p>
                )}
              </div>

              {/* 4. Resume */}
              <div className="pv-card">
                <div className="pv-card-head">
                  <div className="pv-card-title-group">
                    <div className="pv-card-icon-badge">
                      <FiFileText size={18} />
                    </div>
                    <h2 className="pv-card-title-text">Resume</h2>
                  </div>
                </div>

                <div className="pv-resume-item-card">
                  <div className="pv-resume-file-col">
                    <div className="pv-pdf-badge">
                      PDF
                    </div>
                    <div>
                      <div className="pv-resume-name-text">
                        {displayData.resumeName || 'Sample_Java_Developer_Resume (1) (1).pdf'}
                      </div>
                      <div className="pv-resume-meta-text">
                        Uploaded on {displayData.resumeDate || 'Sep 21, 2026'} | 450 KB
                      </div>
                    </div>
                  </div>

                  <div className="pv-resume-actions-group">
                    {displayData.resumeUrl ? (
                      <>
                        <button
                          type="button"
                          className="btn-pv-circle-action"
                          onClick={handleViewResume}
                          title="View Resume"
                        >
                          <FiEye size={16} />
                        </button>
                        <a
                          href={displayData.resumeUrl}
                          download={displayData.resumeName || 'Resume.pdf'}
                          className="btn-pv-circle-action"
                          title="Download Resume"
                        >
                          <FiDownload size={16} />
                        </a>
                      </>
                    ) : (
                      <>
                        <button type="button" className="btn-pv-circle-action" title="Preview Resume">
                          <FiEye size={16} />
                        </button>
                        <button type="button" className="btn-pv-circle-action" title="Download Resume">
                          <FiDownload size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. Verified Assessment Evidence (RightPath) */}
              <div className="pv-card">
                <div className="pv-card-head">
                  <div className="pv-card-title-group">
                    <div className="pv-card-icon-badge">
                      <FiCheckCircle size={18} />
                    </div>
                    <h2 className="pv-card-title-text">Verified Assessment Evidence (RightPath)</h2>
                  </div>
                </div>

                {evidencesList.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                    {evidencesList.map(ev => (
                      <div key={ev.id} style={{ background: '#f0fdf4', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#14532d' }}>{ev.title}</strong>
                          {ev.score != null && (
                            <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.78rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                              Score: {ev.score}%
                            </span>
                          )}
                        </div>
                        {ev.summary && <p style={{ fontSize: '0.82rem', color: '#166534', margin: '0.35rem 0 0' }}>{ev.summary}</p>}
                        <span style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 600, display: 'inline-block', marginTop: '0.4rem' }}>
                          ✓ Verified by {ev.sourceSystem || 'RightPath'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pv-rightpath-banner">
                    <div className="pv-rightpath-left">
                      <FiInfo size={18} />
                      <p className="pv-rightpath-text">
                        No external RightPath assessment evidence linked yet. Complete verified assessments on RightPath to showcase authentic evidence badges to companies.
                      </p>
                    </div>
                    <a
                      href="https://rightpath.live"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-pv-rightpath-link"
                    >
                      Go to RightPath <FiExternalLink size={13} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* -------------------- RIGHT COLUMN -------------------- */}
            <div className="pv-col-stack">
              {/* 1. Key Skills */}
              <div className="pv-card">
                <div className="pv-card-head">
                  <div className="pv-card-title-group">
                    <div className="pv-card-icon-badge">
                      <FiAward size={18} />
                    </div>
                    <h2 className="pv-card-title-text">Key Skills</h2>
                  </div>
                </div>

                <div className="pv-skills-wrap">
                  {displayData.skills.length > 0 ? (
                    displayData.skills.map((skill, i) => {
                      const cls = getSkillClass(skill);
                      return (
                        <span key={i} className={`pv-skill-item-pill ${cls}`}>
                          {skill}
                        </span>
                      );
                    })
                  ) : (
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                      No skills added yet.
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Internships */}
              <div className="pv-card">
                <div className="pv-card-head">
                  <div className="pv-card-title-group">
                    <div className="pv-card-icon-badge">
                      <FiBriefcase size={18} />
                    </div>
                    <h2 className="pv-card-title-text">Internships</h2>
                  </div>
                </div>

                {displayData.experiences && displayData.experiences.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {displayData.experiences.map((exp: any, idx) => {
                      const initials = (exp.companyName || 'Exp')
                        .split(' ')
                        .map((w: string) => w[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'EX';

                      return (
                        <div key={exp.id || idx} className="pv-exp-card-item">
                          <div className="pv-exp-logo-badge">
                            {initials}
                          </div>
                          <div className="pv-exp-info">
                            <div className="pv-exp-title-row">
                              <span className="pv-exp-company-strong">{exp.companyName}</span>
                              <span className="pv-exp-role-sub">({exp.title})</span>
                            </div>
                            <span className="pv-exp-date-line">
                              <FiCalendar size={12} /> {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                            </span>
                            {exp.description && (
                              <p className="pv-exp-desc-line">{exp.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                    No internships or work experience added yet.
                  </p>
                )}
              </div>

              {/* 3. Accomplishments & Strengths */}
              <div className="pv-card">
                <div className="pv-card-head">
                  <div className="pv-card-title-group">
                    <div className="pv-card-icon-badge">
                      <FiAward size={18} />
                    </div>
                    <h2 className="pv-card-title-text">Accomplishments & Strengths</h2>
                  </div>
                </div>

                <div className="pv-strengths-wrap">
                  {strengthsList.length > 0 ? (
                    strengthsList.map((st, i) => {
                      const icons = ['⭐', '👥', '💬', '☀️', '⏰', '📊', '🚀', '🎯', '💡', '🏆'];
                      const icon = icons[i % icons.length];
                      const classes = ['problem-solving', 'teamwork', 'communication', 'adaptability', 'timemanagement', 'leadership'];
                      const cls = classes[i % classes.length];
                      return (
                        <span key={i} className={`pv-strength-item ${cls}`}>
                          {icon} {st}
                        </span>
                      );
                    })
                  ) : (
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                      No accomplishments & strengths customized yet.
                    </p>
                  )}
                </div>
              </div>

              {/* 4. Target Role & Work Preferences */}
              <div className="pv-card">
                <div className="pv-card-head">
                  <div className="pv-card-title-group">
                    <div className="pv-card-icon-badge">
                      <FiTarget size={18} />
                    </div>
                    <h2 className="pv-card-title-text">Target Role & Work Preferences</h2>
                  </div>
                </div>

                <div className="pv-target-roles-grid">
                  {roleInterests.length > 0 ? (
                    roleInterests.map((r, i) => (
                      <div key={r.id || r.roleId || i} className="pv-role-item-card">
                        <div className={`pv-role-icon-box ${i % 2 === 1 ? 'purple' : ''}`}>
                          {i % 2 === 1 ? <FiLayers size={18} /> : <FiMonitor size={18} />}
                        </div>
                        <div>
                          <span className="pv-role-title-bold">{r.roleName || 'Target Role'}</span>
                          <span className="pv-role-worktype-tag">{r.workType || 'HYBRID'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                      No target role preferences configured yet.
                    </p>
                  )}
                </div>
              </div>

              {/* 5. Personal Details */}
              <div className="pv-card">
                <div className="pv-card-head">
                  <div className="pv-card-title-group">
                    <div className="pv-card-icon-badge">
                      <FiUser size={18} />
                    </div>
                    <h2 className="pv-card-title-text">Personal Details</h2>
                  </div>
                </div>

                <div className="pv-personal-2col-grid">
                  <div className="pv-personal-cell">
                    <FiUser size={18} className="pv-personal-cell-icon" />
                    <div className="pv-personal-cell-info">
                      <span className="pv-personal-cell-label">Gender</span>
                      <span className="pv-personal-cell-val">{displayData.gender || 'Not specified'}</span>
                    </div>
                  </div>

                  <div className="pv-personal-cell">
                    <FiCalendar size={18} className="pv-personal-cell-icon" />
                    <div className="pv-personal-cell-info">
                      <span className="pv-personal-cell-label">Date of Birth</span>
                      <span className="pv-personal-cell-val">{displayData.dateOfBirth || 'Not specified'}</span>
                    </div>
                  </div>

                  <div className="pv-personal-cell">
                    <FiHeart size={18} className="pv-personal-cell-icon" />
                    <div className="pv-personal-cell-info">
                      <span className="pv-personal-cell-label">Marital Status</span>
                      <span className="pv-personal-cell-val">{displayData.maritalStatus || 'Not specified'}</span>
                    </div>
                  </div>

                  <div className="pv-personal-cell">
                    <FiGlobe size={18} className="pv-personal-cell-icon" />
                    <div className="pv-personal-cell-info">
                      <span className="pv-personal-cell-label">Languages</span>
                      <span className="pv-personal-cell-val">{displayData.languages || 'English, Telugu'}</span>
                    </div>
                  </div>

                  <div className="pv-personal-cell pv-personal-cell-full">
                    <FiMapPin size={18} className="pv-personal-cell-icon" />
                    <div className="pv-personal-cell-info">
                      <span className="pv-personal-cell-label">Permanent Address</span>
                      <span className="pv-personal-cell-val">{displayData.permanentAddress || 'High Towers Gachibowli, Hyderabad'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // EDIT VIEW (Aligned with proper buttons & Video Profile Section)
  // ========================
  const renderEditView = () => (
    <div className="profile-page-wrapper">
      <div className="profile-container">
        {/* Hidden file inputs */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />
        <input
          type="file"
          ref={resumeInputRef}
          accept=".doc,.docx,.rtf,.pdf"
          onChange={handleResumeUpload}
          style={{ display: 'none' }}
        />
        <input
          type="file"
          ref={videoInputRef}
          accept="video/mp4,video/webm,video/ogg,video/quicktime"
          onChange={handleVideoUpload}
          style={{ display: 'none' }}
        />

        {/* Back button */}
        <div className="profile-top-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <button className="btn-back-to-profile" onClick={goToProfile}>
            <FiArrowLeft size={16} /> Back to Profile
          </button>
          <button className="btn-pv-edit-profile" onClick={goToProfile}>
            <FiEye size={15} /> View Profile
          </button>
        </div>

        {alertMsg && (
          <div className={`profile-alert ${alertMsg.type} profile-toast-professional`}>
            <div className="profile-alert-content">
              {alertMsg.type === 'success' && <FiCheckCircle className="profile-alert-icon success" />}
              {alertMsg.type === 'error' && <FiAlertCircle className="profile-alert-icon error" />}
              {alertMsg.type === 'info' && <FiInfo className="profile-alert-icon info" />}
              <span className="profile-alert-text">{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg(null)} className="btn-alert-close" title="Dismiss">
              <FiX size={16} />
            </button>
            <div className="profile-alert-progress" />
          </div>
        )}

        {/* Edit Header Card */}
        <div className="profile-header-card">
          <div className="profile-header-left">
            <div
              className="avatar-progress-container"
              onClick={() => setShowPhotoModal(true)}
              title="Click to Change Photo"
            >
              <div
                className="avatar-progress-ring"
                style={{ '--progress': `${completionStats.percentage}%` } as React.CSSProperties}
              >
                {displayData.avatarUrl ? (
                  <img
                    src={displayData.avatarUrl}
                    alt={fullName}
                    className="avatar-inner-img"
                  />
                ) : (
                  <div className="avatar-inner-placeholder" title="Click to upload profile photo">
                    {candidateInitials}
                  </div>
                )}
                <div className="avatar-photo-overlay" title="Change Profile Photo">
                  <FiCamera size={20} />
                  <span>{displayData.avatarUrl ? 'Change' : 'Add Photo'}</span>
                </div>
              </div>
              <span className="avatar-completion-badge">{completionStats.percentage}%</span>
              <div className="btn-avatar-camera" title="Click to Change Photo">
                <FiCamera size={14} />
              </div>
            </div>

            <div className="header-info-content">
              <div className="header-name-row">
                <h1 className="candidate-name">{fullName}</h1>
                <button
                  className="btn-icon-edit"
                  onClick={() => {
                    setBasicForm({
                      firstName: displayData.firstName,
                      lastName: displayData.lastName,
                      phone: displayData.phone,
                      currentLocation: displayData.currentLocation,
                      experienceStatus: displayData.experienceStatus,
                      noticePeriod: displayData.noticePeriod,
                    });
                    setBasicErrors({});
                    setActiveModal('basic');
                  }}
                  title="Edit Basic Details"
                >
                  <FiEdit3 size={18} />
                </button>
              </div>
              <div className="last-updated-text">{lastUpdatedDisplay}</div>
              <div className="header-details-grid">
                <button
                  type="button"
                  className={`detail-item ${displayData.currentLocation ? 'filled' : 'empty'}`}
                  onClick={() => {
                    setBasicForm({
                      firstName: displayData.firstName,
                      lastName: displayData.lastName,
                      phone: displayData.phone,
                      currentLocation: displayData.currentLocation,
                      experienceStatus: displayData.experienceStatus,
                      noticePeriod: displayData.noticePeriod,
                    });
                    setBasicErrors({});
                    setActiveModal('basic');
                  }}
                  title="Click to edit location"
                >
                  <FiMapPin className="detail-icon" />
                  <span>{displayData.currentLocation || 'Add location'}</span>
                  {!displayData.currentLocation && <FiPlus size={11} className="detail-add-icon" />}
                </button>
                <button
                  type="button"
                  className={`detail-item ${displayData.phone ? 'filled' : 'empty'}`}
                  onClick={() => {
                    setBasicForm({
                      firstName: displayData.firstName,
                      lastName: displayData.lastName,
                      phone: displayData.phone,
                      currentLocation: displayData.currentLocation,
                      experienceStatus: displayData.experienceStatus,
                      noticePeriod: displayData.noticePeriod,
                    });
                    setBasicErrors({});
                    setActiveModal('basic');
                  }}
                  title="Click to edit phone"
                >
                  <FiPhone className="detail-icon" />
                  <span>{displayData.phone || 'Add phone'}</span>
                  {displayData.phone ? (
                    <FiCheckCircle className="verified-badge" />
                  ) : (
                    <FiPlus size={11} className="detail-add-icon" />
                  )}
                </button>
                <button
                  type="button"
                  className={`detail-item ${displayData.experienceStatus ? 'filled' : 'empty'}`}
                  onClick={() => {
                    setBasicForm({
                      firstName: displayData.firstName,
                      lastName: displayData.lastName,
                      phone: displayData.phone,
                      currentLocation: displayData.currentLocation,
                      experienceStatus: displayData.experienceStatus,
                      noticePeriod: displayData.noticePeriod,
                    });
                    setBasicErrors({});
                    setActiveModal('basic');
                  }}
                  title="Click to edit experience level"
                >
                  <FiBriefcase className="detail-icon" />
                  <span>{displayData.experienceStatus || 'Add experience level'}</span>
                  {!displayData.experienceStatus && <FiPlus size={11} className="detail-add-icon" />}
                </button>
                <div className="detail-item filled email-item">
                  <FiMail className="detail-icon" />
                  <span>
                    {emailText.length > 22 ? emailText.substring(0, 20) + '...' : emailText}
                  </span>
                  <FiCheckCircle className="verified-badge" />
                </div>
                <button
                  type="button"
                  className={`detail-item ${displayData.noticePeriod ? 'filled' : 'empty'}`}
                  onClick={() => {
                    setBasicForm({
                      firstName: displayData.firstName,
                      lastName: displayData.lastName,
                      phone: displayData.phone,
                      currentLocation: displayData.currentLocation,
                      experienceStatus: displayData.experienceStatus,
                      noticePeriod: displayData.noticePeriod,
                    });
                    setBasicErrors({});
                    setActiveModal('basic');
                  }}
                  title="Click to edit availability"
                >
                  <FiCalendar className="detail-icon" />
                  <span>{displayData.noticePeriod || 'Add availability'}</span>
                  {!displayData.noticePeriod && <FiPlus size={11} className="detail-add-icon" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pv-header-right-col" style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="pv-completeness-box" style={{ margin: 0 }}>
              <div className="pv-completeness-header">
                <span>Profile Completeness</span>
                <span className="pv-completeness-pct">{completionStats.percentage}%</span>
              </div>
              <div className="pv-completeness-bar">
                <div
                  className="pv-completeness-fill"
                  style={{ width: `${completionStats.percentage}%` }}
                />
              </div>
              <p className="pv-completeness-subtext">
                {completionStats.percentage === 100
                  ? '🎉 Profile 100% complete! Maximum visibility to top hiring companies.'
                  : `${completionStats.filledCount} of ${completionStats.totalCount} completed. Missing: ${completionStats.missingFields.slice(0, 2).join(', ')}.`}
              </p>
            </div>
          </div>
        </div>

        {/* Main Section Stack */}
        <div className="profile-sections-stack">
          {/* Video Profile / Introduction Video Section */}
          <div className="section-card" id="edit-section-video-profile">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <FiVideo size={18} /> Video Profile (Myself)
              </h2>
              {displayData.videoUrl && (
                <button
                  className="section-action-link"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={videoUploading}
                >
                  <FiUploadCloud size={14} /> Replace Video
                </button>
              )}
            </div>

            <p className="section-card-intro">
              Stand out to employers! Upload a 1-2 minute video introducing yourself, your core technical strengths, and career aspirations.
            </p>

            {displayData.videoUrl ? (
              <div className="video-card-container">
                <div className="video-preview-wrap">
                  <video
                    className="video-player-preview"
                    controls
                    src={displayData.videoUrl}
                    key={displayData.videoUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                <div className="video-uploaded-box">
                  <div className="video-file-info">
                    <span className="video-file-name">{displayData.videoName}</span>
                    <span className="video-upload-date">{displayData.videoDate}</span>
                  </div>
                  <div className="video-file-actions">
                    <button
                      type="button"
                      className="btn-video-action delete"
                      onClick={handleDeleteVideo}
                      title="Remove Video"
                    >
                      <FiTrash2 size={15} /> Remove Video
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="video-dropzone"
                onClick={() => videoInputRef.current?.click()}
              >
                <div className="dropzone-icon-circle">
                  <FiVideo size={24} />
                </div>
                <button
                  type="button"
                  className="btn-upload-video"
                  disabled={videoUploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    videoInputRef.current?.click();
                  }}
                >
                  <FiUploadCloud size={16} /> {videoUploading ? 'Uploading Video...' : 'Upload Video'}
                </button>
                <span className="video-hint">
                  Supported formats: MP4, WEBM, OGG, MOV (Up to 50 MB)
                </span>
              </div>
            )}
          </div>

          {/* Key Skills Section */}
          {/* Card: Accomplishments & Strengths */}
          <div className="section-card" id="edit-section-strengths">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <FiAward size={18} /> Accomplishments & Strengths
              </h2>
            </div>

            <p className="section-card-intro">
              Showcase your soft skills, key accomplishments, and workplace strengths to stand out to hiring companies.
            </p>

            {/* Input & Add Row */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-control"
                style={{ flex: 1, minWidth: '220px' }}
                placeholder="e.g. Critical Thinking, Leadership, Problem-Solving..."
                value={strengthInput}
                onChange={e => {
                  setStrengthInput(e.target.value);
                  if (strengthError) setStrengthError('');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddStrength();
                  }
                }}
              />
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '0.55rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                onClick={() => handleAddStrength()}
              >
                <FiPlus size={16} /> Add Strength
              </button>
            </div>

            {strengthError && (
              <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: '0 0 0.75rem 0', fontWeight: 600 }}>
                {strengthError}
              </p>
            )}

            {/* Popular Suggestions */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.45rem' }}>
                Quick Add Suggestions:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {[
                  'Problem-Solving',
                  'Team Collaboration',
                  'Effective Communication',
                  'Adaptability',
                  'Time Management',
                  'Leadership',
                  'Critical Thinking',
                  'Creativity',
                  'Continuous Learning',
                  'Analytical Mindset'
                ]
                  .filter(item => !strengthsList.includes(item))
                  .slice(0, 6)
                  .map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      style={{
                        background: '#f8fafc',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '9999px',
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.78rem',
                        color: '#334155',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => handleAddStrength(item)}
                    >
                      <FiPlus size={12} /> {item}
                    </button>
                  ))}
              </div>
            </div>

            {/* Current Configured Strengths */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {strengthsList.length > 0 ? (
                strengthsList.map((st, i) => (
                  <span
                    key={i}
                    style={{
                      background: '#f0fdf4',
                      color: '#166534',
                      border: '1px solid #bbf7d0',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '9999px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    <span>⭐ {st}</span>
                    <button
                      type="button"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#15803d',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '1rem',
                        lineHeight: 1
                      }}
                      onClick={() => handleRemoveStrength(st)}
                      title={`Remove ${st}`}
                    >
                      <FiX size={14} />
                    </button>
                  </span>
                ))
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                  No strengths added yet. Use the input above to add your key accomplishments.
                </p>
              )}
            </div>
          </div>

          <div className="section-card" id="edit-section-skills">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <FiAward size={18} /> Key Skills
              </h2>
              <button
                className="section-action-link"
                onClick={() => {
                  setSkillsList([...displayData.skills]);
                  setSkillInput('');
                  setSkillError('');
                  setActiveModal('skills');
                }}
              >
                <FiEdit3 size={14} /> {displayData.skills.length > 0 ? 'Edit Skills' : 'Add Skills'}
              </button>
            </div>
            {displayData.skills.length > 0 ? (
              <div className="skills-chips-wrapper">
                {displayData.skills.map((skill, index) => (
                  <span key={index} className="skill-chip">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div
                className="empty-dashed-placeholder"
                onClick={() => {
                  setSkillsList([]);
                  setSkillInput('');
                  setSkillError('');
                  setActiveModal('skills');
                }}
              >
                <FiPlus size={16} /> Add skills (e.g. Java, React, SQL, Spring Boot)
              </div>
            )}
          </div>

          {/* Education Section */}
          <div className="section-card" id="edit-section-education">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <FiBookOpen size={18} /> Education
              </h2>
              <button
                className="section-action-link"
                onClick={openAddEducation}
              >
                <FiPlus size={14} /> Add Education
              </button>
            </div>
            {displayData.education.length > 0 ? (
              <div className="records-list">
                {displayData.education.map(edu => (
                  <div key={edu.id || edu.qualification} className="record-item">
                    <div className="record-content">
                      <h3 className="record-title">{edu.qualification}</h3>
                      <p className="record-subtitle">{edu.institution}</p>
                      {(edu.startYear || edu.endYear || edu.courseType) && (
                        <span className="record-meta">
                          {edu.startYear ? edu.startYear : ''}{edu.endYear ? ` - ${edu.endYear}` : ''}
                          {edu.courseType ? ` | ${edu.courseType}` : ''}
                        </span>
                      )}
                    </div>
                    <div className="record-actions">
                      <button
                        type="button"
                        className="btn-record-edit"
                        onClick={() => openEditEducation(edu)}
                        title="Edit education record"
                      >
                        <FiEdit3 size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-record-delete"
                        onClick={() => handleDeleteEducation(edu.id)}
                        title="Delete education record"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="empty-dashed-placeholder"
                onClick={openAddEducation}
              >
                <FiPlus size={16} /> Add your college degree, school, or certifications
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div className="section-card" id="edit-section-projects">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <FiBriefcase size={18} /> Projects
              </h2>
              <button
                className="section-action-link"
                onClick={openAddProject}
              >
                <FiPlus size={14} /> Add Project
              </button>
            </div>
            {displayData.projects.length > 0 ? (
              <div className="records-list">
                {displayData.projects.map(proj => (
                  <div key={proj.id || proj.name} className="record-item project-card-item">
                    <div className="record-content">
                      <div className="project-item-top">
                        <h3 className="record-title">{proj.name}</h3>
                        <div className="record-actions">
                          <button
                            type="button"
                            className="btn-record-edit"
                            onClick={() => openEditProject(proj)}
                            title="Edit project"
                          >
                            <FiEdit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-record-delete"
                            onClick={() => handleDeleteProject(proj.id)}
                            title="Delete project"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </div>
                      {(proj.clientCompany || proj.startDate || proj.endDate) && (
                        <p className="record-subtitle">
                          {proj.clientCompany} {proj.startDate ? ` | ${proj.startDate} - ${proj.endDate}` : ''}
                        </p>
                      )}
                      {proj.summary && <p className="record-desc">{proj.summary}</p>}
                      {proj.githubUrl && (
                        <a
                          href={normalizeExternalUrl(proj.githubUrl)} onClick={e => e.stopPropagation()}
                          target="_blank"
                          rel="noreferrer"
                          className="project-github-link"
                        >
                          <FiGithub size={14} /> View Repository
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="empty-dashed-placeholder"
                onClick={openAddProject}
              >
                <FiPlus size={16} /> Add projects, case studies, or portfolio items
              </div>
            )}
          </div>

          {/* Internships Section */}
          <div className="section-card" id="edit-section-internships">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <FiBriefcase size={18} /> Internships
              </h2>
              <button
                className="section-action-link"
                onClick={openAddInternship}
              >
                <FiPlus size={14} /> Add Internship
              </button>
            </div>
            {displayData.experiences && displayData.experiences.length > 0 ? (
              <div className="records-list">
                {displayData.experiences.map((exp: any) => (
                  <div key={exp.id || exp.title} className="record-item">
                    <div className="record-content">
                      <h3 className="record-title">{exp.title}</h3>
                      <p className="record-subtitle">{exp.companyName}</p>
                      <span className="record-meta">
                        <FiCalendar size={12} /> {exp.startDate}{exp.isCurrent ? '  –  Present' : (exp.endDate ? `  –  ${exp.endDate}` : '')}
                        {exp.isCurrent && <span className="ongoing-tag">Ongoing</span>}
                      </span>
                      {exp.description && <p className="record-desc">{exp.description}</p>}
                    </div>
                    <div className="record-actions">
                      <button
                        className="btn-record-edit"
                        onClick={() => openEditInternship(exp)}
                        title="Edit internship"
                      >
                        <FiEdit3 size={15} />
                      </button>
                      <button
                        className="btn-record-delete"
                        onClick={() => handleDeleteInternship(exp.id)}
                        title="Delete internship"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="empty-dashed-placeholder"
                onClick={openAddInternship}
              >
                <FiPlus size={16} /> Add your internship details to highlight practical hands-on experience
              </div>
            )}
          </div>

          {/* Resume Section */}
          <div className="section-card" id="edit-section-resume">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <FiFileText size={18} /> Resume
              </h2>
            </div>
            {displayData.resumeName && (
              <div className="resume-uploaded-box">
                <div className="resume-file-info">
                  <span className="resume-file-name">{displayData.resumeName}</span>
                  <span className="resume-upload-date">{displayData.resumeDate}</span>
                </div>
                <div className="resume-file-actions">
                  {displayData.resumeUrl && (
                    <button
                      type="button"
                      className="btn-resume-icon view"
                      title="View Resume"
                      onClick={handleViewResume}
                    >
                      <FiEye size={16} />
                    </button>
                  )}
                  {displayData.resumeUrl && (
                    <a
                      href={displayData.resumeUrl}
                      download={displayData.resumeName || 'Resume.pdf'}
                      className="btn-resume-icon"
                      title="Download Resume"
                    >
                      <FiDownload size={16} />
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn-resume-icon delete"
                    title="Delete Resume"
                    onClick={handleDeleteResume}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            )}
            <div
              className="resume-dropzone"
              onClick={() => resumeInputRef.current?.click()}
            >
              <div className="dropzone-icon-circle">
                <FiUploadCloud size={24} />
              </div>
              <button
                type="button"
                className="btn-update-resume"
                onClick={(e) => {
                  e.stopPropagation();
                  resumeInputRef.current?.click();
                }}
              >
                <FiUploadCloud size={16} /> {displayData.resumeName ? 'Update resume' : 'Upload resume'}
              </button>
              <span className="resume-hint">
                Supported Formats: DOC, DOCX, RTF, PDF (Up to 10 MB)
              </span>
            </div>
          </div>

          {/* Target Role & Work Preferences Section */}
          <div className="section-card" id="edit-section-roles">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <FiBriefcase size={18} /> Target Role & Work Preferences
              </h2>
              <button
                type="button"
                className="section-action-link"
                onClick={openAddRoleModal}
              >
                <FiPlus size={14} /> Add Role Preference
              </button>
            </div>
            {roleInterests.length > 0 ? (
              <div className="records-list">
                {roleInterests.map(r => (
                  <div key={r.id || r.roleId} className="record-item">
                    <div className="record-content">
                      <h3 className="record-title">{r.roleName || 'Target Role'}</h3>
                      <p className="record-subtitle">
                        <span className="role-work-model-badge">{r.workType || 'Remote'}</span>
                        {r.preferredLocation && (
                          <span className="role-location-text">
                             –  {r.preferredLocation}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="record-actions">
                      <button
                        type="button"
                        className="btn-record-delete"
                        onClick={() => handleRemoveRoleInterest(r.id)}
                        title="Remove role preference"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="empty-dashed-placeholder"
                onClick={openAddRoleModal}
              >
                <FiPlus size={16} /> Select desired role titles and work models (Remote / Hybrid / On-site) for recruiter matching
              </div>
            )}
          </div>

          {/* Personal Details Section */}
          <div className="section-card" id="edit-section-personal">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <FiUser size={18} /> Personal Details
              </h2>
              <button
                className="section-action-link"
                onClick={() => {
                  setPersonalForm({
                    gender: displayData.gender || '',
                    dateOfBirth: displayData.dateOfBirth,
                    maritalStatus: displayData.maritalStatus,
                    permanentAddress: displayData.permanentAddress,
                    languages: displayData.languages,
                  });
                  setPersonalErrors({});
                  setActiveModal('personal');
                }}
              >
                <FiEdit3 size={14} /> Edit Details
              </button>
            </div>
            <div className="personal-details-grid">
              <div className="personal-field-item">
                <span className="field-label">Gender</span>
                <span className="field-value">{displayData.gender || 'Not specified'}</span>
              </div>
              <div className="personal-field-item">
                <span className="field-label">Date of Birth</span>
                <span className="field-value">{displayData.dateOfBirth || 'Not specified'}</span>
              </div>
              <div className="personal-field-item">
                <span className="field-label">Marital Status</span>
                <span className="field-value">{displayData.maritalStatus || 'Not specified'}</span>
              </div>
              <div className="personal-field-item">
                <span className="field-label">Languages Known</span>
                <span className="field-value">{displayData.languages || 'Not specified'}</span>
              </div>
              <div className="personal-field-item field-full">
                <span className="field-label">Permanent Address</span>
                <span className="field-value">{displayData.permanentAddress || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          MODALS
      ============================================================ */}

      {/* Basic Details Modal */}
      {activeModal === 'basic' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Basic Details</h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
                  Update your contact details, location and availability
                </p>
              </div>
              <button className="btn-modal-close" onClick={closeModal} title="Close">
                <FiX size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ gap: '1.15rem' }}>
              {/* Row 1: First Name & Last Name in 2 columns */}
              <div className="modal-grid-2col">
                <div className="form-group">
                  <label className="form-label">
                    First Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${basicErrors.firstName ? 'invalid is-invalid' : ''}`}
                    ref={basicFirstInputRef}
                    value={basicForm.firstName}
                    onChange={e => {
                      setBasicForm(f => ({ ...f, firstName: e.target.value }));
                      if (basicErrors.firstName) setBasicErrors(err => ({ ...err, firstName: '' }));
                    }}
                    placeholder="e.g. John"
                  />
                  {basicErrors.firstName && <span className="form-error">{basicErrors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Last Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${basicErrors.lastName ? 'invalid is-invalid' : ''}`}
                    ref={basicLastNameRef}
                    value={basicForm.lastName}
                    onChange={e => {
                      setBasicForm(f => ({ ...f, lastName: e.target.value }));
                      if (basicErrors.lastName) setBasicErrors(err => ({ ...err, lastName: '' }));
                    }}
                    placeholder="e.g. Doe"
                  />
                  {basicErrors.lastName && <span className="form-error">{basicErrors.lastName}</span>}
                </div>
              </div>

              {/* Row 2: Mobile Phone Number */}
              <div className="form-group">
                <label className="form-label">
                  Mobile Phone Number
                </label>
                <input
                  type="text"
                  className={`form-control ${basicErrors.phone ? 'invalid is-invalid' : ''}`}
                  ref={basicPhoneRef}
                  value={basicForm.phone}
                  onChange={e => {
                    setBasicForm(f => ({ ...f, phone: e.target.value }));
                    if (basicErrors.phone) setBasicErrors(err => ({ ...err, phone: '' }));
                  }}
                  placeholder="e.g. +91 9876543210, +91 9123456789"
                />
                <span className="form-hint">You can enter multiple phone numbers separated by commas</span>
                {basicErrors.phone && <span className="form-error">{basicErrors.phone}</span>}
              </div>

              {/* Row 3: Current Location */}
              <div className="form-group">
                <label className="form-label">
                  Current Location / Cities
                </label>
                <input
                  type="text"
                  className={`form-control ${basicErrors.currentLocation ? 'invalid is-invalid' : ''}`}
                  ref={basicLocationRef}
                  value={basicForm.currentLocation}
                  onChange={e => {
                    setBasicForm(f => ({ ...f, currentLocation: e.target.value }));
                    if (basicErrors.currentLocation) setBasicErrors(err => ({ ...err, currentLocation: '' }));
                  }}
                  placeholder="e.g. Hyderabad, India (or multiple: Hyderabad, Bangalore, Remote)"
                />
                <span className="form-hint">Enter your current city or multiple preferred locations</span>
                {basicErrors.currentLocation && <span className="form-error">{basicErrors.currentLocation}</span>}
              </div>

              {/* Row 4: Experience Status & Notice Period in 2 columns */}
              <div className="modal-grid-2col">
                <div className="form-group">
                  <label className="form-label">Experience Status</label>
                  <select
                    className="form-control"
                    value={basicForm.experienceStatus}
                    onChange={e => setBasicForm(f => ({ ...f, experienceStatus: e.target.value }))}
                  >
                    <option value="">Select Experience Level</option>
                    <option value="Fresher">Fresher (0 Years)</option>
                    <option value="1-2 Years">1-2 Years</option>
                    <option value="3-5 Years">3-5 Years</option>
                    <option value="5+ Years">5+ Years</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notice Period / Availability</label>
                  <select
                    className="form-control"
                    value={basicForm.noticePeriod}
                    onChange={e => setBasicForm(f => ({ ...f, noticePeriod: e.target.value }))}
                  >
                    <option value="">Select Availability</option>
                    <option value="Immediate Joiner">Immediate Joiner</option>
                    <option value="Available to join in 15 Days">Available to join in 15 Days</option>
                    <option value="1 Month">1 Month</option>
                    <option value="2 Months">2 Months</option>
                    <option value="3 Months">3 Months</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn-save" onClick={handleSaveBasic} disabled={saving}>
                {saving ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internship Modal */}
      {activeModal === 'internship' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingInternshipId ? 'Edit Internship' : 'Add Internship'}
              </h3>
              <button className="btn-modal-close" onClick={closeModal}>
                <FiX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  Company / Organization Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${internshipErrors.companyName ? 'invalid' : ''}`}
                  value={internshipForm.companyName}
                  onChange={e => {
                    setInternshipForm(f => ({ ...f, companyName: e.target.value }));
                    if (internshipErrors.companyName) setInternshipErrors(prev => ({ ...prev, companyName: '' }));
                  }}
                  placeholder="e.g. Google, Tata Consultancy Services, Infosys, Tech Startup"
                />
                {internshipErrors.companyName && (
                  <span className="form-error">{internshipErrors.companyName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Internship Role / Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${internshipErrors.title ? 'invalid' : ''}`}
                  value={internshipForm.title}
                  onChange={e => {
                    setInternshipForm(f => ({ ...f, title: e.target.value }));
                    if (internshipErrors.title) setInternshipErrors(prev => ({ ...prev, title: '' }));
                  }}
                  placeholder="e.g. Software Engineer Intern, Java Developer Intern, Web Development Intern"
                />
                {internshipErrors.title && (
                  <span className="form-error">{internshipErrors.title}</span>
                )}
              </div>

              <div className="modal-grid-2col">
                <div className="form-group">
                  <label className="form-label">
                    Start Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${internshipErrors.startDate ? 'invalid' : ''}`}
                    value={internshipForm.startDate}
                    onChange={e => {
                      setInternshipForm(f => ({ ...f, startDate: e.target.value }));
                      if (internshipErrors.startDate) setInternshipErrors(prev => ({ ...prev, startDate: '' }));
                    }}
                  />
                  {internshipErrors.startDate && (
                    <span className="form-error">{internshipErrors.startDate}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    End Date {!internshipForm.isCurrent && <span className="required">*</span>}
                  </label>
                  <input
                    type="date"
                    disabled={internshipForm.isCurrent}
                    className={`form-control ${internshipErrors.endDate ? 'invalid' : ''}`}
                    value={internshipForm.isCurrent ? '' : internshipForm.endDate}
                    onChange={e => {
                      setInternshipForm(f => ({ ...f, endDate: e.target.value }));
                      if (internshipErrors.endDate) setInternshipErrors(prev => ({ ...prev, endDate: '' }));
                    }}
                  />
                  {internshipErrors.endDate && (
                    <span className="form-error">{internshipErrors.endDate}</span>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', color: '#374151', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={internshipForm.isCurrent}
                    onChange={e => {
                      const checked = e.target.checked;
                      setInternshipForm(f => ({ ...f, isCurrent: checked, endDate: checked ? '' : f.endDate }));
                      if (checked && internshipErrors.endDate) {
                        setInternshipErrors(prev => ({ ...prev, endDate: '' }));
                      }
                    }}
                    style={{ width: '16px', height: '16px', accentColor: '#70c144' }}
                  />
                  Currently pursuing / working in this internship
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Responsibilities & Key Learnings / Description
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={internshipForm.description}
                  onChange={e => setInternshipForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your role, projects contributed to, technologies utilized, and key achievements..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn-save" onClick={handleSaveInternship} disabled={saving}>
                {saving ? 'Saving...' : 'Save Internship'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skills Modal */}
      {activeModal === 'skills' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Key Skills</h3>
              <button className="btn-modal-close" onClick={closeModal}>
                <FiX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Add a Skill</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className={`form-control ${skillError ? 'invalid' : ''}`}
                    value={skillInput}
                    onChange={e => {
                      setSkillInput(e.target.value);
                      if (skillError) setSkillError('');
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="e.g. React, Java, Docker, Python"
                  />
                  <button type="button" className="btn-save" onClick={handleAddSkill} style={{ width: 'auto', padding: '0.5rem 1.1rem' }}>
                    Add
                  </button>
                </div>
                {skillError && <span className="form-error">{skillError}</span>}
              </div>

              <div className="skills-edit-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                {skillsList.map((skill, index) => (
                  <span key={index} className="skill-edit-chip">
                    {skill}
                    <button
                      type="button"
                      className="btn-chip-remove"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      <FiX size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-save" onClick={closeModal}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Education Modal */}
      {activeModal === 'education' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingEduId ? "Edit Education" : "Add Education"}</h3>
              <button className="btn-modal-close" onClick={closeModal}>
                <FiX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  Qualification / Degree <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${eduErrors.qualification ? 'invalid' : ''}`}
                  value={eduForm.qualification}
                  onChange={e => {
                    setEduForm(f => ({ ...f, qualification: e.target.value }));
                    if (eduErrors.qualification) setEduErrors(err => ({ ...err, qualification: '' }));
                  }}
                  placeholder="e.g. B.Tech Computer Science & Engineering"
                />
                {eduErrors.qualification && <span className="form-error">{eduErrors.qualification}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  School / University / College <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${eduErrors.institution ? 'invalid' : ''}`}
                  value={eduForm.institution}
                  onChange={e => {
                    setEduForm(f => ({ ...f, institution: e.target.value }));
                    if (eduErrors.institution) setEduErrors(err => ({ ...err, institution: '' }));
                  }}
                  placeholder="e.g. MVGR College of Engineering"
                />
                {eduErrors.institution && <span className="form-error">{eduErrors.institution}</span>}
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Starting Year</label>
                  <input
                    type="number"
                    className="form-control"
                    value={eduForm.startYear}
                    onChange={e => setEduForm(f => ({ ...f, startYear: e.target.value }))}
                    placeholder="e.g. 2021"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Completion Year</label>
                  <input
                    type="number"
                    className="form-control"
                    value={eduForm.endYear}
                    onChange={e => setEduForm(f => ({ ...f, endYear: e.target.value }))}
                    placeholder="e.g. 2025"
                  />
                </div>
              </div>
              {eduErrors.years && <span className="form-error">{eduErrors.years}</span>}

              <div className="form-group">
                <label className="form-label">Course Type</label>
                <select
                  className="form-control"
                  value={eduForm.courseType}
                  onChange={e => setEduForm(f => ({ ...f, courseType: e.target.value }))}
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Correspondence / Distance Learning">Correspondence / Distance Learning</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveEducation} disabled={saving}>
                {saving ? 'Saving...' : (editingEduId ? 'Save Changes' : 'Add Education')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {activeModal === 'project' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingProjId ? "Edit Project" : "Add Project"}</h3>
              <button className="btn-modal-close" onClick={closeModal}>
                <FiX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  Project Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${projErrors.name ? 'invalid' : ''}`}
                  value={projForm.name}
                  onChange={e => {
                    setProjForm(f => ({ ...f, name: e.target.value }));
                    if (projErrors.name) setProjErrors(err => ({ ...err, name: '' }));
                  }}
                  placeholder="e.g. E-Commerce Web Application"
                />
                {projErrors.name && <span className="form-error">{projErrors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Client / Organization (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  value={projForm.clientCompany}
                  onChange={e => setProjForm(f => ({ ...f, clientCompany: e.target.value }))}
                  placeholder="e.g. Personal Project / College Project"
                />
              </div>

              <div className="form-group">
                <label className="form-label">GitHub Repository URL</label>
                <input
                  type="url"
                  className={`form-control ${projErrors.githubUrl ? 'invalid' : ''}`}
                  value={projForm.githubUrl}
                  onChange={e => {
                    setProjForm(f => ({ ...f, githubUrl: e.target.value }));
                    if (projErrors.githubUrl) setProjErrors(err => ({ ...err, githubUrl: '' }));
                  }}
                  placeholder="https://github.com/username/project"
                />
                {projErrors.githubUrl && <span className="form-error">{projErrors.githubUrl}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Project Summary & Description <span className="required">*</span>
                </label>
                <textarea
                  className={`form-control ${projErrors.summary ? 'invalid' : ''}`}
                  rows={4}
                  value={projForm.summary}
                  onChange={e => {
                    setProjForm(f => ({ ...f, summary: e.target.value }));
                    if (projErrors.summary) setProjErrors(err => ({ ...err, summary: '' }));
                  }}
                  placeholder="Explain what the project does, key features, architecture, and tech stack used."
                />
                {projErrors.summary && <span className="form-error">{projErrors.summary}</span>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveProject} disabled={saving}>
                {saving ? 'Saving...' : (editingProjId ? 'Save Changes' : 'Add Project')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personal Details Modal */}
      {/* Company Connect Request Modal */}
      {showConnectModal && (
        <div className="modal-overlay" onClick={() => setShowConnectModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h2>Connect with {fullName}</h2>
              <button className="btn-close-modal" onClick={() => setShowConnectModal(false)}><FiX size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1rem' }}>
                Send an introduction or opportunity inquiry to this candidate.
              </p>
              {connectError && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{connectError}</p>
              )}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Target Role Title <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Developer"
                  value={connectForm.roleTitle}
                  onChange={e => setConnectForm(prev => ({ ...prev, roleTitle: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Work Model
                  </label>
                  <select
                    value={connectForm.workType}
                    onChange={e => setConnectForm(prev => ({ ...prev, workType: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="HYBRID">Hybrid</option>
                    <option value="REMOTE">Remote</option>
                    <option value="ONSITE">On-Site</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Company / Job Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad, Bengaluru"
                    value={connectForm.location}
                    onChange={e => setConnectForm(prev => ({ ...prev, location: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Salary / Compensation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹12 - 18 LPA"
                    value={connectForm.salaryRange}
                    onChange={e => setConnectForm(prev => ({ ...prev, salaryRange: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Work Timings / Shift
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9:00 AM - 6:00 PM IST"
                    value={connectForm.workTimings}
                    onChange={e => setConnectForm(prev => ({ ...prev, workTimings: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Experience Required
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2+ Years / Fresher"
                    value={connectForm.experienceRequired}
                    onChange={e => setConnectForm(prev => ({ ...prev, experienceRequired: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    No. of Openings / Members to Hire
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1, 2, 5"
                    value={connectForm.openingsCount}
                    onChange={e => setConnectForm(prev => ({ ...prev, openingsCount: e.target.value }))}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Expected Joining Date
                </label>
                <input
                  type="date"
                  value={connectForm.expectedStart}
                  onChange={e => setConnectForm(prev => ({ ...prev, expectedStart: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Opportunity Summary <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the opportunity, team, and key expectations..."
                  value={connectForm.opportunitySummary}
                  onChange={e => setConnectForm(prev => ({ ...prev, opportunitySummary: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button type="button" className="btn-cancel" onClick={() => setShowConnectModal(false)} disabled={connectSending}>Cancel</button>
              <button
                type="button"
                className="btn-save"
                onClick={async () => {
                  if (!connectForm.roleTitle.trim()) {
                    setConnectError('Please specify the role title for this opportunity.');
                    return;
                  }
                  if (!connectForm.opportunitySummary.trim()) {
                    setConnectError('Please provide an opportunity summary.');
                    return;
                  }
                  setConnectSending(true);
                  try {
                    await connectionsApi.submit({
                      candidateId: routeCandidateId!,
                      roleTitle: connectForm.roleTitle.trim(),
                      opportunitySummary: connectForm.opportunitySummary.trim(),
                      workType: connectForm.workType,
                      location: connectForm.location.trim() || undefined,
                    });
                    setAlertMsg({ type: 'success', text: `Connection request sent to ${fullName}!` });
                    setShowConnectModal(false);
                    setConnectForm({ roleTitle: '', opportunitySummary: '', workType: 'REMOTE', location: '', salaryRange: '', workTimings: '', experienceRequired: '', openingsCount: '1', expectedStart: '' });
                    setConnectError('');
                  } catch (err: any) {
                    setConnectError(err?.response?.data?.message || 'Failed to submit connection request.');
                  } finally {
                    setConnectSending(false);
                  }
                }}
                disabled={connectSending}
              >
                {connectSending ? 'Sending...' : 'Send Connection Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'roles' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>Target Role Preference</h2>
              <button className="btn-close-modal" onClick={closeModal}><FiX size={18} /></button>
            </div>
            <div className="modal-body">
              {roleError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{roleError}</p>}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Target Role <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  list="roles-catalog-list"
                  placeholder="e.g. Full Stack Developer, Frontend Engineer, DevOps Engineer"
                  value={roleForm.roleName}
                  onChange={e => setRoleForm(prev => ({ ...prev, roleName: e.target.value, roleId: '' }))}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                  autoFocus
                />
                {rolesCatalog && rolesCatalog.length > 0 && (
                  <datalist id="roles-catalog-list">
                    {rolesCatalog.map(r => (
                      <option key={r.id} value={r.roleName} />
                    ))}
                  </datalist>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                  {['Full Stack Developer', 'Frontend Engineer', 'Backend Engineer', 'DevOps Engineer', 'Mobile Developer'].map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRoleForm(prev => ({ ...prev, roleName: role, roleId: '' }))}
                      style={{
                        padding: '0.2rem 0.6rem',
                        fontSize: '0.75rem',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        background: roleForm.roleName.toLowerCase() === role.toLowerCase() ? '#047857' : '#f8fafc',
                        color: roleForm.roleName.toLowerCase() === role.toLowerCase() ? '#ffffff' : '#475569',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      + {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Work Model
                </label>
                <select
                  value={roleForm.workType}
                  onChange={e => setRoleForm(prev => ({ ...prev, workType: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                >
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-Site</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Preferred Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore, Hyderabad, Any"
                  value={roleForm.preferredLocation}
                  onChange={e => setRoleForm(prev => ({ ...prev, preferredLocation: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button type="button" className="btn-cancel" onClick={closeModal} disabled={saving}>Cancel</button>
              <button type="button" className="btn-save" onClick={handleSaveRoleInterest} disabled={saving}>
                {saving ? 'Saving...' : 'Save Role Preference'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'personal' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Personal Details</h3>
              <button className="btn-modal-close" onClick={closeModal}>
                <FiX size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  ref={personalGenderRef}
                  className="form-control"
                  value={personalForm.gender || ''}
                  onChange={e => setPersonalForm(f => ({ ...f, gender: e.target.value }))}
                >
                  <option value="">Not specified</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className={`form-control ${personalErrors.dateOfBirth ? 'invalid is-invalid' : ''}`}
                  max={new Date().toLocaleDateString('en-CA')}
                  value={personalForm.dateOfBirth}
                  onChange={e => {
                    const val = e.target.value;
                    const today = new Date().toLocaleDateString('en-CA');
                    if (val && val > today) {
                      setPersonalErrors(err => ({ ...err, dateOfBirth: 'Date of birth cannot be in the future' }));
                    } else {
                      setPersonalErrors(err => {
                        const rest = { ...err };
                        delete rest.dateOfBirth;
                        return rest;
                      });
                    }
                    setPersonalForm(f => ({ ...f, dateOfBirth: val }));
                  }}
                />
                {personalErrors.dateOfBirth && (
                  <span className="form-error">{personalErrors.dateOfBirth}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Marital Status</label>
                <select
                  className="form-control"
                  value={personalForm.maritalStatus}
                  onChange={e => setPersonalForm(f => ({ ...f, maritalStatus: e.target.value }))}
                >
                  <option value="">Select Status</option>
                  <option value="Single / Unmarried">Single / Unmarried</option>
                  <option value="Married">Married</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Languages Known</label>
                <input
                  type="text"
                  className="form-control"
                  value={personalForm.languages}
                  onChange={e => setPersonalForm(f => ({ ...f, languages: e.target.value }))}
                  placeholder="e.g. English, Hindi, Telugu"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Permanent Address</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={personalForm.permanentAddress}
                  onChange={e => setPersonalForm(f => ({ ...f, permanentAddress: e.target.value }))}
                  placeholder="e.g. Flat 302, Green Meadows, Hyderabad, Andhra Pradesh, India"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSavePersonal} disabled={saving}>
                {saving ? 'Saving...' : 'Save Personal Details'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {(view === 'profile' || isReadOnly) ? renderProfileView() : renderEditView()}
      {showPhotoModal && (
        <div className="photo-modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="photo-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="photo-modal-header">
              <h3>Profile Photo</h3>
              <button
                type="button"
                className="photo-modal-close"
                onClick={() => setShowPhotoModal(false)}
                title="Close"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="photo-modal-body">
              {displayData.avatarUrl ? (
                <img
                  src={displayData.avatarUrl}
                  alt={fullName}
                  className="photo-modal-img"
                />
              ) : (
                <div className="photo-modal-placeholder">
                  <span>{candidateInitials}</span>
                </div>
              )}
            </div>

            {!isReadOnly && (
              <div className="photo-modal-footer">
                <button
                  type="button"
                  className="photo-action-btn photo-btn-change"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <FiCamera size={16} /> Change Photo
                </button>
                {displayData.avatarUrl ? (
                  <button
                    type="button"
                    className="photo-action-btn photo-btn-remove"
                    onClick={handleRemovePhoto}
                  >
                    <FiTrash2 size={16} /> Remove Photo
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CandidateProfilePage;
