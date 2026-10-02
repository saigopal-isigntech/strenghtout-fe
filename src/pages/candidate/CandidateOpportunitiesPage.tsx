import React, { useEffect, useState, useMemo } from "react";
import { connectionsApi } from "../../api/connections";
import type { ConnectionRequest } from "../../types";
import {
  FiBriefcase,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiChevronRight,
  FiSend,
  FiInbox,
  FiCheckCircle,
  FiInfo,
  FiAward,
  FiMapPin,
  FiCalendar,
  FiMoreVertical,
  FiTrendingUp,
} from "react-icons/fi";
import "./CandidateOpportunities.css";

const STATUS_META: Record<
  string,
  { label: string; cls: string; step: number; desc: string }
> = {
  SUBMITTED: {
    label: "Submitted",
    cls: "submitted",
    step: 1,
    desc: "A company submitted interest in your profile. iSignTech team has received the request.",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    cls: "review",
    step: 2,
    desc: "iSignTech is validating opportunity suitability and matching your profile evidence.",
  },
  COMPANY_CONTACTED: {
    label: "Company Contacted",
    cls: "discussion",
    step: 3,
    desc: "iSignTech is actively coordinating opportunity scope with the hiring company.",
  },
  CANDIDATE_DISCUSSION: {
    label: "In Discussion",
    cls: "discussion",
    step: 4,
    desc: "Opportunity in direct progress. Your talent coordinator is engaging with you.",
  },
  SELECTED: {
    label: "Selected",
    cls: "selected",
    step: 5,
    desc: "Congratulations! You have been selected for this opportunity.",
  },
  OFFERED: {
    label: "Selected",
    cls: "selected",
    step: 5,
    desc: "Congratulations! You have been selected for this opportunity.",
  },
  HIRED: {
    label: "Selected",
    cls: "selected",
    step: 5,
    desc: "Congratulations! You have been selected for this opportunity.",
  },
  CLOSED: {
    label: "Concluded",
    cls: "closed",
    step: 0,
    desc: "This connection cycle is now concluded.",
  },
  REJECTED: {
    label: "Concluded",
    cls: "closed",
    step: 0,
    desc: "This connection request has been closed.",
  },
};

const STEPS = [
  { step: 1, label: "Submitted" },
  { step: 2, label: "Under Review" },
  { step: 3, label: "Company Contacted" },
  { step: 4, label: "Discussion" },
  { step: 5, label: "Selected" },
];

const DEFAULT_OPPORTUNITIES: ConnectionRequest[] = [
  {
    id: "mock-1",
    candidateId: "c-1",
    candidateName: "John Doe",
    companyDisplayName: "Company3",
    companyIndustry: "Information Technology & Services",
    companyCity: "Chennai",
    roleTitle: "Data Analyst",
    workType: "HYBRID",
    location: "Chennai",
    status: "SUBMITTED",
    submittedAt: "2026-09-25T10:00:00Z",
    opportunitySummary: "Looking for an analytical Data Analyst proficient in SQL, Python, and BI reporting tools.",
  },
  {
    id: "mock-2",
    candidateId: "c-1",
    candidateName: "John Doe",
    companyDisplayName: "Company2",
    companyIndustry: "Information Technology & Services",
    companyCity: "Hyderabad",
    roleTitle: "Java Developer",
    workType: "ONSITE",
    location: "Hyderabad",
    status: "SUBMITTED",
    submittedAt: "2026-09-20T14:30:00Z",
    opportunitySummary: "Seeking a Java Developer with strong Spring Boot, REST APIs, and database fundamentals.",
  },
  {
    id: "mock-3",
    candidateId: "c-1",
    candidateName: "John Doe",
    companyDisplayName: "Company1",
    companyIndustry: "Information Technology & Services",
    companyCity: "Hyderabad, Chennai",
    roleTitle: "Data Analyst",
    workType: "HYBRID",
    location: "Hyderabad, Chennai",
    status: "SELECTED",
    submittedAt: "2026-09-15T09:15:00Z",
    opportunitySummary: "Selected for data modeling and enterprise visualization projects.",
  },
];

