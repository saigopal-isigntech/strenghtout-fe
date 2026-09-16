import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import AdminDashboard from "../admin/AdminDashboard";
import "./Dashboard.css";

const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();

  // If user is Admin or Super Admin, render the executive Admin Control Center!
  if (isAdmin()) {
    return <AdminDashboard />;
  }

  const candidateCards = [
    { icon: "👤", label: "My Profile", desc: "Manage your public candidate profile and strength tags", link: "/profile" },
    { icon: "🏆", label: "My Evidence", desc: "Showcase your work, projects & verifiable achievements", link: "/evidence" },
    { icon: "🔔", label: "Notifications", desc: "Company connection requests and status updates", link: "/notifications" },
  ];

  const companyCards = [
    { icon: "🔍", label: "Discover Talent", desc: "Search and explore candidate strength profiles", link: "/discover" },
    { icon: "🤝", label: "My Requests", desc: "Track your connection request pipeline", link: "/my-requests" },
    { icon: "🔔", label: "Notifications", desc: "Status updates and system alerts", link: "/notifications" },
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
              ? "Discover verified talent backed by authentic evidence."
              : "Build your credible strength profile and get discovered."}
          </p>
        </div>
        <div className="hero-badge">
          <span className="role-badge">{(user?.role || "").replace("ROLE_", "")}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {cards.map(card => (
          <Link key={card.link} to={card.link} className="dash-card">
            <div className="dash-card-icon">{card.icon}</div>
            <div className="dash-card-content">
              <h3>{card.label}</h3>
              <p>{card.desc}</p>
            </div>
            <span className="dash-card-arrow">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
