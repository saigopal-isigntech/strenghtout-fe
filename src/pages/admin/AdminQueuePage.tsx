import React, { useEffect, useState, useMemo, Fragment } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { connectionsApi } from "../../api/connections";
import type { ConnectionRequest, ConnectionAdminNote, ConnectionStatusHistory } from "../../types";
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
  FiCalendar,
  FiX,
  FiSend,
} from "react-icons/fi";
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

const sm = (s: string) => STATUS_META[s] ?? { label: s || "Unknown", color: "#374151", bg: "#f3f4f6", border: "#d1d5db" };

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

type DetailTab = "OVERVIEW" | "NOTES" | "HISTORY";

const AdminQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = searchParams.get("status") || "";
  const initialQ = searchParams.get("q") || "";

  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState(initialQ);
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

  // Sync statusFilter and searchQuery when searchParams change on navigation
  useEffect(() => {
    const sParam = searchParams.get("status") || "";
    if (sParam !== statusFilter) {
      setStatusFilter(sParam);
    }
    const qParam = searchParams.get("q") || "";
    if (qParam !== searchQuery) {
      setSearchQuery(qParam);
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
    updateUrl(s, searchQuery);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    updateUrl(statusFilter, val);
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
      setToast(err?.response?.data?.message || "Status transition failed.");
      setTimeout(() => setToast(""), 4500);
    } finally {
      setUpdating(null);
    }
  };

  // Add Internal Admin Note (FR-ADM-04)
  const handleAddNote = async (id: string) => {
    const text = (newNoteTexts[id] || "").trim();
    if (!text) return;

    setSubmittingNote(prev => ({ ...prev, [id]: true }));
    try {
      const res = await connectionsApi.addAdminNote(id, text);
      if (res.data?.data) {
        setToast("Internal operational note added successfully.");
        setTimeout(() => setToast(""), 3000);
        setNewNoteTexts(prev => ({ ...prev, [id]: "" }));
        await fetchRequestDetail(id);
      }
    } catch (err: any) {
      setToast(err?.response?.data?.message || "Failed to add internal note.");
      setTimeout(() => setToast(""), 4000);
    } finally {
      setSubmittingNote(prev => ({ ...prev, [id]: false }));
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

      return (
        companyMatch ||
        candidateMatch ||
        headlineMatch ||
        roleMatch ||
        workTypeMatch ||
        locationMatch ||
        summaryMatch ||
        statusLabelMatch
      );
    });
  }, [requests, searchQuery]);

  return (
    <div className="admin-queue-page">
      {/* Toast Notification */}
      {toast && (
        <div className="admin-queue-toast" role="status" aria-live="polite">
          <FiCheckCircle size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="queue-page-header">
        <div>
          <span className="queue-badge">
            <FiFilter size={13} style={{ marginRight: 5, verticalAlign: "middle" }} />
            ADMIN OPERATIONS
          </span>
          <h1 className="queue-title">Connection Request Queue</h1>
          <p className="queue-sub">
            Review, track, and action inbound company-to-candidate connection requests with full audit history and internal notes.
          </p>
        </div>
        <button
          type="button"
          className="queue-refresh-btn"
          onClick={() => {
            load();
            if (expanded) fetchRequestDetail(expanded);
          }}
          disabled={loading}
          title="Refresh Queue"
        >
          <FiRefreshCw size={15} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Unified Search & Status Filter Bar */}
      <div className="queue-search-filter-card">
        {/* Search input row */}
        <div className="queue-search-row">
          <div className="queue-search-box">
            <FiSearch size={16} className="queue-search-icon" />
            <input
              type="text"
              placeholder="Search by company, candidate name, headline, role, location, or status..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="queue-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="queue-search-clear"
                onClick={() => handleSearchChange("")}
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>
          <div className="queue-count-badge">
            <strong>{filteredRequests.length}</strong>
            <span>{filteredRequests.length === 1 ? " request" : " requests"}</span>
            {searchQuery && requests.length !== filteredRequests.length && (
              <span className="queue-count-total"> (out of {requests.length})</span>
            )}
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="queue-filter-chips-row">
          <div className="queue-filter-label">
            <FiFilter size={13} /> Filter by status:
          </div>
          <div className="queue-chips-wrap">
            <button
              type="button"
              className={`filter-chip ${statusFilter === "" ? "active" : ""}`}
              onClick={() => handleStatusFilterChange("")}
            >
              All
            </button>
            {statuses.map((s) => {
              const count = requests.filter(r => r.status === s).length;
              const meta = sm(s);
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  type="button"
                  className={`filter-chip ${isActive ? "active" : ""}`}
                  onClick={() => handleStatusFilterChange(s)}
                  style={
                    isActive
                      ? { background: meta.color, borderColor: meta.color, color: "#fff" }
                      : undefined
                  }
                >
                  {meta.label}
                  {count > 0 && <span className="chip-count-pill">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="queue-table-card">
        {loading && requests.length === 0 ? (
          <div className="queue-loading">
            <div className="spinner-lg" />
            <p>Loading connection requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="queue-empty">
            <FiInbox size={48} className="queue-empty-icon" />
            <h3>No requests found</h3>
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

                // Use detailed cache if loaded, else fallback to queue row item
                const detailedReq = detailCache[r.id] || r;
                const currentTab = activeDetailTabs[r.id] || "OVERVIEW";
                const notesList: ConnectionAdminNote[] = detailedReq.adminNotes || [];
                const historyList: ConnectionStatusHistory[] = detailedReq.history || [];
                const isDetailLoading = loadingDetails[r.id] || false;

                return (
                  <Fragment key={itemKey}>
                    <tr
                      className={`queue-row${isExp ? " queue-row-open" : ""}`}
                      onClick={() => toggleExpand(r.id)}
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
                                  onClick={() => setTransitionTarget({ id: r.id, toStatus: s })}
                                  disabled={!!updating}
                                  style={{ color: btnMeta.color, background: btnMeta.bg, borderColor: btnMeta.border }}
                                  title={`Move to: ${btnMeta.label}`}
                                >
                                  {updating === r.id + s ? (
                                    <span className="spinner-sm" />
                                  ) : (
                                    btnMeta.label
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail Panel with Tabs */}
                    {isExp && (
                      <tr key={`${itemKey}-detail`} className="queue-detail-row">
                        <td colSpan={6}>
                          <div className="queue-detail-panel">
                            {/* Detail Panel Sub-Nav Tabs */}
                            <div className="detail-panel-tabs">
                              <button
                                type="button"
                                className={`detail-tab-btn ${currentTab === "OVERVIEW" ? "active" : ""}`}
                                onClick={() => setActiveDetailTabs(prev => ({ ...prev, [r.id]: "OVERVIEW" }))}
                              >
                                <FiBriefcase size={14} /> Opportunity Overview
                              </button>
                              <button
                                type="button"
                                className={`detail-tab-btn ${currentTab === "NOTES" ? "active" : ""}`}
                                onClick={() => setActiveDetailTabs(prev => ({ ...prev, [r.id]: "NOTES" }))}
                              >
                                <FiFileText size={14} /> Internal Notes
                                {notesList.length > 0 && <span className="tab-badge-count">{notesList.length}</span>}
                              </button>
                              <button
                                type="button"
                                className={`detail-tab-btn ${currentTab === "HISTORY" ? "active" : ""}`}
                                onClick={() => setActiveDetailTabs(prev => ({ ...prev, [r.id]: "HISTORY" }))}
                              >
                                <FiClock size={14} /> Status History
                                {historyList.length > 0 && <span className="tab-badge-count">{historyList.length}</span>}
                              </button>
                            </div>

                            {/* TAB 1: OVERVIEW */}
                            {currentTab === "OVERVIEW" && (
                              <div className="tab-content-pane fade-in">
                                <div className="queue-detail-section">
                                  <span className="queue-detail-label">Opportunity Summary</span>
                                  <p className="queue-detail-text">
                                    {detailedReq.opportunitySummary || detailedReq.message || "No opportunity summary provided."}
                                  </p>
                                </div>
                                <div className="queue-detail-grid">
                                  <div className="queue-detail-item">
                                    <span className="queue-detail-label"><FiBriefcase size={12} /> Company Details</span>
                                    <span className="detail-item-val">
                                      {detailedReq.companyDisplayName || detailedReq.companyName || "N/A"}
                                      {detailedReq.companyIndustry && ` (${detailedReq.companyIndustry})`}
                                    </span>
                                  </div>
                                  <div className="queue-detail-item">
                                    <span className="queue-detail-label"><FiUser size={12} /> Candidate</span>
                                    <span className="detail-item-val">
                                      {detailedReq.candidateFullName || detailedReq.candidateName || "N/A"}
                                      {detailedReq.candidateExperienceMonths !== undefined && (
                                        ` • ${(detailedReq.candidateExperienceMonths / 12).toFixed(1)} yrs exp`
                                      )}
                                    </span>
                                  </div>
                                  <div className="queue-detail-item">
                                    <span className="queue-detail-label"><FiMapPin size={12} /> Location / Model</span>
                                    <span className="detail-item-val">
                                      {detailedReq.location || detailedReq.candidateLocation || "Flexible"} 
                                      {detailedReq.workType && ` [${detailedReq.workType}]`}
                                    </span>
                                  </div>
                                  <div className="queue-detail-item">
                                    <span className="queue-detail-label"><FiCalendar size={12} /> Expected Start</span>
                                    <span className="detail-item-val">{fmtDate(detailedReq.expectedStart)}</span>
                                  </div>
                                  {detailedReq.closedAt && (
                                    <div className="queue-detail-item">
                                      <span className="queue-detail-label">Closed Date</span>
                                      <span className="detail-item-val">{fmtDate(detailedReq.closedAt)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* TAB 2: INTERNAL ADMIN NOTES (FR-ADM-04) */}
                            {currentTab === "NOTES" && (
                              <div className="tab-content-pane fade-in">
                                {/* New Note Form */}
                                <div className="admin-note-form-box">
                                  <label className="admin-note-form-label">
                                    <FiFileText size={13} /> Add New Operational Note
                                  </label>
                                  <div className="admin-note-input-row">
                                    <textarea
                                      rows={2}
                                      placeholder="Type internal notes (e.g. Discussed with hiring manager, candidate availability verified, scheduled call)..."
                                      value={newNoteTexts[r.id] || ""}
                                      onChange={(e) => setNewNoteTexts(prev => ({ ...prev, [r.id]: e.target.value }))}
                                      className="admin-note-textarea"
                                    />
                                    <button
                                      type="button"
                                      className="btn-add-admin-note"
                                      onClick={() => handleAddNote(r.id)}
                                      disabled={!(newNoteTexts[r.id] || "").trim() || submittingNote[r.id]}
                                    >
                                      {submittingNote[r.id] ? (
                                        <span className="spinner-sm" />
                                      ) : (
                                        <>
                                          <FiSend size={13} /> Save Note
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Notes List */}
                                {isDetailLoading ? (
                                  <div className="notes-loading-state">
                                    <span className="spinner-sm" /> Loading notes...
                                  </div>
                                ) : notesList.length === 0 ? (
                                  <div className="empty-notes-box">
                                    <FiFileText size={28} className="empty-notes-icon" />
                                    <p>No internal notes recorded yet for this connection request.</p>
                                    <span>Add an operational note above to maintain administrative traceability.</span>
                                  </div>
                                ) : (
                                  <div className="admin-notes-list">
                                    {notesList.map((note, nIdx) => (
                                      <div key={note.id || `note-${nIdx}`} className="admin-note-card">
                                        <div className="admin-note-header">
                                          <span className="admin-note-author">
                                            <FiUser size={12} /> {note.createdByEmail || "Admin Operator"}
                                          </span>
                                          <span className="admin-note-time">
                                            <FiClock size={11} /> {fmtDateTime(note.createdAt)}
                                          </span>
                                        </div>
                                        <p className="admin-note-body">{note.note}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* TAB 3: STATUS AUDIT HISTORY TIMELINE (FR-ADM-05) */}
                            {currentTab === "HISTORY" && (
                              <div className="tab-content-pane fade-in">
                                <div className="history-timeline-header">
                                  <span className="history-timeline-title">
                                    <FiClock size={14} /> Immutable Status Transition Audit Trail
                                  </span>
                                  <span className="history-count-badge">
                                    {historyList.length} status events recorded
                                  </span>
                                </div>

                                {isDetailLoading ? (
                                  <div className="notes-loading-state">
                                    <span className="spinner-sm" /> Loading status history...
                                  </div>
                                ) : historyList.length === 0 ? (
                                  <div className="empty-notes-box">
                                    <FiClock size={28} className="empty-notes-icon" />
                                    <p>Initial status: <strong>{sm(r.status).label}</strong></p>
                                    <span>No subsequent transitions recorded yet.</span>
                                  </div>
                                ) : (
                                  <div className="status-timeline-container">
                                    {historyList.map((hist, hIdx) => {
                                      const fromMeta = hist.fromStatus ? sm(hist.fromStatus) : null;
                                      const toMeta = sm(hist.toStatus);

                                      return (
                                        <div key={hist.id || `hist-${hIdx}`} className="timeline-event-item">
                                          <div className="timeline-marker-dot" />
                                          <div className="timeline-event-card">
                                            <div className="timeline-event-header">
                                              <div className="timeline-status-change-pills">
                                                {fromMeta && (
                                                  <>
                                                    <span
                                                      className="timeline-status-pill"
                                                      style={{ color: fromMeta.color, background: fromMeta.bg, borderColor: fromMeta.border }}
                                                    >
                                                      {fromMeta.label}
                                                    </span>
                                                    <FiArrowRight size={13} className="timeline-arrow-icon" />
                                                  </>
                                                )}
                                                <span
                                                  className="timeline-status-pill highlight"
                                                  style={{ color: toMeta.color, background: toMeta.bg, borderColor: toMeta.border }}
                                                >
                                                  {toMeta.label}
                                                </span>
                                              </div>
                                              <span className="timeline-timestamp">
                                                <FiClock size={11} /> {fmtDateTime(hist.changedAt)}
                                              </span>
                                            </div>

                                            <div className="timeline-event-meta">
                                              <span>Changed by: <strong>{hist.changedByEmail || "System"}</strong></span>
                                            </div>

                                            {hist.reason && (
                                              <div className="timeline-reason-box">
                                                <strong>Reason / Note:</strong> {hist.reason}
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

      {/* Quick Status Transition Confirmation Dialog with Reason */}
      {transitionTarget && (
        <div className="queue-modal-overlay" onClick={() => setTransitionTarget(null)}>
          <div className="queue-transition-modal" onClick={(e) => e.stopPropagation()}>
            <div className="transition-modal-header">
              <h3>Confirm Status Transition</h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setTransitionTarget(null)}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="transition-modal-body">
              <p>
                You are about to change the status of this request to:
              </p>
              <div className="transition-target-preview">
                <span
                  className="queue-status-badge"
                  style={{
                    color: sm(transitionTarget.toStatus).color,
                    background: sm(transitionTarget.toStatus).bg,
                    borderColor: sm(transitionTarget.toStatus).border,
                    fontSize: "0.92rem",
                    padding: "0.4rem 0.9rem",
                  }}
                >
                  {sm(transitionTarget.toStatus).label}
                </span>
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label style={{ fontSize: "0.86rem", fontWeight: 600, color: "var(--text-secondary, #475569)", display: "block", marginBottom: "0.35rem" }}>
                  Operational Transition Reason (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Candidate confirmed interview availability, client call completed..."
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  className="queue-modal-input"
                />
              </div>
            </div>

            <div className="transition-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setTransitionTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-confirm"
                onClick={() => executeTransition(transitionTarget.id, transitionTarget.toStatus, transitionReason)}
              >
                Confirm Status Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQueuePage;
