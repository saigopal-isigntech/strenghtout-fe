import React, { useEffect, useState, useMemo, Fragment } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { connectionsApi } from "../../api/connections";
import type { ConnectionRequest } from "../../types";
import {
  FiRefreshCw,
  FiInbox,
  FiFilter,
  FiSearch,
  FiExternalLink,
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiArrowRight,
  FiUser,
  FiBriefcase,
  FiMapPin,
  FiX,
  FiSend,
  FiLayers,
  FiTrendingUp,
  FiAward,
  FiActivity,
  FiAlertCircle,
  FiShield,
} from "react-icons/fi";
import "./AdminQueue.css";

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  SUBMITTED:            { label: "Submitted",            color: "#92400e", bg: "#fef3c7", border: "#fde68a" },
  UNDER_REVIEW:         { label: "Under Review",         color: "#1e40af", bg: "#dbeafe", border: "#bfdbfe" },
  COMPANY_CONTACTED:    { label: "Company Contacted",    color: "#065f46", bg: "#d1fae5", border: "#6ee7b7" },
  CANDIDATE_DISCUSSION: { label: "Candidate Discussion", color: "#6b21a8", bg: "#f3e8ff", border: "#d8b4fe" },
  SELECTED:             { label: "Selected / Hired",     color: "#15803d", bg: "#dcfce7", border: "#86efac" },
  RETURNED:             { label: "Returned to Candidate",color: "#b45309", bg: "#ffedd5", border: "#fed7aa" },
  NOT_PROCEEDING:       { label: "Not Proceeding",       color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" },
  CLOSED:               { label: "Closed",               color: "#374151", bg: "#f3f4f6", border: "#e5e7eb" },
};

const NEXT_TRANSITIONS: Record<string, { status: string; label: string; cls: string; needsReason?: boolean }[]> = {
  SUBMITTED: [
    { status: "UNDER_REVIEW",         label: "Mark Under Review",    cls: "btn-action-primary" },
    { status: "NOT_PROCEEDING",       label: "Reject / Not Proceed", cls: "btn-action-danger", needsReason: true },
  ],
  UNDER_REVIEW: [
    { status: "COMPANY_CONTACTED",    label: "Contact Company",      cls: "btn-action-primary" },
    { status: "RETURNED",             label: "Return to Candidate",  cls: "btn-action-warning", needsReason: true },
    { status: "NOT_PROCEEDING",       label: "Not Proceeding",       cls: "btn-action-danger", needsReason: true },
  ],
  COMPANY_CONTACTED: [
    { status: "CANDIDATE_DISCUSSION", label: "Candidate Discussion", cls: "btn-action-primary" },
    { status: "RETURNED",             label: "Return to Candidate",  cls: "btn-action-warning", needsReason: true },
    { status: "NOT_PROCEEDING",       label: "Not Proceeding",       cls: "btn-action-danger", needsReason: true },
  ],
  CANDIDATE_DISCUSSION: [
    { status: "SELECTED",             label: "Confirm Selected / Hire", cls: "btn-action-success" },
    { status: "RETURNED",             label: "Return to Candidate",  cls: "btn-action-warning", needsReason: true },
    { status: "NOT_PROCEEDING",       label: "Not Proceeding",       cls: "btn-action-danger", needsReason: true },
    { status: "CLOSED",               label: "Close Request",        cls: "btn-action-secondary" },
  ],
  SELECTED: [
    { status: "CLOSED",               label: "Mark Closed",          cls: "btn-action-secondary" },
  ],
  RETURNED: [
    { status: "UNDER_REVIEW",         label: "Re-open Review",       cls: "btn-action-primary" },
    { status: "CLOSED",               label: "Close Request",        cls: "btn-action-secondary" },
  ],
  NOT_PROCEEDING: [
    { status: "UNDER_REVIEW",         label: "Re-open Review",       cls: "btn-action-primary" },
    { status: "CLOSED",               label: "Close Request",        cls: "btn-action-secondary" },
  ],
  CLOSED: [],
};

const sm = (status: string) =>
  STATUS_META[status] || { label: status, color: "#374151", bg: "#f3f4f6", border: "#e5e7eb" };

const fmtDate = (iso?: string | null) => {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "N/A";
  }
};

const fmtDateTime = (iso?: string | null) => {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
      " • " +
      d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    );
  } catch {
    return "N/A";
  }
};

type ViewMode = "TABLE" | "BY_CANDIDATE" | "BY_COMPANY";
type DetailTab = "OVERVIEW" | "NOTES" | "HISTORY";

const AdminQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = searchParams.get("status") || "";
  const initialQ = searchParams.get("q") || "";
  const initialView = (searchParams.get("view") as ViewMode) || "TABLE";

  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  
  // Detail expansion & Tab state
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeDetailTabs, setActiveDetailTabs] = useState<Record<string, DetailTab>>({});
  
  // Live cache of request details (with notes and history)
  const [detailCache, setDetailCache] = useState<Record<string, ConnectionRequest>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

  // Internal note inputs per request
  const [newNoteTexts, setNewNoteTexts] = useState<Record<string, string>>({});
  const [submittingNote, setSubmittingNote] = useState<Record<string, boolean>>({});

  // Transition reason modal state
  const [transitionTarget, setTransitionTarget] = useState<{ id: string; toStatus: string } | null>(null);
  const [transitionReason, setTransitionReason] = useState("");

  const updateUrl = (newStatus: string, newSearch: string, newView: ViewMode = viewMode) => {
    const params: Record<string, string> = {};
    if (newStatus) params.status = newStatus;
    if (newSearch && newSearch.trim()) params.q = newSearch.trim();
    if (newView && newView !== "TABLE") params.view = newView;
    setSearchParams(params, { replace: true });
  };

  const load = async () => {
    setLoading(true);
    const params: Record<string, string | number> = { page: 0, size: 200 };
    if (statusFilter) params.status = statusFilter;
    try {
      const res = await connectionsApi.getAdminQueue(params);
      const list = res.data?.data?.content || [];
      setRequests(list);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  // Sync state when searchParams change on back/forward
  useEffect(() => {
    const sParam = searchParams.get("status") || "";
    if (sParam !== statusFilter) setStatusFilter(sParam);
    const qParam = searchParams.get("q") || "";
    if (qParam !== searchQuery) setSearchQuery(qParam);
    const vParam = searchParams.get("view") as ViewMode;
    if (vParam && ["TABLE", "BY_CANDIDATE", "BY_COMPANY"].includes(vParam) && vParam !== viewMode) {
      setViewMode(vParam);
    }
  }, [searchParams]);

  // Fetch full details (notes and history) when a request row is expanded
  const fetchRequestDetail = async (id: string) => {
    setLoadingDetails(prev => ({ ...prev, [id]: true }));
    try {
      const res = await connectionsApi.getRequestDetail(id);
      if (res.data?.data) {
        setDetailCache(prev => ({ ...prev, [id]: res.data.data }));
      }
    } catch {
      // fallback
    } finally {
      setLoadingDetails(prev => ({ ...prev, [id]: false }));
    }
  };

  const toggleExpand = (id: string) => {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      if (!activeDetailTabs[id]) {
        setActiveDetailTabs(prev => ({ ...prev, [id]: "OVERVIEW" }));
      }
      fetchRequestDetail(id);
    }
  };

  const handleStatusFilterChange = (s: string) => {
    setStatusFilter(s);
    updateUrl(s, searchQuery, viewMode);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    updateUrl(statusFilter, val, viewMode);
  };

  const handleViewChange = (v: ViewMode) => {
    setViewMode(v);
    updateUrl(statusFilter, searchQuery, v);
  };

  // Perform status transition
  const executeTransition = async (id: string, toStatus: string, reason?: string) => {
    setUpdating(id + toStatus);
    setTransitionTarget(null);
    setTransitionReason("");
    try {
      await connectionsApi.updateStatus(id, toStatus, reason?.trim() || undefined);
      setToast(`Status successfully moved to ${sm(toStatus).label}`);
      setTimeout(() => setToast(""), 3500);
      await load();
      if (expanded === id) {
        await fetchRequestDetail(id);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update connection status";
      alert(msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleTransitionClick = (id: string, toStatus: string, needsReason?: boolean) => {
    if (needsReason) {
      setTransitionTarget({ id, toStatus });
      setTransitionReason("");
    } else {
      executeTransition(id, toStatus);
    }
  };

  const handleAddNote = async (id: string) => {
    const text = newNoteTexts[id];
    if (!text || !text.trim()) return;

    setSubmittingNote(prev => ({ ...prev, [id]: true }));
    try {
      await connectionsApi.addAdminNote(id, text.trim());
      setNewNoteTexts(prev => ({ ...prev, [id]: "" }));
      await fetchRequestDetail(id);
      setToast("Internal note recorded securely");
      setTimeout(() => setToast(""), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to record internal note");
    } finally {
      setSubmittingNote(prev => ({ ...prev, [id]: false }));
    }
  };

  // Client-side search filtering
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();
    return requests.filter(r => {
      const candName = (r.candidateFullName || r.candidateName || "").toLowerCase();
      const candHead = (r.candidateHeadline || "").toLowerCase();
      const compName = (r.companyDisplayName || r.companyName || "").toLowerCase();
      const role = (r.roleTitle || "").toLowerCase();
      const loc = (r.location || r.candidateLocation || "").toLowerCase();
      const msg = (r.message || r.opportunitySummary || "").toLowerCase();
      const status = (r.status || "").toLowerCase();
      const id = (r.id || "").toLowerCase();
      return (
        candName.includes(q) ||
        candHead.includes(q) ||
        compName.includes(q) ||
        role.includes(q) ||
        loc.includes(q) ||
        msg.includes(q) ||
        status.includes(q) ||
        id.includes(q)
      );
    });
  }, [requests, searchQuery]);

  // High-demand multi-request intelligence mappings
  const candidateRequestCounts = useMemo(() => {
    const map: Record<string, number> = {};
    requests.forEach(r => {
      const key = r.candidateId || r.candidateFullName || r.candidateName;
      if (key) {
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [requests]);

  const companyRequestCounts = useMemo(() => {
    const map: Record<string, number> = {};
    requests.forEach(r => {
      const key = r.companyId || r.companyDisplayName || r.companyName;
      if (key) {
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [requests]);

  // Grouped by Candidate data
  const groupedByCandidate = useMemo(() => {
    const groups: Record<string, {
      candidateId?: string;
      candidateName: string;
      candidateHeadline?: string;
      candidateLocation?: string;
      requests: ConnectionRequest[];
    }> = {};

    filteredRequests.forEach(r => {
      const key = r.candidateId || r.candidateFullName || r.candidateName || "unknown-candidate";
      if (!groups[key]) {
        groups[key] = {
          candidateId: r.candidateId,
          candidateName: r.candidateFullName || r.candidateName || "Candidate",
          candidateHeadline: r.candidateHeadline,
          candidateLocation: r.candidateLocation || r.location,
          requests: [],
        };
      }
      groups[key].requests.push(r);
    });

    return Object.values(groups).sort((a, b) => b.requests.length - a.requests.length);
  }, [filteredRequests]);

  // Grouped by Company data
  const groupedByCompany = useMemo(() => {
    const groups: Record<string, {
      companyId?: string;
      companyName: string;
      companyDisplayName?: string;
      companyIndustry?: string;
      requests: ConnectionRequest[];
    }> = {};

    filteredRequests.forEach(r => {
      const key = r.companyId || r.companyDisplayName || r.companyName || "unknown-company";
      if (!groups[key]) {
        groups[key] = {
          companyId: r.companyId,
          companyName: r.companyName || "Company",
          companyDisplayName: r.companyDisplayName,
          companyIndustry: r.companyIndustry,
          requests: [],
        };
      }
      groups[key].requests.push(r);
    });

    return Object.values(groups).sort((a, b) => b.requests.length - a.requests.length);
  }, [filteredRequests]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = requests.length;
    const submitted = requests.filter(r => r.status === "SUBMITTED").length;
    const underReview = requests.filter(r => r.status === "UNDER_REVIEW").length;
    const discussion = requests.filter(r => r.status === "CANDIDATE_DISCUSSION").length;
    const selected = requests.filter(r => r.status === "SELECTED").length;
    const multiCandidateCount = Object.values(candidateRequestCounts).filter(c => c > 1).length;
    const multiCompanyCount = Object.values(companyRequestCounts).filter(c => c > 1).length;

    return { total, submitted, underReview, discussion, selected, multiCandidateCount, multiCompanyCount };
  }, [requests, candidateRequestCounts, companyRequestCounts]);

  const STATUS_TABS = [
    { key: "",                     label: "All Active & Closed", count: requests.length },
    { key: "SUBMITTED",            label: "Submitted",           count: requests.filter(r => r.status === "SUBMITTED").length },
    { key: "UNDER_REVIEW",         label: "Under Review",        count: requests.filter(r => r.status === "UNDER_REVIEW").length },
    { key: "COMPANY_CONTACTED",    label: "Company Contacted",   count: requests.filter(r => r.status === "COMPANY_CONTACTED").length },
    { key: "CANDIDATE_DISCUSSION", label: "Candidate Discussion",count: requests.filter(r => r.status === "CANDIDATE_DISCUSSION").length },
    { key: "SELECTED",             label: "Selected / Hired",    count: requests.filter(r => r.status === "SELECTED").length },
    { key: "RETURNED",             label: "Returned",            count: requests.filter(r => r.status === "RETURNED").length },
    { key: "NOT_PROCEEDING",       label: "Not Proceeding",      count: requests.filter(r => r.status === "NOT_PROCEEDING").length },
    { key: "CLOSED",               label: "Closed",              count: requests.filter(r => r.status === "CLOSED").length },
  ];

  return (
    <div className="admin-queue-page">
      {/* Toast Notification */}
      {toast && (
        <div className="aq-toast">
          <FiCheckCircle size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="aq-header">
        <div className="aq-header-title-wrap">
          
          <h1>Connection Requests Tracker</h1>
          <p className="aq-subtitle">
            Review, approve, and track connection requests between companies and candidates.
          </p>
        </div>

        <div className="aq-header-actions">
          <button className="aq-refresh-btn" onClick={load} disabled={loading} title="Reload Queue">
            <FiRefreshCw className={loading ? "spin" : ""} size={16} />
            <span>{loading ? "Refreshing..." : "Refresh Queue"}</span>
          </button>
        </div>
      </div>

      {/* Multi-Request Intelligence & Summary KPIs */}
      <div className="aq-metrics-grid">
        <div className="aq-metric-card" onClick={() => handleStatusFilterChange("")}>
          <div className="aq-metric-icon bg-blue"><FiInbox size={20} /></div>
          <div className="aq-metric-info">
            <span className="aq-metric-num">{stats.total}</span>
            <span className="aq-metric-label">Total Applications</span>
          </div>
        </div>

        <div className="aq-metric-card" onClick={() => handleStatusFilterChange("SUBMITTED")}>
          <div className="aq-metric-icon bg-amber"><FiClock size={20} /></div>
          <div className="aq-metric-info">
            <span className="aq-metric-num">{stats.submitted}</span>
            <span className="aq-metric-label">Pending Triage</span>
          </div>
        </div>

        <div className="aq-metric-card" onClick={() => handleStatusFilterChange("CANDIDATE_DISCUSSION")}>
          <div className="aq-metric-icon bg-purple"><FiActivity size={20} /></div>
          <div className="aq-metric-info">
            <span className="aq-metric-num">{stats.discussion}</span>
            <span className="aq-metric-label">In Active Discussion</span>
          </div>
        </div>

        <div className="aq-metric-card" onClick={() => handleStatusFilterChange("SELECTED")}>
          <div className="aq-metric-icon bg-green"><FiAward size={20} /></div>
          <div className="aq-metric-info">
            <span className="aq-metric-num">{stats.selected}</span>
            <span className="aq-metric-label">Selected / Placed</span>
          </div>
        </div>

        <div className="aq-metric-card highlight-card" onClick={() => handleViewChange("BY_CANDIDATE")}>
          <div className="aq-metric-icon bg-fire"><FiTrendingUp size={20} /></div>
          <div className="aq-metric-info">
            <span className="aq-metric-num">{stats.multiCandidateCount}</span>
            <span className="aq-metric-label">Multi-Requested Candidates</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter Tabs, Search, and Multi-View Switcher */}
      <div className="aq-controls-card">
        <div className="aq-top-controls">
          {/* Search bar */}
          <div className="aq-search-bar">
            <FiSearch size={16} className="aq-search-icon" />
            <input
              type="text"
              placeholder="Search by candidate, company, role, location, ID..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button className="aq-search-clear" onClick={() => handleSearchChange("")}>
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="aq-view-switcher">
            <span className="aq-view-label"><FiLayers size={14} /> View Layout:</span>
            <button
              className={`aq-view-btn ${viewMode === "TABLE" ? "active" : ""}`}
              onClick={() => handleViewChange("TABLE")}
            >
              <FiInbox size={14} /> All Requests
            </button>
            <button
              className={`aq-view-btn ${viewMode === "BY_CANDIDATE" ? "active" : ""}`}
              onClick={() => handleViewChange("BY_CANDIDATE")}
            >
              <FiUser size={14} /> Group by Candidate ({groupedByCandidate.length})
            </button>
            <button
              className={`aq-view-btn ${viewMode === "BY_COMPANY" ? "active" : ""}`}
              onClick={() => handleViewChange("BY_COMPANY")}
            >
              <FiBriefcase size={14} /> Group by Company ({groupedByCompany.length})
            </button>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="aq-status-chips">
          <div className="aq-filter-lead"><FiFilter size={13} /> Filter Status:</div>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`aq-status-chip ${statusFilter === tab.key ? "active" : ""}`}
              onClick={() => handleStatusFilterChange(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="aq-chip-count">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="aq-loading-state">
          <FiRefreshCw className="spin" size={32} />
          <p>Loading mediation queue and multi-request analytics...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="aq-empty-state">
          <FiInbox size={48} />
          <h3>No connection requests match the criteria</h3>
          <p>Try clearing filters or search queries to see other candidate applications.</p>
          {(statusFilter || searchQuery) && (
            <button className="aq-clear-btn" onClick={() => { setStatusFilter(""); setSearchQuery(""); updateUrl("", "", viewMode); }}>
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 1. TABLE VIEW */}
          {viewMode === "TABLE" && (
            <>
            <div className="aq-table-wrap desktop-only">
              <table className="aq-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Requested By (Company)</th>
                    <th>Role & Opportunity</th>
                    <th>Status & Triage</th>
                    <th>Requested On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => {
                    const statusConfig = sm(req.status);
                    const isExpanded = expanded === req.id;
                    const transitions = NEXT_TRANSITIONS[req.status] || [];
                    const candKey = req.candidateId || req.candidateFullName || req.candidateName;
                    const compKey = req.companyId || req.companyDisplayName || req.companyName;
                    const candidateReqCount = candidateRequestCounts[candKey || ""] || 1;
                    const compReqCount = companyRequestCounts[compKey || ""] || 1;
                                        const cachedDetail = detailCache[req.id];
                    const activeTab = activeDetailTabs[req.id] || "OVERVIEW";
                    const isRowUpdating = updating?.startsWith(req.id);

                    // Other requests for this candidate
                    const otherCandidateReqs = requests.filter(
                      r => (r.candidateId || r.candidateFullName || r.candidateName) === candKey && r.id !== req.id
                    );

                    return (
                      <Fragment key={req.id}>
                        <tr className={`aq-row ${isExpanded ? "expanded" : ""} ${isRowUpdating ? "row-updating" : ""}`}>
                          {/* Candidate Column */}
                          <td className="aq-cell-candidate">
                            <div className="aq-name-lockup">
                              <span className="aq-cand-name">{req.candidateFullName || req.candidateName || "Candidate"}</span>
                              {req.candidateHeadline && (
                                <span className="aq-cand-email">{req.candidateHeadline}</span>
                              )}
                              {candidateReqCount > 1 && (
                                <span className="aq-badge-multi-hot" title={`This candidate has ${candidateReqCount} active requests across different companies`}>
                                  🔥 {candidateReqCount} Company Requests
                                </span>
                              )}
                              {req.candidateId && (
                                <button
                                  className="aq-link-btn"
                                  onClick={() => navigate(`/candidates/${req.candidateId}`)}
                                >
                                  <FiExternalLink size={12} /> View Candidate
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Company Column */}
                          <td className="aq-cell-company">
                            <div className="aq-company-lockup">
                              <span className="aq-comp-name">{req.companyDisplayName || req.companyName || "Company"}</span>
                              {req.companyCity && (
                                <span className="aq-comp-sub"><FiMapPin size={11} /> {req.companyCity}</span>
                              )}
                              {compReqCount > 1 && (
                                <span className="aq-badge-comp-count">
                                  🏢 {compReqCount} Total Inbound Requests
                                </span>
                              )}
                              {req.companyId && (
                                <button
                                  className="aq-link-btn"
                                  onClick={() => navigate(`/companies/${req.companyId}`)}
                                >
                                  <FiExternalLink size={12} /> Company Details
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Role Column */}
                          <td className="aq-cell-role">
                            <div className="aq-role-lockup">
                              <span className="aq-role-title">{req.roleTitle || "Opportunity"}</span>
                              <span className="aq-role-meta">
                                {req.location && <span><FiMapPin size={11} /> {req.location}</span>}
                                {req.workType && <span className="aq-pill-workmodel">{req.workType}</span>}
                              </span>
                            </div>
                          </td>

                          {/* Status Column */}
                          <td className="aq-cell-status">
                            <span
                              className="aq-status-pill"
                              style={{
                                color: statusConfig.color,
                                background: statusConfig.bg,
                                borderColor: statusConfig.border,
                              }}
                            >
                              <span className="aq-status-dot" style={{ background: statusConfig.color }} />
                              {statusConfig.label}
                            </span>
                          </td>

                          {/* Date Column */}
                          <td className="aq-cell-date">
                            <span className="aq-date-primary">{fmtDate(req.submittedAt)}</span>
                            <span className="aq-date-sub">{fmtDateTime(req.submittedAt)}</span>
                          </td>

                          {/* Quick Transitions & Details Toggle */}
                          <td className="aq-cell-actions">
                            <div className="aq-action-bar">
                              {transitions.map((t) => (
                                <button
                                  key={t.status}
                                  className={`aq-btn-quick ${t.cls}`}
                                  disabled={updating === req.id + t.status}
                                  onClick={() => handleTransitionClick(req.id, t.status, t.needsReason)}
                                  title={t.label}
                                >
                                  {updating === req.id + t.status ? (
                                    <FiRefreshCw className="spin" size={12} />
                                  ) : (
                                    <>
                                      <span>{t.label}</span>
                                      <FiArrowRight size={12} />
                                    </>
                                  )}
                                </button>
                              ))}
                              <button
                                className={`aq-btn-inspect ${isExpanded ? "active" : ""}`}
                                onClick={() => toggleExpand(req.id)}
                              >
                                <FiFileText size={14} />
                                <span>{isExpanded ? "Close Panel" : "Inspect & Notes"}</span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Drawer / Detail Accordion */}
                        {isExpanded && (
                          <tr className="aq-drawer-row">
                            <td colSpan={6} className="aq-drawer-cell">
                              <div className="aq-drawer-inner">
                                {/* Drawer Navigation Tabs */}
                                <div className="aq-drawer-nav">
                                  <button
                                    className={`aq-drawer-tab ${activeTab === "OVERVIEW" ? "active" : ""}`}
                                    onClick={() => setActiveDetailTabs(prev => ({ ...prev, [req.id]: "OVERVIEW" }))}
                                  >
                                    <FiInbox size={14} /> Application Overview & Multi-Match
                                  </button>
                                  <button
                                    className={`aq-drawer-tab ${activeTab === "NOTES" ? "active" : ""}`}
                                    onClick={() => setActiveDetailTabs(prev => ({ ...prev, [req.id]: "NOTES" }))}
                                  >
                                    <FiFileText size={14} /> Confidential Admin Notes ({cachedDetail?.adminNotes?.length || 0})
                                  </button>
                                  <button
                                    className={`aq-drawer-tab ${activeTab === "HISTORY" ? "active" : ""}`}
                                    onClick={() => setActiveDetailTabs(prev => ({ ...prev, [req.id]: "HISTORY" }))}
                                  >
                                    <FiClock size={14} /> State Audit Trail ({cachedDetail?.history?.length || 0})
                                  </button>
                                </div>

                                <div className="aq-drawer-body">
                                  {/* TAB 1: OVERVIEW & MULTI-REQUEST INTELLIGENCE */}
                                  {activeTab === "OVERVIEW" && (
                                    <div className="aq-overview-tab">
                                      {/* Cross-Request Demand Intelligence Alert */}
                                      {otherCandidateReqs.length > 0 && (
                                        <div className="aq-conflict-alert">
                                          <div className="aq-alert-head">
                                            <FiAlertCircle size={18} />
                                            <strong>Candidate Multi-Application Intelligence:</strong>
                                            <span>
                                              {req.candidateFullName || req.candidateName} has {otherCandidateReqs.length} other concurrent connection request(s).
                                            </span>
                                          </div>
                                          <div className="aq-conflict-list">
                                            {otherCandidateReqs.map(other => {
                                              const oSm = sm(other.status);
                                              return (
                                                <div key={other.id} className="aq-conflict-item">
                                                  <span className="aq-conflict-comp">
                                                    🏢 <strong>{other.companyDisplayName || other.companyName}</strong>
                                                  </span>
                                                  <span className="aq-conflict-role">({other.roleTitle || "Role"})</span>
                                                  <span
                                                    className="aq-status-badge-small"
                                                    style={{ color: oSm.color, background: oSm.bg, borderColor: oSm.border }}
                                                  >
                                                    {oSm.label}
                                                  </span>
                                                  <button
                                                    className="aq-btn-mini-switch"
                                                    onClick={() => {
                                                      setExpanded(other.id);
                                                      fetchRequestDetail(other.id);
                                                    }}
                                                  >
                                                    Switch to Request →
                                                  </button>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      <div className="aq-overview-grid">
                                        <div className="aq-overview-card">
                                          <h4>Opportunity Details</h4>
                                          <div className="aq-kv-list">
                                            <div className="aq-kv-item">
                                              <span className="aq-kv-k">Role Title:</span>
                                              <span className="aq-kv-v">{req.roleTitle || "Not specified"}</span>
                                            </div>
                                            <div className="aq-kv-item">
                                              <span className="aq-kv-k">Job Location:</span>
                                              <span className="aq-kv-v">{req.location || "Remote / Undefined"}</span>
                                            </div>
                                            <div className="aq-kv-item">
                                              <span className="aq-kv-k">Work Model:</span>
                                              <span className="aq-kv-v">{req.workType || "Full-time"}</span>
                                            </div>
                                            <div className="aq-kv-item">
                                              <span className="aq-kv-k">Expected Start:</span>
                                              <span className="aq-kv-v">{req.expectedStart || "Immediate"}</span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="aq-overview-card">
                                          <h4>Pitch & Opportunity Summary</h4>
                                          <div className="aq-message-box">
                                            {req.message || req.opportunitySummary ? (
                                              <p>{req.message || req.opportunitySummary}</p>
                                            ) : (
                                              <span className="text-muted">No initial pitch message attached by requesting company.</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Transition Control Section inside Drawer */}
                                      <div className="aq-drawer-actions-panel">
                                        <span className="aq-panel-title">Execute Step Lifecycle Progression:</span>
                                        <div className="aq-panel-buttons">
                                          {transitions.map((t) => (
                                            <button
                                              key={t.status}
                                              className={`aq-btn-quick ${t.cls}`}
                                              disabled={updating === req.id + t.status}
                                              onClick={() => handleTransitionClick(req.id, t.status, t.needsReason)}
                                            >
                                              {updating === req.id + t.status ? (
                                                <FiRefreshCw className="spin" size={12} />
                                              ) : (
                                                <>
                                                  <span>{t.label}</span>
                                                  <FiArrowRight size={13} />
                                                </>
                                              )}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* TAB 2: CONFIDENTIAL ADMIN NOTES */}
                                  {activeTab === "NOTES" && (
                                    <div className="aq-notes-tab">
                                      <div className="aq-notes-notice">
                                        <FiShield size={14} />
                                        <span>Internal Admin Notes are strictly confidential and never visible to candidates or companies.</span>
                                      </div>

                                      {/* New Note Form */}
                                      <div className="aq-new-note-form">
                                        <textarea
                                          rows={3}
                                          placeholder="Record interview notes, compensation discussions, client feedback, or mediation logs..."
                                          value={newNoteTexts[req.id] || ""}
                                          onChange={(e) => setNewNoteTexts(prev => ({ ...prev, [req.id]: e.target.value }))}
                                        />
                                        <button
                                          className="aq-btn-submit-note"
                                          disabled={submittingNote[req.id] || !newNoteTexts[req.id]?.trim()}
                                          onClick={() => handleAddNote(req.id)}
                                        >
                                          <FiSend size={13} />
                                          <span>{submittingNote[req.id] ? "Saving..." : "Record Note"}</span>
                                        </button>
                                      </div>

                                      {/* Existing Notes Feed */}
                                      <div className="aq-notes-feed">
                                        {loadingDetails[req.id] ? (
                                          <div className="aq-mini-loader"><FiRefreshCw className="spin" size={16} /> Fetching notes...</div>
                                        ) : cachedDetail?.adminNotes && cachedDetail.adminNotes.length > 0 ? (
                                          cachedDetail.adminNotes.map((note: any) => (
                                            <div key={note.id || note.createdAt} className="aq-note-card">
                                              <div className="aq-note-header">
                                                <span className="aq-note-author"><FiUser size={12} /> {note.createdByEmail || note.authorName || "Admin"}</span>
                                                <span className="aq-note-time">{fmtDateTime(note.createdAt)}</span>
                                              </div>
                                              <div className="aq-note-content">{note.note}</div>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="aq-empty-notes">No internal notes recorded yet for this connection.</div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* TAB 3: AUDIT HISTORY */}
                                  {activeTab === "HISTORY" && (
                                    <div className="aq-history-tab">
                                      {loadingDetails[req.id] ? (
                                        <div className="aq-mini-loader"><FiRefreshCw className="spin" size={16} /> Fetching audit trail...</div>
                                      ) : cachedDetail?.history && cachedDetail.history.length > 0 ? (
                                        <div className="aq-timeline">
                                          {cachedDetail.history.map((hist: any, idx: number) => {
                                            const fromSm = hist.fromStatus ? sm(hist.fromStatus) : null;
                                            const toSm = sm(hist.toStatus);
                                            return (
                                              <div key={hist.id || idx} className="aq-timeline-item">
                                                <div className="aq-timeline-dot" style={{ background: toSm.color }} />
                                                <div className="aq-timeline-body">
                                                  <div className="aq-timeline-header">
                                                    <span className="aq-timeline-change">
                                                      {fromSm ? (
                                                        <>
                                                          <span className="aq-badge-mini" style={{ color: fromSm.color, background: fromSm.bg }}>{fromSm.label}</span>
                                                          <FiArrowRight size={12} />
                                                        </>
                                                      ) : (
                                                        <span className="text-muted">Initiated as </span>
                                                      )}
                                                      <span className="aq-badge-mini" style={{ color: toSm.color, background: toSm.bg }}>{toSm.label}</span>
                                                    </span>
                                                    <span className="aq-timeline-time">{fmtDateTime(hist.changedAt || hist.createdAt)}</span>
                                                  </div>
                                                  <div className="aq-timeline-meta">
                                                    <span>By: <strong>{hist.changedByEmail || hist.changedByName || "System"}</strong></span>
                                                    {hist.reason && <p className="aq-timeline-reason">"{hist.reason}"</p>}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="aq-empty-notes">No audit log records available.</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="aq-mobile-cards mobile-only">
              {filteredRequests.map((req) => {
                const statusConfig = sm(req.status);
                const isExpanded = expanded === req.id;
                const transitions = NEXT_TRANSITIONS[req.status] || [];
                const candKey = req.candidateId || req.candidateFullName || req.candidateName;
                const compKey = req.companyId || req.companyDisplayName || req.companyName;
                const candidateReqCount = candidateRequestCounts[candKey || ""] || 1;
                    const compReqCount = companyRequestCounts[compKey || ""] || 1;
                const cachedDetail = detailCache[req.id];
                const activeTab = activeDetailTabs[req.id] || "OVERVIEW";
                const compName = req.companyDisplayName || req.companyName || "Company";
                const candName = req.candidateFullName || req.candidateName || "Candidate";

                return (
                  <div key={req.id} className={`aq-mobile-card ${isExpanded ? "expanded" : ""}`}>
                    <div className="aq-mcard-header">
                      <div className="aq-mcard-cand-info">
                        <span className="aq-mcard-cand-name">{candName}</span>
                        {req.candidateHeadline && (
                          <span className="aq-mcard-cand-head">{req.candidateHeadline}</span>
                        )}
                      </div>
                      <span
                        className="aq-status-pill"
                        style={{
                          color: statusConfig.color,
                          background: statusConfig.bg,
                          borderColor: statusConfig.border,
                        }}
                      >
                        <span className="aq-status-dot" style={{ background: statusConfig.color }} />
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="aq-mcard-badges">
                      {candidateReqCount > 1 && (
                        <span className="aq-badge-multi-hot">
                          🔥 {candidateReqCount} Company Requests
                        </span>
                      )}
                      {compReqCount > 1 && (
                        <span className="aq-badge-comp-count">
                          🏢 {compReqCount} Total Inbound Requests
                        </span>
                      )}
                      {req.candidateId && (
                        <button
                          className="aq-link-btn"
                          onClick={() => navigate(`/candidates/${req.candidateId}`)}
                        >
                          <FiExternalLink size={12} /> View Candidate
                        </button>
                      )}
                    </div>

                    <div className="aq-mcard-body">
                      <div className="aq-mcard-row">
                        <span className="aq-mcard-label">Company:</span>
                        <span className="aq-mcard-val-bold">{compName}</span>
                        {req.companyCity && <span className="aq-mcard-sub">({req.companyCity})</span>}
                        {req.companyId && (
                          <button
                            className="aq-link-btn"
                            style={{ marginLeft: "4px" }}
                            onClick={() => navigate(`/companies/${req.companyId}`)}
                          >
                            <FiExternalLink size={11} /> Details
                          </button>
                        )}
                      </div>

                      <div className="aq-mcard-row">
                        <span className="aq-mcard-label">Role:</span>
                        <span className="aq-mcard-val-blue">{req.roleTitle || "Opportunity"}</span>
                        {req.workType && <span className="aq-pill-workmodel">{req.workType}</span>}
                      </div>

                      <div className="aq-mcard-row">
                        <span className="aq-mcard-label">Submitted:</span>
                        <span className="aq-mcard-val">{fmtDate(req.submittedAt)}</span>
                      </div>
                    </div>

                    <div className="aq-mcard-actions">
                      {transitions.map((t) => (
                        <button
                          key={t.status}
                          className={`aq-btn-quick ${t.cls}`}
                          disabled={updating === req.id + t.status}
                          onClick={() => handleTransitionClick(req.id, t.status, t.needsReason)}
                          title={t.label}
                        >
                          {updating === req.id + t.status ? (
                            <FiRefreshCw className="spin" size={12} />
                          ) : (
                            <>
                              <span>{t.label}</span>
                              <FiArrowRight size={12} />
                            </>
                          )}
                        </button>
                      ))}
                      <button
                        className={`aq-btn-inspect ${isExpanded ? "active" : ""}`}
                        onClick={() => toggleExpand(req.id)}
                      >
                        <FiFileText size={14} />
                        <span>{isExpanded ? "Close Panel" : "Inspect & Notes"}</span>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="aq-mcard-drawer">
                        <div className="aq-drawer-nav">
                          <button
                            className={`aq-drawer-tab ${activeTab === "OVERVIEW" ? "active" : ""}`}
                            onClick={() => setActiveDetailTabs(prev => ({ ...prev, [req.id]: "OVERVIEW" }))}
                          >
                            <FiInbox size={14} /> Overview
                          </button>
                          <button
                            className={`aq-drawer-tab ${activeTab === "NOTES" ? "active" : ""}`}
                            onClick={() => setActiveDetailTabs(prev => ({ ...prev, [req.id]: "NOTES" }))}
                          >
                            <FiFileText size={14} /> Notes ({cachedDetail?.adminNotes?.length || 0})
                          </button>
                          <button
                            className={`aq-drawer-tab ${activeTab === "HISTORY" ? "active" : ""}`}
                            onClick={() => setActiveDetailTabs(prev => ({ ...prev, [req.id]: "HISTORY" }))}
                          >
                            <FiClock size={14} /> History ({cachedDetail?.history?.length || 0})
                          </button>
                        </div>

                        <div className="aq-drawer-body">
                          {activeTab === "OVERVIEW" && (
                            <div className="aq-overview-tab">
                              <div className="aq-overview-grid">
                                <div className="aq-overview-card">
                                  <h4>Opportunity Details</h4>
                                  <div className="aq-kv-list">
                                    <div className="aq-kv-item">
                                      <span className="aq-kv-k">Role Title:</span>
                                      <span className="aq-kv-v">{req.roleTitle || "Not specified"}</span>
                                    </div>
                                    <div className="aq-kv-item">
                                      <span className="aq-kv-k">Job Location:</span>
                                      <span className="aq-kv-v">{req.location || "Remote / Undefined"}</span>
                                    </div>
                                    <div className="aq-kv-item">
                                      <span className="aq-kv-k">Work Model:</span>
                                      <span className="aq-kv-v">{req.workType || "Full-time"}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="aq-overview-card">
                                  <h4>Pitch & Opportunity Summary</h4>
                                  <div className="aq-message-box">
                                    <p>{req.message || req.opportunitySummary || "No pitch message."}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === "NOTES" && (
                            <div className="aq-notes-tab">
                              <div className="aq-new-note-form">
                                <textarea
                                  placeholder="Add timestamped internal admin note..."
                                  rows={2}
                                  value={newNoteTexts[req.id] || ""}
                                  onChange={(e) => setNewNoteTexts(prev => ({ ...prev, [req.id]: e.target.value }))}
                                />
                                <button
                                  className="aq-btn-submit-note"
                                  disabled={submittingNote[req.id] || !(newNoteTexts[req.id] || "").trim()}
                                  onClick={() => handleAddNote(req.id)}
                                >
                                  {submittingNote[req.id] ? "Saving..." : "Record Internal Note"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
          )}

          {/* 2. GROUP BY CANDIDATE VIEW */}
          {viewMode === "BY_CANDIDATE" && (
            <div className="aq-grouped-cards-container">
              {groupedByCandidate.map((group) => {
                const totalCompReqs = group.requests.length;
                const isMulti = totalCompReqs > 1;

                return (
                  <div key={group.candidateId || group.candidateName} className={`aq-group-card ${isMulti ? "hot-candidate" : ""}`}>
                    <div className="aq-group-header">
                      <div className="aq-group-header-left">
                        <div className="aq-cand-avatar">
                          <FiUser size={20} />
                        </div>
                        <div>
                          <div className="aq-cand-title-row">
                            <h3>{group.candidateName || "Candidate"}</h3>
                            {isMulti && (
                              <span className="aq-badge-hot">
                                🔥 {totalCompReqs} Simultaneous Company Requests
                              </span>
                            )}
                          </div>
                          {group.candidateHeadline && (
                            <span className="aq-cand-email">{group.candidateHeadline}</span>
                          )}
                        </div>
                      </div>

                      {group.candidateId && (
                        <button
                          className="aq-btn-outline-sm"
                          onClick={() => navigate(`/candidates/${group.candidateId}`)}
                        >
                          <FiExternalLink size={13} /> Full Candidate Dossier
                        </button>
                      )}
                    </div>

                    {/* Sub-table of all company requests for this candidate */}
                    <div className="aq-subtable-wrap">
                      <table className="aq-subtable">
                        <thead>
                          <tr>
                            <th>Requesting Company</th>
                            <th>Target Role</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Received On</th>
                            <th>Triage Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.requests.map((r) => {
                            const rSm = sm(r.status);
                            const transitions = NEXT_TRANSITIONS[r.status] || [];

                            return (
                              <tr key={r.id}>
                                <td>
                                  <div className="aq-company-lockup">
                                    <strong>{r.companyDisplayName || r.companyName}</strong>
                                    {r.companyId && (
                                      <button
                                        className="aq-link-btn"
                                        onClick={() => navigate(`/companies/${r.companyId}`)}
                                      >
                                        <FiExternalLink size={11} /> View Company
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <strong>{r.roleTitle || "Opportunity"}</strong>
                                  <div className="aq-role-meta">{r.workType || "Full-time"}</div>
                                </td>
                                <td>
                                  <span>{r.location || "Remote / Unspecified"}</span>
                                </td>
                                <td>
                                  <span
                                    className="aq-status-pill"
                                    style={{ color: rSm.color, background: rSm.bg, borderColor: rSm.border }}
                                  >
                                    <span className="aq-status-dot" style={{ background: rSm.color }} />
                                    {rSm.label}
                                  </span>
                                </td>
                                <td>{fmtDate(r.submittedAt)}</td>
                                <td>
                                  <div className="aq-action-bar">
                                    {transitions.slice(0, 2).map((t) => (
                                      <button
                                        key={t.status}
                                        className={`aq-btn-quick ${t.cls}`}
                                        disabled={updating === r.id + t.status}
                                        onClick={() => handleTransitionClick(r.id, t.status, t.needsReason)}
                                      >
                                        <span>{t.label}</span>
                                        <FiArrowRight size={11} />
                                      </button>
                                    ))}
                                    <button
                                      className="aq-btn-inspect"
                                      onClick={() => {
                                        setViewMode("TABLE");
                                        setExpanded(r.id);
                                        fetchRequestDetail(r.id);
                                      }}
                                    >
                                      Inspect
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. GROUP BY COMPANY VIEW */}
          {viewMode === "BY_COMPANY" && (
            <div className="aq-grouped-cards-container">
              {groupedByCompany.map((group) => {
                const totalCandReqs = group.requests.length;

                return (
                  <div key={group.companyId || group.companyDisplayName || group.companyName} className="aq-group-card">
                    <div className="aq-group-header">
                      <div className="aq-group-header-left">
                        <div className="aq-comp-avatar">
                          <FiBriefcase size={20} />
                        </div>
                        <div>
                          <div className="aq-cand-title-row">
                            <h3>{group.companyDisplayName || group.companyName || "Company"}</h3>
                            <span className="aq-badge-comp-count">
                              🏢 {totalCandReqs} Total Candidate Request(s)
                            </span>
                          </div>
                          {group.companyIndustry && (
                            <span className="aq-cand-email">Industry: {group.companyIndustry}</span>
                          )}
                        </div>
                      </div>

                      {group.companyId && (
                        <button
                          className="aq-btn-outline-sm"
                          onClick={() => navigate(`/companies/${group.companyId}`)}
                        >
                          <FiExternalLink size={13} /> Full Company Profile
                        </button>
                      )}
                    </div>

                    {/* Sub-table of all candidate requests made by this company */}
                    <div className="aq-subtable-wrap">
                      <table className="aq-subtable">
                        <thead>
                          <tr>
                            <th>Target Candidate</th>
                            <th>Role Position</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Requested On</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.requests.map((r) => {
                            const rSm = sm(r.status);
                            const transitions = NEXT_TRANSITIONS[r.status] || [];
                            const candKey = r.candidateId || r.candidateFullName || r.candidateName;
                            const candCount = candidateRequestCounts[candKey || ""] || 1;

                            return (
                              <tr key={r.id}>
                                <td>
                                  <div className="aq-name-lockup">
                                    <strong>{r.candidateFullName || r.candidateName}</strong>
                                    {candCount > 1 && (
                                      <span className="aq-badge-multi-hot">🔥 {candCount} Active Requests</span>
                                    )}
                                    {r.candidateId && (
                                      <button
                                        className="aq-link-btn"
                                        onClick={() => navigate(`/candidates/${r.candidateId}`)}
                                      >
                                        <FiExternalLink size={11} /> Profile
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <strong>{r.roleTitle || "Opportunity"}</strong>
                                  <div className="aq-role-meta">{r.workType || "Full-time"}</div>
                                </td>
                                <td>
                                  <span>{r.location || "Remote / Unspecified"}</span>
                                </td>
                                <td>
                                  <span
                                    className="aq-status-pill"
                                    style={{ color: rSm.color, background: rSm.bg, borderColor: rSm.border }}
                                  >
                                    <span className="aq-status-dot" style={{ background: rSm.color }} />
                                    {rSm.label}
                                  </span>
                                </td>
                                <td>{fmtDate(r.submittedAt)}</td>
                                <td>
                                  <div className="aq-action-bar">
                                    {transitions.slice(0, 2).map((t) => (
                                      <button
                                        key={t.status}
                                        className={`aq-btn-quick ${t.cls}`}
                                        disabled={updating === r.id + t.status}
                                        onClick={() => handleTransitionClick(r.id, t.status, t.needsReason)}
                                      >
                                        <span>{t.label}</span>
                                        <FiArrowRight size={11} />
                                      </button>
                                    ))}
                                    <button
                                      className="aq-btn-inspect"
                                      onClick={() => {
                                        setViewMode("TABLE");
                                        setExpanded(r.id);
                                        fetchRequestDetail(r.id);
                                      }}
                                    >
                                      Inspect
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Transition Reason Modal */}
      {transitionTarget && (
        <div className="aq-modal-backdrop">
          <div className="aq-modal-box">
            <div className="aq-modal-header">
              <FiAlertCircle size={20} className="text-amber" />
              <h3>Status Transition Justification</h3>
            </div>
            <div className="aq-modal-body">
              <p>
                Moving status to <strong>{sm(transitionTarget.toStatus).label}</strong> requires a mandatory reason or operational note for audit records:
              </p>
              <textarea
                rows={3}
                placeholder="State the reason (e.g. Candidate declined salary offer, Company postponed headcount, Candidate missing required skills)..."
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                autoFocus
              />
            </div>
            <div className="aq-modal-footer">
              <button
                className="aq-btn-modal-cancel"
                onClick={() => setTransitionTarget(null)}
              >
                Cancel
              </button>
              <button
                className="aq-btn-modal-confirm"
                disabled={!transitionReason.trim()}
                onClick={() => executeTransition(transitionTarget.id, transitionTarget.toStatus, transitionReason)}
              >
                Confirm & Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQueuePage;
