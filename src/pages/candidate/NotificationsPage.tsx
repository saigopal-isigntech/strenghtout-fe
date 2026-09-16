import React, { useEffect, useState, useCallback } from "react";
import { notificationsApi } from "../../api/notifications";
import type { Notification } from "../../types";
import {
  FiBell, FiCheck, FiCheckCircle, FiLink, FiUser,
  FiRefreshCw, FiInbox, FiAlertCircle,
} from "react-icons/fi";
import "./Notifications.css";

/* ── Type config ── */
type NMeta = { label: string; icon: React.ReactNode; accent: string; bg: string; border: string };

const getTypeMeta = (type: string): NMeta => {
  if (type?.includes("CONNECTION") || type?.includes("STATUS"))
    return { label: "Connection", icon: <FiLink size={15} />, accent: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" };
  if (type?.includes("EVIDENCE"))
    return { label: "Evidence", icon: <FiCheckCircle size={15} />, accent: "#065f46", bg: "#d1fae5", border: "#6ee7b7" };
  if (type?.includes("PROFILE"))
    return { label: "Profile", icon: <FiUser size={15} />, accent: "#4c1d95", bg: "#ede9fe", border: "#c4b5fd" };
  if (type?.includes("ALERT") || type?.includes("WARN"))
    return { label: "Alert", icon: <FiAlertCircle size={15} />, accent: "#92400e", bg: "#fef3c7", border: "#fde68a" };
  return { label: "System", icon: <FiBell size={15} />, accent: "#374151", bg: "#f3f4f6", border: "#d1d5db" };
};

const fmtTime = (iso: string) => {
  const d   = new Date(iso);
  const now = new Date();
  const diffMs  = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)    return `${diffD}d ago`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [marking,  setMarking]  = useState(false);
  const [filter,   setFilter]   = useState<"all" | "unread" | "read">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getAll(0, 100);
      setNotifications(res.data?.data?.content || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAll = async () => {
    setMarking(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
    } finally {
      setMarking(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read")   return  n.isRead;
    return true;
  });

  return (
    <div className="notif-page">

      {/* ── Page Header ── */}
      <div className="notif-page-header">
        <div className="notif-header-left">
          <div className="notif-page-badge">INBOX</div>
          <h1 className="notif-page-title">Notifications</h1>
          <p className="notif-page-sub">
            Stay updated on connection requests, profile reviews, and platform activity.
          </p>
        </div>
        <div className="notif-header-actions">
          <button className="notif-refresh-btn" onClick={load} disabled={loading} title="Refresh">
            <FiRefreshCw size={14} className={loading ? "spin" : ""} />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button className="notif-mark-all-btn" onClick={markAll} disabled={marking}>
              {marking
                ? <span className="spinner-sm" />
                : <><FiCheck size={14} /> Mark all read</>}
            </button>
          )}
        </div>
      </div>

      {/* ── Filter tabs + stats ── */}
      <div className="notif-filter-bar">
        <div className="notif-tabs">
          {(["all", "unread", "read"] as const).map(tab => (
            <button
              key={tab}
              className={`notif-tab${filter === tab ? " active" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {tab === "all"    && `All (${notifications.length})`}
              {tab === "unread" && `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
              {tab === "read"   && "Read"}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <span className="notif-unread-pill">{unreadCount} unread</span>
        )}
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="notif-loading">
          <div className="spinner-lg" />
          <span>Loading notifications…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="notif-empty">
          <FiInbox size={52} className="notif-empty-icon" />
          <h3>
            {filter === "unread" ? "All caught up!" : "No notifications yet"}
          </h3>
          <p>
            {filter === "unread"
              ? "You have no unread notifications. Check back later."
              : "When you receive notifications, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="notif-list">
          {filtered.map((n, idx) => {
            const meta = getTypeMeta(n.type);
            return (
              <div
                key={n.id}
                className={`notif-item${!n.isRead ? " notif-item-unread" : ""}`}
                onClick={() => !n.isRead && markRead(n.id)}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {/* Unread indicator strip */}
                {!n.isRead && <div className="notif-unread-strip" />}

                {/* Icon */}
                <div
                  className="notif-icon-wrap"
                  style={{ color: meta.accent, background: meta.bg, borderColor: meta.border }}
                >
                  {meta.icon}
                </div>

                {/* Content */}
                <div className="notif-content">
                  <div className="notif-top-row">
                    <span
                      className="notif-type-tag"
                      style={{ color: meta.accent, background: meta.bg, borderColor: meta.border }}
                    >
                      {meta.label}
                    </span>
                    <span className="notif-time">{fmtTime(n.createdAt)}</span>
                  </div>
                  <p className="notif-title">{n.title}</p>
                  <p className="notif-body">{n.body}</p>
                </div>

                {/* Mark-read button */}
                {!n.isRead && (
                  <button
                    className="notif-mark-btn"
                    title="Mark as read"
                    onClick={e => { e.stopPropagation(); markRead(n.id); }}
                    aria-label="Mark as read"
                  >
                    <FiCheck size={13} />
                  </button>
                )}

                {/* Read checkmark */}
                {n.isRead && (
                  <div className="notif-read-check" title="Read">
                    <FiCheckCircle size={15} />
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

export default NotificationsPage;
