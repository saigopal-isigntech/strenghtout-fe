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
  const [connectForm, setConnectForm] = useState({
    roleTitle: '',
    opportunitySummary: '',
    workType: 'REMOTE',
    location: '',
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

  const [eduForm, setEduForm] = useState({
    qualification: '',
    institution: '',
    fieldOfStudy: '',
    startYear: '',
    endYear: '',
    courseType: 'Full Time',
  });
  const [eduErrors, setEduErrors] = useState<Record<string, string>>({});

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
        email: p.email || (isExternalView ? 'saicharan@gmail.com' : (user?.email || '')),
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
        } catch {
          setAlertMsg({ type: 'error', text: 'Failed to save photo to server.' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerPhotoInput = () => {
    if (isReadOnly) return;
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
    if ((displayData.completionPct ?? 0) < 50) {
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
        githubUrl: projForm.githubUrl.trim(),
        demoUrl: projForm.demoUrl.trim(),
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
  const emailText = displayData.email || (isExternalView ? 'saicharan@gmail.com' : (user?.email || 'saicharan@gmail.com'));
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
  // PROFILE VIEW (Clean Modern Card View)
  // ========================
  const renderProfileView = () => (
    <div className="profile-page-wrapper">
      <div className="profile-container">
        {/* Hidden file input for changing candidate photo */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />

        {/* Top action bar */}
        {previewMode && (
          <div style={{ background: '#2563eb', color: '#ffffff', padding: '0.85rem 1.25rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>
              ?? <strong>Company-Facing Preview Mode:</strong> This is how registered recruiters and companies view your verified profile.
            </span>
            <button
              onClick={() => setPreviewMode(false)}
              style={{ background: '#ffffff', color: '#1d4ed8', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Exit Preview
            </button>
          </div>
        )}

        {isExternalView ? (
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-toggle-edit"
              onClick={() => {
                if (user?.role === 'ROLE_COMPANY') navigate('/discover');
                else if (user?.role?.includes('ADMIN')) navigate('/admin/users');
                else navigate(-1);
              }}
              style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600 }}
            >
              <FiArrowLeft size={16} />
              {user?.role === 'ROLE_COMPANY' ? 'Back to Discover' : 'Back to Candidates'}
            </button>

            {user?.role === 'ROLE_COMPANY' && (
              <button
                type="button"
                className="btn-toggle-edit"
                onClick={() => setShowConnectModal(true)}
                style={{ background: '#70c144', color: '#ffffff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', borderRadius: '8px', fontWeight: 700, boxShadow: '0 2px 8px rgba(112, 193, 68, 0.35)' }}
              >
                <FiUserPlus size={16} />
                Connect with Candidate
              </button>
            )}
          </div>
        ) : (
          <div className="profile-action-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="btn-toggle-edit" onClick={() => goToEdit()}>
                <FiEdit3 size={15} />
                Edit Profile Details
              </button>
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              style={{ background: previewMode ? '#1e293b' : '#ede9fe', color: previewMode ? '#fff' : '#6366f1', border: 'none', padding: '0.55rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <FiEye size={15} /> {previewMode ? 'Back to Editor' : 'Company Preview'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {displayData.visibilityStatus === 'PUBLISHED' ? (
              <>
                <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FiCheckCircle size={14} /> PUBLISHED
                </span>
                <button
                  type="button"
                  onClick={handleUnpublish}
                  disabled={publishing}
                  style={{ background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.45rem 0.9rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {publishing ? 'Updating...' : 'Unpublish'}
                </button>
              </>
            ) : (
              <>
                <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 700 }}>
                  DRAFT
                </span>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing || (displayData.completionPct ?? 0) < 50}
                  style={{
                    background: (displayData.completionPct ?? 0) >= 50 ? '#16a34a' : '#94a3b8',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem 1.1rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: (displayData.completionPct ?? 0) >= 50 ? 'pointer' : 'not-allowed',
                    boxShadow: (displayData.completionPct ?? 0) >= 50 ? '0 2px 8px rgba(22, 163, 74, 0.3)' : 'none'
                  }}
                  title={(displayData.completionPct ?? 0) < 50 ? 'Complete at least 50% of your profile to publish' : 'Publish profile to Discovery'}
                >
                  {publishing ? 'Publishing...' : 'Publish to Discovery'}
                </button>
              </>
            )}
          </div>
        </div>
        )}

        {alertMsg && (
          <div className={`profile-alert ${alertMsg.type}`}>
            <span>{alertMsg.text}</span>
            <button onClick={() => setAlertMsg(null)} className="btn-alert-close">
              <FiX size={16} />
            </button>
          </div>
        )}

        {/* Header Card */}
        <div className="pv-header-card">
          <div className="profile-header-left">
            <div
              className="avatar-progress-container"
              onClick={isReadOnly ? undefined : triggerPhotoInput}
              style={{ cursor: isReadOnly ? 'default' : 'pointer' }}
              title={isReadOnly ? fullName : 'Click to Change Photo'}
            >
              <div
                className="avatar-progress-ring"
                style={{ '--progress': `${displayData.completionPct}%` } as React.CSSProperties}
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
                {!isReadOnly && (
                <div className="avatar-photo-overlay" title="Change Profile Photo">
                  <FiCamera size={20} />
                  <span>{displayData.avatarUrl ? 'Change' : 'Add Photo'}</span>
                </div>
              )}
              </div>
              <span className="avatar-completion-badge">{displayData.completionPct}%</span>
              {!isReadOnly && (
                <div className="btn-avatar-camera" title="Click to Change Photo">
                  <FiCamera size={14} />
                </div>
              )}
            </div>

            <div className="pv-header-info">
              <div className="header-name-row">
                <h1 className="pv-candidate-name">{fullName}</h1>
                {!isReadOnly && (
                  <button className="btn-icon-edit" onClick={goToEdit} title="Edit Profile">
                    <FiEdit3 size={18} />
                  </button>
                )}
              </div>
              <p className="pv-last-updated">{lastUpdatedDisplay}</p>

              <div className="pv-detail-grid">
                <span className={`pv-detail-item ${displayData.currentLocation ? 'filled' : 'empty'}`}>
                  <FiMapPin className="detail-icon" /> {displayData.currentLocation || 'Location not specified'}
                </span>
                <span className={`pv-detail-item ${isCompanyView ? 'filled' : (displayData.phone ? 'filled' : 'empty')}`}>
                  <FiPhone className="detail-icon" /> {isCompanyView ? 'Available upon connection' : (displayData.phone || 'Phone not specified')}
                  {(!isCompanyView && displayData.phone) && <FiCheckCircle size={13} className="verified-badge" />}
                </span>
                <span className={`pv-detail-item ${displayData.experienceStatus ? 'filled' : 'empty'}`}>
                  <FiBriefcase className="detail-icon" /> {displayData.experienceStatus || 'Experience not specified'}
                </span>
                <span className="pv-detail-item filled email-item">
                  <FiMail className="detail-icon" />{' '}
                  {isCompanyView
                    ? 'Available upon connection'
                    : (emailText.length > 22 ? emailText.substring(0, 20) + '...' : emailText)}{' '}
                  {!isCompanyView && <FiCheckCircle size={13} className="verified-badge" />}
                </span>
                <span className={`pv-detail-item ${displayData.noticePeriod ? 'filled' : 'empty'}`}>
                  <FiCalendar className="detail-icon" /> {displayData.noticePeriod || 'Availability not specified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="pv-cards-grid">
          {/* Card: Myself / Intro video */}
          <div className="pv-dark-card">
            <div className="pv-card-header-row">
              <h2 className="pv-card-title">
                <FiVideo size={18} /> Myself / Introduction Video
              </h2>
              {!isReadOnly && (
                <button className="section-action-link" onClick={goToEdit}>
                  <FiEdit3 size={13} /> {displayData.videoUrl ? 'Edit Video' : 'Upload Video'}
                </button>
              )}
            </div>
            {displayData.videoUrl ? (
              <>
                <div className="pv-video-wrap">
                  <video
                    className="pv-video"
                    controls
                    src={displayData.videoUrl}
                    key={displayData.videoUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                {displayData.videoName && (
                  <div className="video-file-info" style={{ marginTop: '0.5rem' }}>
                    <span className="video-file-name">{displayData.videoName}</span>
                    {displayData.videoDate && <span className="video-upload-date">{displayData.videoDate}</span>}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-section-card" onClick={isReadOnly ? undefined : goToEdit} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
                <FiVideo size={30} className="empty-section-icon" />
                <p className="empty-section-title">No Introduction Video Uploaded</p>
                <p className="empty-section-desc">{isReadOnly ? 'The candidate has not uploaded an introduction video yet.' : 'Record or upload a 1-minute video pitch showcasing your personality and strengths.'}</p>
                {!isReadOnly && (
                  <button className="btn-empty-action" onClick={goToEdit} type="button">
                    <FiUploadCloud size={14} /> Upload Video
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card: Key Skills */}
          <div className="pv-dark-card">
            <div className="pv-card-header-row">
              <h2 className="pv-card-title">
                <FiAward size={18} /> Key Skills
              </h2>
              {!isReadOnly && (
                <button className="section-action-link" onClick={goToEdit}>
                  <FiEdit3 size={13} /> {displayData.skills.length > 0 ? 'Edit Skills' : 'Add Skills'}
                </button>
              )}
            </div>
            {displayData.skills.length > 0 ? (
              <div className="pv-skills-list">
                {displayData.skills.map((skill, i) => (
                  <span key={i} className="pv-skill-badge">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="empty-section-card" onClick={isReadOnly ? undefined : goToEdit} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
                <FiAward size={30} className="empty-section-icon" />
                <p className="empty-section-title">No Skills Added Yet</p>
                <p className="empty-section-desc">{isReadOnly ? 'No technical skills listed yet.' : 'Add technical skills, tools, and languages to boost discoverability by recruiters.'}</p>
                {!isReadOnly && (
                  <button className="btn-empty-action" onClick={goToEdit} type="button">
                    <FiPlus size={14} /> Add Skills
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card: Education */}
          <div className="pv-dark-card">
            <div className="pv-card-header-row">
              <h2 className="pv-card-title">
                <FiBookOpen size={18} /> Education
              </h2>
              {!isReadOnly && (
                <button className="section-action-link" onClick={goToEdit}>
                  <FiPlus size={13} /> Add Education
                </button>
              )}
            </div>
            {displayData.education.length > 0 ? (
              <ul className="pv-edu-list">
                {displayData.education.map(edu => (
                  <li key={edu.id || edu.qualification} className="pv-edu-item">
                    <span className="pv-edu-degree">{edu.qualification}</span>
                    <span className="pv-edu-inst">{edu.institution}</span>
                    {(edu.startYear || edu.endYear || edu.courseType) && (
                      <span className="pv-edu-year">
                        {edu.startYear ? edu.startYear : ''}{edu.endYear ? ` - ${edu.endYear}` : ''}
                        {edu.courseType ? ` | ${edu.courseType}` : ''}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-section-card" onClick={isReadOnly ? undefined : goToEdit} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
                <FiBookOpen size={30} className="empty-section-icon" />
                <p className="empty-section-title">No Education Added</p>
                <p className="empty-section-desc">{isReadOnly ? 'No education records provided.' : 'Add your degrees, certifications, institutions, and graduation timeline.'}</p>
                {!isReadOnly && (
                  <button className="btn-empty-action" onClick={goToEdit} type="button">
                    <FiPlus size={14} /> Add Education
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card: Projects */}
          <div className="pv-dark-card">
            <div className="pv-card-header-row">
              <h2 className="pv-card-title">
                <FiBriefcase size={18} /> Projects
              </h2>
              {!isReadOnly && (
                <button className="section-action-link" onClick={goToEdit}>
                  <FiPlus size={13} /> Add Project
                </button>
              )}
            </div>
            {displayData.projects.length > 0 ? (
              <ul className="pv-proj-list">
                {displayData.projects.map(proj => {
                  const pid = proj.id || proj.name;
                  const expanded = expandedProjects[pid] || false;
                  return (
                    <li key={pid} className="pv-proj-item">
                      <span className="pv-proj-name">{proj.name}</span>
                      {(proj.clientCompany || proj.startDate || proj.endDate) && (
                        <span className="pv-proj-meta">
                          {proj.clientCompany} {proj.startDate ? ` | ${proj.startDate} - ${proj.endDate}` : ''}
                        </span>
                      )}
                      {proj.summary && (
                        <span className="pv-proj-desc">
                          {expanded || proj.summary.length <= 120
                            ? proj.summary
                            : proj.summary.substring(0, 120) + '... '}
                          {proj.summary.length > 120 && (
                            <button
                              className="pv-read-more"
                              onClick={() => toggleProjectExpand(pid)}
                            >
                              {expanded ? 'Read Less' : 'Read More'}
                            </button>
                          )}
                        </span>
                      )}
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="pv-proj-link"
                        >
                          <FiGithub size={13} /> Repository
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="empty-section-card" onClick={isReadOnly ? undefined : goToEdit} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
                <FiBriefcase size={30} className="empty-section-icon" />
                <p className="empty-section-title">No Projects Added</p>
                <p className="empty-section-desc">{isReadOnly ? 'No projects added yet.' : 'Showcase academic and independent projects with summaries and GitHub links.'}</p>
                {!isReadOnly && (
                  <button className="btn-empty-action" onClick={goToEdit} type="button">
                    <FiPlus size={14} /> Add Project
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card: Internships */}
          <div className="pv-dark-card pv-card-span2">
            <div className="pv-card-header-row">
              <h2 className="pv-card-title">
                <FiBriefcase size={18} /> Internships
              </h2>
              {!isReadOnly && (
                <button className="section-action-link" onClick={goToEdit}>
                  <FiPlus size={13} /> Add Internship
                </button>
              )}
            </div>
            {displayData.experiences && displayData.experiences.length > 0 ? (
              <ul className="pv-exp-list">
                {displayData.experiences.map((exp: any) => (
                  <li key={exp.id || exp.title} className="pv-exp-item">
                    <div className="pv-exp-header">
                      <span className="pv-exp-title">{exp.title}</span>
                      <span className="pv-exp-company">{exp.companyName}</span>
                    </div>
                    <div className="pv-exp-meta">
                      <span className="pv-exp-date">
                        <FiCalendar size={12} /> {exp.startDate}{exp.isCurrent ? ' � Present' : (exp.endDate ? ` � ${exp.endDate}` : '')}
                      </span>
                      {exp.isCurrent && <span className="pv-exp-badge">Ongoing</span>}
                    </div>
                    {exp.description && (
                      <p className="pv-exp-desc">{exp.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-section-card" onClick={isReadOnly ? undefined : goToEdit} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
                <FiBriefcase size={30} className="empty-section-icon" />
                <p className="empty-section-title">No Internships Added</p>
                <p className="empty-section-desc">{isReadOnly ? 'No internships provided.' : 'Add your past internships, organization names, roles, and project learnings to highlight practical experience.'}</p>
                {!isReadOnly && (
                  <button className="btn-empty-action" onClick={goToEdit} type="button">
                    <FiPlus size={14} /> Add Internship
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card: Accomplishments & Strengths */}
          <div className="pv-dark-card">
            <h2 className="pv-card-title">Accomplishments & Strengths</h2>
            <div className="pv-strengths-grid">
              <span className="pv-strength-pill">Problem-Solving</span>
              <span className="pv-strength-pill">Team Collaboration</span>
              <span className="pv-strength-pill">Effective Communication</span>
              <span className="pv-strength-pill">Adaptability</span>
              <span className="pv-strength-pill">Time Management</span>
            </div>
          </div>

          {/* Card: Resume */}
          <div className="pv-dark-card pv-card-span2">
            <div className="pv-card-header-row">
              <h2 className="pv-card-title">
                <FiFileText size={18} /> Resume
              </h2>
              {!isReadOnly && (
                <button className="section-action-link" onClick={goToEdit}>
                  <FiEdit3 size={13} /> {displayData.resumeName ? 'Update Resume' : 'Upload Resume'}
                </button>
              )}
            </div>
            {displayData.resumeName ? (
              <div className="resume-uploaded-box" style={{ margin: 0 }}>
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
                </div>
              </div>
            ) : (
              <div className="empty-section-card" onClick={isReadOnly ? undefined : goToEdit} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
                <FiUploadCloud size={30} className="empty-section-icon" />
                <p className="empty-section-title">No Resume Uploaded</p>
                <p className="empty-section-desc">{isReadOnly ? 'No resume attached.' : 'Upload your PDF or DOCX resume to enable quick company applications.'}</p>
                {!isReadOnly && (
                  <button className="btn-empty-action" onClick={goToEdit} type="button">
                    <FiUploadCloud size={14} /> Upload Resume
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card: Target Role Preferences */}
          <div className="pv-dark-card pv-card-span2">
            <div className="pv-card-header-row">
              <h2 className="pv-card-title">
                <FiBriefcase size={18} /> Target Role & Work Preferences
              </h2>
              {!isReadOnly && (
                <button className="section-action-link" onClick={openAddRoleModal}>
                  <FiPlus size={13} /> Add Role Preference
                </button>
              )}
            </div>
            {roleInterests.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {roleInterests.map(r => (
                  <div key={r.id || r.roleId} style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>{r.roleName || 'Target Role'}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {r.workType || 'Remote'} {r.preferredLocation ? `� ${r.preferredLocation}` : ''}
                      </span>
                    </div>
                    {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRoleInterest(r.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      title="Remove Role Preference"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-section-card" onClick={isReadOnly ? undefined : openAddRoleModal} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
                <FiBriefcase size={30} className="empty-section-icon" />
                <p className="empty-section-title">No Target Roles Configured</p>
                <p className="empty-section-desc">{isReadOnly ? 'No target role preferences configured.' : 'Select desired role titles and work models (Remote / Hybrid / On-site) for recruiter matching.'}</p>
                {!isReadOnly && (
                  <button className="btn-empty-action" type="button">
                    <FiPlus size={14} /> Add Role Preference
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card: Verified Evidence & RightPath Assessments */}
          <div className="pv-dark-card pv-card-span2">
            <div className="pv-card-header-row">
              <h2 className="pv-card-title">
                <FiCheckCircle size={18} color="#16a34a" /> Verified Assessment Evidence (RightPath)
              </h2>
            </div>
            {evidencesList.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
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
                      ? Verified by {ev.sourceSystem || 'RightPath'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
                  No external RightPath assessment evidence linked yet. Complete verified assessments on RightPath to showcase authentic evidence badges to companies.
                </p>
              </div>
            )}
          </div>

          {/* Card: Personal Details */}
          <div className="pv-dark-card pv-card-span2">
            <div className="pv-card-header-row">
              <h2 className="pv-card-title">
                <FiUser size={18} /> Personal Details
              </h2>
              {!isReadOnly && (
                <button className="section-action-link" onClick={goToEdit}>
                  <FiEdit3 size={13} /> Edit Details
                </button>
              )}
            </div>
            {isCompanyView ? (
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', color: '#334155', fontWeight: 600, fontSize: '0.92rem' }}>
                  <FiUser size={16} color="#70c144" />
                  <span>Personal Details Protected</span>
                </div>
                <p style={{ margin: '0 0 0.85rem', fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>
                  Candidate personal details (Date of Birth, Marital Status, Permanent Address, and direct personal contact details) are kept private to protect candidate confidentiality until a connection request is accepted.
                </p>
                <div className="pv-personal-grid">
                  <div className="pv-personal-field">
                    <span className="pv-label">Languages Known</span>
                    <span className="pv-val">{displayData.languages || 'English'}</span>
                  </div>
                  <div className="pv-personal-field">
                    <span className="pv-label">Current Location</span>
                    <span className="pv-val">{displayData.currentLocation || 'Location on file'}</span>
                  </div>
                  <div className="pv-personal-field">
                    <span className="pv-label">Work Eligibility</span>
                    <span className="pv-val">Verified Candidate</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pv-personal-grid">
                <div className="pv-personal-field">
                  <span className="pv-label">Gender</span>
                  <span className="pv-val">{displayData.gender || 'Not specified'}</span>
                </div>
                <div className="pv-personal-field">
                  <span className="pv-label">Date of Birth</span>
                  <span className="pv-val">{displayData.dateOfBirth || 'Not specified'}</span>
                </div>
                <div className="pv-personal-field">
                  <span className="pv-label">Marital Status</span>
                  <span className="pv-val">{displayData.maritalStatus || 'Not specified'}</span>
                </div>
                <div className="pv-personal-field">
                  <span className="pv-label">Languages Known</span>
                  <span className="pv-val">{displayData.languages || 'Not specified'}</span>
                </div>
                <div className="pv-personal-field" style={{ gridColumn: '1 / -1' }}>
                  <span className="pv-label">Permanent Address</span>
                  <span className="pv-val">{displayData.permanentAddress || 'Not specified'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ========================
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
        <div className="profile-top-nav">
          <button className="btn-back-to-profile" onClick={goToProfile}>
            <FiArrowLeft size={16} /> Back to Profile
          </button>
        </div>

        {alertMsg && (
          <div className={`profile-alert ${alertMsg.type}`}>
            <span>{alertMsg.text}</span>
            <button onClick={() => setAlertMsg(null)} className="btn-alert-close">
              <FiX size={16} />
            </button>
          </div>
        )}

        {/* Edit Header Card */}
        <div className="profile-header-card">
          <div className="profile-header-left">
            <div
              className="avatar-progress-container"
              onClick={triggerPhotoInput}
              title="Click to Change Photo"
            >
              <div
                className="avatar-progress-ring"
                style={{ '--progress': `${displayData.completionPct}%` } as React.CSSProperties}
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
              <span className="avatar-completion-badge">{displayData.completionPct}%</span>
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
        </div>

        {/* Main Section Stack */}
        <div className="profile-sections-stack">
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
                onClick={() => {
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
                }}
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
                    <button
                      className="btn-record-delete"
                      onClick={() => handleDeleteEducation(edu.id)}
                      title="Delete education record"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="empty-dashed-placeholder"
                onClick={() => {
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
                }}
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
                onClick={() => {
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
                }}
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
                        <button
                          className="btn-record-delete"
                          onClick={() => handleDeleteProject(proj.id)}
                          title="Delete project"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                      {(proj.clientCompany || proj.startDate || proj.endDate) && (
                        <p className="record-subtitle">
                          {proj.clientCompany} {proj.startDate ? ` | ${proj.startDate} - ${proj.endDate}` : ''}
                        </p>
                      )}
                      {proj.summary && <p className="record-desc">{proj.summary}</p>}
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
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
                onClick={() => {
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
                }}
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
                        <FiCalendar size={12} /> {exp.startDate}{exp.isCurrent ? ' � Present' : (exp.endDate ? ` � ${exp.endDate}` : '')}
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
                            � {r.preferredLocation}
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
                    gender: displayData.gender,
                    dateOfBirth: displayData.dateOfBirth,
                    maritalStatus: displayData.maritalStatus,
                    permanentAddress: displayData.permanentAddress,
                    languages: displayData.languages,
                  });
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
              <h3 className="modal-title">Add Education</h3>
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
                {saving ? 'Saving...' : 'Save Education'}
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
              <h3 className="modal-title">Add Project</h3>
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
                {saving ? 'Saving...' : 'Save Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personal Details Modal */}
      {/* Company Connect Request Modal */}
      {showConnectModal && (
        <div className="modal-overlay" onClick={() => setShowConnectModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
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
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Work Model
                </label>
                <select
                  value={connectForm.workType}
                  onChange={e => setConnectForm(prev => ({ ...prev, workType: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-Site</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore, Hyderabad, Remote"
                  value={connectForm.location}
                  onChange={e => setConnectForm(prev => ({ ...prev, location: e.target.value }))}
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
                    setConnectForm({ roleTitle: '', opportunitySummary: '', workType: 'REMOTE', location: '' });
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
                  className="form-control"
                  value={personalForm.gender}
                  onChange={e => setPersonalForm(f => ({ ...f, gender: e.target.value }))}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-control"
                  value={personalForm.dateOfBirth}
                  onChange={e => setPersonalForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                />
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

  return (view === 'profile' || isReadOnly) ? renderProfileView() : renderEditView();
};

export default CandidateProfilePage;
