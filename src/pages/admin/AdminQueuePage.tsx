import React, { useEffect, useState, useMemo, Fragment } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { connectionsApi } from "../../api/connections";
import type { ConnectionRequest } from "../../types";
import { isValidUserAvatar } from "../../utils/validators";
import { AdminHeroBanner } from "../../components/admin/AdminHeroBanner";
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
  FiCalendar,
  FiMoreVertical,
  FiList,
} from "react-icons/fi";
import "./AdminQueue.css";

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  SUBMITTED:            { label: "Submitted",            color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
  UNDER_REVIEW:         { label: "Under Review",         color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" },
  COMPANY_CONTACTED:    { label: "Company Contacted",    color: "#047857", bg: "#d1fae5", border: "#6ee7b7" },
  CANDIDATE_DISCUSSION: { label: "Candidate Discussion", color: "#7e22ce", bg: "#f3e8ff", border: "#d8b4fe" },
  SELECTED:             { label: "Selected / Hired",     color: "#15803d", bg: "#dcfce7", border: "#86efac" },
  RETURNED:             { label: "Returned to Candidate",color: "#c2410c", bg: "#ffedd5", border: "#fed7aa" },
  NOT_PROCEEDING:       { label: "Not Proceeding",       color: "#be123c", bg: "#ffe4e6", border: "#fecdd3" },
  CLOSED:               { label: "Closed",               color: "#475569", bg: "#f1f5f9", border: "#e2e8f0" },
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
  STATUS_META[status] || { label: status, color: "#475569", bg: "#f1f5f9", border: "#e2e8f0" };

const fmtDateOnly = (iso?: string | null) => {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "N/A";
  }
};

const fmtTimeOnly = (iso?: string | null) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
  } catch {
    return "";
  }
};

