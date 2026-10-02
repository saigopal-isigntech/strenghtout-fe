import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiCheck } from "react-icons/fi";

const LoginSuccessToast: React.FC = () => {
  const [show, setShow] = useState(false);
  const location = useLocation();

  // Listen for login flag across navigation redirects
  useEffect(() => {
    try {
      const shouldShow = sessionStorage.getItem("show_login_success_toast");
      if (shouldShow === "true") {
        sessionStorage.removeItem("show_login_success_toast");
        setShow(true);
      }
    } catch {
      // ignore storage access issues
    }
  }, [location.pathname]);

  // Separate timer strictly bound to 'show' state so route changes (/dashboard -> /candidate/dashboard) do NOT cancel it
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => {
      setShow(false);
    }, 2000); // exactly 2 seconds
    return () => clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-card">
        <div className="auth-modal-icon">
          <FiCheck size={20} />
        </div>
        <div className="auth-modal-content">
          <h3 className="auth-modal-title">Login Successful!</h3>
          <p className="auth-modal-desc">
            Welcome back to StrengthOut!
          </p>
        </div>
        <div className="auth-modal-progress">
          <div className="auth-modal-progress-bar" style={{ animationDuration: "2s" }} />
        </div>
      </div>
    </div>
  );
};

export default LoginSuccessToast;
