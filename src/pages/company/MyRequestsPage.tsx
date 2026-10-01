import React, { useEffect, useState, useCallback, useMemo, Fragment } from "react";
import { connectionsApi } from "../../api/connections";
import type { ConnectionRequest } from "../../types";
import {
  FiBriefcase,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiRefreshCw,
  FiCheckCircle,
  FiSend,
  FiUsers,
  FiMessageSquare,
  FiRotateCcw,
  FiSearch,
  FiSliders,
  FiGrid,
  FiList,
  FiMoreVertical,
  FiArrowRight,
  FiInbox,
} from "react-icons/fi";
import "./MyRequests.css";

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  SUBMITTED:            { label: "Submitted",            color: "#6b21a8", bg: "#f3e8ff", border: "#e9d5ff", dot: "#9333ea" },
  UNDER_REVIEW:         { label: "Under Review",         color: "#92400e", bg: "#fef3c7", border: "#fde68a", dot: "#d97706" },
  COMPANY_CONTACTED:    { label: "Company Contacted",    color: "#1e40af", bg: "#dbeafe", border: "#bfdbfe", dot: "#2563eb" },
  CANDIDATE_DISCUSSION: { label: "Candidate Discussion", color: "#4c1d95", bg: "#ede9fe", border: "#c4b5fd", dot: "#7c3aed" },
  SELECTED:             { label: "Selected / Hired",     color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", dot: "#10b981" },
  NOT_PROCEEDING:       { label: "Not Proceeding",       color: "#991b1b", bg: "#fee2e2", border: "#fca5a5", dot: "#ef4444" },
  RETURNED:             { label: "Returned",             color: "#991b1b", bg: "#fee2e2", border: "#fca5a5", dot: "#ef4444" },
  CLOSED:               { label: "Closed",               color: "#374151", bg: "#f3f4f6", border: "#d1d5db", dot: "#6b7280" },
};

const sm = (s: string) => STATUS_META[s] ?? { label: s, color: "#374151", bg: "#f3f4f6", border: "#d1d5db", dot: "#6b7280" };

const fmtDateDisplay = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return String(iso);
  }
};

const fmtTimeDisplay = (iso?: string | null) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
  } catch {
    return "";
  }
};

const expLabel = (months?: number) => {
  if (!months && months !== 0) return null;
  if (months === 0) return "Entry / Fresher";
  const y = Math.floor(months / 12);
  const m = months % 12;
  return y > 0 ? (m > 0 ? `${y}y ${m}m` : `${y} yr`) : `${m} mo`;
};

const AVATAR_COLORS = [
  { bg: "#3b82f6", color: "#ffffff" },
  { bg: "#8b5cf6", color: "#ffffff" },
  { bg: "#10b981", color: "#ffffff" },
  { bg: "#ec4899", color: "#ffffff" },
  { bg: "#f59e0b", color: "#ffffff" },
  { bg: "#14b8a6", color: "#ffffff" },
];

const getAvatarStyle = (name?: string) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const STAGES = [
  { key: "SUBMITTED",            label: "Submitted" },
  { key: "UNDER_REVIEW",         label: "Under Review" },
  { key: "COMPANY_CONTACTED",    label: "Company Contacted" },
  { key: "CANDIDATE_DISCUSSION", label: "Candidate Discussion" },
  { key: "SELECTED",             label: "Selected" },
];

const getStageIndex = (status: string) => {
  const map: Record<string, number> = {
    SUBMITTED: 0,
    UNDER_REVIEW: 1,
    COMPANY_CONTACTED: 2,
    CANDIDATE_DISCUSSION: 3,
    SELECTED: 4,
  };
  return map[status] ?? (status === "NOT_PROCEEDING" || status === "RETURNED" || status === "CLOSED" ? 5 : 0);
};

