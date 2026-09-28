import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { connectionsApi } from "../../api/connections";
import type { ConnectionRequest } from "../../types";
import {
  FiBriefcase,
  FiMapPin,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiSend,
  FiInbox,
  FiCheckCircle,
  FiInfo,
  FiArrowRight,
  FiActivity,
  FiAward,
} from "react-icons/fi";
import "./CandidateOpportunities.css";

const STATUS_META: Record<
  string,
  { label: string; bg: string; color: string; border: string; step: number; desc: string }
> = {
  SUBMITTED: {
    label: "Submitted",
    bg: "#eff6ff",
    color: "#1d4ed8",
    border: "#bfdbfe",
    step: 1,
    desc: "A company submitted interest in your profile. iSignTech team has received the request.",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    bg: "#fefce8",
    color: "#a16207",
    border: "#fef08a",
    step: 2,
    desc: "iSignTech is validating opportunity suitability and matching your profile evidence.",
  },
  COMPANY_CONTACTED: {
    label: "Company Contacted",
    bg: "#faf5ff",
    color: "#7e22ce",
    border: "#e9d5ff",
    step: 3,
    desc: "iSignTech is actively coordinating opportunity scope with the hiring company.",
  },
  CANDIDATE_DISCUSSION: {
    label: "Candidate Discussion",
    bg: "#ecfdf5",
    color: "#047857",
    border: "#a7f3d0",
    step: 4,
    desc: "Opportunity in direct progress. Your talent coordinator is engaging with you.",
  },
  SELECTED: {
    label: "Selected 🎉",
    bg: "#f0fdf4",
    color: "#15803d",
    border: "#86efac",
    step: 5,
    desc: "Congratulations! The hiring company has selected your profile for this opportunity.",
  },
  NOT_PROCEEDING: {
    label: "Not Proceeding",
    bg: "#fef2f2",
    color: "#b91c1c",
    border: "#fecaca",
    step: 0,
    desc: "This opportunity will not continue further at this time.",
  },
  RETURNED: {
    label: "Returned",
    bg: "#f8fafc",
    color: "#475569",
    border: "#cbd5e1",
    step: 0,
    desc: "Request has been released back into the candidate talent pool.",
  },
  CLOSED: {
    label: "Closed",
    bg: "#f1f5f9",
    color: "#64748b",
    border: "#cbd5e1",
    step: 0,
    desc: "This connection process has concluded.",
  },
};

const STEPS = [
  { step: 1, label: "Submitted" },
  { step: 2, label: "Under Review" },
  { step: 3, label: "Company Contacted" },
  { step: 4, label: "In Discussion" },
  { step: 5, label: "Selected" },
];

const fmtDate = (str?: string) => {
  if (!str) return "-";
  try {
    return new Date(str).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return str;
  }
};