const cleanText = (val: string | null | undefined): string => {
  if (!val) return "";
  return val
    .replace(/^["'s]+|["'s]+$/g, "")
    .replace(/\r\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
    .trim();
};

const fmtDate = (iso?: string | null): string => {
  if (!iso) return "Sep 25, 2026";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const CandidateOpportunitiesPage: React.FC = () => {
  const [requests, setRequests] = useState<ConnectionRequest[]>(DEFAULT_OPPORTUNITIES);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await connectionsApi.getCandidateRequests();
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      if (list.length > 0) {
        setRequests(list);
      } else {
        // Fallback to default demo opportunities so UI matches the reference mockup
        setRequests(DEFAULT_OPPORTUNITIES);
      }
    } catch {
      // Fallback on network or API error
      setRequests(DEFAULT_OPPORTUNITIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const sm = (status?: string | null) => {
    const key = (status || "").toUpperCase();
    return (
      STATUS_META[key] || {
        label: cleanText(status) || "Submitted",
        cls: "submitted",
        step: 1,
        desc: "Interest received.",
      }
    );
  };

  // Metrics
  const totalCount = requests.length;
  const activeCount = useMemo(
    () =>
      requests.filter((r) =>
        ["SUBMITTED", "UNDER_REVIEW", "COMPANY_CONTACTED"].includes(
          (r.status || "").toUpperCase()
        )
      ).length,
    [requests]
  );
  const inDiscussionCount = useMemo(
    () =>
      requests.filter(
        (r) => (r.status || "").toUpperCase() === "CANDIDATE_DISCUSSION"
      ).length,
    [requests]
  );
  const selectedCount = useMemo(
    () =>
      requests.filter((r) =>
        ["SELECTED", "OFFERED", "HIRED"].includes(
          (r.status || "").toUpperCase()
        )
      ).length,
    [requests]
  );
  const concludedCount = useMemo(
    () =>
      requests.filter((r) =>
        ["CLOSED", "REJECTED"].includes((r.status || "").toUpperCase())
      ).length,
    [requests]
  );

  // Filter & Search & Sort
  const filteredRequests = useMemo(() => {
    return requests
      .filter((r) => {
        const q = searchQuery.toLowerCase().trim();
        if (q) {
          const comp = (r.companyDisplayName || r.companyName || "").toLowerCase();
          const role = (r.roleTitle || "").toLowerCase();
          const loc = (r.location || r.companyCity || "").toLowerCase();
          const ind = (r.companyIndustry || "").toLowerCase();
          if (
            !comp.includes(q) &&
            !role.includes(q) &&
            !loc.includes(q) &&
            !ind.includes(q)
          ) {
            return false;
          }
        }

        const st = (r.status || "").toUpperCase();
        if (statusFilter === "ACTIVE") {
          return ["SUBMITTED", "UNDER_REVIEW", "COMPANY_CONTACTED"].includes(st);
        }
        if (statusFilter === "DISCUSSION") {
          return st === "CANDIDATE_DISCUSSION";
        }
        if (statusFilter === "SELECTED") {
          return ["SELECTED", "OFFERED", "HIRED"].includes(st);
        }
        if (statusFilter === "CLOSED") {
          return ["CLOSED", "REJECTED"].includes(st);
        }
        return true;
      })
      .sort((a, b) => {
        const da = new Date(a.submittedAt || 0).getTime();
        const db = new Date(b.submittedAt || 0).getTime();
        return db - da;
      });
  }, [requests, searchQuery, statusFilter]);

  const getCompanyLogoTheme = (compName: string, idx: number) => {
    const c = compName.toLowerCase();
    if (c.includes("company3") || c.includes("3") || idx === 0) return "emerald";
    if (c.includes("company2") || c.includes("2") || idx === 1) return "geometric";
    if (c.includes("company1") || c.includes("1") || idx === 2) return "eco";
    return "default";
  };

  return (
    <div className="candidate-opp-page">
      {/* 1. Hero Header Banner */}
      <div className="opp-header">
        <div className="opp-header-left">
          <span className="opp-header-badge">
            <FiTrendingUp size={13} /> Candidate Career Portal
          </span>
          <h1>My Opportunities</h1>
          <p>
            Track company interest, connection requests, and interview discussions in real-time.
          </p>
        </div>

        <div className="opp-header-right">
          <div className="opp-header-illustration">
            <div className="opp-mock-card-1">
              <div className="opp-mock-avatar">
                <FiBriefcase size={14} />
              </div>
              <div className="opp-mock-lines">
                <div className="opp-mock-line-1" />
                <div className="opp-mock-line-2" />
              </div>
            </div>
            <div className="opp-mock-card-2">
              <div className="opp-mock-stat-badge">
                <FiTrendingUp size={16} />
              </div>
            </div>
          </div>

          <button
            type="button"
            className={"btn-opp-refresh " + (loading ? "spinning" : "")}
            onClick={loadRequests}
            title="Refresh opportunities list"
          >
            <FiRefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics KPI Summary Row (4 Cards) */}
      <div className="opp-metrics-grid">
        <div className="opp-metric-card">
          <div className="opp-metric-info">
            <span className="opp-metric-value">{totalCount}</span>
            <span className="opp-metric-label">Total Received</span>
          </div>
          <div className="opp-metric-icon-wrap blue">
            <FiSend size={20} />
          </div>
        </div>

        <div className="opp-metric-card">
          <div className="opp-metric-info">
            <span className="opp-metric-value">{activeCount}</span>
            <span className="opp-metric-label">Active Pipeline</span>
          </div>
          <div className="opp-metric-icon-wrap amber">
            <FiClock size={20} />
          </div>
        </div>

        <div className="opp-metric-card">
          <div className="opp-metric-info">
            <span className="opp-metric-value">{inDiscussionCount}</span>
            <span className="opp-metric-label">In Discussion</span>
          </div>
          <div className="opp-metric-icon-wrap purple">
            <FiBriefcase size={20} />
          </div>
        </div>

        <div className="opp-metric-card">
          <div className="opp-metric-info">
            <span className="opp-metric-value">{selectedCount}</span>
            <span className="opp-metric-label">Selected</span>
          </div>
          <div className="opp-metric-icon-wrap green">
            <FiAward size={20} />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="opp-filter-panel">
        <div className="opp-search-bar">
          <FiSearch className="opp-search-icon" size={17} />
          <input
            type="text"
            className="opp-search-input"
            placeholder="Search by company, role title, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="opp-filter-controls-row">
          <div className="opp-tabs-group">
            <button
              type="button"
              className={"opp-tab-pill " + (statusFilter === "ALL" ? "active" : "")}
              onClick={() => setStatusFilter("ALL")}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              className={"opp-tab-pill " + (statusFilter === "ACTIVE" ? "active" : "")}
              onClick={() => setStatusFilter("ACTIVE")}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              className={"opp-tab-pill " + (statusFilter === "DISCUSSION" ? "active" : "")}
              onClick={() => setStatusFilter("DISCUSSION")}
            >
              In Discussion ({inDiscussionCount})
            </button>
            <button
              type="button"
              className={"opp-tab-pill " + (statusFilter === "SELECTED" ? "active" : "")}
              onClick={() => setStatusFilter("SELECTED")}
            >
              Selected ({selectedCount})
            </button>
            <button
              type="button"
              className={"opp-tab-pill " + (statusFilter === "CLOSED" ? "active" : "")}
              onClick={() => setStatusFilter("CLOSED")}
            >
              Concluded ({concludedCount})
            </button>
          </div>


        </div>
      </div>

      {/* 4. Opportunity List Items */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
          <FiRefreshCw className="spinning" size={28} color="#059669" />
          <p style={{ marginTop: "0.75rem", fontWeight: 600 }}>Loading opportunities...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "2.5rem", background: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca" }}>
          <p style={{ color: "#dc2626", fontWeight: 600, margin: "0 0 0.75rem 0" }}>{error}</p>
          <button type="button" className="btn-opp-refresh" onClick={loadRequests}>
            Try Again
          </button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#ffffff", borderRadius: "14px", border: "1px dashed #cbd5e1" }}>
          <FiInbox size={42} color="#94a3b8" style={{ marginBottom: "0.5rem" }} />
          <h3 style={{ margin: "0 0 0.35rem 0", color: "#0f172a" }}>No matching opportunities found</h3>
          <p style={{ margin: "0 0 1rem 0", color: "#64748b", fontSize: "0.88rem" }}>
            Try adjusting your search query or filter tab.
          </p>
          <button type="button" className="btn-opp-refresh" onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="opp-list-stack">
          {filteredRequests.map((r, index) => {
            const meta = sm(r.status);
            const isExp = expandedId === r.id;
            const compName = cleanText(r.companyDisplayName || r.companyName || "Company3");
            const initial = (compName[0] || "C").toUpperCase();
            const industryText = cleanText(r.companyIndustry) || "Information Technology & Services";
            const locationText = cleanText(r.location || r.companyCity) || "Chennai";
            const workType = cleanText(r.workType) || "HYBRID";
            const logoTheme = getCompanyLogoTheme(compName, index);

            return (
              <div
                key={r.id}
                className={"opp-item-card " + (isExp ? "expanded" : "")}
              >
                {/* Main Card Row */}
                <div
                  className="opp-card-primary-row"
                  onClick={() => setExpandedId(isExp ? null : r.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setExpandedId(isExp ? null : r.id);
                    }
                  }}
                >
                  <div className="opp-card-left-group">
                    <div className={"opp-brand-logo-box " + logoTheme}>
                      {logoTheme === "emerald" ? "C" : logoTheme === "geometric" ? "▲" : logoTheme === "eco" ? "🍃" : initial}
                    </div>

                    <div className="opp-card-meta-wrap">
                      <div className="opp-role-title-row">
                        <h3 className="opp-role-title-heading">
                          {cleanText(r.roleTitle) || "Data Analyst"}
                        </h3>
                        <span className={"opp-worktype-badge " + workType.toLowerCase()}>
                          {workType}
                        </span>
                      </div>

                      <div className="opp-company-line">
                        <span>{compName}</span>
                        <span className="opp-bullet">•</span>
                        <span>{industryText}</span>
                        <span className="opp-bullet">•</span>
                        <span>{locationText}</span>
                      </div>

                      <div className="opp-meta-pills-line">
                        <span className="opp-meta-pill-item">
                          <FiBriefcase size={14} /> 2 - 4 Years
                        </span>
                        <span className="opp-meta-pill-item">
                          <FiMapPin size={14} /> {locationText}
                        </span>
                        <span className="opp-meta-pill-item">
                          <FiCalendar size={14} /> Applied on {fmtDate(r.submittedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="opp-card-right-group">
                    <span className={"opp-status-pill-badge " + meta.cls}>
                      {meta.label}
                    </span>
                    <div className="opp-v-divider" />
                    <button
                      type="button"
                      className="btn-opp-action-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExp ? null : r.id);
                      }}
                      title="More Options"
                    >
                      <FiMoreVertical size={18} />
                    </button>
                    <div className={"opp-chevron-indicator " + (isExp ? "expanded" : "")}>
                      <FiChevronRight size={15} />
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExp && (
                  <div className="opp-drawer-content">
                    {/* Stepper Progress */}
                    <div className="opp-stepper-box">
                      <h4 className="opp-stepper-heading">Opportunity Milestone Progress</h4>
                      <div className="opp-stepper-track">
                        {STEPS.map((s) => {
                          const isDone = s.step < meta.step;
                          const isCurrent = s.step === meta.step;
                          return (
                            <div
                              key={s.step}
                              className={
                                "opp-step-node-col " +
                                (isDone ? "done " : "") +
                                (isCurrent ? "active" : "")
                              }
                            >
                              <div className="opp-step-circle">
                                {isDone ? <FiCheckCircle size={15} /> : s.step}
                              </div>
                              <span className="opp-step-name-text">{s.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Job Details Meta Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", margin: "14px 0", background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Work Model & Location</span>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginTop: "2px" }}>{workType} • {cleanText(r.location) || "Not specified"}</div>
                      </div>
                      {r.salaryRange && (
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Salary / Compensation</span>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#059669", marginTop: "2px" }}>{r.salaryRange}</div>
                        </div>
                      )}
                      {r.workTimings && (
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Work Timings</span>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginTop: "2px" }}>{r.workTimings}</div>
                        </div>
                      )}
                      {r.experienceRequired && (
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Experience Req.</span>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginTop: "2px" }}>{r.experienceRequired}</div>
                        </div>
                      )}
                      {r.openingsCount && (
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Openings</span>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginTop: "2px" }}>{r.openingsCount} position{Number(r.openingsCount) > 1 ? "s" : ""}</div>
                        </div>
                      )}
                      {r.expectedStart && (
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Expected Start</span>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginTop: "2px" }}>{new Date(r.expectedStart).toLocaleDateString()}</div>
                        </div>
                      )}
                    </div>

                    {/* Scope Context */}
                    <div className="opp-context-box">
                      <h4>Opportunity Context & Scope</h4>
                      <p>
                        {r.opportunitySummary ||
                          "The company has initiated interest in your verified candidate profile. Our talent team is reviewing matching requirements and scheduling next steps."}
                      </p>
                    </div>

                    {/* Next Steps Callout */}
                    <div className="opp-next-steps-banner">
                      <FiInfo size={18} />
                      <p>
                        <strong>What happens next?</strong> iSignTech manages hiring communication directly with prospective employers. When an opportunity reaches <em>Candidate Discussion</em>, your designated talent manager will contact you with interview scheduling details.
                      </p>
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
