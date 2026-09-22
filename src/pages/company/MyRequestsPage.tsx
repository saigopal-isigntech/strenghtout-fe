import React, { useEffect, useState, useCallback, Fragment } from "react";
import { connectionsApi } from "../../api/connections";
import type { ConnectionRequest } from "../../types";
import {
  FiBriefcase, FiMapPin, FiCalendar, FiClock,
  FiChevronDown, FiChevronUp, FiRefreshCw, FiInbox,
} from "react-icons/fi";
import "./MyRequests.css";

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  SUBMITTED:            { label: "Submitted",            color: "#92400e", bg: "#fef3c7", border: "#fde68a" },
  UNDER_REVIEW:         { label: "Under Review",         color: "#1e40af", bg: "#dbeafe", border: "#bfdbfe" },
  COMPANY_CONTACTED:    { label: "Company Contacted",    color: "#065f46", bg: "#d1fae5", border: "#6ee7b7" },
  CANDIDATE_DISCUSSION: { label: "Candidate Discussion", color: "#4c1d95", bg: "#ede9fe", border: "#c4b5fd" },
  SELECTED:             { label: "Selected",             color: "#064e3b", bg: "#a7f3d0", border: "#34d399" },
  NOT_PROCEEDING:       { label: "Not Proceeding",       color: "#991b1b", bg: "#fee2e2", border: "#fca5a5" },
  RETURNED:             { label: "Returned",             color: "#78350f", bg: "#fef3c7", border: "#fde68a" },
  CLOSED:               { label: "Closed",               color: "#374151", bg: "#f3f4f6", border: "#d1d5db" },
};

const sm = (s: string) => STATUS_META[s] ?? { label: s, color: "#374151", bg: "#f3f4f6", border: "#d1d5db" };

const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return String(iso);
  }
};

const expLabel = (months?: number) => {
  if (!months && months !== 0) return null;
  if (months === 0) return "Entry / Fresher";
  const y = Math.floor(months / 12);
  const m = months % 12;
  return y > 0 ? (m > 0 ? `${y}y ${m}m` : `${y} yr`) : `${m} mo`;
};

