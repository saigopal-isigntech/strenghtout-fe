import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth";
import logoImg from "../../assets/logo.png";
import authBg from "../../assets/auth-bg.jpg";
import { FiShield, FiKey, FiLock, FiEye, FiEyeOff, FiArrowRight, FiArrowLeft, FiCheck } from "react-icons/fi";
import "./Auth.css";

const FEATURES = [
  {
    icon: <FiShield size={20} color="#70c144" />,
    title: "Secure account recovery",
    desc: "We send a 6-digit OTP directly to your email to verify your identity.",
  },
  {
    icon: <FiKey size={20} color="#70c144" />,
    title: "Instant password reset",
    desc: "Set up a new strong password and regain access in under 2 minutes.",
  },
  {
    icon: <FiLock size={20} color="#70c144" />,
    title: "End-to-end security",
    desc: "Your credentials are always protected with enterprise-grade encryption.",
  },
];

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<"email" | "otp" | "reset">("email");

  const [email, setEmail]                     = useState("");
  const [otp, setOtp]                         = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken]           = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd]           = useState(false);
  const [showConfirmPwd, setShowConfirmPwd]   = useState(false);

  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState("");
  const [resendTimer, setResendTimer]         = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await authApi.forgotPasswordSendOtp(email);
      setSuccess("OTP sent to your email. Please check your inbox.");
      setStep("otp");
      startResendTimer();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to send OTP. Please check the email address.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^d*$/.test(val)) return;
    const nextOtp = [...otp];
    nextOtp[idx] = val.slice(-1);
    setOtp(nextOtp);

    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const nextOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      nextOtp[i] = pasted[i] || "";
    }
    setOtp(nextOtp);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await authApi.forgotPasswordSendOtp(email);
      setSuccess("A new OTP has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      startResendTimer();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the full 6-digit OTP.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await authApi.forgotPasswordVerifyOtp(email, code);
      setResetToken(res.data.data.resetToken);
      setSuccess("OTP verified! Now enter your new password.");
      setStep("reset");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await authApi.resetPassword(email, resetToken, newPassword);
      navigate("/login", {
        state: {
          registeredEmail: email,
          successMsg: "Password reset successful! Sign in with your new password.",
        },
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to reset password. Please try again.");
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
            Account recovery.<br />
            Quick &amp; secure.<br />
            <span>Get back in.</span>
          </h1>
          <p className="auth-panel-sub">
            Follow the simple steps to reset your password and regain access to your StrengthOut account.
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

            {/* ---- STEP 1: Email ---- */}
            {step === "email" && (
              <>
                <h2 className="auth-form-title">Reset Password</h2>
                <p className="auth-form-sub">
                  Enter your registered email and we&apos;ll send a 6-digit OTP.
                </p>
                {error && <div className="auth-error">{error}</div>}
                <form onSubmit={handleSendOtp} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="fp-email">Email Address <span className="required-star">*</span></label>
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  <button
                    id="fp-send-otp-btn"
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading}
                  >
                    {loading ? <span className="spinner" /> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>Send OTP <FiArrowRight size={16} /></span>}
                  </button>
                </form>
                <p className="auth-bottom-link">
                  <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FiArrowLeft size={15} /> Back to Login</Link>
                </p>
              </>
            )}

            {/* ---- STEP 2: OTP ---- */}
            {step === "otp" && (
              <>
                <h2 className="auth-form-title">Enter OTP</h2>
                <p className="auth-form-sub">
                  We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
                </p>
                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success"><span><FiCheck size={14} /></span>&nbsp;{success}</div>}
                <form onSubmit={handleVerifyOtp} className="auth-form">
                  <div className="otp-boxes-row" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-digit-${idx}`}
                        ref={el => { otpRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        className={`otp-digit-box ${digit ? "filled" : ""}`}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>

                  <div className="otp-resend-row">
                    {resendTimer > 0
                      ? <span className="otp-timer">Resend OTP in {resendTimer}s</span>
                      : <button type="button" className="btn-resend" onClick={handleResend} disabled={loading}>Resend OTP</button>
                    }
                  </div>

                  <button
                    id="fp-verify-otp-btn"
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading || otp.join("").length < 6}
                  >
                    {loading ? <span className="spinner" /> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>Verify OTP <FiArrowRight size={16} /></span>}
                  </button>
                </form>
                <p className="auth-bottom-link">
                  <button className="btn-link" onClick={() => { setStep("email"); setOtp(["","","","","",""]); setError(""); setSuccess(""); }}>
                    Change email
                  </button>
                </p>
              </>
            )}

            {/* ---- STEP 3: New Password ---- */}
            {step === "reset" && (
              <>
                <h2 className="auth-form-title">New Password</h2>
                <p className="auth-form-sub">
                  Create a strong password for <strong>{email}</strong>.
                </p>
                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success"><span><FiCheck size={14} /></span>&nbsp;{success}</div>}
                <form onSubmit={handleResetPassword} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="fp-new-pwd">New Password <span className="required-star">*</span></label>
                    <div className="password-wrapper">
                      <input
                        id="fp-new-pwd"
                        type={showNewPwd ? "text" : "password"}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        required
                        minLength={8}
                        autoFocus
                      />
                      <button type="button" className="pwd-toggle" onClick={() => setShowNewPwd(v => !v)} tabIndex={-1}>
                        {showNewPwd ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                    {newPassword && newPassword.length < 8 && (
                      <span className="field-hint error">At least 8 characters required</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="fp-confirm-pwd">Confirm Password <span className="required-star">*</span></label>
                    <div className="password-wrapper">
                      <input
                        id="fp-confirm-pwd"
                        type={showConfirmPwd ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your password"
                        required
                      />
                      <button type="button" className="pwd-toggle" onClick={() => setShowConfirmPwd(v => !v)} tabIndex={-1}>
                        {showConfirmPwd ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <span className="field-hint error">Passwords do not match</span>
                    )}
                    {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                      <span className="field-hint success"><FiCheck size={14} /> Passwords match</span>
                    )}
                  </div>

                  <div className="pwd-strength-wrap">
                    {["Weak", "Fair", "Good", "Strong"].map((label, i) => {
                      const len = newPassword.length;
                      const hasUpper = /[A-Z]/.test(newPassword);
                      const hasNum = /[0-9]/.test(newPassword);
                      const hasSym = /[^A-Za-z0-9]/.test(newPassword);
                      const score = (len >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSym ? 1 : 0);
                      return (
                        <div key={label} className={`pwd-bar ${i < score ? `pwd-bar-${score}` : ""}`} title={label} />
                      );
                    })}
                  </div>

                  <button
                    id="fp-reset-pwd-btn"
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
                  >
                    {loading ? <span className="spinner" /> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>Reset Password <FiArrowRight size={16} /></span>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ForgotPasswordPage;
