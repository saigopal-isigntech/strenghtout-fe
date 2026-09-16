import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth";
import logoImg from "../../assets/logo.png";
import authBg from "../../assets/auth-bg.jpg";
import { FiTarget, FiUsers, FiBriefcase, FiTrendingUp, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import "./Auth.css";

const FEATURES = [
  {
    icon: <FiTarget size={20} color="#70c144" />,
    title: "Skills that speak louder than words",
    desc: "Our challenge system lets your real abilities shine — not just what you write on paper.",
  },
  {
    icon: <FiUsers size={20} color="#70c144" />,
    title: "A network built on verified talent",
    desc: "Every profile on StrengthOut is backed by demonstrated, assessed skills.",
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
  const [showPwd, setShowPwd]           = useState(false);

  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const isCompany = role === "COMPANY";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authApi.register({
        fullName: isCompany ? companyName : fullName,
        email,
        password,
        role,
      });

      navigate("/login", {
        state: {
          registeredEmail: email,
          successMsg: "Account created! Sign in to start your StrengthOut journey.",
        },
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Registration failed. Please try again.";
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
                onClick={() => setRole("CANDIDATE")}
              >
                Candidate
              </button>
              <button
                type="button"
                className={`role-toggle-btn ${isCompany ? "active" : ""}`}
                onClick={() => setRole("COMPANY")}
              >
                Employer / Company
              </button>
            </div>

            <form onSubmit={handleRegister} className="auth-form">

              {isCompany ? (
                <div className="form-group">
                  <label htmlFor="reg-company">
                    Company Name <span className="required-star">*</span>
                  </label>
                  <input
                    id="reg-company"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    required
                  />
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
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    required
                  />
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isCompany ? "hr@acme.com" : "you@example.com"}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">
                  Password <span className="required-star">*</span>
                </label>
                <div className="password-wrapper">
                  <input
                    id="reg-password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
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
                {password && password.length < 8 && (
                  <span className="field-hint error">
                    Password must be at least 8 characters long.
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
