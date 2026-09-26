import React, { useEffect, useState, useMemo, Fragment } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { connectionsApi } from "../../api/connections";
import type { ConnectionRequest } from "../../types";
import { FiRefreshCw, FiInbox, FiFilter, FiSearch, FiExternalLink } from "react-icons/fi";
import "./AdminQueue.css";

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
const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "N/A";
  }
};

const AdminQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = searchParams.get("status") || "";
  const initialQ = searchParams.get("q") || "";

  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery]   = useState(initialQ);
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast]       = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const updateUrl = (newStatus: string, newSearch: string) => {
    const params: Record<string, string> = {};
    if (newStatus) params.status = newStatus;
    if (newSearch && newSearch.trim()) params.q = newSearch.trim();
    setSearchParams(params, { replace: true });
  };

  const load = async () => {
    setLoading(true);
    const params: Record<string, string | number> = { page: 0, size: 100 };
    if (statusFilter) params.status = statusFilter;
    try {
      const res = await connectionsApi.getAdminQueue(params);
      const list = res.data.data.content || [];
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

  const handleStatusFilterChange = (s: string) => {
    setStatusFilter(s);
    updateUrl(s, searchQuery);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    updateUrl(statusFilter, val);
  };

  const transition = async (id: string, toStatus: string) => {
    setUpdating(id + toStatus);
    try {
      await connectionsApi.updateStatus(id, toStatus);
      setToast("Status updated to " + (sm(toStatus).label));
      setTimeout(() => setToast(""), 3000);
      load();
    } catch (err: any) {
      setToast(err?.response?.data?.message || "Update failed");
      setTimeout(() => setToast(""), 4000);
    } finally {
      setUpdating(null);
    }
  };

  const statuses = Object.keys(STATUS_META);

  // Real-time client search filtering
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase().trim();

    return requests.filter(r => {
      const companyMatch = (r.companyDisplayName || r.companyName || "").toLowerCase().includes(q);
      const candidateMatch = (r.candidateFullName || r.candidateName || "").toLowerCase().includes(q);
      const headlineMatch = (r.candidateHeadline || "").toLowerCase().includes(q);
      const roleMatch = (r.roleTitle || "").toLowerCase().includes(q);
      const workTypeMatch = (r.workType || "").toLowerCase().includes(q);
      const locationMatch = (r.candidateLocation || r.location || "").toLowerCase().includes(q);
      const summaryMatch = (r.opportunitySummary || r.message || "").toLowerCase().includes(q);
      const statusLabelMatch = sm(r.status).label.toLowerCase().includes(q);

      return companyMatch || candidateMatch || headlineMatch || roleMatch || workTypeMatch || locationMatch || summaryMatch || statusLabelMatch;
    });
  }, [requests, searchQuery]);

  return (
    <div className="admin-queue-page">
      {toast && <div className="admin-toast">{toast}</div>}

      {/* Page Header */}
      <div className="queue-page-header">
        <div>
          <div className="queue-page-badge">ADMIN OPERATIONS</div>
          <h1 className="queue-title">Connection Request Queue</h1>
          <p className="queue-sub">Review and action inbound company-to-candidate connection requests</p>
        </div>
        <button className="queue-refresh-btn" onClick={load} disabled={loading} title="Refresh">
          <FiRefreshCw size={15} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Unified Search & Filter Bar matching Admin design system */}
      <div className="queue-search-filter-card">
        <div className="queue-search-row">
          <div className="queue-search-box">
            <FiSearch size={15} className="queue-search-icon" />
            <input
              type="text"
              className="queue-search-input"
              placeholder="Search requests by company, candidate, role, location, or summary..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="queue-clear-search-btn"
                onClick={() => handleSearchChange("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <span className="queue-count-badge">
            {filteredRequests.length} matching request{filteredRequests.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="queue-filter-chips-row">
          <div className="queue-filter-label-group">
            <FiFilter size={13} style={{ color: "#64748b" }} />
            <span className="queue-filter-label">Filter by status:</span>
          </div>
          <div className="queue-chip-row">
            <button
              type="button"
              className={`filter-chip${statusFilter === "" ? " active" : ""}`}
              onClick={() => handleStatusFilterChange("")}
            >
              All
            </button>
            {statuses.map(s => (
              <button
                type="button"
                key={s}
                className={`filter-chip${statusFilter === s ? " active" : ""}`}
                onClick={() => handleStatusFilterChange(s)}
                style={statusFilter === s ? { background: sm(s).bg, color: sm(s).color, borderColor: sm(s).border } : {}}
              >
                {sm(s).label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="queue-table-card">
        {loading ? (
          <div className="queue-loading">
            <div className="spinner-lg" />
            <span>Loading requests...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="queue-empty">
            <FiInbox size={48} className="queue-empty-icon" />
            <h3>No matching requests found</h3>
            <p>
              {searchQuery || statusFilter
                ? "No connection requests match your active search or status filter. Try clearing the filters."
                : "No connection requests have been submitted yet."}
            </p>
            {(searchQuery || statusFilter) && (
              <button
                type="button"
                className="btn-reset-queue-filters"
                onClick={() => {
                  setStatusFilter("");
                  setSearchQuery("");
                  updateUrl("", "");
                }}
              >
                Reset Search & Filters
              </button>
            )}
          </div>
        ) : (
          <table className="queue-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Candidate</th>
                <th>Role</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((r, index) => {
                const meta    = sm(r.status);
                const isExp   = expanded === r.id;
                const next    = r.allowedNextStatuses || [];
                const itemKey = r.id || `queue-${index}`;

                return (
                  <Fragment key={itemKey}>
                    <tr
                      className={`queue-row${isExp ? " queue-row-open" : ""}`}
                      onClick={() => setExpanded(isExp ? null : r.id)}
                    >
                      <td>
                        <div className="queue-company-cell">
                          <div className="queue-company-avatar">
                            {(r.companyDisplayName || r.companyName || "?")[0].toUpperCase()}
                          </div>
                          <div className="queue-company-info">
                            <span 
                              className="queue-company-name-link"
                              onClick={(e) => {
                                if (r.companyId) {
                                  e.stopPropagation();
                                  navigate(`/companies/${r.companyId}`);
                                }
                              }}
                              title={r.companyId ? "Click to view company profile" : ""}
                            >
                              {r.companyDisplayName || r.companyName || "Unknown Company"}
                              {r.companyId && <FiExternalLink size={10} style={{ marginLeft: "4px", verticalAlign: "middle" }} />}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div 
                          className="queue-candidate-name-link"
                          onClick={(e) => {
                            if (r.candidateId) {
                              e.stopPropagation();
                              navigate(`/candidates/${r.candidateId}`);
                            }
                          }}
                          title={r.candidateId ? "Click to view candidate profile" : ""}
                        >
                          {r.candidateFullName || r.candidateName || "Candidate"}
                          {r.candidateId && <FiExternalLink size={10} style={{ marginLeft: "4px", verticalAlign: "middle" }} />}
                        </div>
                        {r.candidateHeadline && (
                          <div className="queue-candidate-headline">{r.candidateHeadline}</div>
                        )}
                      </td>
                      <td>
                        <span className="queue-role-text">{r.roleTitle || "Opportunity"}</span>
                        {r.workType && (
                          <span className={`queue-worktype-chip queue-worktype-${r.workType?.toLowerCase()}`}>
                            {r.workType}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className="queue-status-badge"
                          style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="queue-date-cell">{fmtDate(r.submittedAt)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="queue-action-btns">
                          {next.length === 0 ? (
                            <span className="queue-no-action">-</span>
                          ) : (
                            next.map(s => {
                              const btnMeta = sm(s);
                              return (
                                <button
                                  key={s}
                                  className="queue-action-btn"
                                  onClick={() => transition(r.id, s)}
                                  disabled={!!updating}
                                  style={{ color: btnMeta.color, background: btnMeta.bg, borderColor: btnMeta.border }}
                                  title={`Move to: ${btnMeta.label}`}
                                >
                                  {updating === r.id + s
                                    ? <span className="spinner-sm" />
                                    : btnMeta.label}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExp && (
                      <tr key={`${itemKey}-detail`} className="queue-detail-row">
                        <td colSpan={6}>
                          <div className="queue-detail-panel">
                            <div className="queue-detail-section">
                              <span className="queue-detail-label">Opportunity Summary</span>
                              <p className="queue-detail-text">{r.opportunitySummary || r.message || "-"}</p>
                            </div>
                            <div className="queue-detail-grid">
                              {(r.candidateLocation || r.location) && (
                                <div className="queue-detail-item">
                                  <span className="queue-detail-label">Location</span>
                                  <span>{r.candidateLocation || r.location}</span>
                                </div>
                              )}
                              {r.workType && (
                                <div className="queue-detail-item">
                                  <span className="queue-detail-label">Work Type</span>
                                  <span>{r.workType}</span>
                                </div>
                              )}
                              {r.expectedStart && (
                                <div className="queue-detail-item">
                                  <span className="queue-detail-label">Expected Start</span>
                                  <span>{fmtDate(r.expectedStart)}</span>
                                </div>
                              )}
                              {r.closedAt && (
                                <div className="queue-detail-item">
                                  <span className="queue-detail-label">Closed At</span>
                                  <span>{fmtDate(r.closedAt)}</span>
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
        )}
      </div>
    </div>
  );
};

export default AdminQueuePage;
