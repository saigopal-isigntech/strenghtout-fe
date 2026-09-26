import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import AdminDashboard from "../admin/AdminDashboard";
import { candidatesApi } from "../../api/candidates";
import type { CandidateProfile } from "../../types";
import {
  FiUser,
  FiAward,
  FiBell,
  FiSearch,
  FiSend,
  FiArrowRight,
  FiEdit3,
  FiAlertCircle,
} from "react-icons/fi";
import "./Dashboard.css";

const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // If user is Admin or Super Admin, render the executive Admin Control Center!
  if (isAdmin()) {
    return <AdminDashboard />;
  }

  const isCandidate = user?.role === "ROLE_CANDIDATE";

  useEffect(() => {
    if (isCandidate) {
      setLoadingProfile(true);
      candidatesApi
        .getMyProfile()
        .then((res) => {
          setCandidateProfile(res.data?.data || null);
        })
        .catch(() => {
          setCandidateProfile(null);
        })
        .finally(() => {
          setLoadingProfile(false);
        });
    }
  }, [isCandidate]);

  // Determine if candidate profile is brand new / unmodified:
  // True if headline is empty, skills list is empty, and summary is empty (or completion <= 15%)
  const isProfileUnmodified =
    isCandidate &&
    !loadingProfile &&
    candidateProfile !== null &&
    (!candidateProfile.headline?.trim() ||
      !candidateProfile.skills ||
      candidateProfile.skills.length === 0) &&
    (candidateProfile.completionPct ?? 0) <= 25;

  const candidateCards = [
    {
      icon: <FiUser size={24} />,
      label: "My Profile",
      desc: "Manage your public candidate profile, video introduction, and strength tags",
      link: "/candidate/profile",
    },
    {
      icon: <FiAward size={24} />,
      label: "My Key Strengths",
      desc: "Showcase your work, projects & verifiable technical achievements",
      link: "/candidate/profile",
    },
    {
      icon: <FiBell size={24} />,
      label: "Notifications",
      desc: "Company connection requests, interviews, and status updates",
      link: "/notifications",
    },
  ];

  const companyCards = [
    {
      icon: <FiSearch size={24} />,
      label: "Discover Talent",
      desc: "Search and explore candidate strength profiles and intro videos",
      link: "/company/discover",
    },
    {
      icon: <FiSend size={24} />,
      label: "My Requests",
      desc: "Track your candidate connection request pipeline and statuses",
      link: "/company/requests",
    },
    {
      icon: <FiBell size={24} />,
      label: "Notifications",
      desc: "Status updates, candidate acceptances, and system alerts",
      link: "/notifications",
    },
  ];

  const cards = user?.role === "ROLE_COMPANY" ? companyCards : candidateCards;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="dashboard-page">
      {/* Onboarding Prompt Banner for New Candidates */}
      {isProfileUnmodified && (
        <div className="profile-setup-banner">
          <div className="setup-banner-left">
            <div className="setup-badge">
              <FiAlertCircle size={14} /> Action Required
            </div>
            <h2 className="setup-title">Complete & Setup Your Profile</h2>
            <p className="setup-desc">
              Your candidate profile is currently unconfigured. Add your resume headline, key skills, education, and resume to get discovered by recruiters and unlock connection requests.
            </p>
            <div className="setup-progress-row">
              <div className="setup-progress-bar">
                <div
                  className="setup-progress-fill"
                  style={{ width: `${Math.max(candidateProfile?.completionPct ?? 0, 8)}%` }}
                />
              </div>
              <span className="setup-progress-text">
                {candidateProfile?.completionPct ?? 0}% Profile Setup
              </span>
            </div>
          </div>
          <div className="setup-banner-right">
            <Link to="/candidate/profile" className="btn-setup-action">
              <FiEdit3 size={16} /> Complete Profile <FiArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      <div className="dashboard-hero">
        <div className="hero-content">
          <p className="hero-greeting">{greeting()},</p>
          <h1 className="hero-name">{user?.fullName || "User"}</h1>
          <p className="hero-sub">
            {user?.role === "ROLE_COMPANY"
              ? "Discover verified talent backed by authentic evidence and video introductions."
              : "Build your credible strength profile, upload your intro video, and get discovered."}
          </p>
        </div>
        <div className="hero-badge">
          <span className="role-badge">{(user?.role || "").replace("ROLE_", "")}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {cards.map((card) => (
          <Link key={card.link + card.label} to={card.link} className="dash-card">
            <div className="dash-card-icon">{card.icon}</div>
            <div className="dash-card-content">
              <h3>{card.label}</h3>
              <p>{card.desc}</p>
            </div>
            <span className="dash-card-arrow">
              <FiArrowRight size={18} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
