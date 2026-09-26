import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { adminApi } from "../../api/admin";
import { connectionsApi } from "../../api/connections";
import type { PlatformOverview, ConnectionRequest } from "../../types";
import {
  FiShield,
  FiAward,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiLayers,
  FiArrowRight,
  FiInbox,
  FiSearch,
  FiBriefcase,
} from "react-icons/fi";
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
    setLoading(true);
    try {
      const [ovRes, queueRes] = await Promise.all([
        adminApi.getOverview(),
        connectionsApi.getAdminQueue({ page: 0, size: 5, status: "SUBMITTED" }),
      ]);
      setOverview(ovRes.data.data);
      setPendingRequests(queueRes.data.data.content || []);
    } catch {
      /* silent */
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
      setTimeout(() => setToast(""), 3500);
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
            <span className="sparkle" style={{ display: "inline-flex", alignItems: "center", marginRight: "0.35rem" }}>
              {isSuperAdmin ? <FiAward size={15} color="#f59e0b" /> : <FiShield size={14} color="#38bdf8" />}
            </span>
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
          <div className="kpi-header-row">
            <div className="kpi-icon-pill amber">
              <FiClock size={20} />
            </div>
            <Link to="/admin/requests" className="kpi-action-link">
              View Queue <FiArrowRight size={12} />
            </Link>
          </div>
          <div className="kpi-value">{loading ? "..." : overview?.pendingReviewRequests ?? 0}</div>
          <div className="kpi-label">Pending Review Queue</div>
          <div className="kpi-sub">Awaiting admin review</div>
        </div>

        <div className="kpi-card highlight-green">
          <div className="kpi-header-row">
            <div className="kpi-icon-pill green">
              <FiLayers size={20} />
            </div>
            <span className="kpi-tag green">{overview?.approvedRequests ?? 0} Approved</span>
          </div>
          <div className="kpi-value">{loading ? "..." : overview?.totalConnectionRequests ?? 0}</div>
          <div className="kpi-label">Total Connection Requests</div>
          <div className="kpi-sub">Inbound introductions & requests</div>
        </div>

        <div className="kpi-card highlight-blue">
          <div className="kpi-header-row">
            <div className="kpi-icon-pill blue">
              <FiUsers size={20} />
            </div>
            <Link to="/admin/users" className="kpi-action-link">
              Manage <FiArrowRight size={12} />
            </Link>
          </div>
          <div className="kpi-value">{loading ? "..." : overview?.totalUsers ?? 1}</div>
          <div className="kpi-label">Total Platform Users</div>
          <div className="kpi-sub">Registered accounts directory</div>
        </div>

        <div className="kpi-card highlight-teal">
          <div className="kpi-header-row">
            <div className="kpi-icon-pill teal">
              <FiBriefcase size={20} />
            </div>
            <span className="kpi-tag teal">Live Registry</span>
          </div>
          <div className="kpi-value">
            {loading ? "..." : `${overview?.candidateCount ?? 0} / ${overview?.companyCount ?? 0}`}
          </div>
          <div className="kpi-label">Candidates / Companies</div>
          <div className="kpi-sub">Active talent & employer profiles</div>
        </div>
      </div>

      {/* Admin Quick Action Hub */}
      <div className="admin-actions-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Administrative Modules</h2>
            <p className="section-sub">Core operational management portals and governance tools</p>
          </div>
        </div>
        <div className="action-cards-grid">
          <Link to="/admin/requests" className="action-card">
            <div className="action-card-top">
              <div className="action-icon-wrap amber">
                <FiInbox size={22} />
              </div>
              <span className="action-badge">Queue</span>
            </div>
            <div className="action-card-body">
              <h3 className="action-card-title">Connection Requests</h3>
              <p className="action-card-desc">Review inbound company introductions, inspect candidate requests, and authorize connection status.</p>
            </div>
            <div className="action-card-footer">
              <span>Open Queue</span>
              <FiArrowRight size={15} className="action-arrow" />
            </div>
          </Link>

          <Link to="/admin/users" className="action-card">
            <div className="action-card-top">
              <div className="action-icon-wrap blue">
                <FiUsers size={22} />
              </div>
              <span className="action-badge">Directory</span>
            </div>
            <div className="action-card-body">
              <h3 className="action-card-title">User Governance</h3>
              <p className="action-card-desc">Inspect candidates, registered companies, and system administrators. Manage permissions and status.</p>
            </div>
            <div className="action-card-footer">
              <span>Manage Users</span>
              <FiArrowRight size={15} className="action-arrow" />
            </div>
          </Link>

          <Link to="/admin/audit" className="action-card">
            <div className="action-card-top">
              <div className="action-icon-wrap purple">
                <FiShield size={22} />
              </div>
              <span className="action-badge">Security</span>
            </div>
            <div className="action-card-body">
              <h3 className="action-card-title">Audit & Security Stream</h3>
              <p className="action-card-desc">Cryptographically ordered immutable event logs tracking authentication, modifications, and actions.</p>
            </div>
            <div className="action-card-footer">
              <span>View Logs</span>
              <FiArrowRight size={15} className="action-arrow" />
            </div>
          </Link>

          <Link to="/discover" className="action-card">
            <div className="action-card-top">
              <div className="action-icon-wrap green">
                <FiSearch size={22} />
              </div>
              <span className="action-badge">Discovery</span>
            </div>
            <div className="action-card-body">
              <h3 className="action-card-title">Talent Discovery</h3>
              <p className="action-card-desc">Search and inspect public candidate profiles, skill badges, verified achievements, and video profiles.</p>
            </div>
            <div className="action-card-footer">
              <span>Explore Talent</span>
              <FiArrowRight size={15} className="action-arrow" />
            </div>
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
          <Link to="/admin/requests" className="btn-outline">
            Open Full Queue ({overview?.pendingReviewRequests ?? 0})
          </Link>
        </div>

        {loading ? (
          <div className="table-loading"><div className="spinner" /> Loading requests...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="empty-state-box">
            <FiCheckCircle size={38} className="empty-icon" style={{ color: "#70c144", marginBottom: "0.5rem" }} />
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
                {pendingRequests.map(req => {
                  const compName = req.companyDisplayName || req.companyName || (req as any).company?.displayName || (req as any).company?.legalName || "Registered Employer";
                  const candName = req.candidateFullName || req.candidateName || (req as any).candidate?.fullName || "Registered Candidate";
                  const roleText = req.roleTitle ? `${req.roleTitle}` : "";
                  const summaryText = req.opportunitySummary || req.message || "General introduction & connection request";
                  const displaySnippet = roleText ? `${roleText} — ${summaryText}` : summaryText;

                  return (
                    <tr key={req.id}>
                      <td className="time-col">
                        {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString() : "Recent"}
                      </td>
                      <td className="company-col">
                        <span style={{ fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                          {compName}
                        </span>
                        {req.companyCity && (
                          <span style={{ display: "block", fontSize: "0.76rem", color: "#64748b", fontWeight: 500 }}>
                            {req.companyCity}
                          </span>
                        )}
                      </td>
                      <td className="candidate-col">
                        <span style={{ fontWeight: 700, color: "#1d72f2" }}>
                          {candName}
                        </span>
                        {req.candidateHeadline && (
                          <span style={{ display: "block", fontSize: "0.76rem", color: "#64748b", fontWeight: 500 }}>
                            {req.candidateHeadline}
                          </span>
                        )}
                      </td>
                      <td className="msg-col">
                        <span title={displaySnippet}>
                          {displaySnippet.slice(0, 65)}{displaySnippet.length > 65 ? "..." : ""}
                        </span>
                      </td>
                      <td className="actions-col">
                        <button
                          className="btn-quick-approve"
                          disabled={actionLoading === req.id}
                          onClick={() => handleQuickStatus(req.id, "UNDER_REVIEW")}
                          title="Set status to Under Review"
                        >
                          Under Review
                        </button>
                        <button
                          className="btn-quick-reject"
                          disabled={actionLoading === req.id}
                          onClick={() => handleQuickStatus(req.id, "CLOSED")}
                          title="Reject / Close request"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
