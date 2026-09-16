import React, { useEffect, useState } from "react";
import { connectionsApi } from "../../api/connections";
import type { ConnectionRequest } from "../../types";
import { FiRefreshCw, FiInbox, FiFilter } from "react-icons/fi";
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
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const AdminQueuePage: React.FC = () => {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast]       = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const params: Record<string, string | number> = { page: 0, size: 50 };
    if (statusFilter) params.status = statusFilter;
    try {
      const res = await connectionsApi.getAdminQueue(params);
      setRequests(res.data.data.content);
      setTotal(res.data.data.totalElements);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

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

  return (
    <div className="admin-queue-page">
      {toast && <div className="admin-toast">{toast}</div>}

      {/* ── Page Header ── */}
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

      {/* ── Filter Bar ── */}
      <div className="queue-filter-bar">
        <div className="queue-filter-left">
          <FiFilter size={14} style={{ color: "#64748b" }} />
          <span className="queue-filter-label">Filter by status:</span>
          <div className="queue-chip-row">
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
                onClick={() => setStatusFilter(s)}
                style={statusFilter === s ? { background: sm(s).bg, color: sm(s).color, borderColor: sm(s).border } : {}}
              >
                {sm(s).label}
              </button>
            ))}
          </div>
        </div>
        <span className="queue-count-badge">{total} request{total !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Table Card ── */}
      <div className="queue-table-card">
        {loading ? (
          <div className="queue-loading">
            <div className="spinner-lg" />
            <span>Loading requests…</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="queue-empty">
            <FiInbox size={48} className="queue-empty-icon" />
            <h3>No requests found</h3>
            <p>
              {statusFilter
                ? `No requests with status "${sm(statusFilter).label}". Try selecting a different filter.`
                : "No connection requests have been submitted yet."}
            </p>
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
              {requests.map(r => {
                const meta   = sm(r.status);
                const isExp  = expanded === r.id;
                const next   = r.allowedNextStatuses || [];
                return (
                  <>
                    <tr
                      key={r.id}
                      className={`queue-row${isExp ? " queue-row-open" : ""}`}
                      onClick={() => setExpanded(isExp ? null : r.id)}
                    >
                      <td>
                        <div className="queue-company-cell">
                          <div className="queue-company-avatar">
                            {(r.companyDisplayName || "?")[0].toUpperCase()}
                          </div>
                          <span className="queue-company-name">{r.companyDisplayName}</span>
                        </div>
                      </td>
                      <td>
                        <div className="queue-candidate-name">{r.candidateFullName}</div>
                        {r.candidateHeadline && (
                          <div className="queue-candidate-headline">{r.candidateHeadline}</div>
                        )}
                      </td>
                      <td>
                        <span className="queue-role-text">{r.roleTitle}</span>
                        <span className={`queue-worktype-chip queue-worktype-${r.workType?.toLowerCase()}`}>
                          {r.workType}
                        </span>
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
                            <span className="queue-no-action">—</span>
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
                      <tr key={r.id + "-detail"} className="queue-detail-row">
                        <td colSpan={6}>
                          <div className="queue-detail-panel">
                            <div className="queue-detail-section">
                              <span className="queue-detail-label">Opportunity Summary</span>
                              <p className="queue-detail-text">{r.opportunitySummary || "—"}</p>
                            </div>
                            <div className="queue-detail-grid">
                              {r.candidateLocation && (
                                <div className="queue-detail-item">
                                  <span className="queue-detail-label">Location</span>
                                  <span>{r.candidateLocation}</span>
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
                  </>
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