const CandidateOpportunitiesPage: React.FC = () => {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await connectionsApi.getCandidateRequests();
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setRequests(list);
    } catch {
      setError("Unable to load opportunity requests. Please try again.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const sm = (st: string) =>
    STATUS_META[st?.toUpperCase()] || {
      label: st || "Unknown",
      bg: "#f1f5f9",
      color: "#475569",
      border: "#cbd5e1",
      step: 1,
      desc: "Status update in progress.",
    };

  // Stats calculation
  const total = requests.length;
  const activeCount = requests.filter(
    (r) => ["SUBMITTED", "UNDER_REVIEW", "COMPANY_CONTACTED", "CANDIDATE_DISCUSSION"].includes(r.status)
  ).length;
  const inDiscussionCount = requests.filter((r) => r.status === "CANDIDATE_DISCUSSION").length;
  const selectedCount = requests.filter((r) => r.status === "SELECTED").length;

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Status filter
      if (statusFilter === "ACTIVE") {
        if (!["SUBMITTED", "UNDER_REVIEW", "COMPANY_CONTACTED", "CANDIDATE_DISCUSSION"].includes(r.status))
          return false;
      } else if (statusFilter === "DISCUSSION") {
        if (r.status !== "CANDIDATE_DISCUSSION") return false;
      } else if (statusFilter === "SELECTED") {
        if (r.status !== "SELECTED") return false;
      } else if (statusFilter === "CLOSED") {
        if (!["NOT_PROCEEDING", "RETURNED", "CLOSED"].includes(r.status)) return false;
      }

      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const comp = (r.companyDisplayName || r.companyName || "").toLowerCase();
        const role = (r.roleTitle || "").toLowerCase();
        const loc = (r.location || r.companyCity || "").toLowerCase();
        const sum = (r.opportunitySummary || "").toLowerCase();
        if (!comp.includes(q) && !role.includes(q) && !loc.includes(q) && !sum.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  return (
    <div className="candidate-opp-page">
      {/* Page Header */}
      <div className="opp-header">
        <div className="opp-header-left">
          <div className="opp-header-badge">
            <FiActivity size={14} /> Candidate Career Portal
          </div>
          <h1>My Opportunities</h1>
          <p>
            Track company interest, connection requests, and interview discussions in real-time.
          </p>
        </div>
        <button
          type="button"
          className="btn-opp-refresh"
          onClick={loadRequests}
          disabled={loading}
          title="Refresh opportunities"
        >
          <FiRefreshCw size={15} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="opp-metrics-grid">
        <div className="opp-metric-card">
          <div className="metric-icon blue">
            <FiSend size={20} />
          </div>
          <div className="metric-meta">
            <span className="metric-value">{total}</span>
            <span className="metric-label">Total Received</span>
          </div>
        </div>

        <div className="opp-metric-card">
          <div className="metric-icon amber">
            <FiClock size={20} />
          </div>
          <div className="metric-meta">
            <span className="metric-value">{activeCount}</span>
            <span className="metric-label">Active Pipeline</span>
          </div>
        </div>

        <div className="opp-metric-card">
          <div className="metric-icon purple">
            <FiBriefcase size={20} />
          </div>
          <div className="metric-meta">
            <span className="metric-value">{inDiscussionCount}</span>
            <span className="metric-label">In Discussion</span>
          </div>
        </div>

        <div className="opp-metric-card">
          <div className="metric-icon green">
            <FiAward size={20} />
          </div>
          <div className="metric-meta">
            <span className="metric-value">{selectedCount}</span>
            <span className="metric-label">Selected</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="opp-filter-bar">
        <div className="opp-search-wrap">
          <FiSearch className="opp-search-icon" size={16} />
          <input
            type="search"
            placeholder="Search by company, role title, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="opp-search-input"
          />
        </div>

        <div className="opp-chip-row">
          <button
            type="button"
            className={`opp-filter-chip ${statusFilter === "ALL" ? "active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            All ({total})
          </button>
          <button
            type="button"
            className={`opp-filter-chip ${statusFilter === "ACTIVE" ? "active" : ""}`}
            onClick={() => setStatusFilter("ACTIVE")}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            className={`opp-filter-chip ${statusFilter === "DISCUSSION" ? "active" : ""}`}
            onClick={() => setStatusFilter("DISCUSSION")}
          >
            In Discussion ({inDiscussionCount})
          </button>
          <button
            type="button"
            className={`opp-filter-chip ${statusFilter === "SELECTED" ? "active" : ""}`}
            onClick={() => setStatusFilter("SELECTED")}
          >
            Selected ({selectedCount})
          </button>
          <button
            type="button"
            className={`opp-filter-chip ${statusFilter === "CLOSED" ? "active" : ""}`}
            onClick={() => setStatusFilter("CLOSED")}
          >
            Concluded
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="opp-loading-state">
          <div className="spinner-lg" />
          <p>Loading your opportunity requests...</p>
        </div>
      ) : error ? (
        <div className="opp-error-state">
          <p>{error}</p>
          <button type="button" className="btn-opp-retry" onClick={loadRequests}>
            Try Again
          </button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="opp-empty-card">
          <div className="opp-empty-icon-wrap">
            <FiInbox size={44} />
          </div>
          <h3>{searchQuery || statusFilter !== "ALL" ? "No matching opportunities found" : "No connection requests yet"}</h3>
          <p>
            {searchQuery || statusFilter !== "ALL"
              ? "Try adjusting your search query or switching the status filter tab."
              : "When companies discover your verified profile and submit connection requests, they will appear here in real-time."}
          </p>
          {!searchQuery && statusFilter === "ALL" && (
            <Link to="/candidate/profile" className="btn-opp-action">
              <FiBriefcase size={16} /> Enhance Your Profile <FiArrowRight size={16} />
            </Link>
          )}
        </div>
      ) : (
        <div className="opp-list">
          {filteredRequests.map((r) => {
            const meta = sm(r.status);
            const isExp = expandedId === r.id;
            const compName = r.companyDisplayName || r.companyName || "Interested Employer";
            const initial = (compName[0] || "C").toUpperCase();
            const currentStep = meta.step;

            return (
              <div key={r.id} className={`opp-card ${isExp ? "expanded" : ""}`}>
                {/* Main Card Header / Summary */}
                <div
                  className="opp-card-main"
                  onClick={() => setExpandedId(isExp ? null : r.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setExpandedId(isExp ? null : r.id);
                    }
                  }}
                >
                  <div className="opp-comp-avatar">{initial}</div>

                  <div className="opp-card-body">
                    <div className="opp-top-row">
                      <h3 className="opp-role-title">{r.roleTitle || "Software Engineer"}</h3>
                      <span
                        className="opp-status-badge"
                        style={{
                          background: meta.bg,
                          color: meta.color,
                          borderColor: meta.border,
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <div className="opp-comp-row">
                      <strong className="opp-comp-name">{compName}</strong>
                      {r.companyIndustry && <span className="opp-dot">&bull;</span>}
                      {r.companyIndustry && <span className="opp-industry">{r.companyIndustry}</span>}
                    </div>

                    <div className="opp-meta-row">
                      {r.workType && (
                        <span className={`opp-worktype-chip ${r.workType.toLowerCase()}`}>
                          {r.workType}
                        </span>
                      )}
                      {(r.location || r.companyCity) && (
                        <span className="opp-meta-item">
                          <FiMapPin size={12} /> {r.location || r.companyCity}
                        </span>
                      )}
                      {r.submittedAt && (
                        <span className="opp-meta-item">
                          <FiClock size={12} /> Received {fmtDate(r.submittedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="opp-expand-toggle" aria-label="Toggle details">
                    {isExp ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExp && (
                  <div className="opp-card-expanded">
                    {/* Progress Tracker Stepper */}
                    {currentStep > 0 ? (
                      <div className="opp-stepper-container">
                        <span className="opp-stepper-title">Opportunity Milestone Progress</span>
                        <div className="opp-stepper">
                          {STEPS.map((s) => {
                            const isDone = s.step < currentStep;
                            const isCurrent = s.step === currentStep;
                            return (
                              <div
                                key={s.step}
                                className={`opp-step-item ${isDone ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                              >
                                <div className="step-node">
                                  {isDone ? <FiCheckCircle size={14} /> : s.step}
                                </div>
                                <span className="step-label">{s.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="opp-concluded-banner">
                        <FiInfo size={16} />
                        <span>{meta.desc}</span>
                      </div>
                    )}

                    {/* Opportunity Context */}
                    <div className="opp-detail-section">
                      <h4 className="opp-section-heading">Opportunity Context & Scope</h4>
                      <p className="opp-summary-text">
                        {r.opportunitySummary ||
                          "The company has initiated interest in your verified skill profile. Our talent team is reviewing matching requirements."}
                      </p>
                    </div>

                    {/* Information / Next Steps Notice */}
                    <div className="opp-info-callout">
                      <FiInfo size={16} className="callout-icon" />
                      <div className="callout-text">
                        <strong>What happens next?</strong>
                        <p>
                          iSignTech manages hiring communication directly with prospective employers. When an opportunity reaches <em>Candidate Discussion</em>, your designated talent manager will contact you with interview and role scheduling details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CandidateOpportunitiesPage;
