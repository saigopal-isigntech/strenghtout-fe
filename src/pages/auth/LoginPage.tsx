import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logoImg from "../../assets/logo.png";
import authBg from "../../assets/auth-bg.jpg";
import { FiAward, FiBriefcase, FiTrendingUp, FiEye, FiEyeOff, FiArrowRight, FiCheck, FiAlertCircle } from "react-icons/fi";
import { validateEmail, validatePassword } from "../../utils/validators";
import "./Auth.css";

const FEATURES = [
  {
    icon: <FiAward size={20} color="#70c144" />,
    title: "Prove your strength, not just your resume",
    desc: "Complete real-world skill challenges that let companies see exactly what you can build.",
  },
  {
    icon: <FiBriefcase size={20} color="#70c144" />,
    title: "Companies that match your ambitions",
    desc: "Connect directly with hiring managers who value authentic engineering talent.",
  },
  {
    icon: <FiTrendingUp size={20} color="#70c144" />,
    title: "Accelerate your hiring journey",
    desc: "Skip initial phone screens and move straight to meaningful conversations.",
  },
];

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const registeredEmail = (location.state as any)?.registeredEmail || "";
  const initialSuccess  = (location.state as any)?.successMsg || "";

  const [email, setEmail]         = useState(registeredEmail);
  const [password, setPassword]   = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [error, setError]         = useState("");
  const [success]                 = useState(initialSuccess);
  const [loading, setLoading]     = useState(false);

  // Field errors & touched states
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched]         = useState<{ email?: boolean; password?: boolean }>({});

  const validateForm = () => {
    const emailErr = validateEmail(email);
    const pwdErr   = validatePassword(password, 1);
    const errors: { email?: string; password?: string } = {};

    if (emailErr) errors.email = emailErr;
    if (pwdErr) errors.password = pwdErr;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') {
      const err = validateEmail(email);
      setFieldErrors(prev => ({ ...prev, email: err || undefined }));
    } else if (field === 'password') {
      const err = validatePassword(password, 1);
      setFieldErrors(prev => ({ ...prev, password: err || undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!validateForm()) {
      return;
    }

    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed. Please check your credentials.");
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
        <div className="auth-left-inner">
          <Link to="/" className="auth-panel-logo" title="StrengthOut Home">
            <img src={logoImg} alt="StrengthOut" />
          </Link>

          <div className="auth-left-hero">
            <h1 className="auth-panel-headline">
              Your strength.<br />
              Your story.<br />
              <span>Your career.</span>
            </h1>
            <p className="auth-panel-sub">
              StrengthOut replaces blind CV screening with real skill validation &mdash;
              so the right companies find <em>you</em>, not just your paper.
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
      </div>

      {/* --------------- RIGHT PANEL --------------- */}
      <div className="auth-right">

        <div className="auth-right-inner">
          <div className="auth-form-wrapper">
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-sub">
              Sign in to continue growing your career on StrengthOut.
            </p>

            {success && (
              <div className="auth-success">
                <span><FiCheck size={14} /></span>&nbsp;{success}
              </div>
            )}
            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <label htmlFor="login-email">
                  Email <span className="required-star">*</span>
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) {
                      const err = validateEmail(e.target.value);
                      setFieldErrors(prev => ({ ...prev, email: err || undefined }));
                    }
                  }}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@example.com"
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label htmlFor="login-password" style={{ margin: 0 }}>
                    Password <span className="required-star">*</span>
                  </label>
                  <Link to="/forgot-password" className="forgot-password-link" style={{ fontSize: '0.85rem', color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
                    Forgot password?
                  </Link>
                </div>
                <div className={`password-wrapper ${touched.password && fieldErrors.password ? "is-invalid-wrap" : ""}`}>
                  <input
                    id="login-password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (touched.password) {
                        const err = validatePassword(e.target.value, 1);
                        setFieldErrors(prev => ({ ...prev, password: err || undefined }));
                      }
                    }}
                    onBlur={() => handleBlur('password')}
                    placeholder="Your password"
                    className={touched.password && fieldErrors.password ? "is-invalid" : ""}
                    autoComplete="current-password"
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

              <button
                id="login-submit-btn"
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>Sign In <FiArrowRight size={16} /></span>}
              </button>
            </form>

            <p className="auth-bottom-link">
              Don&apos;t have an account?&nbsp;
              <Link to="/register">Join StrengthOut free</Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
