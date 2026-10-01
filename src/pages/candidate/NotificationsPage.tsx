import { AdminHeroBanner } from "../../components/admin/AdminHeroBanner";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { notificationsApi } from "../../api/notifications";
import type { Notification } from "../../types";
import {
  FiCheckCircle,
  FiBell,
  FiLink,
  FiRefreshCw,
  FiInbox,
  FiAlertCircle,
  FiSearch,
  FiArrowRight,
  FiClock,
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
      icon: <FiActivity size={13} />,
      accent: "#2563eb",
      bg: "#eff6ff",
      border: "#bfdbfe",
      accentColor: "#3b82f6",
    };
  }
  if (t.includes("CONNECTION") || t.includes("REQUEST")) {
    return {
      label: "Connection Request",
      category: "connection",
      icon: <FiLink size={13} />,
      accent: "#047857",
      bg: "#ecfdf5",
      border: "#a7f3d0",
      accentColor: "#10b981",
    };
  }
  if (t.includes("EVIDENCE") || t.includes("VERIF")) {
    return {
      label: "Skill Verification",
      category: "evidence",
      icon: <FiCheckCircle size={13} />,
      accent: "#7e22ce",
      bg: "#faf5ff",
      border: "#e9d5ff",
      accentColor: "#a855f7",
    };
  }
  if (t.includes("PROFILE")) {
    return {
      label: "Profile Activity",
      category: "profile",
      icon: <FiLayers size={13} />,
      accent: "#0284c7",
      bg: "#f0f9ff",
      border: "#bae6fd",
      accentColor: "#0ea5e9",
    };
  }
  return {
    label: "System Alert",
    category: "system",
    icon: <FiAlertCircle size={13} />,
    accent: "#d97706",
    bg: "#fffbe6",
    border: "#fef08a",
    accentColor: "#f59e0b",
  };
};

/* Format helper for relative time */
const fmtTime = (str?: string) => {
  if (!str) return "Just now";
  try {
    const d = new Date(str);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return diffMins + "m ago";
    if (diffHours < 24) return diffHours + "h ago";
    if (diffDays < 7) return diffDays + "d ago";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
};

/* Status badge styling */
const getStatusBadgeStyle = (status: string) => {
  const s = status.toUpperCase();
  if (s.includes("UNDER_REVIEW") || s.includes("PENDING")) {
    return { bg: "#fffbeb", color: "#b45309", border: "#fde68a", label: status.replace(/_/g, " ") };
  }
  if (s.includes("APPROVED") || s.includes("ACCEPTED") || s.includes("SUBMITTED")) {
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
    load(true);
  }, [load]);

  /* Parse status helper */
  const extractStatusFromText = (text?: string) => {
    if (!text) return null;
    const match = text.match(/status (?:changed to|is now|was updated to)?\s*([A-Z_]+)/i);
    return match ? match[1] : null;
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
        return { to: "/company/requests", label: "View in Requests" };
      }
      return { to: "/company/discover", label: "Discover Talent" };
    }
    // Candidate
    if (meta.category === "connection" || meta.category === "status") {
      return { to: "/candidate/opportunities", label: "View Opportunities" };
    }
    return { to: "/candidate/profile", label: "View Profile" };
  };

  return (
    <div className="notif-page">
      {/* Page Header */}
      <AdminHeroBanner
        illustrationType="notifications"
        badgeText="ACTIVITY & NOTIFICATIONS"
        badgeIcon={<FiBell size={14} />}
        title="Notifications"
        subtitle="Stay updated with real-time connection status changes, profile reviews, and platform activity."
        actionButton={
          <button className="notif-btn-refresh-banner" onClick={() => load(true)} disabled={loading}>
            <FiRefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Filter Tabs & Search Bar */}
      <div className="notif-controls-row">
        <div className="notif-filter-tabs">
          <button
            className={"notif-tab-item " + (filter === "all" ? "active" : "")}
            onClick={() => setFilter("all")}
          >
            All <span className="tab-pill-count">{counts.all}</span>
          </button>
          <button
            className={"notif-tab-item " + (filter === "connection" ? "active" : "")}
            onClick={() => setFilter("connection")}
          >
            Connections <span className="tab-pill-count">{counts.connection}</span>
          </button>
          <button
            className={"notif-tab-item " + (filter === "status" ? "active" : "")}
            onClick={() => setFilter("status")}
          >
            Status Updates <span className="tab-pill-count">{counts.status}</span>
          </button>
          <button
            className={"notif-tab-item " + (filter === "system" ? "active" : "")}
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
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Streamlined Notifications List */}
      {loading ? (
        <div className="notif-loading-state">
          <div className="spinner-lg" />
          <span>Loading activity notifications...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="notif-empty-state">
          <FiInbox size={44} className="notif-empty-icon" />
          <h3>No notifications found</h3>
          <p>
            {searchQuery
              ? "No notifications match \"" + searchQuery + "\". Try a different search term."
              : "You're all caught up! New updates will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className="notif-cards-stack">
          {filtered.map((n) => {
            const meta = getTypeMeta(n.type, n.title);
            const extractedStatus = extractStatusFromText(n.body);
            const action = getActionLink(n);
            const statusStyle = extractedStatus ? getStatusBadgeStyle(extractedStatus) : null;

            return (
              <div key={n.id} className="notif-card-wrapper">
                <div className="notif-card-accent" style={{ backgroundColor: meta.accentColor }} />

                <div className="notif-card-inner">
                  {/* Top Header Row */}
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
                          {statusStyle.label}
                        </span>
                      )}
                    </div>

                    <div className="notif-time-badge">
                      <FiClock size={12} style={{ marginRight: 4 }} />
                      {fmtTime(n.createdAt)}
                    </div>
                  </div>

                  {/* Clean Title & Message Body (No verbose metadata box) */}
                  <div className="notif-content-area">
                    <h3 className="notif-headline">{n.title}</h3>
                    <p className="notif-message">{n.body}</p>
                  </div>

                  {/* Clean Bottom Bar */}
                  <div className="notif-card-bottom">
                    <Link to={action.to} className="notif-link-btn">
                      <span>{action.label}</span>
                      <FiArrowRight size={13} />
                    </Link>

                    <div className="notif-read-tag">
                      <FiCheckCircle size={13} /> Read
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
