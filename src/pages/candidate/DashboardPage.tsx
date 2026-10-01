import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import AdminDashboard from "../admin/AdminDashboard";
import { candidatesApi } from "../../api/candidates";
import type { CandidateProfile } from "../../types";
import {
  FiUser,
  FiBell,
  FiSearch,
  FiSend,
  FiArrowRight,
  FiEdit3,
  FiAlertCircle,
  FiKey,
  FiUsers,
  FiBriefcase,
  FiPlay,
  FiAward,
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

  const isCompany = user?.role === "ROLE_COMPANY";
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
      id: "profile",
      icon: <FiUser size={22} />,
      label: "My Profile",
      desc: "Manage your public candidate profile, video introduction, and strength tags.",
      link: "/candidate/profile",
      actionText: "View Profile",
      category: "green",
      isPrimary: true,
    },
    {
      id: "opportunities",
      icon: <FiSend size={22} />,
      label: "My Opportunities",
      desc: "Track company connection requests, interview progress, and hiring status.",
      link: "/candidate/opportunities",
      actionText: "View Opportunities",
      category: "blue",
      isPrimary: false,
    },
    {
      id: "strengths",
      icon: <FiKey size={22} />,
      label: "My Key Strengths",
      desc: "Showcase your work, projects & verifiable technical achievements.",
      link: "/candidate/profile",
      actionText: "View Strengths",
      category: "purple",
      isPrimary: false,
    },
    {
      id: "notifications",
      icon: <FiBell size={22} />,
      label: "Notifications",
      desc: "Status updates, candidate acceptances, and system alerts in one place.",
      link: "/notifications",
      actionText: "View All",
      category: "orange",
      isPrimary: false,
    },
  ];

  const companyCards = [
    {
      id: "discover",
      icon: <FiSearch size={22} />,
      label: "Discover Talent",
      desc: "Search and explore candidate strength profiles and intro videos backed by real evidence.",
      link: "/company/discover",
      actionText: "Discover Now",
      category: "green",
      isPrimary: true,
    },
    {
      id: "requests",
      icon: <FiSend size={22} />,
      label: "My Requests",
      desc: "Track your candidate connection request pipeline and statuses.",
      link: "/company/requests",
      actionText: "View Requests",
      category: "blue",
      isPrimary: false,
    },
    {
      id: "profile",
      icon: <FiBriefcase size={22} />,
      label: "Company Profile",
      desc: "Manage your company profile, branding, team details and settings.",
      link: "/company/profile",
      actionText: "Manage Profile",
      category: "purple",
      isPrimary: false,
    },
    {
      id: "notifications",
      icon: <FiBell size={22} />,
      label: "Notifications",
      desc: "Status updates, candidate acceptances, and system alerts in one place.",
      link: "/notifications",
      actionText: "View All",
      category: "orange",
      isPrimary: false,
    },
  ];

  const cards = isCompany ? companyCards : candidateCards;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "GOOD MORNING,";
    if (h < 17) return "GOOD AFTERNOON,";
    return "GOOD EVENING,";
  };

  const completionPct = candidateProfile?.completionPct ?? (isCompany ? 95 : 100);

  return (
    <div className="dashboard-page-container">
      {/* Onboarding Prompt Banner for New Candidates */}
      {isProfileUnmodified && (
        <div className="profile-setup-banner">
          <div className="setup-banner-left">
            <div className="setup-badge">
              <FiAlertCircle size={14} /> Action Required
            </div>
            <h2 className="setup-title">Complete & Setup Your Profile</h2>
            <p className="setup-desc">
              Your candidate profile is currently unconfigured. Add your resume headline, key skills, education, and resume to get discovered by recruiters.
            </p>
            <div className="setup-progress-row">
              <div className="setup-progress-bar">
                <div
                  className="setup-progress-fill"
                  style={{ width: `${Math.max(completionPct, 8)}%` }}
                />
              </div>
              <span className="setup-progress-text">
                {completionPct}% Profile Setup
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

      {/* 1. Hero Welcome Banner */}
      <div className="company-hero-banner">
        {/* Background Organic Wave SVG */}
        <svg
          className="hero-bg-waves"
          viewBox="0 0 1000 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M380,220 C380,120 480,30 1000,45 L1000,220 Z"
            fill="#a7f3d0"
            opacity="0.45"
          />
          <path
            d="M440,220 C440,140 580,55 1000,75 L1000,220 Z"
            fill="#6ee7b7"
            opacity="0.2"
          />
        </svg>

        {/* Left Hero Content */}
        <div className="hero-left-content">
          <span className="hero-greeting-tag">{greeting()}</span>
          <h1 className="hero-user-name">
            {user?.fullName || (isCompany ? "company1" : "User")} <span className="wave-hand">👋</span>
          </h1>
          <p className="hero-subtext">
            {isCompany
              ? "Discover verified talent backed by authentic evidence and video introductions."
              : "Build your credible strength profile, upload your intro video, and get discovered by companies."}
          </p>
        </div>

        {/* Right Hero Illustration & Top Pill Badge */}
        <div className="hero-right-graphic">
          <div className="hero-top-pill">
            <FiAward size={14} className="pill-sparkle" />
            <span>Build Stronger Teams with Verified Talent</span>
          </div>

          {/* Mockup Graphic Card matching reference image */}
          <div className="hero-illustration-composite">
            <div className="main-mockup-card">
              <div className="mockup-header-bar">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="mockup-body">
                <div className="user-avatar-circle">
                  <FiUser size={18} />
                </div>
                <div className="mockup-lines">
                  <div className="m-line w-80" />
                  <div className="m-line w-50" />
                </div>
                <div className="mockup-badge-box">
                  <FiUsers size={18} />
                </div>
              </div>
            </div>

            {/* Video Play Floating Card */}
            <div className="floating-play-card">
              <div className="play-icon-box">
                <FiPlay size={14} fill="#2563eb" color="#2563eb" />
              </div>
            </div>

            {/* Analytics Bars Floating Card */}
            <div className="floating-chart-card">
              <div className="mini-bars">
                <span className="m-bar h-40" />
                <span className="m-bar h-70" />
                <span className="m-bar h-100" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Four Action / Navigation Cards Grid */}
      <div className="company-cards-grid">
        {cards.map((card) => {
          return (
            <div
              key={card.id}
              className={`nav-action-card card-${card.category} ${card.isPrimary ? "card-primary-focus" : ""}`}
            >
              {/* Top Header Row with Circle Icon and Circle Arrow */}
              <div className="card-top-row">
                <div className={`icon-container category-${card.category}`}>
                  {card.icon}
                </div>
                <Link to={card.link} className={`arrow-circle-btn arrow-${card.category}`} title="Navigate">
                  <FiArrowRight size={15} />
                </Link>
              </div>

              {/* Center Content */}
              <div className="card-body-content">
                <h3 className="card-title">{card.label}</h3>
                <p className="card-desc">{card.desc}</p>
              </div>

              {/* Bottom Full-Width Action Button */}
              <div className="card-footer-action">
                <Link
                  to={card.link}
                  className={`action-btn-link btn-${card.category} ${card.isPrimary ? "btn-solid-primary" : ""}`}
                >
                  <span>{card.actionText}</span>
                  <FiArrowRight size={15} className="btn-arrow" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardPage;