const RequestLifecycleStepper: React.FC<{ status: string }> = ({ status }) => {
  const currentIndex = getStageIndex(status);
  const isTerminalOther = status === "NOT_PROCEEDING" || status === "RETURNED" || status === "CLOSED";

  return (
    <div className="mr-stepper-wrap">
      <div className="mr-stepper-header">
        <span className="mr-stepper-title">Request Progress Lifecycle</span>
        {isTerminalOther && (
          <span className={`mr-terminal-badge mr-terminal-${status.toLowerCase()}`}>
            {sm(status).label}
          </span>
        )}
      </div>

      <div className="mr-stepper">
        {STAGES.map((st, idx) => {
          const isCompleted = idx < currentIndex || status === "SELECTED";
          const isCurrent = idx === currentIndex && !isTerminalOther && status !== "SELECTED";

          return (
            <div
              key={st.key}
              className={`mr-step-node ${isCompleted ? "completed" : isCurrent ? "current" : "upcoming"}`}
            >
              <div className="mr-step-icon">
                {isCompleted ? (
                  <FiCheckCircle size={16} />
                ) : isCurrent ? (
                  <span className="mr-step-pulse" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className="mr-step-label">{st.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MyRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "candidate" | "role">("date");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const PAGE_SIZE = 12;

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await connectionsApi.getMyRequests(p, PAGE_SIZE);
      const data = res.data?.data;
      setRequests(data?.content || []);
      setTotal(data?.totalElements || 0);
      setPage(p);
    } catch {
      setRequests([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  // Compute 6 Top Summary Card Metrics
  const metrics = useMemo(() => {
    const totalCount = requests.length;
    let underReview = 0;
    let companyContacted = 0;
    let inDiscussion = 0;
    let selectedHired = 0;
    let returnedClosed = 0;

    requests.forEach(r => {
      if (r.status === "UNDER_REVIEW") underReview++;
      else if (r.status === "COMPANY_CONTACTED") companyContacted++;
      else if (r.status === "CANDIDATE_DISCUSSION") inDiscussion++;
      else if (r.status === "SELECTED") selectedHired++;
      else if (r.status === "RETURNED" || r.status === "CLOSED" || r.status === "NOT_PROCEEDING") returnedClosed++;
    });

    return { total: totalCount, underReview, companyContacted, inDiscussion, selectedHired, returnedClosed };
  }, [requests]);

  // Compute Filter Tab Counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: requests.length,
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      COMPANY_CONTACTED: 0,
      CANDIDATE_DISCUSSION: 0,
      SELECTED: 0,
      RETURNED: 0,
      CLOSED: 0,
    };

    requests.forEach(r => {
      if (counts[r.status] !== undefined) counts[r.status]++;
      if (r.status === "NOT_PROCEEDING") counts["CLOSED"]++;
    });

    return counts;
  }, [requests]);

  // Filter & Sort Requests
  const filteredRequests = useMemo(() => {
    let list = requests;

    if (statusFilter && statusFilter !== "ALL") {
      list = list.filter(r => r.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        r =>
          (r.candidateFullName || "").toLowerCase().includes(q) ||
          (r.candidateHeadline || "").toLowerCase().includes(q) ||
          (r.roleTitle || "").toLowerCase().includes(q) ||
          (r.location || "").toLowerCase().includes(q) ||
          (r.candidateLocation || "").toLowerCase().includes(q)
      );
    }

    if (sortBy === "candidate") {
      return [...list].sort((a, b) => (a.candidateFullName || "").localeCompare(b.candidateFullName || ""));
    }
    if (sortBy === "role") {
      return [...list].sort((a, b) => (a.roleTitle || "").localeCompare(b.roleTitle || ""));
    }

    return [...list].sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
  }, [requests, statusFilter, searchQuery, sortBy]);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="mr-page-container">
      {/* 1. Hero Header Banner matching reference mockup */}
      <div className="mr-hero-banner">
        <svg
          className="hero-bg-waves"
          viewBox="0 0 1000 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path d="M380,220 C380,120 480,30 1000,45 L1000,220 Z" fill="#a7f3d0" opacity="0.45" />
          <path d="M440,220 C440,140 580,55 1000,75 L1000,220 Z" fill="#6ee7b7" opacity="0.2" />
        </svg>

        <div className="hero-left-col">
          <div className="mr-hero-badge">MY REQUEST HISTORY</div>
          <h1 className="mr-hero-title">My Connection Requests</h1>
          <p className="mr-hero-sub">
            Track all candidate outreach requests you have submitted via StrengthOut.
          </p>
        </div>

        <div className="hero-right-col">
          <button
            type="button"
            className="mr-refresh-btn"
            onClick={() => load(page)}
            disabled={loading}
          >
            <FiRefreshCw size={15} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Summary Cards Row (6 Cards matching reference mockup) */}
      <div className="mr-metrics-grid">
        <div className="metric-card card-blue">
          <div className="metric-icon-box blue">
            <FiSend size={18} />
          </div>
          <div className="metric-info">
            <strong className="metric-val">{metrics.total}</strong>
            <span className="metric-lbl">Total Requests</span>
          </div>
        </div>

        <div className="metric-card card-amber">
          <div className="metric-icon-box amber">
            <FiClock size={18} />
          </div>
          <div className="metric-info">
            <strong className="metric-val">{metrics.underReview}</strong>
            <span className="metric-lbl">Under Review</span>
          </div>
        </div>

        <div className="metric-card card-mint">
          <div className="metric-icon-box mint">
            <FiUsers size={18} />
          </div>
          <div className="metric-info">
            <strong className="metric-val">{metrics.companyContacted}</strong>
            <span className="metric-lbl">Company Contacted</span>
          </div>
        </div>

        <div className="metric-card card-purple">
          <div className="metric-icon-box purple">
            <FiMessageSquare size={18} />
          </div>
          <div className="metric-info">
            <strong className="metric-val">{metrics.inDiscussion}</strong>
            <span className="metric-lbl">In Discussion</span>
          </div>
        </div>

        <div className="metric-card card-green">
          <div className="metric-icon-box green">
            <FiCheckCircle size={18} />
          </div>
          <div className="metric-info">
            <strong className="metric-val">{metrics.selectedHired}</strong>
            <span className="metric-lbl">Selected / Hired</span>
          </div>
        </div>

        <div className="metric-card card-red">
          <div className="metric-icon-box red">
            <FiRotateCcw size={18} />
          </div>
          <div className="metric-info">
            <strong className="metric-val">{metrics.returnedClosed}</strong>
            <span className="metric-lbl">Returned / Closed</span>
          </div>
        </div>
      </div>

      {/* 3. Search Bar & Controls Row */}
      <div className="mr-toolbar-bar">
        <div className="mr-search-box">
          <FiSearch size={18} className="search-icon-left" />
          <input
            type="text"
            className="search-field"
            placeholder="Search by candidate name, role, skills, or location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="clear-search-btn" onClick={() => setSearchQuery("")}>
              ×
            </button>
          )}
        </div>

        <div className="mr-toolbar-right">
          <div className="sort-dropdown-wrapper">
            <FiSliders size={14} className="sort-icon" />
            <span className="sort-label">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="date">Submitted Date</option>
              <option value="candidate">Candidate Name</option>
              <option value="role">Role Title</option>
            </select>
          </div>

          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <FiList size={16} />
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <FiGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Filter Tabs Row (Pills with Counts matching mockup) */}
      <div className="mr-tabs-row">
        <div className="tabs-pill-group">
          <button
            type="button"
            className={`tab-pill ${statusFilter === "ALL" ? "active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            <span>All</span>
            <span className="count-pill">{tabCounts.ALL}</span>
          </button>

          <button
            type="button"
            className={`tab-pill ${statusFilter === "SUBMITTED" ? "active" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "SUBMITTED" ? "ALL" : "SUBMITTED")}
          >
            <span>Submitted</span>
            <span className="count-pill">{tabCounts.SUBMITTED}</span>
          </button>

          <button
            type="button"
            className={`tab-pill ${statusFilter === "UNDER_REVIEW" ? "active" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "UNDER_REVIEW" ? "ALL" : "UNDER_REVIEW")}
          >
            <span>Under Review</span>
            <span className="count-pill">{tabCounts.UNDER_REVIEW}</span>
          </button>

          <button
            type="button"
            className={`tab-pill ${statusFilter === "COMPANY_CONTACTED" ? "active" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "COMPANY_CONTACTED" ? "ALL" : "COMPANY_CONTACTED")}
          >
            <span>Company Contacted</span>
            <span className="count-pill">{tabCounts.COMPANY_CONTACTED}</span>
          </button>

          <button
            type="button"
            className={`tab-pill ${statusFilter === "CANDIDATE_DISCUSSION" ? "active" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "CANDIDATE_DISCUSSION" ? "ALL" : "CANDIDATE_DISCUSSION")}
          >
            <span>Candidate Discussion</span>
            <span className="count-pill">{tabCounts.CANDIDATE_DISCUSSION}</span>
          </button>

          <button
            type="button"
            className={`tab-pill ${statusFilter === "SELECTED" ? "active" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "SELECTED" ? "ALL" : "SELECTED")}
          >
            <span>Selected / Hired</span>
            <span className="count-pill">{tabCounts.SELECTED}</span>
          </button>

          <button
            type="button"
            className={`tab-pill ${statusFilter === "RETURNED" ? "active" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "RETURNED" ? "ALL" : "RETURNED")}
          >
            <span>Returned</span>
            <span className="count-pill">{tabCounts.RETURNED}</span>
          </button>

          <button
            type="button"
            className={`tab-pill ${statusFilter === "CLOSED" ? "active" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "CLOSED" ? "ALL" : "CLOSED")}
          >
            <span>Closed</span>
            <span className="count-pill">{tabCounts.CLOSED}</span>
          </button>
        </div>
      </div>

      {/* 5. Request Content (Table Stream / Loading / Empty) */}
      {loading && requests.length === 0 ? (
        <div className="mr-loading-state">
          <div className="spinner" />
          <span>Loading your candidate connection requests...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="mr-empty-state">
          <FiInbox size={44} className="empty-icon" />
          <h3>No connection requests found</h3>
          <p>No outreach requests match your selected status or search filter.</p>
        </div>
      ) : (
        <div className="mr-table-card-wrapper">
          <table className="mr-custom-table">
            <thead>
              <tr>
                <th>CANDIDATE</th>
                <th>ROLE & OPPORTUNITY</th>
                <th>STATUS</th>
                <th>SUBMITTED ON</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((r, index) => {
                const meta = sm(r.status);
                const isExp = expanded === r.id;
                const itemKey = r.id || `req-${index}`;
                const avatarStyle = getAvatarStyle(r.candidateFullName);
                const exp = expLabel(r.candidateExperienceMonths || (r as any).candidateTotalExperienceMonths);
                const dateStr = fmtDateDisplay(r.submittedAt);
                const timeStr = fmtTimeDisplay(r.submittedAt);

                return (
                  <Fragment key={itemKey}>
                    <tr className={`mr-table-row ${isExp ? "expanded" : ""}`}>
                      {/* CANDIDATE */}
                      <td>
                        <div className="mr-cand-flex">
                          <div
                            className="mr-cand-avatar"
                            style={{ background: avatarStyle.bg, color: avatarStyle.color }}
                          >
                            {(r.candidateFullName || "?")[0].toUpperCase()}
                          </div>
                          <div className="mr-cand-details">
                            <h4 className="cand-name">{r.candidateFullName || "Candidate User"}</h4>
                            {r.candidateHeadline && (
                              <p className="cand-headline">{r.candidateHeadline}</p>
                            )}
                            <div className="cand-meta-line">
                              {r.candidateLocation && (
                                <span className="cand-meta-item">
                                  <FiMapPin size={11} /> {r.candidateLocation}
                                </span>
                              )}
                              {exp && (
                                <span className="cand-meta-item">
                                  <FiBriefcase size={11} /> {exp}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ROLE & OPPORTUNITY */}
                      <td>
                        <div className="mr-role-col">
                          <h4 className="role-title">{r.roleTitle}</h4>
                          <span className={`worktype-tag tag-${(r.workType || "hybrid").toLowerCase()}`}>
                            {r.workType || "HYBRID"}
                          </span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td>
                        <span
                          className="mr-status-pill-badge"
                          style={{
                            color: meta.color,
                            background: meta.bg,
                            borderColor: meta.border,
                          }}
                        >
                          <span className="status-dot" style={{ background: meta.dot }} />
                          <span>{meta.label}</span>
                        </span>
                      </td>

                      {/* SUBMITTED ON */}
                      <td>
                        <div className="mr-datetime-col">
                          <span className="date-item">
                            <FiCalendar size={13} /> {dateStr}
                          </span>
                          {timeStr && (
                            <span className="time-item">
                              <FiClock size={12} /> {timeStr}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div className="mr-actions-cell">
                          <button
                            type="button"
                            className="btn-view-details-action"
                            onClick={() => setExpanded(isExp ? null : r.id!)}
                          >
                            <span>View Details</span>
                            <FiArrowRight size={14} />
                          </button>
                          <button type="button" className="btn-options-action" title="Options">
                            <FiMoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Details Row */}
                    {isExp && (
                      <tr key={`${itemKey}-detail`} className="mr-detail-row">
                        <td colSpan={5}>
                          <div className="mr-detail-panel">
                            <RequestLifecycleStepper status={r.status} />

                            <div className="mr-detail-section">
                              <h5 className="mr-detail-label">Opportunity Summary</h5>
                              <p className="mr-detail-text">{r.opportunitySummary || "—"}</p>
                            </div>

                            {Array.isArray(r.allowedNextStatuses) && r.allowedNextStatuses.length > 0 && (
                              <div className="mr-detail-section">
                                <h5 className="mr-detail-label">Pending Allowed Stages</h5>
                                <div className="mr-next-row">
                                  {r.allowedNextStatuses.map(ns => {
                                    const nsMeta = sm(ns);
                                    return (
                                      <span
                                        key={ns}
                                        className="mr-next-chip"
                                        style={{
                                          color: nsMeta.color,
                                          background: nsMeta.bg,
                                          borderColor: nsMeta.border,
                                        }}
                                      >
                                        {nsMeta.label}
                                      </span>
                                    );
                                  })}
                                </div>
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

      {/* 6. Pagination Bar */}
      {totalPages > 1 && (
        <div className="mr-pagination-bar">
          <button
            type="button"
            className="pagination-nav-btn"
            disabled={page === 0 || loading}
            onClick={() => load(page - 1)}
          >
            Previous
          </button>
          <div className="pagination-page-nums">
            {Array.from({ length: totalPages }, (_, i) => i).map(p => (
              <button
                key={p}
                className={`page-num-btn ${p === page ? "active" : ""}`}
                onClick={() => load(p)}
              >
                {p + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="pagination-nav-btn"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => load(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MyRequestsPage;
