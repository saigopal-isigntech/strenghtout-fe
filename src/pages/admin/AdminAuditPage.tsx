import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/admin";
import type { AdminAuditItem } from "../../types";
import { FiRefreshCw, FiShield, FiUser, FiGlobe, FiClock, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "./AdminAudit.css";

const PAGE_SIZE = 10;

const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadLogs = async (p = page) => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs({ page: p, size: PAGE_SIZE });
      setLogs(res.data.data.content || []);
      setTotal(res.data.data.totalElements || 0);
      setTotalPages(res.data.data.totalPages || Math.ceil((res.data.data.totalElements || 0) / PAGE_SIZE));
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(0);
  }, []);

  const renderPagination = () => {
    if (total <= 0 || totalPages <= 1) return null;

    const startItem = page * PAGE_SIZE + 1;
    const endItem = Math.min((page + 1) * PAGE_SIZE, total);

    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(0, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages - 1, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(0, end - maxButtons + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return (
      <div className="admin-pagination-bar">
        <div className="pagination-info">
          Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of <strong>{total}</strong> entries (10 per page)
        </div>
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-btn nav"
            disabled={page === 0}
            onClick={() => loadLogs(page - 1)}
          >
            <FiChevronLeft size={16} /> Previous
          </button>
          {start > 0 && (
            <>
              <button
                type="button"
                className={`pagination-btn num ${page === 0 ? "active" : ""}`}
                onClick={() => loadLogs(0)}
              >
                1
              </button>
              {start > 1 && <span className="pagination-ellipsis">...</span>}
            </>
          )}
          {pages.map(p => (
            <button
              key={p}
              type="button"
              className={`pagination-btn num ${p === page ? "active" : ""}`}
              onClick={() => loadLogs(p)}
            >
              {p + 1}
            </button>
          ))}
          {end < totalPages - 1 && (
            <>
              {end < totalPages - 2 && <span className="pagination-ellipsis">...</span>}
              <button
                type="button"
                className={`pagination-btn num ${page === totalPages - 1 ? "active" : ""}`}
                onClick={() => loadLogs(totalPages - 1)}
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            type="button"
            className="pagination-btn nav"
            disabled={page >= totalPages - 1}
            onClick={() => loadLogs(page + 1)}
          >
            Next <FiChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-audit-page">
      <div className="audit-header">
        <div>
          <h1 className="page-title">Platform Audit & Security Stream</h1>
          <p className="page-sub">Cryptographically ordered immutable event logs ({total} events logged)</p>
        </div>
        <button
          className="btn-refresh"
          onClick={() => loadLogs(page)}
          disabled={loading}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          <FiRefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Stream
        </button>
      </div>

      {loading ? (
        <div className="table-loading"><div className="spinner" /> Loading audit events...</div>
      ) : logs.length === 0 ? (
        <div className="empty-audit">
          <FiShield size={42} style={{ color: "#70c144", marginBottom: "0.5rem" }} />
          <h3>Audit Log Ready</h3>
          <p>Security audit events are captured live upon user authentication and data modifications.</p>
        </div>
      ) : (
        <>
          <div className="audit-timeline">
            {logs.map(log => {
              const isLogin = log.eventType.includes("LOGIN");
              const isStatus = log.eventType.includes("STATUS");
              return (
                <div key={log.id} className="audit-card">
                  <div className="audit-badge-col">
                    <span className={`event-badge ${isLogin ? "login" : isStatus ? "status" : "generic"}`}>
                      {log.eventType}
                    </span>
                  </div>
                  <div className="audit-info-col">
                    <div className="audit-title">
                      Entity: <strong>{log.entityType}</strong> {log.entityId ? `(#${log.entityId.slice(0, 8)})` : ""}
                    </div>
                    {log.metadataJson && <div className="audit-meta">{log.metadataJson}</div>}
                    <div className="audit-footer">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                        <FiUser size={13} /> Actor: {log.actorUserId ? log.actorUserId.slice(0, 8) : "System"}
                      </span>
                      {log.ipAddress && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <FiGlobe size={13} /> IP: {log.ipAddress}
                        </span>
                      )}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                        <FiClock size={13} /> {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default AdminAuditPage;
