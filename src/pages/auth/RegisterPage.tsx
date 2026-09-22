import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth";
import logoImg from "../../assets/logo.png";
import authBg from "../../assets/auth-bg.jpg";
import { FiAward, FiBriefcase, FiTrendingUp, FiEye, FiEyeOff, FiArrowRight, FiCheck, FiAlertCircle } from "react-icons/fi";
import { validateEmail, validatePassword, validateRequired } from "../../utils/validators";
import "./Auth.css";

const FEATURES = [
  {
    icon: <FiAward size={20} color="#70c144" />,
    title: "Prove your strength, not just your resume",
    desc: "Complete real-world skill challenges that let companies see exactly what you can do.",
  },
  {
    icon: <FiBriefcase size={20} color="#70c144" />,
    title: "Companies that match your ambitions",
    desc: "Connect directly with hiring managers who value what you can build.",
  },
  {
    icon: <FiTrendingUp size={20} color="#70c144" />,
    title: "Accelerate your hiring journey",
    desc: "Skip initial phone screens and move straight to meaningful conversations.",
  },
];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [role, setRole]                 = useState<"CANDIDATE" | "COMPANY">("CANDIDATE");
  const [fullName, setFullName]         = useState("");
  const [companyName, setCompanyName]   = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd]           = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const [fieldErrors, setFieldErrors]   = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [touched, setTouched]           = useState<{
    name?: boolean;
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});

  const isCompany = role === "COMPANY";

  const validateForm = () => {
    const errors: typeof fieldErrors = {};

    const nameToValidate = isCompany ? companyName : fullName;
    const nameLabel = isCompany ? "Company name" : "Full name";
    const nameErr = validateRequired(nameToValidate, nameLabel, 2);
    if (nameErr) errors.name = nameErr;

    const emailErr = validateEmail(email, isCompany ? "Work email" : "Email");
    if (emailErr) errors.email = emailErr;

    const pwdErr = validatePassword(password, 8);
    if (pwdErr) errors.password = pwdErr;

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'name') {
      const nameToValidate = isCompany ? companyName : fullName;
      const nameLabel = isCompany ? "Company name" : "Full name";
      const err = validateRequired(nameToValidate, nameLabel, 2);
      setFieldErrors(prev => ({ ...prev, name: err || undefined }));
    } else if (field === 'email') {
      const err = validateEmail(email, isCompany ? "Work email" : "Email");
      setFieldErrors(prev => ({ ...prev, email: err || undefined }));
    } else if (field === 'password') {
      const err = validatePassword(password, 8);
      setFieldErrors(prev => ({ ...prev, password: err || undefined }));
    } else if (field === 'confirmPassword') {
      let err: string | undefined;
      if (!confirmPassword) err = "Please confirm your password.";
      else if (password !== confirmPassword) err = "Passwords do not match.";
      setFieldErrors(prev => ({ ...prev, confirmPassword: err }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    if (!validateForm()) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      await authApi.register({
        fullName: isCompany ? companyName.trim() : fullName.trim(),
        email: email.trim(),
        password,
        role,
      });

      navigate("/login", {
        state: {
          registeredEmail: email.trim(),
          successMsg: "Account created successfully! Please sign in with your credentials.",
        },
      });
    } catch (err: any) {
      let msg = err?.response?.data?.message || err?.message || "Registration failed. Please try again.";
      if (err?.code === "ERR_NETWORK" || !err?.response) {
        msg = "Cannot connect to backend server. Please make sure the backend is running on port 8080.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">

      {/* --------------- LEFT PANEL --------------- */}
      <div
        className="auth-left"
        style={{ "--auth-bg": `url(${authBg})` } as React.CSSProperties}
      >
        <div className="auth-left-glow" />
        <div className="auth-left-content">
          <Link to="/" className="auth-panel-logo" title="StrengthOut Home">
            <img src={logoImg} alt="StrengthOut" />
          </Link>
          <h1 className="auth-panel-headline">
            Build your profile.<br />
            Prove your skills.<br />
            <span>Get hired.</span>
          </h1>
          <p className="auth-panel-sub">
            Join thousands of professionals who use StrengthOut to prove their skills,
            skip traditional resume filters, and connect directly with top companies.
          </p>
          <ul className="auth-features">
            {FEATURES.map((f) => (
              <li key={f.title} className="auth-feature-item">
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

      {/* --------------- RIGHT PANEL --------------- */}
      <div className="auth-right">

        <div className="auth-right-inner">
          <div className="auth-form-wrapper">
            <h2 className="auth-form-title">Create an account</h2>
            <p className="auth-form-sub">
              Get started with StrengthOut in under 2 minutes.
            </p>

            {error && <div className="auth-error">{error}</div>}

            {/* Role selector */}
            <div className="role-toggle-group" role="group" aria-label="Account type">
              <button
                type="button"
                className={`role-toggle-btn ${!isCompany ? "active" : ""}`}
                onClick={() => { setRole("CANDIDATE"); setFieldErrors({}); }}
              >
                Candidate
              </button>
              <button
                type="button"
                className={`role-toggle-btn ${isCompany ? "active" : ""}`}
                onClick={() => { setRole("COMPANY"); setFieldErrors({}); }}
              >
                Employer / Company
              </button>
            </div>

            <form onSubmit={handleRegister} className="auth-form" noValidate>

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
                        const err = validateRequired(e.target.value, "Company name", 2);
                        setFieldErrors(prev => ({ ...prev, name: err || undefined }));
                      }
                    }}
                    onBlur={() => handleBlur('name')}
                    placeholder="Acme Corp"
                    className={touched.name && fieldErrors.name ? "is-invalid" : ""}
                  />
                  {touched.name && fieldErrors.name && (
                    <span className="field-hint error">
                      <FiAlertCircle size={13} /> {fieldErrors.name}
                    </span>
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
                        const err = validateRequired(e.target.value, "Full name", 2);
                        setFieldErrors(prev => ({ ...prev, name: err || undefined }));
                      }
                    }}
                    onBlur={() => handleBlur('name')}
                    placeholder="Alex Morgan"
                    className={touched.name && fieldErrors.name ? "is-invalid" : ""}
                  />
                  {touched.name && fieldErrors.name && (
                    <span className="field-hint error">
                      <FiAlertCircle size={13} /> {fieldErrors.name}
                    </span>
                  )}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="reg-email">
                  {isCompany ? "Work Email" : "Email Address"}{" "}
                  <span className="required-star">*</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) {
                      const err = validateEmail(e.target.value, isCompany ? "Work email" : "Email");
                      setFieldErrors(prev => ({ ...prev, email: err || undefined }));
                    }
                  }}
                  onBlur={() => handleBlur('email')}
                  placeholder={isCompany ? "hr@acme.com" : "you@example.com"}
                  className={touched.email && fieldErrors.email ? "is-invalid" : ""}
                  autoComplete="email"
                />
                {touched.email && fieldErrors.email && (
                  <span className="field-hint error">
                    <FiAlertCircle size={13} /> {fieldErrors.email}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">
                  Password <span className="required-star">*</span>
                </label>
                <div className={`password-wrapper ${touched.password && fieldErrors.password ? "is-invalid-wrap" : ""}`}>
                  <input
                    id="reg-password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (touched.password) {
                        const err = validatePassword(e.target.value, 8);
                        setFieldErrors(prev => ({ ...prev, password: err || undefined }));
                      }
                      if (touched.confirmPassword && confirmPassword) {
                        const match = e.target.value === confirmPassword;
                        setFieldErrors(prev => ({ ...prev, confirmPassword: match ? undefined : "Passwords do not match." }));
                      }
                    }}
                    onBlur={() => handleBlur('password')}
                    placeholder="Min 8 characters"
                    className={touched.password && fieldErrors.password ? "is-invalid" : ""}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="pwd-toggle"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPwd ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {touched.password && fieldErrors.password && (
                  <span className="field-hint error">
                    <FiAlertCircle size={13} /> {fieldErrors.password}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reg-confirm-password">
                  Confirm Password <span className="required-star">*</span>
                </label>
                <div className={`password-wrapper ${touched.confirmPassword && fieldErrors.confirmPassword ? "is-invalid-wrap" : ""}`}>
                  <input
                    id="reg-confirm-password"
                    type={showConfirmPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (touched.confirmPassword) {
                        const match = password === e.target.value;
                        setFieldErrors(prev => ({ ...prev, confirmPassword: match ? undefined : "Passwords do not match." }));
                      }
                    }}
                    onBlur={() => handleBlur('confirmPassword')}
                    placeholder="Confirm password"
                    className={touched.confirmPassword && fieldErrors.confirmPassword ? "is-invalid" : ""}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="pwd-toggle"
                    onClick={() => setShowConfirmPwd((v) => !v)}
                    aria-label={showConfirmPwd ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showConfirmPwd ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {touched.confirmPassword && fieldErrors.confirmPassword && (
                  <span className="field-hint error">
                    <FiAlertCircle size={13} /> {fieldErrors.confirmPassword}
                  </span>
                )}
                {confirmPassword && password === confirmPassword && password.length >= 8 && (
                  <span className="field-hint success">
                    <FiCheck size={13} /> Passwords match
                  </span>
                )}
              </div>

              <button
                id="reg-submit-btn"
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>{isCompany ? "Create Employer Account" : "Create Candidate Account"} <FiArrowRight size={16} /></span>}
              </button>

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
