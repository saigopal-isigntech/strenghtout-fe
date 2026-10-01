import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { adminApi } from "../../api/admin";
import { connectionsApi } from "../../api/connections";
import type { PlatformOverview, ConnectionRequest } from "../../types";
import { AdminHeroBanner } from "../../components/admin/AdminHeroBanner";
import {
  FiShield,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiLayers,
  FiArrowRight,
  FiSearch,
  FiBriefcase,
  FiGrid,
} from "react-icons/fi";
import "./AdminDashboard.css";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [candFallback, setCandFallback] = useState<number | null>(null);
  const [compFallback, setCompFallback] = useState<number | null>(null);
  const [pendingFallback, setPendingFallback] = useState<number | null>(null);
  const [totalReqFallback, setTotalReqFallback] = useState<number | null>(null);

  const isSuperAdmin = user?.role === "ROLE_SUPER_ADMIN" || user?.accountType === "SUPER_ADMIN";
  const ovAny = overview as any;

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovRes, queueRes, compRes, candRes, reqsRes] = await Promise.allSettled([
        adminApi.getOverview(),
        connectionsApi.getAdminQueue({ page: 0, size: 5, status: "SUBMITTED" }),
        adminApi.getCompanies({ page: 0, size: 1 }),
        adminApi.getCandidates({ page: 0, size: 1 }),
        connectionsApi.getAdminQueue({ page: 0, size: 1 }),
      ]);

      if (ovRes.status === "fulfilled" && ovRes.value.data?.data) {
        setOverview(ovRes.value.data.data);
      }
      if (queueRes.status === "fulfilled" && queueRes.value.data?.data) {
        setPendingRequests(queueRes.value.data.data.content || []);
      }
      if (compRes.status === "fulfilled" && compRes.value.data?.data) {
        setCompFallback(compRes.value.data.data.totalElements ?? 0);
      }
      if (candRes.status === "fulfilled" && candRes.value.data?.data) {
        setCandFallback(candRes.value.data.data.totalElements ?? 0);
      }
      if (reqsRes.status === "fulfilled" && reqsRes.value.data?.data) {
        setTotalReqFallback(reqsRes.value.data.data.totalElements ?? 0);
        const content = reqsRes.value.data.data.content || [];
        setPendingFallback(content.filter((r: any) => r.status === "SUBMITTED" || r.status === "UNDER_REVIEW").length);
      }
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
      setToast("Request status updated to " + newStatus);
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

      {/* Detailed Hero Banner Matching Reference Image Detailing */}
      <AdminHeroBanner
          illustrationType="dashboard"
        badgeText={isSuperAdmin ? "SUPER ADMIN PORTAL" : "ADMIN CONTROL CENTER"}
        badgeIcon={<FiShield size={14} />}
        title={`Welcome, ${user?.fullName || "iSignTech Admin"}`}
        highlightText={user?.fullName || "iSignTech Admin"}
        subtitle="Enterprise oversight, connection governance, and platform security management."
        signedInEmail={user?.email || "admin@gmail.com"}
      />

      {/* 2. KPI Stat Cards Row */}
      <div className="kpi-grid">
        <div className="kpi-card bg-emerald-glow">
          <div className="kpi-header-row">
            <span className="kpi-icon-box bg-emerald-light">
              <FiUsers size={22} className="text-emerald-deep" />
            </span>
            <span className="kpi-trend positive">+12% this month</span>
          </div>
          <div className="kpi-body">
            <span className="kpi-number">{loading ? "..." : (ovAny?.candidateCount ?? ovAny?.totalCandidates ?? ovAny?.totalUsers ?? candFallback ?? 0)}</span>
            <span className="kpi-title">Active Candidates</span>
            <span className="kpi-subtitle">Verified pool profiles</span>
          </div>
          <Link to="/admin/users?tab=candidates" className="kpi-footer-link">
            <span>Manage Candidates</span>
            <FiArrowRight size={14} />
          </Link>
        </div>

        <div className="kpi-card bg-blue-glow">
          <div className="kpi-header-row">
            <span className="kpi-icon-box bg-blue-light">
              <FiBriefcase size={22} className="text-blue-deep" />
            </span>
            <span className="kpi-trend neutral">Active Partner Pool</span>
          </div>
          <div className="kpi-body">
            <span className="kpi-number">{loading ? "..." : (ovAny?.companyCount ?? ovAny?.totalCompanies ?? ovAny?.totalUserAccounts ?? compFallback ?? 0)}</span>
            <span className="kpi-title">Registered Companies</span>
            <span className="kpi-subtitle">Employer accounts</span>
          </div>
          <Link to="/admin/users?tab=companies" className="kpi-footer-link">
            <span>Manage Companies</span>
            <FiArrowRight size={14} />
          </Link>
        </div>

        <div className="kpi-card bg-amber-glow">
          <div className="kpi-header-row">
            <span className="kpi-icon-box bg-amber-light">
              <FiClock size={22} className="text-amber-deep" />
            </span>
            <span className="kpi-badge-amber">Action Required</span>
          </div>
          <div className="kpi-body">
            <span className="kpi-number">{loading ? "..." : (ovAny?.pendingReviewRequests ?? ovAny?.pendingRequests ?? ovAny?.submittedRequests ?? pendingFallback ?? 0)}</span>
            <span className="kpi-title">Pending Connections</span>
            <span className="kpi-subtitle">Awaiting admin review</span>
          </div>
          <Link to="/admin/requests?status=SUBMITTED" className="kpi-footer-link">
            <span>Process Queue</span>
            <FiArrowRight size={14} />
          </Link>
        </div>

        <div className="kpi-card bg-purple-glow">
          <div className="kpi-header-row">
            <span className="kpi-icon-box bg-purple-light">
              <FiLayers size={22} className="text-purple-deep" />
            </span>
            <span className="kpi-trend positive">Total Pipeline</span>
          </div>
          <div className="kpi-body">
            <span className="kpi-number">{loading ? "..." : (ovAny?.totalConnectionRequests ?? ovAny?.totalRequests ?? ovAny?.totalConnections ?? totalReqFallback ?? 0)}</span>
            <span className="kpi-title">Total Requests</span>
            <span className="kpi-subtitle">All-time connections</span>
          </div>
          <Link to="/admin/requests" className="kpi-footer-link">
            <span>View Full Tracker</span>
            <FiArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Main Administrative Modules Grid */}
      <div className="admin-modules-grid">
        {/* Module 1: Pending Connections Triage */}
        <div className="admin-module-card">
          <div className="module-header">
            <div className="module-title-wrap">
              <FiClock size={18} className="module-icon text-amber" />
              <div>
                <h2>Pending Connection Triage</h2>
                <p>Needs initial review and routing</p>
              </div>
            </div>
            <Link to="/admin/requests?status=SUBMITTED" className="btn-module-link">
              View All Queue
            </Link>
          </div>

          <div className="module-body">
            {loading ? (
              <div className="module-loading">Loading pending requests...</div>
            ) : pendingRequests.length === 0 ? (
              <div className="module-empty">
                <FiCheckCircle size={32} color="#10b981" />
                <p>No pending connection requests awaiting review!</p>
              </div>
            ) : (
              <div className="triage-list">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="triage-item">
                    <div className="triage-main">
                      <div className="triage-cand">
                        <strong>{req.candidateFullName || req.candidateName}</strong>
                        <span className="triage-role">{req.roleTitle || "Opportunity"}</span>
                      </div>
                      <div className="triage-comp">
                        <span>Requested by: <strong>{req.companyDisplayName || req.companyName}</strong></span>
                      </div>
                    </div>
                    <div className="triage-actions">
                      <button
                        className="btn-quick-review"
                        disabled={actionLoading === req.id}
                        onClick={() => handleQuickStatus(req.id, "UNDER_REVIEW")}
                      >
                        Start Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Module 2: Management Navigation Shortcuts */}
        <div className="admin-module-card">
          <div className="module-header">
            <div className="module-title-wrap">
              <FiGrid size={18} className="module-icon text-blue" />
              <div>
                <h2>Admin Management Portals</h2>
                <p>Direct navigation to control sections</p>
              </div>
            </div>
          </div>

          <div className="portal-nav-list">
            <Link to="/admin/requests" className="portal-nav-item">
              <div className="portal-nav-icon bg-green"><FiLayers size={18} /></div>
              <div className="portal-nav-text">
                <strong>Connection Requests Tracker</strong>
                <span>Review, approve, and track connection requests between companies & candidates</span>
              </div>
              <FiArrowRight size={16} className="portal-arrow" />
            </Link>

            <Link to="/admin/users" className="portal-nav-item">
              <div className="portal-nav-icon bg-blue"><FiUsers size={18} /></div>
              <div className="portal-nav-text">
                <strong>User & Account Management</strong>
                <span>Manage registered candidates, company accounts, and admin permissions</span>
              </div>
              <FiArrowRight size={16} className="portal-arrow" />
            </Link>

            <Link to="/admin/audit" className="portal-nav-item">
              <div className="portal-nav-icon bg-purple"><FiSearch size={18} /></div>
              <div className="portal-nav-text">
                <strong>System Audit & Security Logs</strong>
                <span>Inspect operational activity logs, status transition history, and audit trail</span>
              </div>
              <FiArrowRight size={16} className="portal-arrow" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
