import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import AdminDashboard from "../admin/AdminDashboard";
import {
  FiUser,
  FiAward,
  FiBell,
  FiSearch,
  FiSend,
  FiArrowRight,
} from "react-icons/fi";
import "./Dashboard.css";

const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();

  // If user is Admin or Super Admin, render the executive Admin Control Center!
  if (isAdmin()) {
    return <AdminDashboard />;
  }

  const candidateCards = [
    {
      icon: <FiUser size={24} />,
      label: "My Profile",
      desc: "Manage your public candidate profile, video introduction, and strength tags",
      link: "/profile",
    },
    {
      icon: <FiAward size={24} />,
      label: "My Key Strengths",
      desc: "Showcase your work, projects & verifiable technical achievements",
      link: "/profile",
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
      link: "/discover",
    },
    {
      icon: <FiSend size={24} />,
      label: "My Requests",
      desc: "Track your candidate connection request pipeline and statuses",
      link: "/my-requests",
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
