import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { notificationsApi } from "../../api/notifications";
import type { Notification } from "../../types";
import {
  FiCheck,
  FiCheckCircle,
  FiLink,
  FiUser,
  FiRefreshCw,
  FiInbox,
  FiAlertCircle,
  FiSearch,
  FiArrowRight,
  FiCopy,
  FiClock,
  FiTag,
  FiActivity,
  FiLayers,
} from "react-icons/fi";
import "./Notifications.css";

/* Notification Category Config */
type NMeta = {
  label: string;
  category: "connection" | "status" | "evidence" | "profile" | "system";
  icon: React.ReactNode;
  accent: string;
  bg: string;
  border: string;
  accentColor: string;
};

const getTypeMeta = (type: string, title = ""): NMeta => {
  const t = (type + " " + title).toUpperCase();
  if (t.includes("STATUS")) {
    return {
      label: "Status Update",
      category: "status",
      icon: <FiActivity size={14} />,
      accent: "#1d4ed8",
      bg: "#eff6ff",
      border: "#bfdbfe",
      accentColor: "#3b82f6",
    };
  }
  if (t.includes("CONNECTION") || t.includes("REQUEST")) {
    return {
      label: "Connection Request",
      category: "connection",
      icon: <FiLink size={14} />,
      accent: "#15803d",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      accentColor: "#16a34a",
    };
  }
  if (t.includes("EVIDENCE")) {
    return {
      label: "Evidence",
      category: "evidence",
      icon: <FiCheckCircle size={14} />,
      accent: "#0f766e",
      bg: "#f0fdfa",
      border: "#99f6e4",
      accentColor: "#14b8a6",
    };
  }
  if (t.includes("PROFILE")) {
    return {
      label: "Profile",
      category: "profile",
      icon: <FiUser size={14} />,
      accent: "#6d28d9",
      bg: "#f5f3ff",
      border: "#ddd6fe",
      accentColor: "#8b5cf6",
    };
  }
  if (t.includes("ALERT") || t.includes("WARN") || t.includes("SECURITY")) {
    return {
      label: "System Alert",
      category: "system",
      icon: <FiAlertCircle size={14} />,
      accent: "#b45309",
      bg: "#fffbeb",
      border: "#fde68a",
      accentColor: "#f59e0b",
    };
  }
  return {
    label: "Notification",
    category: "system",
    icon: <FiLayers size={14} />,
    accent: "#334155",
    bg: "#f8fafc",
    border: "#e2e8f0",
    accentColor: "#64748b",
  };
};

