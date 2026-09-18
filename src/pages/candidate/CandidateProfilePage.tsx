import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { candidatesApi } from '../../api/candidates';
import profileImg from '../../assets/image.png';
import udayVideo from '../../assets/Uday video.mp4';
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
  FiTrash2,
  FiCode,
  FiGithub,
  FiPlus,
  FiX,
  FiArrowLeft,
  FiCamera,
  FiFileText,
  FiBookOpen,
  FiUser,
  FiAward,
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
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Guard ref: prevents duplicate API calls from React StrictMode double-invoke or object-ref dependency changes
  const hasFetched = useRef(false);

  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // view = 'profile' | 'edit'
  const [view, setView] = useState<'profile' | 'edit'>('profile');
  const [activeSection, setActiveSection] = useState('resume');

  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ---- Live display state (drives both profile + edit views) ----
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
    resumeName: 'MEAN_stack_resume.pdf',
    resumeDate: 'Uploaded on May 05, 2026',
  });

  // ---- Modal form state (temp edits before save) ----
  const [basicForm, setBasicForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    currentLocation: '',
    experienceStatus: '',
    noticePeriod: '',
  });
  const [headlineText, setHeadlineText] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [eduForm, setEduForm] = useState({
    qualification: '',
    institution: '',
    fieldOfStudy: '',
    startYear: 2021,
    endYear: 2025,
    courseType: 'Full Time',
  });
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
  const [personalForm, setPersonalForm] = useState({
    gender: 'Male',
    dateOfBirth: '2003-08-15',
    maritalStatus: 'Single',
    permanentAddress: 'Andhra Pradesh, India',
    languages: 'English, Hindi, Telugu',
  });

  // fetchProfile is memoized via useCallback.
  // Deps use primitive values (userId, role) not the whole user object,
  // preventing spurious re-calls when the object reference changes.
  const fetchProfile = useCallback(async () => {
    if (hasFetched.current) return; // prevent duplicate calls (StrictMode / dep re-trigger)
    hasFetched.current = true;
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
        resumeName: p.resumeName || 'MEAN_stack_resume.pdf',
        resumeDate: p.resumeUploadedDate || 'Uploaded on May 05, 2026',
      });

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const lastUserIdRef = useRef<string | null>(null);

  // Runs only when the stable primitives change. 'navigate' is stable from react-router.
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'ROLE_CANDIDATE') {
      navigate('/dashboard');
      return;
    }
    // Reset the guard ONLY if user ID actually changed (e.g. re-login as a different user)
    if (lastUserIdRef.current !== user.userId) {
      hasFetched.current = false;
      lastUserIdRef.current = user.userId;
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

  // ---- Navigate between views ----
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
    setActiveSection('resume');
  };

  const goToProfile = () => setView('profile');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const elem = document.getElementById('edit-section-' + id);
    if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleProjectExpand = (id: string) => {
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const closeModal = () => setActiveModal(null);

  // ---- Save handlers (persists to backend database and updates displayData) ----
  const handleSaveBasic = async () => {
    setSaving(true);
    try {
      await candidatesApi.updateMyProfile({
        firstName: basicForm.firstName,
        lastName: basicForm.lastName,
        phone: basicForm.phone,
        currentLocation: basicForm.currentLocation,
        experienceStatus: basicForm.experienceStatus,
        noticePeriod: basicForm.noticePeriod,
      });
      setDisplayData(prev => ({
        ...prev,
        firstName: basicForm.firstName,
        lastName: basicForm.lastName,
        phone: basicForm.phone,
        currentLocation: basicForm.currentLocation,
        experienceStatus: basicForm.experienceStatus,
        noticePeriod: basicForm.noticePeriod,
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
    setSaving(true);
    try {
      await candidatesApi.updateMyProfile({ headline: headlineText });
      setDisplayData(prev => ({ ...prev, headline: headlineText }));
      setAlertMsg({ type: 'success', text: 'Resume headline saved successfully!' });
      closeModal();
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to update headline.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!skillInput.trim()) return;
    const newSkill = skillInput.trim();
    if (skillsList.includes(newSkill)) {
      setSkillInput('');
      return;
    }
    const updated = [...skillsList, newSkill];
    setSkillsList(updated);
    setDisplayData(prev => ({ ...prev, skills: updated }));
    setSkillInput('');
    try {
      await candidatesApi.updateMyProfile({ skills: updated });
      setAlertMsg({ type: 'success', text: `Skill "${newSkill}" added and saved!` });
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
    if (!eduForm.qualification.trim() || !eduForm.institution.trim()) {
      setAlertMsg({ type: 'error', text: 'Qualification and Institution are required.' });
      return;
    }
    setSaving(true);
    try {
      const res = await candidatesApi.addEducation({
        qualification: eduForm.qualification,
        institution: eduForm.institution,
        fieldOfStudy: eduForm.fieldOfStudy,
        startYear: Number(eduForm.startYear) || 2021,
        endYear: Number(eduForm.endYear) || 2025,
      });
      const newEdu: CandidateEducation = (res.data?.data as any) || {
        id: String(Date.now()),
        qualification: eduForm.qualification,
        institution: eduForm.institution,
        fieldOfStudy: eduForm.fieldOfStudy,
        startYear: eduForm.startYear,
        endYear: eduForm.endYear,
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
    if (!projForm.name.trim()) {
      setAlertMsg({ type: 'error', text: 'Project name is required.' });
      return;
    }
    setSaving(true);
    try {
      const res = await candidatesApi.addProject({
        name: projForm.name,
        summary: projForm.summary,
        githubUrl: projForm.githubUrl,
        demoUrl: projForm.demoUrl,
        startDate: projForm.startDate || 'Mar 2026',
        endDate: projForm.endDate || 'Apr 2026',
      });
      const newProj: CandidateProject = (res.data?.data as any) || {
        id: String(Date.now()),
        name: projForm.name,
        clientCompany: projForm.clientCompany || 'grow tech (Offsite)',
        workType: projForm.workType || 'Full Time',
        summary: projForm.summary,
        githubUrl: projForm.githubUrl,
        demoUrl: projForm.demoUrl,
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
    setSaving(true);
    try {
      await candidatesApi.updateMyProfile({ summary: summaryText, bio: summaryText });
      setDisplayData(prev => ({ ...prev, summary: summaryText }));
      setAlertMsg({ type: 'success', text: 'Profile summary updated and saved!' });
      closeModal();
    } catch {
      setAlertMsg({ type: 'error', text: 'Failed to update summary.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePersonal = async () => {
    setSaving(true);
    try {
      const langStr = Array.isArray(personalForm.languages)
        ? personalForm.languages.join(', ')
        : personalForm.languages;

      await candidatesApi.updateMyProfile({
        gender: personalForm.gender,
        dateOfBirth: personalForm.dateOfBirth,
        maritalStatus: personalForm.maritalStatus,
        permanentAddress: personalForm.permanentAddress,
        languages: langStr,
      });
      setDisplayData(prev => ({
        ...prev,
        gender: personalForm.gender,
        dateOfBirth: personalForm.dateOfBirth,
        maritalStatus: personalForm.maritalStatus,
        permanentAddress: personalForm.permanentAddress,
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const uploadDate = `Uploaded on ${new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })}`;
      setDisplayData(prev => ({
        ...prev,
        resumeName: file.name,
        resumeDate: uploadDate,
      }));
      try {
        await candidatesApi.updateMyProfile({
          resumeName: file.name,
          resumeUploadedDate: uploadDate,
        });
        setAlertMsg({ type: 'success', text: `Resume "${file.name}" uploaded and saved!` });
      } catch {
        setAlertMsg({ type: 'error', text: 'Failed to save resume details to server.' });
      }
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
  // PROFILE VIEW (original dark-card design, data-driven from displayData)
  // ========================
  const ProfileView = () => (
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
          <button
            onClick={() => setAlertMsg(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Card - Avatar + completion + info */}
      <div className="pv-header-card">
        <div className="pv-avatar-wrap" onClick={triggerPhotoInput} style={{ cursor: 'pointer' }}>
          <div
            className="pv-progress-ring"
            style={{
              background: `conic-gradient(#22c55e ${displayData.completionPct * 3.6}deg, #e2e8f0 0deg)`,
            }}
          >
            <img
              src={displayData.avatarUrl || profileImg}
              alt={fullName}
              className="pv-avatar-img"
            />
            <div className="pv-avatar-photo-overlay" title="Change Profile Photo">
              <FiCamera size={20} />
              <span>Change</span>
            </div>
          </div>
          <span className="pv-completion-tag">{displayData.completionPct}%</span>
          <div className="btn-avatar-camera" title="Click to Change Photo">
            <FiCamera size={14} />
          </div>
        </div>

        <div className="pv-header-info">
          <h1 className="pv-candidate-name">{fullName}</h1>
          <p className="pv-last-updated">Profile last updated - 22 Jun, 2026</p>

          <div className="pv-detail-grid">
            <span className="pv-detail-item">
              <FiMapPin size={14} /> {displayData.currentLocation}
            </span>
            <span className="pv-detail-item">
              <FiPhone size={14} /> {displayData.phone}{' '}
              <FiCheckCircle size={13} color="#16a34a" />
            </span>
            <span className="pv-detail-item">
              <FiBriefcase size={14} /> {displayData.experienceStatus}
            </span>
            <span className="pv-detail-item">
              <FiMail size={14} />{' '}
              {emailText.length > 22 ? emailText.substring(0, 20) + '...' : emailText}{' '}
              <FiCheckCircle size={13} color="#16a34a" />
            </span>
            <span className="pv-detail-item full-row">
              <FiCalendar size={14} /> {displayData.noticePeriod}
            </span>
          </div>
        </div>

      </div>

      {/* Dark cards grid */}
      <div className="pv-cards-grid">
        {/* Card: Myself / Intro video */}
        <div className="pv-dark-card">
          <h2 className="pv-card-title">Myself</h2>
          <div className="pv-video-wrap">
            <video className="pv-video" controls src={udayVideo}>
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Card: Key Skills */}
        <div className="pv-dark-card">
          <h2 className="pv-card-title">Key Skills</h2>
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
          <h2 className="pv-card-title">Education</h2>
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
          <h2 className="pv-card-title">Projects</h2>
          <ul className="pv-proj-list">
            {displayData.projects.slice(0, 2).map(proj => {
              const pid = proj.id || proj.name;
              const expanded = expandedProjects[pid] || false;
              return (
                <li key={pid} className="pv-proj-item">
                  <span className="pv-proj-name">{proj.name}</span>
                  <span className="pv-proj-meta">
                    {proj.clientCompany} • {proj.startDate} – {proj.endDate}
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
          <h2 className="pv-card-title">Profile Summary</h2>
          <p className="pv-summary-text">{displayData.headline}</p>
          <p className="pv-summary-text" style={{ marginTop: '0.5rem', opacity: 0.8 }}>
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

        {/* Card: Personal Details */}
        <div className="pv-dark-card pv-card-span2">
          <h2 className="pv-card-title">Personal Details</h2>
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
  );

  // ========================
  // EDIT VIEW (matching Figma/screenshot layout)
  // ========================
  const EditView = () => (
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

        {/* Back button */}
        <div style={{ marginBottom: '0.5rem' }}>
          <button className="btn-back-to-profile" onClick={goToProfile}>
            <FiArrowLeft size={16} /> Back to Profile
          </button>
        </div>

        {alertMsg && (
          <div className={`profile-alert ${alertMsg.type}`}>
            <span>{alertMsg.text}</span>
            <button
              onClick={() => setAlertMsg(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Edit Header Card */}
        <div className="profile-header-card">
          <div className="profile-header-left">
            <div
              className="avatar-progress-container"
              onClick={triggerPhotoInput}
              style={{ cursor: 'pointer' }}
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
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <FiCalendar className="detail-icon" />
                  <span>{displayData.noticePeriod}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Body: Quick Links + Sections */}
        <div className="profile-body-layout">
          {/* Quick Links Sidebar */}

          {/* Section Cards */}
          <div className="profile-sections-stack">
            {/* Resume */}
            <div className="section-card" id="edit-section-resume">
              <div className="section-card-header">
                <h2 className="section-card-title">Resume</h2>
              </div>
              {displayData.resumeName && (
                <div className="resume-uploaded-box">
                  <div className="resume-file-info">
                    <span className="resume-file-name">{displayData.resumeName}</span>
                    <span className="resume-upload-date">{displayData.resumeDate}</span>
                  </div>
                  <div className="resume-file-actions">
                    <button className="btn-resume-icon" title="Download">
                      <FiDownload size={16} />
                    </button>
                    <button
                      className="btn-resume-icon delete"
                      title="Delete"
                      onClick={() => setDisplayData(prev => ({ ...prev, resumeName: '' }))}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
              <div className="resume-dropzone">
                <label className="btn-update-resume">
                  Update resume
                  <input
                    type="file"
                    accept=".doc,.docx,.rtf,.pdf"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                <span className="resume-hint">
                  Supported Formats: doc, docx, rtf, pdf, upto 2 MB
                </span>
              </div>
            </div>

            {/* Resume Headline */}
            <div className="section-card" id="edit-section-resume-headline">
              <div className="section-card-header">
                <h2 className="section-card-title">Resume headline</h2>
                <button
                  className="btn-icon-edit"
                  onClick={() => {
                    setHeadlineText(displayData.headline);
                    setActiveModal('headline');
                  }}
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
                    setActiveModal('skills');
                  }}
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
                    setActiveModal('education');
                  }}
                >
                  Add education
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
                      {edu.startYear} {edu.endYear ? ` - ${edu.endYear}` : ''}
                      {edu.courseType ? ` | ${edu.courseType}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IT Skills */}
            <div className="section-card" id="edit-section-it-skills">
              <div className="section-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h2 className="section-card-title">IT skills</h2>
                  <span className="it-skills-boost">Add 10%</span>
                </div>
                <button
                  className="btn-link-action"
                  onClick={() => {
                    setSkillsList([...displayData.skills]);
                    setActiveModal('skills');
                  }}
                >
                  Add details
                </button>
              </div>
              <p className="it-skills-subtext">
                Show your technical expertise by mentioning softwares and skills you know
              </p>
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
                    setActiveModal('project');
                  }}
                >
                  Add project
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
                    setActiveModal('summary');
                  }}
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
                <button className="btn-icon-edit" onClick={goToProfile}>
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
                    setActiveModal('personal');
                  }}
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
    </div>
  );

  return (
    <>
      {view === 'profile' ? <ProfileView /> : <EditView />}

      {/* MODALS */}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={basicForm.firstName}
                    onChange={e => setBasicForm({ ...basicForm, firstName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={basicForm.lastName}
                    onChange={e => setBasicForm({ ...basicForm, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Mobile Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={basicForm.phone}
                  onChange={e => setBasicForm({ ...basicForm, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Current Location / City</label>
                <input
                  type="text"
                  className="form-control"
                  value={basicForm.currentLocation}
                  onChange={e =>
                    setBasicForm({ ...basicForm, currentLocation: e.target.value })
                  }
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Experience Status</label>
                  <input
                    type="text"
                    className="form-control"
                    value={basicForm.experienceStatus}
                    onChange={e =>
                      setBasicForm({ ...basicForm, experienceStatus: e.target.value })
                    }
                    placeholder="e.g. Fresher / 2 Years"
                  />
                </div>
                <div className="form-group">
                  <label>Notice Period / Availability</label>
                  <input
                    type="text"
                    className="form-control"
                    value={basicForm.noticePeriod}
                    onChange={e =>
                      setBasicForm({ ...basicForm, noticePeriod: e.target.value })
                    }
                    placeholder="e.g. Available in 15 Days"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveBasic} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
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
                <label>Headline Statement</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={headlineText}
                  onChange={e => setHeadlineText(e.target.value)}
                  placeholder="Summarize your experience and strengths..."
                />
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
                    className="form-control"
                    style={{ flex: 1 }}
                    placeholder="e.g. Spring Boot, Docker..."
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
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
              </div>
              <div className="form-group">
                <label>Current Skills</label>
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
                      >
                        ✕
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
                <label>Degree / Qualification</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. B.Tech / B.E. Computer Science"
                  value={eduForm.qualification}
                  onChange={e => setEduForm({ ...eduForm, qualification: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>College / Institution Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. MVGR College of Engineering"
                  value={eduForm.institution}
                  onChange={e => setEduForm({ ...eduForm, institution: e.target.value })}
                />
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
                    onChange={e =>
                      setEduForm({ ...eduForm, startYear: parseInt(e.target.value) || 2021 })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>End Year</label>
                  <input
                    type="number"
                    className="form-control"
                    value={eduForm.endYear}
                    onChange={e =>
                      setEduForm({ ...eduForm, endYear: parseInt(e.target.value) || 2025 })
                    }
                  />
                </div>
              </div>
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
                <label>Project Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. E-Commerce Web Application"
                  value={projForm.name}
                  onChange={e => setProjForm({ ...projForm, name: e.target.value })}
                />
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
                <label>Project Summary & Key Contributions</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Describe your role, tech stack, and achievements..."
                  value={projForm.summary}
                  onChange={e => setProjForm({ ...projForm, summary: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>GitHub Repository Link</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="https://github.com/username/project"
                  value={projForm.githubUrl}
                  onChange={e => setProjForm({ ...projForm, githubUrl: e.target.value })}
                />
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
                <label>Detailed Bio / Summary</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={summaryText}
                  onChange={e => setSummaryText(e.target.value)}
                  placeholder="Describe your professional background..."
                />
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Gender</label>
                  <select
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
                  <label>Marital Status</label>
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
                <label>Date of Birth</label>
                <input
                  type="date"
                  className="form-control"
                  value={personalForm.dateOfBirth}
                  onChange={e =>
                    setPersonalForm({ ...personalForm, dateOfBirth: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Languages Known</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="English, Hindi, Telugu"
                  value={personalForm.languages}
                  onChange={e =>
                    setPersonalForm({ ...personalForm, languages: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Permanent Address</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={personalForm.permanentAddress}
                  onChange={e =>
                    setPersonalForm({ ...personalForm, permanentAddress: e.target.value })
                  }
                />
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