import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import logoImg from '../../assets/logo.png';
import authBg from '../../assets/auth-bg.jpg';
import {
  FiAward,
  FiBriefcase,
  FiTrendingUp,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiArrowLeft,
  FiCheck,
  FiGlobe,
  FiLinkedin,
  FiMapPin,
  FiUsers,
  FiPhone,
  FiUser,
  FiLayers,
} from 'react-icons/fi';
import { validateEmail, validatePassword, validateRequired } from '../../utils/validators';
import './Auth.css';

const CANDIDATE_FEATURES = [
  {
    icon: <FiAward size={20} color="#70c144" />,
    title: 'Prove your strength, not just your resume',
    desc: 'Complete real-world skill challenges that let companies see exactly what you can build.',
  },
  {
    icon: <FiBriefcase size={20} color="#70c144" />,
    title: 'Companies that match your ambitions',
    desc: 'Connect directly with hiring managers who value authentic engineering talent.',
  },
  {
    icon: <FiTrendingUp size={20} color="#70c144" />,
    title: 'Accelerate your hiring journey',
    desc: 'Skip initial phone screens and move straight to meaningful conversations.',
  },
];

const COMPANY_FEATURES = [
  {
    icon: <FiAward size={20} color="#70c144" />,
    title: 'Hire Verified, High-Impact Talent',
    desc: 'Access pre-evaluated candidates with validated skills, repo code, and RightPath assessments.',
  },
  {
    icon: <FiBriefcase size={20} color="#70c144" />,
    title: 'Cut Screening Time by 70%',
    desc: 'Review verified submissions and candidate video pitch introductions directly.',
  },
  {
    icon: <FiTrendingUp size={20} color="#70c144" />,
    title: 'Accelerate Team Growth',
    desc: 'Hire directly with transparent candidate data and zero recruitment bottlenecks.',
  },
];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [role, setRole]                       = useState<'CANDIDATE' | 'COMPANY'>('CANDIDATE');
  const [companyStep, setCompanyStep]         = useState<1 | 2>(1);

  // Step 1 fields (Credentials & Name)
  const [fullName, setFullName]               = useState('');
  const [companyName, setCompanyName]         = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd]                 = useState(false);
  const [showConfirmPwd, setShowConfirmPwd]   = useState(false);

  // Step 2 fields (Company Extended Details)
  const [website, setWebsite]                 = useState('');
  const [linkedinUrl, setLinkedinUrl]         = useState('');
  const [city, setCity]                       = useState('');
  const [country, setCountry]                 = useState('India');
  const [companySize, setCompanySize]         = useState('11-50 Employees');
  const [industry, setIndustry]               = useState('Information Technology & Services');
  const [description, setDescription]         = useState('');
  const [contactName, setContactName]         = useState('');
  const [contactPhone, setContactPhone]       = useState('');

  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');

  const [fieldErrors, setFieldErrors]         = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [touched, setTouched]                 = useState<{
    name?: boolean;
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});

  const isCompany = role === 'COMPANY';

  // Check if Step 1 has all required fields properly filled to enable the Next button
  const isStep1Complete = Boolean(
    companyName.trim().length >= 2 &&
    email.trim().length > 0 &&
    !validateEmail(email, 'Work email') &&
    password.length >= 8 &&
    confirmPassword === password
  );

  const handleRoleChange = (newRole: 'CANDIDATE' | 'COMPANY') => {
    setRole(newRole);
    setCompanyStep(1);
    setError('');
    setFieldErrors({});
    setTouched({});
  };

  const validateStep1 = () => {
    const errors: typeof fieldErrors = {};

    const nameToValidate = isCompany ? companyName : fullName;
    const nameLabel = isCompany ? 'Company name' : 'Full name';
    const nameErr = validateRequired(nameToValidate, nameLabel, 2);
    if (nameErr) errors.name = nameErr;

    const emailErr = validateEmail(email, isCompany ? 'Work email' : 'Email');
    if (emailErr) errors.email = emailErr;

    const pwdErr = validatePassword(password, 8);
    if (pwdErr) errors.password = pwdErr;

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'name') {
      const nameToValidate = isCompany ? companyName : fullName;
      const nameLabel = isCompany ? 'Company name' : 'Full name';
      const err = validateRequired(nameToValidate, nameLabel, 2);
      setFieldErrors(prev => ({ ...prev, name: err || undefined }));
    } else if (field === 'email') {
      const err = validateEmail(email, isCompany ? 'Work email' : 'Email');
      setFieldErrors(prev => ({ ...prev, email: err || undefined }));
    } else if (field === 'password') {
      const err = validatePassword(password, 8);
      setFieldErrors(prev => ({ ...prev, password: err || undefined }));
    } else if (field === 'confirmPassword') {
      let err: string | undefined;
      if (!confirmPassword) err = 'Please confirm your password.';
      else if (password !== confirmPassword) err = 'Passwords do not match.';
      setFieldErrors(prev => ({ ...prev, confirmPassword: err }));
    }
  };

  const handleNextStep = () => {
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (validateStep1()) {
      setError('');
      setCompanyStep(2);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setCompanyStep(1);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep1()) {
      setCompanyStep(1);
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isCompany) {
        let formattedWebsite = website.trim();
        if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
          formattedWebsite = `https://${formattedWebsite}`;
        }

        let formattedLinkedin = linkedinUrl.trim();
        if (formattedLinkedin && !/^https?:\/\//i.test(formattedLinkedin)) {
          formattedLinkedin = `https://${formattedLinkedin}`;
        }

        await authApi.register({
          fullName: companyName.trim(),
          companyName: companyName.trim(),
          email: email.trim(),
          password,
          role: 'COMPANY',
          website: formattedWebsite,
          linkedinUrl: formattedLinkedin,
          city: city.trim(),
          country: country.trim(),
          companySize,
          industry,
          description: description.trim(),
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
        });
      } else {
        await authApi.register({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role: 'CANDIDATE',
        });
      }

      navigate('/login', {
        state: {
          registeredEmail: email.trim(),
          successMsg: 'Account created successfully! Please sign in with your credentials.',
        },
      });
    } catch (err: any) {
      let msg = err?.response?.data?.message || err?.message || 'Registration failed. Please try again.';
      if (err?.code === 'ERR_NETWORK' || !err?.response) {
        msg = 'Cannot connect to backend server. Please make sure the backend is running on port 8080.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const currentFeatures = isCompany ? COMPANY_FEATURES : CANDIDATE_FEATURES;

  return (
    <div className="auth-root">
            {/* --------------- LEFT PANEL --------------- */}
      <div
        className="auth-left"
        style={{ '--auth-bg': `url(${authBg})` } as React.CSSProperties}
      >
        <div className="auth-left-glow" />
        <div className="auth-left-inner">
          <Link to="/" className="auth-panel-logo" title="StrengthOut Home">
            <img src={logoImg} alt="StrengthOut" />
          </Link>

          <div className="auth-left-hero">
            <h1 className="auth-panel-headline">
              {isCompany ? (
                <>
                  Hire verified,<br />
                  high-impact talent<br />
                  <span>directly.</span>
                </>
              ) : (
                <>
                  Your strength.<br />
                  Your story.<br />
                  <span>Your career.</span>
                </>
              )}
            </h1>

            <p className="auth-panel-sub">
              {isCompany
                ? 'Discover skilled professionals with verified RightPath assessments, authentic project repositories, and video pitch introductions.'
                : 'StrengthOut helps you get discovered for what you can actually build — not just keywords on a piece of paper.'}
            </p>

            <ul className="auth-features">
              {currentFeatures.map((f, i) => (
                <li key={i} className="auth-feature-item">
                  <div className="auth-feature-icon">{f.icon}</div>
                  <div className="auth-feature-text">
                    <strong>{f.title}</strong>
                    <span>{f.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="auth-left-footer">
            &copy; {new Date().getFullYear()} StrengthOut &bull; iSign Technologies
          </p>
        </div>
      </div>

      {/* --------------- RIGHT PANEL --------------- */}
      <div className="auth-right">

        <div className="auth-right-inner">
          <div
            className="auth-form-wrapper"
            style={{ maxWidth: isCompany && companyStep === 2 ? '440px' : '400px' }}
          >
            <h2 className="auth-form-title">Create an account</h2>
            <p className="auth-form-sub">
              {isCompany && companyStep === 2
                ? 'Provide organization details to help candidates learn about your company.'
                : 'Get started with StrengthOut in under 2 minutes.'}
            </p>

            {error && <div className="auth-error">{error}</div>}

            {/* Role Toggle Selector */}
            <div className="role-toggle-group">
              <button
                type="button"
                className={`role-toggle-btn ${!isCompany ? 'active' : ''}`}
                onClick={() => handleRoleChange('CANDIDATE')}
              >
                Candidate
              </button>
              <button
                type="button"
                className={`role-toggle-btn ${isCompany ? 'active' : ''}`}
                onClick={() => handleRoleChange('COMPANY')}
              >
                Employer / Company
              </button>
            </div>

            {/* Multi-Step Stepper for Company */}
            {isCompany && (
              <div className="company-stepper">
                <div className={`company-step-item ${companyStep === 1 ? 'active' : 'completed'}`}>
                  <span className="company-step-badge">{companyStep > 1 ? '✓' : '1'}</span>
                  <span className="company-step-label">Account Info</span>
                </div>
                <div className="company-step-divider" />
                <div className={`company-step-item ${companyStep === 2 ? 'active' : ''}`}>
                  <span className="company-step-badge">2</span>
                  <span className="company-step-label">Company Details</span>
                </div>
              </div>
            )}

            <form className="auth-form" onSubmit={handleRegister} noValidate>
              {/* ====================================================
                  STEP 1: Account Credentials & Name
                 ==================================================== */}
              {(!isCompany || companyStep === 1) && (
                <>
                  {isCompany ? (
                    <div className="form-group">
                      <label htmlFor="reg-company">
                        Company Name <span className="required-star">*</span>
                      </label>
                      <input
                        id="reg-company"
                        type="text"
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          if (touched.name) {
                            const err = validateRequired(e.target.value, 'Company name', 2);
                            setFieldErrors(prev => ({ ...prev, name: err || undefined }));
                          }
                        }}
                        onBlur={() => handleBlur('name')}
                        placeholder="e.g. Acme Innovations"
                        autoComplete="organization"
                      />
                      {touched.name && fieldErrors.name && (
                        <span className="field-hint error">{fieldErrors.name}</span>
                      )}
                    </div>
                  ) : (
                    <div className="form-group">
                      <label htmlFor="reg-fullname">
                        Full Name <span className="required-star">*</span>
                      </label>
                      <input
                        id="reg-fullname"
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (touched.name) {
                            const err = validateRequired(e.target.value, 'Full name', 2);
                            setFieldErrors(prev => ({ ...prev, name: err || undefined }));
                          }
                        }}
                        onBlur={() => handleBlur('name')}
                        placeholder="e.g. Alex Johnson"
                        autoComplete="name"
                      />
                      {touched.name && fieldErrors.name && (
                        <span className="field-hint error">{fieldErrors.name}</span>
                      )}
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="reg-email">
                      {isCompany ? 'Work Email' : 'Email Address'} <span className="required-star">*</span>
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (touched.email) {
                          const err = validateEmail(e.target.value, isCompany ? 'Work email' : 'Email');
                          setFieldErrors(prev => ({ ...prev, email: err || undefined }));
                        }
                      }}
                      onBlur={() => handleBlur('email')}
                      placeholder={isCompany ? 'hr@company.com' : 'alex@example.com'}
                      autoComplete="email"
                    />
                    {touched.email && fieldErrors.email && (
                      <span className="field-hint error">{fieldErrors.email}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-password">
                      Password <span className="required-star">*</span>
                    </label>
                    <div className="password-wrapper">
                      <input
                        id="reg-password"
                        type={showPwd ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (touched.password) {
                            const err = validatePassword(e.target.value, 8);
                            setFieldErrors(prev => ({ ...prev, password: err || undefined }));
                          }
                        }}
                        onBlur={() => handleBlur('password')}
                        placeholder="Minimum 8 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="pwd-toggle"
                        onClick={() => setShowPwd(!showPwd)}
                        aria-label={showPwd ? 'Hide password' : 'Show password'}
                      >
                        {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                    {touched.password && fieldErrors.password && (
                      <span className="field-hint error">{fieldErrors.password}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-confirm-password">
                      Confirm Password <span className="required-star">*</span>
                    </label>
                    <div className="password-wrapper">
                      <input
                        id="reg-confirm-password"
                        type={showConfirmPwd ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (touched.confirmPassword) {
                            let err: string | undefined;
                            if (!e.target.value) err = 'Please confirm your password.';
                            else if (password !== e.target.value) err = 'Passwords do not match.';
                            setFieldErrors(prev => ({ ...prev, confirmPassword: err }));
                          }
                        }}
                        onBlur={() => handleBlur('confirmPassword')}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="pwd-toggle"
                        onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                        aria-label={showConfirmPwd ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                    {touched.confirmPassword && fieldErrors.confirmPassword && (
                      <span className="field-hint error">{fieldErrors.confirmPassword}</span>
                    )}
                    {confirmPassword && !fieldErrors.confirmPassword && password === confirmPassword && (
                      <span className="field-hint success">
                        <FiCheck size={12} style={{ marginRight: '3px', verticalAlign: 'middle' }} /> Passwords match
                      </span>
                    )}
                  </div>

                  {/* Step 1 Actions */}
                  {isCompany ? (
                    <button
                      id="reg-next-btn"
                      type="button"
                      className="auth-submit-btn"
                      onClick={handleNextStep}
                      disabled={!isStep1Complete}
                    >
                      <span>Next: Company Details</span> <FiArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      id="reg-submit-btn"
                      type="submit"
                      className="auth-submit-btn"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="spinner" />
                      ) : (
                        <>
                          <span>Create Account</span> <FiArrowRight size={16} />
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              {/* ====================================================
                  STEP 2: Company Extended Details
                 ==================================================== */}
              {isCompany && companyStep === 2 && (
                <div className="company-details-step">
                  <div className="form-group">
                    <label htmlFor="reg-website">
                      <FiGlobe size={14} style={{ marginRight: '5px', verticalAlign: 'middle', color: '#70c144' }} />
                      Company Website URL
                    </label>
                    <input
                      id="reg-website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                    />
                    <span className="field-hint-sub">e.g. https://acmecorp.com</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-linkedin">
                      <FiLinkedin size={14} style={{ marginRight: '5px', verticalAlign: 'middle', color: '#0a66c2' }} />
                      LinkedIn Company Page
                    </label>
                    <input
                      id="reg-linkedin"
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/company/acmecorp"
                    />
                    <span className="field-hint-sub">Helps candidates verify and research your organization</span>
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label htmlFor="reg-city">
                        <FiMapPin size={14} style={{ marginRight: '5px', verticalAlign: 'middle', color: '#70c144' }} />
                        City / Headquarters
                      </label>
                      <input
                        id="reg-city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Hyderabad"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="reg-country">Country</label>
                      <input
                        id="reg-country"
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. India"
                      />
                    </div>
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label htmlFor="reg-size">
                        <FiUsers size={14} style={{ marginRight: '5px', verticalAlign: 'middle', color: '#70c144' }} />
                        Employee Strength
                      </label>
                      <select
                        id="reg-size"
                        value={companySize}
                        onChange={(e) => setCompanySize(e.target.value)}
                        className="form-select"
                      >
                        <option value="1-10 Employees">1-10 Employees (Seed / Early)</option>
                        <option value="11-50 Employees">11-50 Employees (Startup / Growth)</option>
                        <option value="51-200 Employees">51-200 Employees (Mid-size)</option>
                        <option value="201-500 Employees">201-500 Employees (Scale-up)</option>
                        <option value="500+ Employees">500+ Employees (Enterprise)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="reg-industry">
                        <FiLayers size={14} style={{ marginRight: '5px', verticalAlign: 'middle', color: '#70c144' }} />
                        Industry / Domain
                      </label>
                      <select
                        id="reg-industry"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="form-select"
                      >
                        <option value="Information Technology & Services">Information Technology & Services</option>
                        <option value="Software Development & SaaS">Software Development & SaaS</option>
                        <option value="Financial Services & Fintech">Financial Services & Fintech</option>
                        <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                        <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                        <option value="Telecommunications">Telecommunications</option>
                        <option value="Consulting & Professional Services">Consulting & Professional Services</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-desc">About Organization</label>
                    <textarea
                      id="reg-desc"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Briefly describe your company mission, culture, or hiring focus..."
                      className="form-textarea"
                    />
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label htmlFor="reg-contact-name">
                        <FiUser size={14} style={{ marginRight: '5px', verticalAlign: 'middle', color: '#70c144' }} />
                        Contact Person
                      </label>
                      <input
                        id="reg-contact-name"
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. HR Manager / Lead"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="reg-contact-phone">
                        <FiPhone size={14} style={{ marginRight: '5px', verticalAlign: 'middle', color: '#70c144' }} />
                        Contact Phone
                      </label>
                      <input
                        id="reg-contact-phone"
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="e.g. +91 9876543210"
                      />
                    </div>
                  </div>

                  {/* Navigation Action Buttons for Step 2 */}
                  <div className="auth-step-actions">
                    <button
                      type="button"
                      className="auth-secondary-btn"
                      onClick={handlePrevStep}
                      disabled={loading}
                    >
                      <FiArrowLeft size={16} /> Back
                    </button>
                    <button
                      id="reg-submit-btn"
                      type="submit"
                      className="auth-submit-btn"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="spinner" />
                      ) : (
                        <>
                          <span>Create Employer Account</span> <FiArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            <p className="auth-bottom-link">
              Already have an account?&nbsp;
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
