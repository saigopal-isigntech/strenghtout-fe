import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { candidatesApi } from '../../api/candidates';
import profileImg from '../../assets/image.png';
import udayVideo from '../../assets/Uday video.mp4';
import {
  validateRequired,
  validatePhone,
  validateUrl,
  validateYearRange,
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
  FiPlayCircle,
  FiFileText,
  FiAward,
  FiUser,
  FiInfo,
  FiAlertCircle,
} from 'react-icons/fi';
import type { CandidateProfile, CandidateEducation, CandidateProject } from '../../types';

const DEFAULT_SKILLS = [
  'HTML',
  'CSS',
  'Javascript',
  'Java',
  'Bootstrap',
  'Angular',
  'React.js',
  'Node.js',
  'Express',
  'MySQL',
  'MongoDB',
];

const DEFAULT_EDUCATION: CandidateEducation[] = [
  {
    id: 'default-edu-1',
    qualification: 'B.Tech / B.E. Electronics and Telecommunication',
    institution: 'MVGR College of Engineering, Vizianagaram',
    startYear: 2021,
    endYear: 2025,
    courseType: 'Full Time',
  },
  {
    id: 'default-edu-2',
    qualification: 'Class XII',
    institution: 'Andhra Pradesh',
    startYear: 2021,
    endYear: 2021,
    courseType: 'Full Time',
  },
  {
    id: 'default-edu-3',
    qualification: 'Class X',
    institution: 'Andhra Pradesh',
    startYear: 2019,
    endYear: 2019,
    courseType: 'Full Time',
  },
];

const DEFAULT_PROJECTS: CandidateProject[] = [
  {
    id: 'default-proj-1',
    name: 'E-Commerce Web Application',
    clientCompany: 'grow tech (Offsite)',
    startDate: 'Mar 2026',
    endDate: 'Apr 2026',
    startDateStr: 'Mar 2026',
    endDateStr: 'Apr 2026',
    workType: 'Full Time',
    githubUrl: 'https://github.com',
    summary:
      'Developed a full-featured E-Commerce Web Application using Angular, Node.js, Express.js, and MongoDB to provide a complete online shopping experience with separate user and admin modules. Implemented secure user authentication with login validation and role-based access control for Users.',
  },
  {
    id: 'default-proj-2',
    name: 'Uber Operational Analytics Dashboard',
    clientCompany: '(Offsite)',
    startDate: 'Aug 2025',
    endDate: 'Dec 2025',
    startDateStr: 'Aug 2025',
    endDateStr: 'Dec 2025',
    workType: 'Full Time',
    githubUrl: 'https://github.com',
    summary:
      'Worked as a Data Analyst Intern where I collected, cleaned, and validated raw datasets for business analysis. Performed data analysis using SQL, Excel, and Python to identify trends, patterns, and customer behavior. Created interactive dashboards using Power BI and Tableau to visualize metrics.',
  },
];

