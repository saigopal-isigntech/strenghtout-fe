import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/admin";
import type { AdminAuditItem } from "../../types";
import "./AdminAudit.css";

const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs({ page: 0, size: 50 });
      setLogs(res.data.data.content || []);
      setTotal(res.data.data.totalElements || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="admin-audit-page">
      <div className="audit-header">
        <div>
          <h1 className="page-title">Platform Audit & Security Stream</h1>
          <p className="page-sub">Cryptographically ordered immutable event logs ({total} events logged)</p>
        </div>
        <button className="btn-refresh" onClick={loadLogs}>↻ Refresh Stream</button>
      </div>

      {loading ? (
        <div className="table-loading"><div className="spinner" /> Loading audit events...</div>
      ) : logs.length === 0 ? (
        <div className="empty-audit">
          <span className="empty-icon">🛡️</span>
          <h3>Audit Log Ready</h3>
          <p>Security audit events are captured live upon user authentication and data modifications.</p>
        </div>
      ) : (
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
                    <span>Actor: {log.actorUserId ? log.actorUserId.slice(0, 8) : "System"}</span>
                    {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminAuditPage;
