import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logoImg from "../../assets/logo.png";
import authBg from "../../assets/auth-bg.jpg";
import { FiAward, FiBriefcase, FiZap, FiTrendingUp, FiEye, FiEyeOff, FiArrowRight, FiCheck } from "react-icons/fi";
import "./Auth.css";

const FEATURES = [
  {
    icon: <FiAward size={20} color="#70c144" />,
    title: "Prove your strength, not just your resume",
    desc: "Complete real-world skill challenges that let companies see exactly what you can do.",
  },
  {
    icon: <FiBriefcase size={20} color="#70c144" />,
    title: "Get discovered by industry leaders",
    desc: "Top companies actively browse StrengthOut to find candidates who stand out.",
  },
  {
    icon: <FiZap size={20} color="#70c144" />,
    title: "Instant profile visibility",
    desc: "Your verified strengths appear in company searches the moment you complete them.",
  },
  {
    icon: <FiTrendingUp size={20} color="#70c144" />,
    title: "Track your career growth",
    desc: "Analytics show how your profile performs and how to level up faster.",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
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
        <div className="auth-left-content">
          <Link to="/" className="auth-panel-logo" title="StrengthOut Home">
            <img src={logoImg} alt="StrengthOut" />
          </Link>
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

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="login-email">
                  Email <span className="required-star">*</span>
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
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
                <div className="password-wrapper">
                  <input
                    id="login-password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
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