const MyRequestsPage: React.FC = () => {
  const [requests, setRequests]     = useState<ConnectionRequest[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(0);
  const [loading, setLoading]       = useState(false);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const PAGE_SIZE = 12;

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res  = await connectionsApi.getMyRequests(p, PAGE_SIZE);
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

  useEffect(() => { load(0); }, [load]);

  const filtered   = statusFilter ? requests.filter(r => r.status === statusFilter) : requests;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const statuses   = Object.keys(STATUS_META);

  return (
    <div className="mr-page">

      {/* ── Page Header ── */}
      <div className="mr-page-header">
        <div>
          <div className="mr-page-badge">MY REQUEST HISTORY</div>
          <h1 className="mr-page-title">My Connection Requests</h1>
          <p className="mr-page-sub">
            Track all candidate outreach requests you have submitted via StrengthOut.
          </p>
        </div>
        <button className="mr-refresh-btn" onClick={() => load(page)} disabled={loading}>
          <FiRefreshCw size={15} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Filter + Count bar ── */}
      <div className="mr-filter-bar">
        <div className="mr-filter-left">
          <span className="mr-filter-label">Filter:</span>
          <div className="mr-chip-row">
            <button
              className={`filter-chip${statusFilter === "" ? " active" : ""}`}
              onClick={() => setStatusFilter("")}
            >
              All
            </button>
            {statuses.map(s => (
              <button
                key={s}
                className={`filter-chip${statusFilter === s ? " active" : ""}`}
                onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
                style={statusFilter === s ? { background: sm(s).bg, color: sm(s).color, borderColor: sm(s).border } : {}}
              >
                {sm(s).label}
              </button>
            ))}
          </div>
        </div>
        <span className="mr-count-badge">{total} request{total !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Content ── */}
      {loading && requests.length === 0 ? (
        <div className="mr-loading">
          <div className="spinner-lg" />
          <span>Loading requests…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mr-empty">
          <FiInbox size={48} className="mr-empty-icon" />
          <h3>No requests found</h3>
          <p>
            {statusFilter
              ? `No requests with status "${sm(statusFilter).label}". Try clearing the filter.`
              : "You haven't submitted any connection requests yet. Go to Discover and click Connect on a candidate."}
          </p>
        </div>
      ) : (
        <div className="mr-table-card">
          <table className="mr-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role</th>
                <th>Status</th>
                <th>Submitted</th>
                <th style={{ width: "36px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, index) => {
                const meta  = sm(r.status);
                const isExp = expanded === r.id;
                const exp   = expLabel(r.candidateExperienceMonths);
                const itemKey = r.id || `req-${index}`;

                return (
                  <Fragment key={itemKey}>
                    <tr
                      className={`mr-row${isExp ? " mr-row-open" : ""}`}
                      onClick={() => setExpanded(isExp ? null : r.id)}
                    >
                      {/* Candidate */}
                      <td>
                        <div className="mr-cand-cell">
                          <div className="mr-cand-avatar">
                            {(r.candidateFullName || "?")[0].toUpperCase()}
                          </div>
                          <div className="mr-cand-info">
                            <div className="mr-cand-name">{r.candidateFullName}</div>
                            {r.candidateHeadline && (
                              <div className="mr-cand-headline">{r.candidateHeadline}</div>
                            )}
                            <div className="mr-cand-meta">
                              {r.candidateLocation && (
                                <span><FiMapPin size={10} /> {r.candidateLocation}</span>
                              )}
                              {exp && <span><FiBriefcase size={10} /> {exp}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Role */}
                      <td>
                        <div className="mr-role-name">{r.roleTitle}</div>
                        <div className="mr-role-chips">
                          <span className={`mr-worktype mr-worktype-${r.workType?.toLowerCase()}`}>
                            {r.workType}
                          </span>
                          {r.location && (
                            <span className="mr-loc-chip">
                              <FiMapPin size={10} /> {r.location}
                            </span>
                          )}
                          {r.expectedStart && (
                            <span className="mr-loc-chip">
                              <FiCalendar size={10} /> {fmtDate(r.expectedStart)}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Status */}
                      <td>
                        <span
                          className="mr-status-badge"
                          style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      {/* Date */}
                      <td className="mr-date-cell">
                        <span><FiClock size={11} /> {fmtDate(r.submittedAt)}</span>
                        {r.closedAt && (
                          <div className="mr-closed-date">Closed {fmtDate(r.closedAt)}</div>
                        )}
                      </td>
                      {/* Expand arrow */}
                      <td className="mr-expand-cell">
                        {isExp ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                      </td>
                    </tr>

                    {isExp && (
                      <tr key={`${itemKey}-detail`} className="mr-detail-row">
                        <td colSpan={5}>
                          <div className="mr-detail-panel">
                            <div className="mr-detail-section">
                              <span className="mr-detail-label">Opportunity Summary</span>
                              <p className="mr-detail-text">{r.opportunitySummary || "—"}</p>
                            </div>
                            {Array.isArray(r.allowedNextStatuses) && r.allowedNextStatuses.length > 0 && (
                              <div className="mr-detail-section">
                                <span className="mr-detail-label">Pending Stages</span>
                                <div className="mr-next-row">
                                  {r.allowedNextStatuses.map(ns => {
                                    const nsMeta = sm(ns);
                                    return (
                                      <span
                                        key={ns}
                                        className="mr-next-chip"
                                        style={{ color: nsMeta.color, background: nsMeta.bg, borderColor: nsMeta.border }}
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

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="mr-pagination">
          <button className="mr-page-btn" disabled={page === 0 || loading} onClick={() => load(page - 1)}>
            ← Previous
          </button>
          <span className="mr-page-info">Page {page + 1} of {totalPages}</span>
          <button className="mr-page-btn" disabled={page >= totalPages - 1 || loading} onClick={() => load(page + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default MyRequestsPage;