/* Format relative time */
const fmtTime = (iso: string) => {
  if (!iso) return "Just now";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

/* Format full readable timestamp */
const fmtFullDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/* Parse body text for candidate name and status */
const parseNotificationBody = (body: string) => {
  let candidateName = "";
  let extractedStatus = "";

  const candidateMatch = body.match(/candidate\s+([A-Za-z0-9_\s]+?)(?:\s+changed|\s+has|\s+is|\.|$)/i);
  if (candidateMatch && candidateMatch[1]) {
    candidateName = candidateMatch[1].trim();
  }

  const statusMatch =
    body.match(/changed to\s+([A-Z_]+)/i) ||
    body.match(/\b(UNDER_REVIEW|SUBMITTED|APPROVED|ACCEPTED|CLOSED|REJECTED|PENDING|IN_PROGRESS)\b/i);
  if (statusMatch && statusMatch[1]) {
    extractedStatus = statusMatch[1].trim().toUpperCase();
  }

  return { candidateName, extractedStatus };
};

/* Status badge styling */
const getStatusBadgeStyle = (status: string) => {
  const s = status.toUpperCase();
  if (s.includes("UNDER_REVIEW") || s.includes("PENDING")) {
    return { bg: "#fffbeb", color: "#b45309", border: "#fde68a", label: status.replace(/_/g, " ") };
  }
  if (s.includes("APPROVED") || s.includes("ACCEPTED")) {
    return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", label: status.replace(/_/g, " ") };
  }
  if (s.includes("REJECTED") || s.includes("DECLINED")) {
    return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", label: status.replace(/_/g, " ") };
  }
  if (s.includes("CLOSED")) {
    return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", label: status.replace(/_/g, " ") };
  }
  return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", label: status.replace(/_/g, " ") };
};

const NotificationsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "connection" | "status" | "system">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* Load notifications and automatically mark unread as read on page visit */
  const load = useCallback(async (autoMark = true) => {
    setLoading(true);
    try {
      const res = await notificationsApi.getAll(0, 100);
      const list = res.data?.data?.content || [];
      const hasUnread = list.some(n => !n.isRead);

      if (hasUnread && autoMark) {
        try {
          await notificationsApi.markAllRead();
          window.dispatchEvent(new Event("notificationsRead"));
          setNotifications(list.map(n => ({ ...n, isRead: true })));
        } catch {
          setNotifications(list);
        }
      } else {
        setNotifications(list);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Automatically marks all notifications as read upon visiting the page
    load(true);
  }, [load]);

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* Filter & search handling */
  const filtered = useMemo(() => {
    return notifications.filter(n => {
      const meta = getTypeMeta(n.type, n.title);
      if (filter === "connection" && meta.category !== "connection") return false;
      if (filter === "status" && meta.category !== "status") return false;
      if (filter === "system" && meta.category !== "system" && meta.category !== "profile" && meta.category !== "evidence") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title?.toLowerCase().includes(q);
        const matchesBody = n.body?.toLowerCase().includes(q);
        const matchesType = n.type?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBody && !matchesType) return false;
      }
      return true;
    });
  }, [notifications, filter, searchQuery]);

  /* Category counts */
  const counts = useMemo(() => {
    let connection = 0;
    let status = 0;
    let system = 0;
    notifications.forEach(n => {
      const meta = getTypeMeta(n.type, n.title);
      if (meta.category === "connection") connection++;
      else if (meta.category === "status") status++;
      else system++;
    });
    return { all: notifications.length, connection, status, system };
  }, [notifications]);

  /* Contextual action link */
  const getActionLink = (n: Notification) => {
    const meta = getTypeMeta(n.type, n.title);
    if (isAdmin()) {
      return { to: "/admin/requests", label: "View in Admin Queue" };
    }
    if (user?.role === "ROLE_COMPANY") {
      if (meta.category === "connection" || meta.category === "status") {
        return { to: "/my-requests", label: "View in My Requests" };
      }
      return { to: "/discover", label: "Discover Talent" };
    }
    // Candidate
    if (meta.category === "connection" || meta.category === "status") {
      return { to: "/profile", label: "View Candidate Profile" };
    }
    return { to: "/profile", label: "View Profile" };
  };

  return (
    <div className="notif-page">
      {/* Page Header */}
      <div className="notif-page-header">
        <div className="notif-header-left">
          <div className="notif-badge-pill">
            <span className="notif-dot-pulse" />
            Activity & Notifications
          </div>
          <h1 className="notif-page-title">Notifications</h1>
          <p className="notif-page-sub">
            Stay updated with real-time connection status changes, profile reviews, and platform activity.
          </p>
        </div>
        <div className="notif-header-actions">
          <button className="notif-btn-refresh" onClick={() => load(true)} disabled={loading}>
            <FiRefreshCw size={13} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="notif-controls-row">
        <div className="notif-filter-tabs">
          <button
            className={`notif-tab-item ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All <span className="tab-pill-count">{counts.all}</span>
          </button>
          <button
            className={`notif-tab-item ${filter === "connection" ? "active" : ""}`}
            onClick={() => setFilter("connection")}
          >
            Connections <span className="tab-pill-count">{counts.connection}</span>
          </button>
          <button
            className={`notif-tab-item ${filter === "status" ? "active" : ""}`}
            onClick={() => setFilter("status")}
          >
            Status Updates <span className="tab-pill-count">{counts.status}</span>
          </button>
          <button
            className={`notif-tab-item ${filter === "system" ? "active" : ""}`}
            onClick={() => setFilter("system")}
          >
            System & Alerts <span className="tab-pill-count">{counts.system}</span>
          </button>
        </div>

        <div className="notif-search-container">
          <FiSearch size={14} className="notif-search-icon" />
          <input
            type="search"
            className="notif-search-field"
            placeholder="Search by candidate, status, or keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="notif-search-clear-btn" onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Notifications Cards Stream */}
      {loading ? (
        <div className="notif-loading-state">
          <div className="spinner-lg" />
          <span>Loading activity stream...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="notif-empty-state">
          <FiInbox size={44} className="notif-empty-icon" />
          <h3>No notifications found</h3>
          <p>
            {searchQuery
              ? `No notifications match "${searchQuery}". Try a different search term.`
              : "You're all caught up! New updates will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className="notif-cards-stack">
          {filtered.map((n, idx) => {
            const meta = getTypeMeta(n.type, n.title);
            const { candidateName, extractedStatus } = parseNotificationBody(n.body);
            const action = getActionLink(n);
            const statusStyle = extractedStatus ? getStatusBadgeStyle(extractedStatus) : null;

            return (
              <div
                key={n.id}
                className="notif-card-wrapper"
                style={{ animationDelay: `${idx * 0.02}s` }}
              >
                {/* Left brand accent border */}
                <div className="notif-card-accent" style={{ backgroundColor: meta.accentColor }} />

                <div className="notif-card-inner">
                  {/* Top Bar */}
                  <div className="notif-top-bar">
                    <div className="notif-chips-group">
                      <span
                        className="notif-chip-category"
                        style={{ color: meta.accent, backgroundColor: meta.bg, borderColor: meta.border }}
                      >
                        {meta.icon}
                        {meta.label}
                      </span>

                      {extractedStatus && statusStyle && (
                        <span
                          className="notif-chip-status"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                            borderColor: statusStyle.border,
                          }}
                        >
                          <FiTag size={10} style={{ marginRight: 3 }} />
                          {statusStyle.label}
                        </span>
                      )}
                    </div>

                    <div className="notif-time-badge">
                      <span className="time-relative" title={fmtFullDate(n.createdAt)}>
                        <FiClock size={12} style={{ marginRight: 3 }} />
                        {fmtTime(n.createdAt)}
                      </span>
                      <span className="time-sep">•</span>
                      <span className="time-full">{fmtFullDate(n.createdAt)}</span>
                    </div>
                  </div>

                  {/* Title & Body */}
                  <div className="notif-content-area">
                    <h3 className="notif-headline">{n.title}</h3>
                    <p className="notif-message">{n.body}</p>
                  </div>

                  {/* Metadata Row */}
                  <div className="notif-meta-box">
                    {candidateName && (
                      <div className="meta-item">
                        <span className="meta-item-label">Candidate:</span>
                        <span className="meta-item-value highlight">
                          <FiUser size={12} style={{ marginRight: 3, color: "var(--primary-green, #16a34a)" }} />
                          {candidateName}
                        </span>
                      </div>
                    )}

                    {extractedStatus && (
                      <div className="meta-item">
                        <span className="meta-item-label">Status:</span>
                        <span className="meta-item-value">{extractedStatus}</span>
                      </div>
                    )}

                    <div className="meta-item">
                      <span className="meta-item-label">Event:</span>
                      <span className="meta-item-value">{meta.label}</span>
                    </div>

                    {n.relatedId && (
                      <div className="meta-item">
                        <span className="meta-item-label">Ref:</span>
                        <span className="meta-item-value font-mono">#{n.relatedId.slice(0, 8)}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer Bar */}
                  <div className="notif-card-bottom">
                    <Link to={action.to} className="notif-link-btn">
                      <span>{action.label}</span>
                      <FiArrowRight size={13} />
                    </Link>

                    <div className="notif-actions-right">
                      <button
                        className="notif-btn-copy"
                        title="Copy details"
                        onClick={e => handleCopy(n.id, `${n.title}\n${n.body}\n${fmtFullDate(n.createdAt)}`, e)}
                      >
                        {copiedId === n.id ? (
                          <span style={{ color: "var(--primary-green, #16a34a)", display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <FiCheck size={12} /> Copied
                          </span>
                        ) : (
                          <>
                            <FiCopy size={12} /> Copy
                          </>
                        )}
                      </button>

                      <span className="notif-read-tag">
                        <FiCheckCircle size={13} /> Read
                      </span>
                    </div>
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

export default NotificationsPage;