const CandidateProfilePage: React.FC = () => {
  const { user, isAuthenticated, updateUserAvatar } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // view = 'profile' | 'edit'
  const [view, setView] = useState<'profile' | 'edit'>('edit');
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  // ---- Live display state ----
  const [displayData, setDisplayData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    currentLocation: '',
    experienceStatus: 'Fresher',
    noticePeriod: 'Available to join in 15 Days',
    headline: '',
    summary: '',
    skills: [] as string[],
    education: [] as CandidateEducation[],
    projects: [] as CandidateProject[],
    gender: 'Male',
    dateOfBirth: '2003-08-15',
    maritalStatus: 'Single',
    permanentAddress: 'Andhra Pradesh, India',
    languages: 'English, Hindi, Telugu',
    linkedinUrl: '',
    portfolioUrl: '',
    avatarUrl: '',
    completionPct: 90,
    resumeName: 'Sample_Java_Developer_Resume (1).pdf',
    resumeDate: 'Uploaded on Sep 17, 2026',
    resumeUrl: '',
    videoName: '',
    videoDate: '',
    videoUrl: '',
  });

  // ---- Modal form states & validation errors ----
  const [basicForm, setBasicForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    currentLocation: '',
    experienceStatus: 'Fresher',
    noticePeriod: 'Available to join in 15 Days',
  });
  const [basicErrors, setBasicErrors] = useState<Record<string, string>>({});

  const [headlineText, setHeadlineText] = useState('');
  const [headlineError, setHeadlineError] = useState('');

  const [summaryText, setSummaryText] = useState('');
  const [summaryError, setSummaryError] = useState('');

  const [skillInput, setSkillInput] = useState('');
  const [skillError, setSkillError] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>([]);

  const [eduForm, setEduForm] = useState({
    qualification: '',
    institution: '',
    fieldOfStudy: '',
    startYear: 2021,
    endYear: 2025,
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
    startDate: 'Mar 2026',
    endDate: 'Apr 2026',
  });
  const [projErrors, setProjErrors] = useState<Record<string, string>>({});

  const [personalForm, setPersonalForm] = useState({
    gender: 'Male',
    dateOfBirth: '2003-08-15',
    maritalStatus: 'Single',
    permanentAddress: 'Andhra Pradesh, India',
    languages: 'English, Hindi, Telugu',
  });
  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({});

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await candidatesApi.getMyProfile();
      const p: CandidateProfile =
        res.data && (res.data as any).data ? (res.data as any).data : (res.data as any);

      const userFirstName = user?.fullName ? user.fullName.split(' ')[0] : 'Sai Gopal';
      const userLastName = user?.fullName
        ? user.fullName.split(' ').slice(1).join(' ')
        : 'Machepalli';

      const pSkills =
        Array.isArray(p.skills) && p.skills.length
          ? p.skills.map((s: any) => (typeof s === 'string' ? s : s.skillName || s.name))
          : DEFAULT_SKILLS;

      const pEducation =
        Array.isArray(p.education) && p.education.length
          ? p.education.map((e: any) => ({
              id: e.id ? String(e.id) : undefined,
              qualification: e.qualification || '',
              institution: e.institution || '',
              fieldOfStudy: e.fieldOfStudy || '',
              startYear: e.startYear || 2021,
              endYear: e.endYear || 2025,
              courseType: e.courseType || 'Full Time',
            }))
          : DEFAULT_EDUCATION;

      const pProjects =
        Array.isArray(p.projects) && p.projects.length
          ? p.projects.map((pr: any) => ({
              id: pr.id ? String(pr.id) : undefined,
              name: pr.name || '',
              clientCompany: pr.clientCompany || 'grow tech (Offsite)',
              workType: pr.workType || 'Full Time',
              summary: pr.summary || '',
              githubUrl: pr.githubUrl || 'https://github.com',
              demoUrl: pr.demoUrl || '',
              startDate: pr.startDateStr || (typeof pr.startDate === 'string' ? pr.startDate : 'Mar 2026'),
              endDate: pr.endDateStr || (typeof pr.endDate === 'string' ? pr.endDate : 'Apr 2026'),
              startDateStr: pr.startDateStr || (typeof pr.startDate === 'string' ? pr.startDate : 'Mar 2026'),
              endDateStr: pr.endDateStr || (typeof pr.endDate === 'string' ? pr.endDate : 'Apr 2026'),
            }))
          : DEFAULT_PROJECTS;

      const parsedLanguages = Array.isArray(p.languages)
        ? p.languages.join(', ')
        : (p.languages as string) || 'English, Hindi, Telugu';

      setDisplayData({
        firstName: p.firstName || userFirstName,
        lastName: p.lastName || userLastName,
        phone: p.phone || '9398804186',
        currentLocation: p.currentLocation || p.location || 'Hyderabad, INDIA',
        experienceStatus: p.experienceStatus || 'Fresher',
        noticePeriod: p.noticePeriod || p.availability || 'Available to join in 15 Days',
        headline:
          p.headline ||
          'Results-driven Full Stack Developer skilled in Angular, Node.js, Express.js, MongoDB, SQL, and Power BI with experience in building scalable web applications and data-driven dashboards.',
        summary:
          p.summary ||
          p.bio ||
          'Enthusiastic full-stack engineer passionate about building high-performance web applications.',
        skills: pSkills,
        education: pEducation,
        projects: pProjects,
        gender: p.gender || 'Male',
        dateOfBirth: p.dateOfBirth || '2003-08-15',
        maritalStatus: p.maritalStatus || 'Single',
        permanentAddress: p.permanentAddress || 'Andhra Pradesh, India',
        languages: parsedLanguages,
        linkedinUrl: p.linkedinUrl || 'https://linkedin.com',
        portfolioUrl: p.portfolioUrl || 'https://github.com',
        avatarUrl: p.avatarUrl || '',
        completionPct: p.completionPct && p.completionPct > 0 ? p.completionPct : 90,
        resumeName: p.resumeName || 'Sample_Java_Developer_Resume (1).pdf',
        resumeDate: p.resumeUploadedDate || 'Uploaded on Sep 17, 2026',
        resumeUrl: p.resumeUrl || '',
        videoName: p.videoName || '',
        videoDate: p.videoUploadedDate || '',
        videoUrl: p.videoUrl || '',
      });

      if (p.avatarUrl) {
        updateUserAvatar(p.avatarUrl);
      }

      setSkillsList(pSkills);
    } catch {
      setSkillsList(DEFAULT_SKILLS);
      setDisplayData(prev => ({
        ...prev,
        skills: DEFAULT_SKILLS,
        education: DEFAULT_EDUCATION,
        projects: DEFAULT_PROJECTS,
      }));
    } finally {
      setLoading(false);
    }
  }, [user?.userId, updateUserAvatar]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'ROLE_CANDIDATE') {
      navigate('/dashboard');
      return;
    }

    fetchProfile();
  }, [isAuthenticated, user?.userId, user?.role, fetchProfile, navigate]);

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
          setAlertMsg({ type: 'success', text: `Resume "${file.name}" uploaded and saved successfully!` });
        } catch {
          setAlertMsg({ type: 'error', text: 'Failed to save resume details to server.' });
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
      setAlertMsg({ type: 'error', text: 'Failed to remove resume from server.' });
    }
  };

  const handleViewResume = () => {
    if (!displayData.resumeUrl) return;

    if (displayData.resumeUrl.startsWith('data:')) {
      try {
        const arr = displayData.resumeUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
      } catch {
        window.open(displayData.resumeUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      window.open(displayData.resumeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // ---- Video Upload & Delete Handler ----
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('video/')) {
        setAlertMsg({ type: 'error', text: 'Please select a valid video file (MP4, WebM, MOV).' });
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setAlertMsg({ type: 'error', text: 'Video file size must be less than 50MB.' });
        return;
      }

      setVideoUploading(true);
      setAlertMsg({ type: 'info', text: 'Processing and uploading your introduction video...' });

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
          setAlertMsg({ type: 'success', text: `Introduction video "${file.name}" uploaded and saved successfully!` });
        } catch {
          setAlertMsg({ type: 'error', text: 'Failed to save video to server.' });
        } finally {
          setVideoUploading(false);
        }
      };
      reader.onerror = () => {
        setAlertMsg({ type: 'error', text: 'Failed to read video file.' });
        setVideoUploading(false);
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
  const goToEdit = () => {
    setSkillsList([...displayData.skills]);
    setHeadlineText(displayData.headline);
    setSummaryText(displayData.summary);
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
    setView('edit');
  };

  const goToProfile = () => setView('profile');

  const toggleProjectExpand = (id: string) => {
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const closeModal = () => {
    setActiveModal(null);
    setBasicErrors({});
    setHeadlineError('');
    setSummaryError('');
    setSkillError('');
    setEduErrors({});
    setProjErrors({});
    setPersonalErrors({});
  };

  // Automatically focus the input/textarea field and place the pointer/caret inside when modal opens
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
        if (
          (targetInput.tagName === 'INPUT' || targetInput.tagName === 'TEXTAREA') &&
          typeof (targetInput as HTMLInputElement).value === 'string' &&
          (targetInput as HTMLInputElement).setSelectionRange
        ) {
          const len = (targetInput as HTMLInputElement).value.length;
          (targetInput as HTMLInputElement).setSelectionRange(len, len);
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeModal]);

  // ---- Save handlers with Form Validations ----
  const handleSaveBasic = async () => {
    const errors: Record<string, string> = {};
    const fnErr = validateRequired(basicForm.firstName, 'First name', 2);
    if (fnErr) errors.firstName = fnErr;

    const lnErr = validateRequired(basicForm.lastName, 'Last name', 1);
    if (lnErr) errors.lastName = lnErr;

    const phErr = validatePhone(basicForm.phone, 'Mobile phone');
    if (phErr) errors.phone = phErr;

    const locErr = validateRequired(basicForm.currentLocation, 'Current location', 2);
    if (locErr) errors.currentLocation = locErr;

    if (!basicForm.experienceStatus.trim()) {
      errors.experienceStatus = 'Experience status is required.';
    }
    if (!basicForm.noticePeriod.trim()) {
      errors.noticePeriod = 'Notice period is required.';
    }

    if (Object.keys(errors).length > 0) {
      setBasicErrors(errors);
      return;
    }

    setSaving(true);
    try {
      await candidatesApi.updateMyProfile({
        firstName: basicForm.firstName.trim(),
        lastName: basicForm.lastName.trim(),
        phone: basicForm.phone.trim(),
        currentLocation: basicForm.currentLocation.trim(),
        experienceStatus: basicForm.experienceStatus.trim(),
        noticePeriod: basicForm.noticePeriod.trim(),
      });
      setDisplayData(prev => ({
        ...prev,
        firstName: basicForm.firstName.trim(),
        lastName: basicForm.lastName.trim(),
        phone: basicForm.phone.trim(),
        currentLocation: basicForm.currentLocation.trim(),
        experienceStatus: basicForm.experienceStatus.trim(),
        noticePeriod: basicForm.noticePeriod.trim(),
      }));
      setAlertMsg({ type: 'success', text: 'Basic profile details saved successfully!' });
      closeModal();
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to update basic details.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHeadline = async () => {
    const err = validateRequired(headlineText, 'Resume headline', 8);
    if (err) {
      setHeadlineError(err);
      return;
    }

    setSaving(true);
    try {
      await candidatesApi.updateMyProfile({ headline: headlineText.trim() });
      setDisplayData(prev => ({ ...prev, headline: headlineText.trim() }));
      setAlertMsg({ type: 'success', text: 'Resume headline saved successfully!' });
      closeModal();
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to update headline.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    const trimmed = skillInput.trim();
    if (!trimmed) {
      setSkillError('Please enter a skill name.');
      return;
    }
    if (trimmed.length < 2) {
      setSkillError('Skill name must be at least 2 characters.');
      return;
    }
    if (skillsList.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillError(`Skill "${trimmed}" is already added.`);
      return;
    }

    setSkillError('');
    const updated = [...skillsList, trimmed];
    setSkillsList(updated);
    setDisplayData(prev => ({ ...prev, skills: updated }));
    setSkillInput('');
    try {
      await candidatesApi.updateMyProfile({ skills: updated });
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
      await candidatesApi.updateMyProfile({ skills: updated });
      setAlertMsg({ type: 'success', text: `Skill "${skillToRemove}" removed.` });
    } catch {
      /* silent */
    }
  };

  const handleSaveEducation = async () => {
    const errors: Record<string, string> = {};
    const qualErr = validateRequired(eduForm.qualification, 'Qualification / Degree', 2);
    if (qualErr) errors.qualification = qualErr;

    const instErr = validateRequired(eduForm.institution, 'College / Institution name', 2);
    if (instErr) errors.institution = instErr;

    const yrErr = validateYearRange(Number(eduForm.startYear) || 2021, Number(eduForm.endYear) || 2025);
    if (yrErr) errors.years = yrErr;

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
        startYear: Number(eduForm.startYear) || 2021,
        endYear: Number(eduForm.endYear) || 2025,
      });
      const newEdu: CandidateEducation = (res.data?.data as any) || {
        id: String(Date.now()),
        qualification: eduForm.qualification.trim(),
        institution: eduForm.institution.trim(),
        fieldOfStudy: eduForm.fieldOfStudy.trim(),
        startYear: Number(eduForm.startYear) || 2021,
        endYear: Number(eduForm.endYear) || 2025,
        courseType: eduForm.courseType || 'Full Time',
      };
      setDisplayData(prev => ({ ...prev, education: [...prev.education, newEdu] }));
      setAlertMsg({ type: 'success', text: 'Education record added and saved!' });
      closeModal();
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to add education record.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEducation = async (id?: string) => {
    if (!id) return;
    try {
      if (!id.startsWith('default-')) {
        await candidatesApi.deleteEducation(id);
      }
      setDisplayData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }));
      setAlertMsg({ type: 'success', text: 'Education record deleted.' });
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to delete education record.' });
    }
  };

  const handleSaveProject = async () => {
    const errors: Record<string, string> = {};
    const nameErr = validateRequired(projForm.name, 'Project title', 3);
    if (nameErr) errors.name = nameErr;

    const sumErr = validateRequired(projForm.summary, 'Project summary', 10);
    if (sumErr) errors.summary = sumErr;

    if (projForm.githubUrl) {
      const ghErr = validateUrl(projForm.githubUrl, 'GitHub URL');
      if (ghErr) errors.githubUrl = ghErr;
    }

    if (projForm.demoUrl) {
      const demoErr = validateUrl(projForm.demoUrl, 'Demo URL');
      if (demoErr) errors.demoUrl = demoErr;
    }

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
        startDate: projForm.startDate || 'Mar 2026',
        endDate: projForm.endDate || 'Apr 2026',
      });
      const newProj: CandidateProject = (res.data?.data as any) || {
        id: String(Date.now()),
        name: projForm.name.trim(),
        clientCompany: projForm.clientCompany.trim() || 'grow tech (Offsite)',
        workType: projForm.workType || 'Full Time',
        summary: projForm.summary.trim(),
        githubUrl: projForm.githubUrl.trim(),
        demoUrl: projForm.demoUrl.trim(),
        startDate: projForm.startDate || 'Mar 2026',
        endDate: projForm.endDate || 'Apr 2026',
      };
      setDisplayData(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
      setAlertMsg({ type: 'success', text: 'Project added and saved!' });
      closeModal();
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to add project.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id?: string) => {
    if (!id) return;
    try {
      if (!id.startsWith('default-')) {
        await candidatesApi.deleteProject(id);
      }
      setDisplayData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
      setAlertMsg({ type: 'success', text: 'Project deleted.' });
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to delete project.' });
    }
  };

  const handleSaveSummary = async () => {
    const err = validateRequired(summaryText, 'Profile summary', 10);
    if (err) {
      setSummaryError(err);
      return;
    }

    setSaving(true);
    try {
      await candidatesApi.updateMyProfile({ summary: summaryText.trim(), bio: summaryText.trim() });
      setDisplayData(prev => ({ ...prev, summary: summaryText.trim() }));
      setAlertMsg({ type: 'success', text: 'Profile summary updated and saved!' });
      closeModal();
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to update summary.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePersonal = async () => {
    const errors: Record<string, string> = {};
    if (!personalForm.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required.';
    } else {
      const dobDate = new Date(personalForm.dateOfBirth);
      if (dobDate > new Date()) {
        errors.dateOfBirth = 'Date of birth cannot be in the future.';
      }
    }

    const langErr = validateRequired(personalForm.languages, 'Languages known', 2);
    if (langErr) errors.languages = langErr;

    const addrErr = validateRequired(personalForm.permanentAddress, 'Permanent address', 4);
    if (addrErr) errors.permanentAddress = addrErr;

    if (Object.keys(errors).length > 0) {
      setPersonalErrors(errors);
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
      setAlertMsg({ type: 'success', text: 'Personal details saved successfully!' });
      closeModal();
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to update personal details.' });
    } finally {
      setSaving(false);
    }
  };

  const fullName =
    `${displayData.firstName} ${displayData.lastName}`.trim() || user?.fullName || 'Sai Gopal Machepalli';
  const emailText = user?.email || 'test@gmail.com';

  if (loading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="spinner-lg" />
      </div>
    );
  }

  // ========================
  // PROFILE VIEW (Clean Modern Card View)
  // ========================
  const ProfileView = () => (
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
      <div className="profile-action-bar">
        <button className="btn-toggle-edit" onClick={goToEdit}>
          <FiEdit3 size={15} />
          Edit Profile Details
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

      {/* Header Card */}
      <div className="pv-header-card">
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
              <img
                src={displayData.avatarUrl || profileImg}
                alt={fullName}
                className="avatar-inner-img"
              />
              <div className="avatar-photo-overlay" title="Change Profile Photo">
                <FiCamera size={20} />
                <span>Change</span>
              </div>
            </div>
            <span className="avatar-completion-badge">{displayData.completionPct}%</span>
            <div className="btn-avatar-camera" title="Click to Change Photo">
              <FiCamera size={14} />
            </div>
          </div>

          <div className="pv-header-info">
            <div className="header-name-row">
              <h1 className="pv-candidate-name">{fullName}</h1>
              <button className="btn-icon-edit" onClick={goToEdit} title="Edit Profile">
                <FiEdit3 size={18} />
              </button>
            </div>
            <p className="pv-last-updated">Profile last updated - 22 Jun, 2026</p>

            <div className="pv-detail-grid">
              <span className="pv-detail-item">
                <FiMapPin className="detail-icon" /> {displayData.currentLocation}
              </span>
              <span className="pv-detail-item">
                <FiPhone className="detail-icon" /> {displayData.phone}{' '}
                <FiCheckCircle size={13} color="#16a34a" />
              </span>
              <span className="pv-detail-item">
                <FiBriefcase className="detail-icon" /> {displayData.experienceStatus}
              </span>
              <span className="pv-detail-item">
                <FiMail className="detail-icon" />{' '}
                {emailText.length > 22 ? emailText.substring(0, 20) + '...' : emailText}{' '}
                <FiCheckCircle size={13} color="#16a34a" />
              </span>
              <span className="pv-detail-item">
                <FiCalendar className="detail-icon" /> {displayData.noticePeriod}
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
            <button className="section-action-link" onClick={goToEdit}>
              <FiEdit3 size={13} /> Edit Video
            </button>
          </div>
          <div className="pv-video-wrap">
            <video
              className="pv-video"
              controls
              src={displayData.videoUrl || udayVideo}
              key={displayData.videoUrl || 'default'}
            >
              Your browser does not support the video tag.
            </video>
          </div>
          {displayData.videoName ? (
            <div className="video-file-info" style={{ marginTop: '0.5rem' }}>
              <span className="video-file-name">{displayData.videoName}</span>
              {displayData.videoDate && <span className="video-upload-date">{displayData.videoDate}</span>}
            </div>
          ) : (
            <p className="pv-video-hint">
              <FiInfo size={13} /> Showing candidate introduction video. You can upload or replace your video anytime from Edit Profile.
            </p>
          )}
        </div>

        {/* Card: Key Skills */}
        <div className="pv-dark-card">
          <div className="pv-card-header-row">
            <h2 className="pv-card-title">
              <FiAward size={18} /> Key Skills
            </h2>
            <button className="section-action-link" onClick={goToEdit}>
              <FiEdit3 size={13} /> Edit Skills
            </button>
          </div>
          <div className="pv-skills-list">
            {displayData.skills.map((skill, i) => (
              <span key={i} className="pv-skill-badge">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Card: Education */}
        <div className="pv-dark-card">
          <div className="pv-card-header-row">
            <h2 className="pv-card-title">Education</h2>
            <button className="section-action-link" onClick={goToEdit}>
              <FiPlus size={13} /> Add Education
            </button>
          </div>
          <ul className="pv-edu-list">
            {displayData.education.slice(0, 3).map(edu => (
              <li key={edu.id || edu.qualification} className="pv-edu-item">
                <span className="pv-edu-degree">{edu.qualification}</span>
                <span className="pv-edu-inst">{edu.institution}</span>
                <span className="pv-edu-year">
                  {edu.startYear}-{edu.endYear}
                  {edu.courseType ? ` | ${edu.courseType}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card: Projects */}
        <div className="pv-dark-card">
          <div className="pv-card-header-row">
            <h2 className="pv-card-title">Projects</h2>
            <button className="section-action-link" onClick={goToEdit}>
              <FiPlus size={13} /> Add Project
            </button>
          </div>
          <ul className="pv-proj-list">
            {displayData.projects.slice(0, 2).map(proj => {
              const pid = proj.id || proj.name;
              const expanded = expandedProjects[pid] || false;
              return (
                <li key={pid} className="pv-proj-item">
                  <span className="pv-proj-name">{proj.name}</span>
                  <span className="pv-proj-meta">
                    {proj.clientCompany} &nbsp; {proj.startDate} - {proj.endDate}
                  </span>
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
        </div>

        {/* Card: Profile Summary */}
        <div className="pv-dark-card">
          <div className="pv-card-header-row">
            <h2 className="pv-card-title">Profile Summary</h2>
            <button className="section-action-link" onClick={goToEdit}>
              <FiEdit3 size={13} /> Edit
            </button>
          </div>
          <p className="pv-summary-text">{displayData.headline}</p>
          <p className="pv-summary-text" style={{ marginTop: '0.5rem', opacity: 0.85 }}>
            {displayData.summary}
          </p>
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
        {displayData.resumeName && (
          <div className="pv-dark-card pv-card-span2">
            <div className="pv-card-header-row">
              <h2 className="pv-card-title">
                <FiFileText size={18} /> Resume
              </h2>
              <button className="section-action-link" onClick={goToEdit}>
                <FiEdit3 size={13} /> Update Resume
              </button>
            </div>
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
          </div>
        )}

        {/* Card: Personal Details */}
        <div className="pv-dark-card pv-card-span2">
          <div className="pv-card-header-row">
            <h2 className="pv-card-title">
              <FiUser size={18} /> Personal Details
            </h2>
            <button className="section-action-link" onClick={goToEdit}>
              <FiEdit3 size={13} /> Edit Details
            </button>
          </div>
          <div className="pv-personal-grid">
            <div className="pv-personal-field">
              <span className="pv-label">Gender</span>
              <span className="pv-val">{displayData.gender}</span>
            </div>
            <div className="pv-personal-field">
              <span className="pv-label">Date of Birth</span>
              <span className="pv-val">{displayData.dateOfBirth}</span>
            </div>
            <div className="pv-personal-field">
              <span className="pv-label">Marital Status</span>
              <span className="pv-val">{displayData.maritalStatus}</span>
            </div>
            <div className="pv-personal-field">
              <span className="pv-label">Languages Known</span>
              <span className="pv-val">{displayData.languages}</span>
            </div>
            <div className="pv-personal-field" style={{ gridColumn: '1 / -1' }}>
              <span className="pv-label">Permanent Address</span>
              <span className="pv-val">{displayData.permanentAddress}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

  // ========================
  // EDIT VIEW (Aligned with proper buttons & Video Profile Section)
  // ========================
  const EditView = () => (
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
                <img
                  src={displayData.avatarUrl || profileImg}
                  alt={fullName}
                  className="avatar-inner-img"
                />
                <div className="avatar-photo-overlay" title="Change Profile Photo">
                  <FiCamera size={20} />
                  <span>Change</span>
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
              <div className="last-updated-text">Profile last updated - 22 Jun , 2026</div>
              <div className="header-details-grid">
                <div className="detail-item">
                  <FiMapPin className="detail-icon" />
                  <span>{displayData.currentLocation}</span>
                </div>
                <div className="detail-item">
                  <FiPhone className="detail-icon" />
                  <span>{displayData.phone}</span>
                  <FiCheckCircle className="verified-badge" />
                </div>
                <div className="detail-item">
                  <FiBriefcase className="detail-icon" />
                  <span>{displayData.experienceStatus}</span>
                </div>
                <div className="detail-item">
                  <FiMail className="detail-icon" />
                  <span>
                    {emailText.length > 22 ? emailText.substring(0, 20) + '...' : emailText}
                  </span>
                  <FiCheckCircle className="verified-badge" />
                </div>
                <div className="detail-item">
                  <FiCalendar className="detail-icon" />
                  <span>{displayData.noticePeriod}</span>
                </div>
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
            <div className="resume-dropzone">
              <button
                type="button"
                className="btn-update-resume"
                onClick={() => resumeInputRef.current?.click()}
              >
                <FiUploadCloud size={16} /> Update resume
              </button>
              <span className="resume-hint">
                Supported Formats: doc, docx, rtf, pdf, upto 10 MB
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
                    <span className="video-file-name">
                      <FiPlayCircle size={16} color="#70c144" /> {displayData.videoName || 'Candidate_Intro_Video.mp4'}
                    </span>
                    <span className="video-upload-date">
                      {displayData.videoDate || 'Uploaded recently'}
                    </span>
                  </div>
                  <div className="video-file-actions">
                    <button
                      type="button"
                      className="btn-video-action"
                      onClick={() => videoInputRef.current?.click()}
                      title="Replace Video"
                    >
                      <FiUploadCloud size={15} /> Replace
                    </button>
                    <button
                      type="button"
                      className="btn-video-action delete"
                      title="Delete Video"
                      onClick={handleDeleteVideo}
                    >
                      <FiTrash2 size={15} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="video-dropzone">
                <div className="video-dropzone-icon">
                  <FiVideo size={36} />
                </div>
                <h4 className="video-dropzone-title">Ask candidate for introduction video</h4>
                <p className="video-dropzone-desc">
                  Profiles with a video introduction get up to <strong>3x more interview requests</strong> from top tech companies.
                </p>
                <button
                  type="button"
                  className="btn-upload-video"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={videoUploading}
                >
                  <FiUploadCloud size={16} /> {videoUploading ? 'Uploading Video...' : 'Upload Video Profile'}
                </button>
                <span className="video-hint">
                  Supported Formats: MP4, WebM, MOV &nbsp;|&nbsp; Max Size: 50 MB &nbsp;|&nbsp; Recommended Length: 1 - 2 mins
                </span>
              </div>
            )}
          </div>

          {/* Resume Headline */}
          <div className="section-card" id="edit-section-resume-headline">
            <div className="section-card-header">
              <h2 className="section-card-title">Resume headline</h2>
              <button
                className="btn-icon-edit"
                onClick={() => {
                  setHeadlineText(displayData.headline);
                  setHeadlineError('');
                  setActiveModal('headline');
                }}
                title="Edit Resume Headline"
              >
                <FiEdit3 size={18} />
              </button>
            </div>
            <p className="headline-text">{displayData.headline}</p>
          </div>

          {/* Key Skills */}
          <div className="section-card" id="edit-section-key-skills">
            <div className="section-card-header">
              <h2 className="section-card-title">Key skills</h2>
              <button
                className="btn-icon-edit"
                onClick={() => {
                  setSkillsList([...displayData.skills]);
                  setSkillError('');
                  setActiveModal('skills');
                }}
                title="Edit Skills"
              >
                <FiEdit3 size={18} />
              </button>
            </div>
            <div className="skills-tags-container">
              {displayData.skills.map((skill, index) => (
                <span key={index} className="skill-pill">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="section-card" id="edit-section-education">
            <div className="section-card-header">
              <h2 className="section-card-title">Education</h2>
              <button
                className="btn-link-action"
                onClick={() => {
                  setEduForm({
                    qualification: '',
                    institution: '',
                    fieldOfStudy: '',
                    startYear: 2021,
                    endYear: 2025,
                    courseType: 'Full Time',
                  });
                  setEduErrors({});
                  setActiveModal('education');
                }}
              >
                + Add education
              </button>
            </div>
            <div className="education-items-list">
              {displayData.education.map(edu => (
                <div key={edu.id || edu.qualification} className="edu-record">
                  <div className="edu-record-header">
                    <span className="edu-degree">{edu.qualification}</span>
                    <button
                      className="btn-record-delete"
                      onClick={() => handleDeleteEducation(edu.id)}
                      title="Delete education record"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                  <div className="edu-institution">{edu.institution}</div>
                  <div className="edu-years">
                    {edu.startYear} - {edu.endYear} &nbsp;|&nbsp; {edu.courseType || 'Full Time'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className="section-card" id="edit-section-projects">
            <div className="section-card-header">
              <h2 className="section-card-title">Projects</h2>
              <button
                className="btn-link-action"
                onClick={() => {
                  setProjForm({
                    name: '',
                    clientCompany: '',
                    workType: 'Full Time',
                    summary: '',
                    githubUrl: '',
                    demoUrl: '',
                    startDate: 'Mar 2026',
                    endDate: 'Apr 2026',
                  });
                  setProjErrors({});
                  setActiveModal('project');
                }}
              >
                + Add project
              </button>
            </div>
            <div className="projects-items-list">
              {displayData.projects.map(proj => {
                const pid = proj.id || proj.name;
                const expanded = expandedProjects[pid] || false;
                return (
                  <div key={pid} className="project-record">
                    <div className="project-record-header">
                      <span className="project-title">{proj.name}</span>
                      <button
                        className="btn-record-delete"
                        onClick={() => handleDeleteProject(proj.id)}
                        title="Delete project"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                    <div className="project-company">{proj.clientCompany}</div>
                    <div className="project-duration">
                      {proj.startDate} to {proj.endDate} ({proj.workType || 'Full Time'})
                    </div>
                    {proj.summary && (
                      <div className="project-summary">
                        {expanded || proj.summary.length <= 150
                          ? proj.summary
                          : proj.summary.substring(0, 150) + '... '}
                        {proj.summary.length > 150 && (
                          <button
                            className="btn-read-more"
                            onClick={() => toggleProjectExpand(pid)}
                          >
                            {expanded ? 'Read Less' : 'Read More'}
                          </button>
                        )}
                      </div>
                    )}
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="project-repo-link"
                      >
                        <FiGithub size={14} /> Repository
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Profile Summary */}
          <div className="section-card" id="edit-section-profile-summary">
            <div className="section-card-header">
              <h2 className="section-card-title">Profile summary</h2>
              <button
                className="btn-icon-edit"
                onClick={() => {
                  setSummaryText(displayData.summary);
                  setSummaryError('');
                  setActiveModal('summary');
                }}
                title="Edit Summary"
              >
                <FiEdit3 size={18} />
              </button>
            </div>
            <p className="summary-text">{displayData.summary}</p>
          </div>

          {/* Accomplishments */}
          <div className="section-card" id="edit-section-accomplishments">
            <div className="section-card-header">
              <h2 className="section-card-title">Accomplishments & Strengths</h2>
              <button className="btn-icon-edit" onClick={goToProfile} title="View Profile">
                <FiEdit3 size={18} />
              </button>
            </div>
            <div className="strengths-tags-container">
              <span className="strength-badge">Problem-Solving</span>
              <span className="strength-badge">Team Collaboration</span>
              <span className="strength-badge">Effective Communication</span>
              <span className="strength-badge">Adaptability</span>
              <span className="strength-badge">Time Management</span>
            </div>
          </div>

          {/* Personal Details */}
          <div className="section-card" id="edit-section-personal-details">
            <div className="section-card-header">
              <h2 className="section-card-title">Personal details</h2>
              <button
                className="btn-icon-edit"
                onClick={() => {
                  setPersonalForm({
                    gender: displayData.gender,
                    dateOfBirth: displayData.dateOfBirth,
                    maritalStatus: displayData.maritalStatus,
                    permanentAddress: displayData.permanentAddress,
                    languages: displayData.languages,
                  });
                  setPersonalErrors({});
                  setActiveModal('personal');
                }}
                title="Edit Personal Details"
              >
                <FiEdit3 size={18} />
              </button>
            </div>
            <div className="personal-details-grid">
              <div className="personal-detail-group">
                <span className="personal-detail-label">GENDER</span>
                <span className="personal-detail-value">{displayData.gender}</span>
              </div>
              <div className="personal-detail-group">
                <span className="personal-detail-label">DATE OF BIRTH</span>
                <span className="personal-detail-value">{displayData.dateOfBirth}</span>
              </div>
              <div className="personal-detail-group">
                <span className="personal-detail-label">MARITAL STATUS</span>
                <span className="personal-detail-value">{displayData.maritalStatus}</span>
              </div>
              <div className="personal-detail-group">
                <span className="personal-detail-label">LANGUAGES KNOWN</span>
                <span className="personal-detail-value">{displayData.languages}</span>
              </div>
              <div className="personal-detail-group" style={{ gridColumn: '1 / -1' }}>
                <span className="personal-detail-label">PERMANENT ADDRESS</span>
                <span className="personal-detail-value">{displayData.permanentAddress}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {view === 'profile' ? <ProfileView /> : <EditView />}

      {/* MODALS WITH FORM VALIDATIONS */}
      {activeModal === 'basic' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Basic Profile Details</h3>
              <button className="btn-modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-grid-2col">
                <div className="form-group">
                  <label>First Name <span className="required-star">*</span></label>
                  <input
                    type="text"
                    autoFocus
                    className={`form-control ${basicErrors.firstName ? 'is-invalid' : ''}`}
                    value={basicForm.firstName}
                    onChange={e => {
                      setBasicForm({ ...basicForm, firstName: e.target.value });
                      if (basicErrors.firstName) {
                        setBasicErrors(prev => ({ ...prev, firstName: '' }));
                      }
                    }}
                    placeholder="First Name"
                  />
                  {basicErrors.firstName && (
                    <span className="form-error-text">
                      <FiAlertCircle size={12} /> {basicErrors.firstName}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>Last Name <span className="required-star">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${basicErrors.lastName ? 'is-invalid' : ''}`}
                    value={basicForm.lastName}
                    onChange={e => {
                      setBasicForm({ ...basicForm, lastName: e.target.value });
                      if (basicErrors.lastName) {
                        setBasicErrors(prev => ({ ...prev, lastName: '' }));
                      }
                    }}
                    placeholder="Last Name"
                  />
                  {basicErrors.lastName && (
                    <span className="form-error-text">
                      <FiAlertCircle size={12} /> {basicErrors.lastName}
                    </span>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Mobile Phone <span className="required-star">*</span></label>
                <input
                  type="text"
                  className={`form-control ${basicErrors.phone ? 'is-invalid' : ''}`}
                  value={basicForm.phone}
                  onChange={e => {
                    setBasicForm({ ...basicForm, phone: e.target.value });
                    if (basicErrors.phone) {
                      setBasicErrors(prev => ({ ...prev, phone: '' }));
                    }
                  }}
                  placeholder="e.g. 9398804186"
                />
                {basicErrors.phone && (
                  <span className="form-error-text">
                    <FiAlertCircle size={12} /> {basicErrors.phone}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>Current Location / City <span className="required-star">*</span></label>
                <input
                  type="text"
                  className={`form-control ${basicErrors.currentLocation ? 'is-invalid' : ''}`}
                  value={basicForm.currentLocation}
                  onChange={e => {
                    setBasicForm({ ...basicForm, currentLocation: e.target.value });
                    if (basicErrors.currentLocation) {
                      setBasicErrors(prev => ({ ...prev, currentLocation: '' }));
                    }
                  }}
                  placeholder="e.g. Hyderabad, INDIA"
                />
                {basicErrors.currentLocation && (
                  <span className="form-error-text">
                    <FiAlertCircle size={12} /> {basicErrors.currentLocation}
                  </span>
                )}
              </div>
              <div className="modal-grid-2col">
                <div className="form-group">
                  <label>Experience Status <span className="required-star">*</span></label>
                  <select
                    className={`form-control ${basicErrors.experienceStatus ? 'is-invalid' : ''}`}
                    value={basicForm.experienceStatus}
                    onChange={e => {
                      setBasicForm({ ...basicForm, experienceStatus: e.target.value });
                      if (basicErrors.experienceStatus) {
                        setBasicErrors(prev => ({ ...prev, experienceStatus: '' }));
                      }
                    }}
                  >
                    <option value="Fresher">Fresher</option>
                    <option value="1-2 Years">1-2 Years</option>
                    <option value="3-5 Years">3-5 Years</option>
                    <option value="5-8 Years">5-8 Years</option>
                    <option value="8+ Years">8+ Years</option>
                  </select>
                  {basicErrors.experienceStatus && (
                    <span className="form-error-text">
                      <FiAlertCircle size={12} /> {basicErrors.experienceStatus}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>Notice Period / Availability <span className="required-star">*</span></label>
                  <select
                    className={`form-control ${basicErrors.noticePeriod ? 'is-invalid' : ''}`}
                    value={basicForm.noticePeriod}
                    onChange={e => {
                      setBasicForm({ ...basicForm, noticePeriod: e.target.value });
                      if (basicErrors.noticePeriod) {
                        setBasicErrors(prev => ({ ...prev, noticePeriod: '' }));
                      }
                    }}
                  >
                    <option value="Immediate / Ready to Join">Immediate / Ready to Join</option>
                    <option value="Available to join in 15 Days">Available to join in 15 Days</option>
                    <option value="Available to join in 30 Days">Available to join in 30 Days</option>
                    <option value="Available to join in 60 Days">Available to join in 60 Days</option>
                    <option value="Serving Notice Period">Serving Notice Period</option>
                  </select>
                  {basicErrors.noticePeriod && (
                    <span className="form-error-text">
                      <FiAlertCircle size={12} /> {basicErrors.noticePeriod}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveBasic} disabled={saving}>
                {saving ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'headline' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Resume Headline</h3>
              <button className="btn-modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Professional Headline <span className="required-star">*</span></label>
                <textarea
                  autoFocus
                  className={`form-control ${headlineError ? 'is-invalid' : ''}`}
                  rows={4}
                  value={headlineText}
                  onChange={e => {
                    setHeadlineText(e.target.value);
                    if (headlineError) setHeadlineError('');
                  }}
                  placeholder="Summarize your experience and strengths..."
                />
                {headlineError && (
                  <span className="form-error-text">
                    <FiAlertCircle size={12} /> {headlineError}
                  </span>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveHeadline} disabled={saving}>
                {saving ? 'Saving...' : 'Save Headline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'skills' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Manage Key Skills</h3>
              <button className="btn-modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Add New Skill</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    autoFocus
                    className={`form-control ${skillError ? 'is-invalid' : ''}`}
                    style={{ flex: 1 }}
                    placeholder="e.g. Spring Boot, Docker..."
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
                  />
                  <button className="btn-primary" onClick={handleAddSkill}>
                    <FiPlus /> Add
                  </button>
                </div>
                {skillError && (
                  <span className="form-error-text">
                    <FiAlertCircle size={12} /> {skillError}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>Current Skills ({skillsList.length})</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {skillsList.map(skill => (
                    <span
                      key={skill}
                      className="skill-tag-pill"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                        title={`Remove ${skill}`}
                      >
                        <FiX size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={closeModal}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'education' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Education Record</h3>
              <button className="btn-modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Degree / Qualification <span className="required-star">*</span></label>
                <input
                  type="text"
                  autoFocus
                  className={`form-control ${eduErrors.qualification ? 'is-invalid' : ''}`}
                  placeholder="e.g. B.Tech / B.E. Computer Science"
                  value={eduForm.qualification}
                  onChange={e => {
                    setEduForm({ ...eduForm, qualification: e.target.value });
                    if (eduErrors.qualification) setEduErrors(prev => ({ ...prev, qualification: '' }));
                  }}
                />
                {eduErrors.qualification && (
                  <span className="form-error-text">
                    <FiAlertCircle size={12} /> {eduErrors.qualification}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>College / Institution Name <span className="required-star">*</span></label>
                <input
                  type="text"
                  className={`form-control ${eduErrors.institution ? 'is-invalid' : ''}`}
                  placeholder="e.g. MVGR College of Engineering"
                  value={eduForm.institution}
                  onChange={e => {
                    setEduForm({ ...eduForm, institution: e.target.value });
                    if (eduErrors.institution) setEduErrors(prev => ({ ...prev, institution: '' }));
                  }}
                />
                {eduErrors.institution && (
                  <span className="form-error-text">
                    <FiAlertCircle size={12} /> {eduErrors.institution}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>Specialization / Field of Study</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Electronics & Communication"
                  value={eduForm.fieldOfStudy}
                  onChange={e => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Start Year</label>
                  <input
                    type="number"
                    className="form-control"
                    value={eduForm.startYear}
                    onChange={e => {
                      setEduForm({ ...eduForm, startYear: parseInt(e.target.value) || 2021 });
                      if (eduErrors.years) setEduErrors(prev => ({ ...prev, years: '' }));
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>End Year</label>
                  <input
                    type="number"
                    className="form-control"
                    value={eduForm.endYear}
                    onChange={e => {
                      setEduForm({ ...eduForm, endYear: parseInt(e.target.value) || 2025 });
                      if (eduErrors.years) setEduErrors(prev => ({ ...prev, years: '' }));
                    }}
                  />
                </div>
              </div>
              {eduErrors.years && (
                <span className="form-error-text">
                  <FiAlertCircle size={12} /> {eduErrors.years}
                </span>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveEducation}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Education'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'project' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Portfolio Project</h3>
              <button className="btn-modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Project Title <span className="required-star">*</span></label>
                <input
                  type="text"
                  autoFocus
                  className={`form-control ${projErrors.name ? 'is-invalid' : ''}`}
                  placeholder="e.g. E-Commerce Web Application"
                  value={projForm.name}
                  onChange={e => {
                    setProjForm({ ...projForm, name: e.target.value });
                    if (projErrors.name) setProjErrors(prev => ({ ...prev, name: '' }));
                  }}
                />
                {projErrors.name && (
                  <span className="form-error-text">
                    <FiAlertCircle size={12} /> {projErrors.name}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>Client / Company Tag</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. grow tech (Offsite)"
                  value={projForm.clientCompany}
                  onChange={e => setProjForm({ ...projForm, clientCompany: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Project Summary & Key Contributions <span className="required-star">*</span></label>
                <textarea
                  className={`form-control ${projErrors.summary ? 'is-invalid' : ''}`}
                  rows={4}
                  placeholder="Describe your role, tech stack, and achievements..."
                  value={projForm.summary}
                  onChange={e => {
                    setProjForm({ ...projForm, summary: e.target.value });
                    if (projErrors.summary) setProjErrors(prev => ({ ...prev, summary: '' }));
                  }}
                />
                {projErrors.summary && (
                  <span className="form-error-text">
                    <FiAlertCircle size={12} /> {projErrors.summary}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>GitHub Repository Link (Optional)</label>
                <input
                  type="text"
                  className={`form-control ${projErrors.githubUrl ? 'is-invalid' : ''}`}
                  placeholder="https://github.com/username/project"
                  value={projForm.githubUrl}
                  onChange={e => {
                    setProjForm({ ...projForm, githubUrl: e.target.value });
                    if (projErrors.githubUrl) setProjErrors(prev => ({ ...prev, githubUrl: '' }));
                  }}
                />
                {projErrors.githubUrl && (
                  <span className="form-error-text">
                    <FiAlertCircle size={12} /> {projErrors.githubUrl}
                  </span>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveProject}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'summary' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Profile Summary</h3>
              <button className="btn-modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Detailed Bio / Summary <span className="required-star">*</span></label>
                <textarea
                  autoFocus
                  className={`form-control ${summaryError ? 'is-invalid' : ''}`}
                  rows={5}
                  value={summaryText}
                  onChange={e => {
                    setSummaryText(e.target.value);
                    if (summaryError) setSummaryError('');
                  }}
                  placeholder="Describe your professional background..."
                />
                {summaryError && (
                  <span className="form-error-text">
                    <FiAlertCircle size={12} /> {summaryError}
                  </span>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveSummary}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Summary'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'personal' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Personal Details</h3>
              <button className="btn-modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-grid-2col">
                <div className="form-group">
                  <label>Gender <span className="required-star">*</span></label>
                  <select
                    autoFocus
                    className="form-control"
                    value={personalForm.gender}
                    onChange={e =>
                      setPersonalForm({ ...personalForm, gender: e.target.value })
                    }
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Marital Status <span className="required-star">*</span></label>
                  <select
                    className="form-control"
                    value={personalForm.maritalStatus}
                    onChange={e =>
                      setPersonalForm({ ...personalForm, maritalStatus: e.target.value })
                    }
                  >
                    <option>Single</option>
                    <option>Married</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Date of Birth <span className="required-star">*</span></label>
                <input
                  type="date"
                  className={`form-control ${personalErrors.dateOfBirth ? 'is-invalid' : ''}`}
                  value={personalForm.dateOfBirth}
                  onChange={e => {
                    setPersonalForm({ ...personalForm, dateOfBirth: e.target.value });
                    if (personalErrors.dateOfBirth) setPersonalErrors(prev => ({ ...prev, dateOfBirth: '' }));
                  }}
                />
                {personalErrors.dateOfBirth && (
                  <span className="form-error-text">
                    <FiAlertCircle size={12} /> {personalErrors.dateOfBirth}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>Languages Known <span className="required-star">*</span></label>
                <input
                  type="text"
                  className={`form-control ${personalErrors.languages ? 'is-invalid' : ''}`}
                  placeholder="English, Hindi, Telugu"
                  value={personalForm.languages}
                  onChange={e => {
                    setPersonalForm({ ...personalForm, languages: e.target.value });
                    if (personalErrors.languages) setPersonalErrors(prev => ({ ...prev, languages: '' }));
                  }}
                />
                {personalErrors.languages && (
                  <span className="form-error-text">
                    <FiAlertCircle size={12} /> {personalErrors.languages}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>Permanent Address <span className="required-star">*</span></label>
                <textarea
                  className={`form-control ${personalErrors.permanentAddress ? 'is-invalid' : ''}`}
                  rows={3}
                  value={personalForm.permanentAddress}
                  onChange={e => {
                    setPersonalForm({ ...personalForm, permanentAddress: e.target.value });
                    if (personalErrors.permanentAddress) setPersonalErrors(prev => ({ ...prev, permanentAddress: '' }));
                  }}
                />
                {personalErrors.permanentAddress && (
                  <span className="form-error-text">
                    <FiAlertCircle size={12} /> {personalErrors.permanentAddress}
                  </span>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSavePersonal}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CandidateProfilePage;
