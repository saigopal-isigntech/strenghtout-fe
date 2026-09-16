import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { adminApi } from "../../api/admin";
import { connectionsApi } from "../../api/connections";
import type { PlatformOverview, ConnectionRequest } from "../../types";
import "./AdminDashboard.css";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const isSuperAdmin = user?.role === "ROLE_SUPER_ADMIN" || user?.accountType === "SUPER_ADMIN";

  const loadData = async () => {
    try {
      const [ovRes, reqRes] = await Promise.allSettled([
        adminApi.getOverview(),
        connectionsApi.getAdminQueue({ page: 0, size: 5, status: "PENDING_REVIEW" }),
      ]);

      if (ovRes.status === "fulfilled") {
        setOverview(ovRes.value.data.data);
      }
      if (reqRes.status === "fulfilled") {
        setPendingRequests(reqRes.value.data.data.content || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickStatus = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      await connectionsApi.updateStatus(id, newStatus);
      setToast(`Request status updated to ${newStatus}`);
      setTimeout(() => setToast(""), 3000);
      loadData();
    } catch (err: any) {
      setToast(err?.response?.data?.message || "Failed to update status");
      setTimeout(() => setToast(""), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-dashboard">
      {toast && <div className="admin-toast">{toast}</div>}

      {/* Hero Banner */}
      <div className={`admin-hero ${isSuperAdmin ? "super-hero" : ""}`}>
        <div className="hero-left">
          <div className="admin-role-tag">
            <span className="sparkle">{isSuperAdmin ? "👑" : "🛡️"}</span>
            {isSuperAdmin ? "SUPER ADMIN PORTAL" : "ADMIN CONTROL CENTER"}
          </div>
          <h1 className="admin-welcome">
            Welcome, {user?.fullName || "Administrator"}
          </h1>
          <p className="admin-subtext">
            Enterprise oversight, connection governance, and platform security management.
          </p>
          <div className="admin-meta-chips">
            <span className="chip">Signed in: <strong>{user?.email}</strong></span>
            <span className="chip live">● System Live</span>
            <span className="chip db">DB: PostgreSQL 18.6</span>
          </div>
        </div>

        <div className="hero-right">
          <div className="privilege-box">
            <div className="privilege-title">Access Level</div>
            <div className="privilege-badge">
              {isSuperAdmin ? "SUPER_ADMIN (Full Access)" : "ADMIN"}
            </div>
            <div className="privilege-note">
              {isSuperAdmin
                ? "Full privilege to review requests, manage all user tiers, and inspect system audit streams."
                : "Privilege to manage connection queues and view directory."}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="kpi-grid">
        <div className="kpi-card highlight-amber">
          <div className="kpi-icon">⏳</div>
          <div className="kpi-info">
            <div className="kpi-value">{loading ? "..." : overview?.pendingReviewRequests ?? 0}</div>
            <div className="kpi-label">Pending Review Queue</div>
            <Link to="/admin/requests" className="kpi-link">View Queue →</Link>
          </div>
        </div>

        <div className="kpi-card highlight-purple">
          <div className="kpi-icon">🤝</div>
          <div className="kpi-info">
            <div className="kpi-value">{loading ? "..." : overview?.totalConnectionRequests ?? 0}</div>
            <div className="kpi-label">Total Connection Requests</div>
            <span className="kpi-sub">{overview?.approvedRequests ?? 0} Approved</span>
          </div>
        </div>

        <div className="kpi-card highlight-blue">
          <div className="kpi-icon">👥</div>
          <div className="kpi-info">
            <div className="kpi-value">{loading ? "..." : overview?.totalUsers ?? 1}</div>
            <div className="kpi-label">Total Platform Users</div>
            <Link to="/admin/users" className="kpi-link">Manage Users →</Link>
          </div>
        </div>

        <div className="kpi-card highlight-emerald">
          <div className="kpi-icon">🏢</div>
          <div className="kpi-info">
            <div className="kpi-value">{loading ? "..." : (overview?.candidateCount ?? 0) + " / " + (overview?.companyCount ?? 0)}</div>
            <div className="kpi-label">Candidates / Companies</div>
            <span className="kpi-sub">Active platform directory</span>
          </div>
        </div>
      </div>

      {/* Admin Quick Action Hub */}
      <div className="admin-actions-section">
        <h2 className="section-title">Administrative Modules</h2>
        <div className="action-cards-grid">
          <Link to="/admin/requests" className="action-card">
            <div className="action-icon">📋</div>
            <div className="action-text">
              <h3>Connection Request Queue</h3>
              <p>Review inbound company introductions, inspect messages, and approve or reject requests.</p>
            </div>
            <span className="action-arrow">→</span>
          </Link>

          <Link to="/admin/users" className="action-card">
            <div className="action-icon">👥</div>
            <div className="action-text">
              <h3>Platform User Directory</h3>
              <p>Browse candidates, company accounts, and admin users. Suspend or activate accounts.</p>
            </div>
            <span className="action-arrow">→</span>
          </Link>

          <Link to="/admin/audit" className="action-card">
            <div className="action-icon">🛡️</div>
            <div className="action-text">
              <h3>Audit & Security Logs</h3>
              <p>Immutable event log tracking logins, status changes, and administrative actions.</p>
            </div>
            <span className="action-arrow">→</span>
          </Link>

          <Link to="/discover" className="action-card">
            <div className="action-icon">🔍</div>
            <div className="action-text">
              <h3>Candidate Talent Discovery</h3>
              <p>Search and inspect public candidate profiles, skill badges, and verified evidence.</p>
            </div>
            <span className="action-arrow">→</span>
          </Link>
        </div>
      </div>

      {/* Pending Introductions Quick-Review */}
      <div className="admin-recent-section">
        <div className="recent-header">
          <div>
            <h2 className="section-title">Urgent Review Queue</h2>
            <p className="section-sub">Company connection requests awaiting administrative authorization</p>
          </div>
          <Link to="/admin/requests" className="btn-outline">Open Full Queue ({overview?.pendingReviewRequests ?? 0})</Link>
        </div>

        {loading ? (
          <div className="table-loading"><div className="spinner" /> Loading requests...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="empty-state-box">
            <span className="empty-icon">✨</span>
            <h3>Queue is Clear!</h3>
            <p>No connection requests currently require pending review.</p>
          </div>
        ) : (
          <div className="requests-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Submitted</th>
                  <th>Company</th>
                  <th>Candidate</th>
                  <th>Message Snippet</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map(req => (
                  <tr key={req.id}>
                    <td className="time-col">{new Date(req.submittedAt).toLocaleDateString()}</td>
                    <td className="company-col"><strong>{req.companyName}</strong></td>
                    <td className="candidate-col">{req.candidateName}</td>
                    <td className="msg-col">{req.message?.slice(0, 70) || "No message"}{req.message?.length > 70 ? "..." : ""}</td>
                    <td className="actions-col">
                      <button
                        className="btn-quick-approve"
                        disabled={actionLoading === req.id}
                        onClick={() => handleQuickStatus(req.id, "UNDER_REVIEW")}
                      >
                        Under Review
                      </button>
                      <button
                        className="btn-quick-reject"
                        disabled={actionLoading === req.id}
                        onClick={() => handleQuickStatus(req.id, "REJECTED")}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