const getInitials = (name?: string) => {
  if (!name) return "CD";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const AVATAR_BG_COLORS = [
  { bg: "#dcfce7", text: "#166534" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#dbeafe", text: "#1e40af" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#f3e8ff", text: "#6b21a8" },
  { bg: "#ccfbf1", text: "#115e59" },
];

const getAvatarStyle = (name?: string) => {
  if (!name) return AVATAR_BG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_BG_COLORS.length;
  return AVATAR_BG_COLORS[idx];
};

const QueueAvatar: React.FC<{
  src?: string | null;
  name: string;
  avatarStyle: { bg: string; text: string };
  initials: string;
  large?: boolean;
}> = ({ src, name, avatarStyle, initials, large }) => {
  const [imgError, setImgError] = useState(false);
  const showImg = Boolean(src && isValidUserAvatar(src) && !imgError);

  return (
    <div
      className={`aq-avatar-circle ${large ? "large" : ""}`}
      style={{
        background: showImg ? "#f1f5f9" : avatarStyle.bg,
        color: avatarStyle.text,
      }}
    >
      {showImg ? (
        <img
          src={src!}
          alt={name}
          className="aq-avatar-img"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
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
  
  // Live cache of request details
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

  // Fetch full details
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

    return { total, submitted, underReview, discussion, selected, multiCandidateCount };
  }, [requests, candidateRequestCounts]);

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

      {/* Mint Hero Banner with Detailed Organic Waves & Graphic */}
      <AdminHeroBanner
          illustrationType="requests"
        badgeText="CONNECTION REQUESTS TRACKER"
        badgeIcon={<FiActivity size={14} />}
        title="Connection Requests Tracker"
        highlightText="Connection Requests"
        subtitle="Review, approve, and track connection requests between companies and candidates."
        actionButton={
          <button className="aq-refresh-btn" onClick={load} disabled={loading} title="Reload Queue">
            <FiRefreshCw className={loading ? "spin" : ""} size={15} />
            <span>{loading ? "Refreshing..." : "Refresh Queue"}</span>
          </button>
        }
      />

      {/* 5 KPI Metric Cards Row */}
      <div className="aq-metrics-grid">
        <div className="aq-metric-card" onClick={() => handleStatusFilterChange("")}>
          <div className="aq-metric-top">
            <div className="aq-metric-icon bg-blue"><FiInbox size={18} /></div>
            <span className="aq-card-arrow"><FiArrowRight size={14} /></span>
          </div>
          <div className="aq-metric-body">
            <span className="aq-metric-num">{stats.total}</span>
            <span className="aq-metric-label">Total Applications</span>
            <span className="aq-metric-sub">All connection requests</span>
          </div>
        </div>

        <div className="aq-metric-card" onClick={() => handleStatusFilterChange("SUBMITTED")}>
          <div className="aq-metric-top">
            <div className="aq-metric-icon bg-amber"><FiClock size={18} /></div>
            <span className="aq-card-arrow"><FiArrowRight size={14} /></span>
          </div>
          <div className="aq-metric-body">
            <span className="aq-metric-num">{stats.submitted}</span>
            <span className="aq-metric-label">Pending Triage</span>
            <span className="aq-metric-sub">Needs initial review</span>
          </div>
        </div>

        <div className="aq-metric-card" onClick={() => handleStatusFilterChange("CANDIDATE_DISCUSSION")}>
          <div className="aq-metric-top">
            <div className="aq-metric-icon bg-purple"><FiActivity size={18} /></div>
            <span className="aq-card-arrow"><FiArrowRight size={14} /></span>
          </div>
          <div className="aq-metric-body">
            <span className="aq-metric-num">{stats.discussion}</span>
            <span className="aq-metric-label">In Active Discussion</span>
            <span className="aq-metric-sub">Under communication</span>
          </div>
        </div>

        <div className="aq-metric-card" onClick={() => handleStatusFilterChange("SELECTED")}>
          <div className="aq-metric-top">
            <div className="aq-metric-icon bg-green"><FiAward size={18} /></div>
            <span className="aq-card-arrow"><FiArrowRight size={14} /></span>
          </div>
          <div className="aq-metric-body">
            <span className="aq-metric-num">{stats.selected}</span>
            <span className="aq-metric-label">Selected / Placed</span>
            <span className="aq-metric-sub">Successfully hired</span>
          </div>
        </div>

        <div className="aq-metric-card" onClick={() => handleViewChange("BY_CANDIDATE")}>
          <div className="aq-metric-top">
            <div className="aq-metric-icon bg-orange"><FiTrendingUp size={18} /></div>
            <span className="aq-card-arrow"><FiArrowRight size={14} /></span>
          </div>
          <div className="aq-metric-body">
            <span className="aq-metric-num">{stats.multiCandidateCount}</span>
            <span className="aq-metric-label">Multi-Requested</span>
            <span className="aq-metric-sub">Applied to multiple companies</span>
          </div>
        </div>
      </div>

      {/* Control Card Box: Search, Layout Switcher & Status Filter Chips */}
      <div className="aq-controls-card">
        <div className="aq-top-controls-row">
          {/* Search Bar */}
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

          {/* View Mode Switcher Pills */}
          <div className="aq-layout-switcher">
            <span className="aq-layout-label"><FiLayers size={14} /> View Layout:</span>
            <div className="aq-layout-pills">
              <button
                className={`aq-layout-btn ${viewMode === "TABLE" ? "active" : ""}`}
                onClick={() => handleViewChange("TABLE")}
              >
                <FiList size={14} /> All Requests
              </button>
              <button
                className={`aq-layout-btn ${viewMode === "BY_CANDIDATE" ? "active" : ""}`}
                onClick={() => handleViewChange("BY_CANDIDATE")}
              >
                <FiUser size={14} /> Group by Candidate ({groupedByCandidate.length})
              </button>
              <button
                className={`aq-layout-btn ${viewMode === "BY_COMPANY" ? "active" : ""}`}
                onClick={() => handleViewChange("BY_COMPANY")}
              >
                <FiBriefcase size={14} /> Group by Company ({groupedByCompany.length})
              </button>
            </div>
          </div>
        </div>

        {/* Filter Status Chips */}
        <div className="aq-filter-chips-row">
          <span className="aq-filter-label"><FiFilter size={14} /> Filter Status:</span>
          <div className="aq-filter-chips">
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  className={`aq-filter-chip ${isActive ? "active" : ""}`}
                  onClick={() => handleStatusFilterChange(tab.key)}
                >
                  <span>{tab.label}</span>
                  <span className="aq-chip-count">{tab.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="aq-loading-state">
          <FiRefreshCw className="spin" size={28} />
          <p>Loading connection requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="aq-empty-state">
          <FiInbox size={42} />
          <h3>No connection requests found</h3>
          <p>Try adjusting your search query or status filter chips.</p>
          {(statusFilter || searchQuery) && (
            <button className="aq-btn-outline" onClick={() => { handleStatusFilterChange(""); handleSearchChange(""); }}>
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 1. TABLE VIEW */}
          {viewMode === "TABLE" && (
            <div className="aq-table-card">
              <table className="aq-table">
                <thead>
                  <tr>
                    <th>CANDIDATE</th>
                    <th>REQUESTED BY (COMPANY)</th>
                    <th>ROLE & OPPORTUNITY</th>
                    <th>STATUS & TRIAGE</th>
                    <th>REQUESTED ON</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((r) => {
                    const smObj = sm(r.status);
                    const transitions = NEXT_TRANSITIONS[r.status] || [];
                    const candKey = r.candidateId || r.candidateFullName || r.candidateName;
                    const candCount = candidateRequestCounts[candKey || ""] || 1;
                    const isExp = expanded === r.id;
                    const activeTab = activeDetailTabs[r.id] || "OVERVIEW";
                    const detailedReq = (detailCache[r.id] || r) as any;
                    const candName = r.candidateFullName || r.candidateName || "Candidate";
                    const avatarStyle = getAvatarStyle(candName);
                    const initials = getInitials(candName);

                    return (
                      <Fragment key={r.id}>
                        <tr className={`aq-row ${isExp ? "expanded-row" : ""}`}>
                          {/* Candidate Column */}
                          <td>
                            <div className="aq-candidate-cell">
                              <QueueAvatar
                                src={r.candidateAvatarUrl}
                                name={candName}
                                avatarStyle={avatarStyle}
                                initials={initials}
                              />
                              <div className="aq-candidate-info">
                                <strong
                                  className="aq-candidate-name"
                                  onClick={() => r.candidateId && navigate(`/candidates/${r.candidateId}`)}
                                >
                                  {candName}
                                </strong>
                                <div className="aq-candidate-headline">
                                  {r.candidateHeadline || "Candidate Profile"}
                                </div>
                                {candCount > 1 && (
                                  <span className="aq-flame-badge">
                                    🔥 {candCount} Company Requests
                                  </span>
                                )}
                                {r.candidateId && (
                                  <button
                                    className="aq-link-btn"
                                    onClick={() => navigate(`/candidates/${r.candidateId}`)}
                                  >
                                    <FiExternalLink size={12} /> View Candidate
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Company Column */}
                          <td>
                            <div className="aq-company-cell">
                              <strong
                                className="aq-company-name"
                                onClick={() => r.companyId && navigate(`/companies/${r.companyId}`)}
                              >
                                {r.companyDisplayName || r.companyName || "Company"}
                              </strong>
                              <div className="aq-company-location">
                                <FiMapPin size={12} />
                                <span>{r.candidateLocation || r.location || "Unspecified"}</span>
                              </div>
                              {r.companyId && (
                                <button
                                  className="aq-link-btn"
                                  onClick={() => navigate(`/companies/${r.companyId}`)}
                                >
                                  <FiExternalLink size={12} /> Company Details
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Role Column */}
                          <td>
                            <div className="aq-role-cell">
                              <strong className="aq-role-title">{r.roleTitle || "Opportunity"}</strong>
                              <span className="aq-workplace-tag">
                                {(r.workType || "HYBRID").toUpperCase()}
                              </span>
                            </div>
                          </td>

                          {/* Status Column */}
                          <td>
                            <span
                              className="aq-status-pill"
                              style={{ color: smObj.color, background: smObj.bg, borderColor: smObj.border }}
                            >
                              <span className="aq-status-dot" style={{ background: smObj.color }} />
                              {smObj.label}
                            </span>
                          </td>

                          {/* Requested On Column */}
                          <td>
                            <div className="aq-date-cell">
                              <div className="aq-date-main">
                                <FiCalendar size={13} />
                                <span>{fmtDateOnly(r.submittedAt)}</span>
                              </div>
                              <div className="aq-time-sub">{fmtTimeOnly(r.submittedAt)}</div>
                            </div>
                          </td>

                          {/* Actions Column */}
                          <td>
                            <div className="aq-actions-cell">
                              {transitions.length > 0 && (
                                <button
                                  className={`aq-btn-action ${transitions[0].cls}`}
                                  disabled={updating === r.id + transitions[0].status}
                                  onClick={() => handleTransitionClick(r.id, transitions[0].status, transitions[0].needsReason)}
                                >
                                  <span>{transitions[0].label}</span>
                                  <FiArrowRight size={13} />
                                </button>
                              )}

                              {transitions.length > 1 && (
                                <button
                                  className={`aq-btn-action ${transitions[1].cls}`}
                                  disabled={updating === r.id + transitions[1].status}
                                  onClick={() => handleTransitionClick(r.id, transitions[1].status, transitions[1].needsReason)}
                                >
                                  <span>{transitions[1].label}</span>
                                  <FiArrowRight size={13} />
                                </button>
                              )}

                              <button
                                className="aq-btn-inspect"
                                onClick={() => toggleExpand(r.id)}
                              >
                                <FiFileText size={13} />
                                <span>{isExp ? "Close Detail" : "Inspect & Notes"}</span>
                              </button>
                              
                              <button className="aq-btn-more-dots" title="More Options" onClick={() => toggleExpand(r.id)}>
                                <FiMoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Drawer Details */}
                        {isExp && (
                          <tr className="aq-expanded-row">
                            <td colSpan={6}>
                              <div className="aq-detail-drawer">
                                {/* Drawer Header Tabs */}
                                <div className="aq-drawer-tabs">
                                  <button
                                    className={`aq-tab-btn ${activeTab === "OVERVIEW" ? "active" : ""}`}
                                    onClick={() => setActiveDetailTabs(prev => ({ ...prev, [r.id]: "OVERVIEW" }))}
                                  >
                                    Opportunity Overview
                                  </button>
                                  <button
                                    className={`aq-tab-btn ${activeTab === "NOTES" ? "active" : ""}`}
                                    onClick={() => setActiveDetailTabs(prev => ({ ...prev, [r.id]: "NOTES" }))}
                                  >
                                    Internal Audit Notes ({detailedReq.adminNotes?.length || 0})
                                  </button>
                                  <button
                                    className={`aq-tab-btn ${activeTab === "HISTORY" ? "active" : ""}`}
                                    onClick={() => setActiveDetailTabs(prev => ({ ...prev, [r.id]: "HISTORY" }))}
                                  >
                                    Status Audit Log ({detailedReq.statusHistory?.length || 0})
                                  </button>
                                </div>

                                {loadingDetails[r.id] ? (
                                  <div className="aq-drawer-loading">
                                    <FiRefreshCw className="spin" size={20} />
                                    <span>Fetching audit records...</span>
                                  </div>
                                ) : (
                                  <div className="aq-drawer-content">
                                    {/* TAB 1: OVERVIEW */}
                                    {activeTab === "OVERVIEW" && (
                                      <div className="aq-overview-tab">
                                        <div className="aq-overview-grid">
                                          <div className="aq-overview-block">
                                            <span className="aq-meta-label">Connection ID</span>
                                            <span className="aq-meta-val code">{r.id}</span>
                                          </div>
                                          <div className="aq-overview-block">
                                            <span className="aq-meta-label">Target Role</span>
                                            <span className="aq-meta-val" style={{ fontWeight: 700, color: "#0f172a" }}>{r.roleTitle || "Opportunity"}</span>
                                          </div>
                                          <div className="aq-overview-block">
                                            <span className="aq-meta-label">Work Model</span>
                                            <span className="aq-meta-val">{r.workType || "HYBRID"}</span>
                                          </div>
                                          <div className="aq-overview-block">
                                            <span className="aq-meta-label">Company / Job Location</span>
                                            <span className="aq-meta-val">{r.location || r.companyCity || "Not specified"}</span>
                                          </div>
                                          <div className="aq-overview-block">
                                            <span className="aq-meta-label">Salary / Compensation</span>
                                            <span className="aq-meta-val" style={{ color: "#059669", fontWeight: 700 }}>
                                              {r.salaryRange || "Not specified"}
                                            </span>
                                          </div>
                                          <div className="aq-overview-block">
                                            <span className="aq-meta-label">Work Timings / Shift</span>
                                            <span className="aq-meta-val">{r.workTimings || "Standard Business Hours"}</span>
                                          </div>
                                          <div className="aq-overview-block">
                                            <span className="aq-meta-label">Experience Required</span>
                                            <span className="aq-meta-val">{r.experienceRequired || "Not specified"}</span>
                                          </div>
                                          <div className="aq-overview-block">
                                            <span className="aq-meta-label">Positions / Members Needed</span>
                                            <span className="aq-meta-val" style={{ color: "#2563eb", fontWeight: 700 }}>
                                              {r.openingsCount ? `${r.openingsCount} Candidate${Number(r.openingsCount) > 1 ? "s" : ""}` : "1 Candidate"}
                                            </span>
                                          </div>
                                          <div className="aq-overview-block">
                                            <span className="aq-meta-label">Expected Start Date</span>
                                            <span className="aq-meta-val">
                                              {r.expectedStart ? new Date(r.expectedStart).toLocaleDateString() : "Immediate / Flexible"}
                                            </span>
                                          </div>
                                          <div className="aq-overview-block">
                                            <span className="aq-meta-label">Company Contact</span>
                                            <span className="aq-meta-val">{r.companyDisplayName || r.companyName || "N/A"}</span>
                                          </div>
                                          <div className="aq-overview-block">
                                            <span className="aq-meta-label">Candidate Name</span>
                                            <span className="aq-meta-val">{candName}</span>
                                          </div>
                                        </div>

                                        {(r.message || r.opportunitySummary) && (
                                          <div className="aq-message-box">
                                            <span className="aq-meta-label">Opportunity Summary & Covering Note:</span>
                                            <p>{r.opportunitySummary || r.message}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* TAB 2: INTERNAL NOTES */}
                                    {activeTab === "NOTES" && (
                                      <div className="aq-notes-tab">
                                        <div className="aq-note-input-row">
                                          <textarea
                                            rows={2}
                                            placeholder="Add an internal operational note or call outcome for admins..."
                                            value={newNoteTexts[r.id] || ""}
                                            onChange={(e) => setNewNoteTexts({ ...newNoteTexts, [r.id]: e.target.value })}
                                          />
                                          <button
                                            className="aq-btn-add-note"
                                            disabled={!newNoteTexts[r.id]?.trim() || submittingNote[r.id]}
                                            onClick={() => handleAddNote(r.id)}
                                          >
                                            <FiSend size={13} />
                                            <span>{submittingNote[r.id] ? "Saving..." : "Save Note"}</span>
                                          </button>
                                        </div>

                                        <div className="aq-notes-list">
                                          {(!detailedReq.adminNotes || detailedReq.adminNotes.length === 0) ? (
                                            <p className="aq-no-data">No internal notes recorded yet.</p>
                                          ) : (
                                            detailedReq.adminNotes.map((n: any, i: number) => (
                                              <div key={i} className="aq-note-item">
                                                <div className="aq-note-header">
                                                  <strong>{n.adminEmail || "Admin User"}</strong>
                                                  <span>{fmtDateOnly(n.createdAt)}</span>
                                                </div>
                                                <p className="aq-note-text">{n.note}</p>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* TAB 3: STATUS HISTORY */}
                                    {activeTab === "HISTORY" && (
                                      <div className="aq-history-tab">
                                        {(!detailedReq.statusHistory || detailedReq.statusHistory.length === 0) ? (
                                          <p className="aq-no-data">No audit logs recorded for this request.</p>
                                        ) : (
                                          <div className="aq-history-timeline">
                                            {detailedReq.statusHistory.map((item: any, i: number) => {
                                              const hSm = sm(item.toStatus);
                                              return (
                                                <div key={i} className="aq-timeline-item">
                                                  <div className="aq-timeline-badge" style={{ background: hSm.bg, color: hSm.color }}>
                                                    {hSm.label}
                                                  </div>
                                                  <div className="aq-timeline-content">
                                                    <div className="aq-timeline-meta">
                                                      <span>Updated by: {item.changedBy || "System"}</span>
                                                      <span>• {fmtDateOnly(item.timestamp)}</span>
                                                    </div>
                                                    {item.reason && (
                                                      <div className="aq-timeline-reason">
                                                        Reason: <em>{item.reason}</em>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
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
          )}

          {/* 2. GROUP BY CANDIDATE VIEW */}
          {viewMode === "BY_CANDIDATE" && (
            <div className="aq-grouped-cards-container">
              {groupedByCandidate.map((group) => {
                const totalReqs = group.requests.length;
                const initials = getInitials(group.candidateName);
                const avatarStyle = getAvatarStyle(group.candidateName);

                return (
                  <div key={group.candidateId || group.candidateName} className="aq-group-card">
                    <div className="aq-group-header">
                      <div className="aq-group-header-left">
                        <QueueAvatar
                          src={group.requests?.[0]?.candidateAvatarUrl}
                          name={group.candidateName}
                          avatarStyle={avatarStyle}
                          initials={initials}
                          large
                        />
                        <div>
                          <div className="aq-cand-title-row">
                            <h3>{group.candidateName}</h3>
                            {totalReqs > 1 ? (
                              <span className="aq-flame-badge">🔥 {totalReqs} Company Requests</span>
                            ) : (
                              <span className="aq-badge-single">1 Company Request</span>
                            )}
                          </div>
                          {group.candidateHeadline && (
                            <div className="aq-cand-headline">{group.candidateHeadline}</div>
                          )}
                        </div>
                      </div>

                      {group.candidateId && (
                        <button
                          className="aq-btn-outline-sm"
                          onClick={() => navigate(`/candidates/${group.candidateId}`)}
                        >
                          <FiExternalLink size={13} /> View Full Profile
                        </button>
                      )}
                    </div>

                    <div className="aq-subtable-wrap">
                      <table className="aq-subtable">
                        <thead>
                          <tr>
                            <th>Company Name</th>
                            <th>Role Position</th>
                            <th>Status</th>
                            <th>Requested On</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.requests.map((r) => {
                            const rSm = sm(r.status);
                            const transitions = NEXT_TRANSITIONS[r.status] || [];

                            return (
                              <tr key={r.id}>
                                <td>
                                  <div className="aq-name-lockup">
                                    <strong>{r.companyDisplayName || r.companyName}</strong>
                                    {r.companyId && (
                                      <button
                                        className="aq-link-btn"
                                        onClick={() => navigate(`/companies/${r.companyId}`)}
                                      >
                                        <FiExternalLink size={11} /> Details
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <strong>{r.roleTitle || "Opportunity"}</strong>
                                  <div className="aq-role-meta">{r.workType || "HYBRID"}</div>
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
                                <td>{fmtDateOnly(r.submittedAt)}</td>
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
                              🏢 {totalCandReqs} Candidate Request(s)
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

                    <div className="aq-subtable-wrap">
                      <table className="aq-subtable">
                        <thead>
                          <tr>
                            <th>Target Candidate</th>
                            <th>Role Position</th>
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
                                      <span className="aq-flame-badge">🔥 {candCount} Active Requests</span>
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
                                  <div className="aq-role-meta">{r.workType || "HYBRID"}</div>
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
                                <td>{fmtDateOnly(r.submittedAt)}</td>
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
