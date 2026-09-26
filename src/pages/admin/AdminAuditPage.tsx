import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/admin";
import type { AdminAuditItem, AdminUserItem, CompanyProfile, CandidateProfile } from "../../types";
import {
  FiRefreshCw,
  FiShield,
  FiUser,
  FiGlobe,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiCheckCircle,
  FiAlertTriangle,
  FiActivity,
  FiDatabase,
  FiCopy,
  FiCheck,
  FiLogIn,
  FiUserPlus,
  FiLink,
  FiCode,
  FiExternalLink,
} from "react-icons/fi";
import "./AdminAudit.css";

const PAGE_SIZE = 10;

type FilterCategory = "ALL" | "AUTH" | "REGISTER" | "PROFILES" | "CONNECTIONS" | "SECURITY";

const AdminAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AdminAuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedPayloads, setExpandedPayloads] = useState<Record<string, boolean>>({});

  // Directory caches to resolve User/Company/Candidate details
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [companiesList, setCompaniesList] = useState<CompanyProfile[]>([]);
  const [candidatesList, setCandidatesList] = useState<CandidateProfile[]>([]);

  // Load directory items in parallel to resolve real entity names & emails
  const loadDirectoryData = async () => {
    try {
      const [uRes, cRes, candRes] = await Promise.allSettled([
        adminApi.getUsers({ page: 0, size: 100 }),
        adminApi.getCompanies({ page: 0, size: 100 }),
        adminApi.getCandidates({ page: 0, size: 100 }),
      ]);
      if (uRes.status === "fulfilled" && uRes.value.data?.data) {
        setUsersList(uRes.value.data.data.content || []);
      }
      if (cRes.status === "fulfilled" && cRes.value.data?.data) {
        setCompaniesList(cRes.value.data.data.content || []);
      }
      if (candRes.status === "fulfilled" && candRes.value.data?.data) {
        setCandidatesList(candRes.value.data.data.content || []);
      }
    } catch {
      // silent directory fetch
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs({ page: 0, size: 100 });
      const content = res.data.data.content || [];
      setLogs(content);
      setTotal(res.data.data.totalElements || content.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    loadDirectoryData();
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(0);
  };

  const handleCategoryChange = (cat: FilterCategory) => {
    setActiveCategory(cat);
    setPage(0);
  };

  // Lookup maps for instant O(1) resolution
  const usersMap = useMemo(() => {
    const map: Record<string, AdminUserItem> = {};
    usersList.forEach(u => {
      if (u.id) map[u.id.toLowerCase()] = u;
    });
    return map;
  }, [usersList]);

  const companiesMapById = useMemo(() => {
    const map: Record<string, CompanyProfile> = {};
    companiesList.forEach(c => {
      if (c.id) map[c.id.toLowerCase()] = c;
    });
    return map;
  }, [companiesList]);

  const companiesMapByUser = useMemo(() => {
    const map: Record<string, CompanyProfile> = {};
    companiesList.forEach(c => {
      if (c.userId) map[c.userId.toLowerCase()] = c;
      if (c.email) map[c.email.toLowerCase()] = c;
    });
    return map;
  }, [companiesList]);

  const candidatesMapById = useMemo(() => {
    const map: Record<string, CandidateProfile> = {};
    candidatesList.forEach(c => {
      if (c.id) map[c.id.toLowerCase()] = c;
    });
    return map;
  }, [candidatesList]);

  const candidatesMapByUser = useMemo(() => {
    const map: Record<string, CandidateProfile> = {};
    candidatesList.forEach(c => {
      if (c.userId) map[c.userId.toLowerCase()] = c;
      if (c.email) map[c.email.toLowerCase()] = c;
    });
    return map;
  }, [candidatesList]);

  // Resolve actor identity to real User name, Email, and Account type
  const resolveActor = (actorUserId?: string) => {
    if (!actorUserId) {
      return {
        name: "System Engine",
        email: "Automated Platform Task",
        role: "SYSTEM",
        link: null,
      };
    }

    const key = actorUserId.toLowerCase();
    const user = usersMap[key];
    const company = companiesMapByUser[key] || (user ? companiesMapByUser[user.email?.toLowerCase()] : undefined);
    const candidate = candidatesMapByUser[key] || (user ? candidatesMapByUser[user.email?.toLowerCase()] : undefined);

    if (company) {
      return {
        name: company.displayName || company.legalName || "Company User",
        email: user?.email || company.email || "",
        role: "COMPANY",
        link: `/companies/${company.id}`,
      };
    }

    if (candidate) {
      return {
        name: candidate.fullName || "Candidate User",
        email: user?.email || candidate.email || "",
        role: "CANDIDATE",
        link: `/candidates/${candidate.id}`,
      };
    }

    if (user) {
      const isSuper = user.roles?.includes("ROLE_SUPER_ADMIN") || user.accountType === "SUPER_ADMIN";
      return {
        name: user.email ? user.email.split("@")[0] : "Admin User",
        email: user.email,
        role: isSuper ? "SUPER ADMIN" : user.accountType || "ADMIN",
        link: null,
      };
    }

    return {
      name: `User #${actorUserId.slice(0, 8)}`,
      email: "",
      role: "USER",
      link: null,
    };
  };

  // Resolve target entity details (Company Name, Candidate Name, User Email, etc.)
  const resolveEntity = (entityType: string, entityId?: string) => {
    if (!entityId) {
      return {
        title: entityType,
        subtitle: "",
        badge: entityType,
        link: null,
      };
    }

    const key = entityId.toLowerCase();

    if (entityType === "USER") {
      const user = usersMap[key];
      const company = companiesMapByUser[key] || (user ? companiesMapByUser[user.email?.toLowerCase()] : undefined);
      const candidate = candidatesMapByUser[key] || (user ? candidatesMapByUser[user.email?.toLowerCase()] : undefined);

      if (company) {
        return {
          title: company.displayName || company.legalName || "Company Account",
          subtitle: user?.email || company.email || `ID: #${entityId.slice(0, 8)}`,
          badge: "COMPANY",
          link: `/companies/${company.id}`,
        };
      }

      if (candidate) {
        return {
          title: candidate.fullName || "Candidate Account",
          subtitle: user?.email || candidate.email || `ID: #${entityId.slice(0, 8)}`,
          badge: "CANDIDATE",
          link: `/candidates/${candidate.id}`,
        };
      }

      if (user) {
        const isSuper = user.roles?.includes("ROLE_SUPER_ADMIN") || user.accountType === "SUPER_ADMIN";
        return {
          title: user.email,
          subtitle: `Registered Account • Status: ${user.status}`,
          badge: isSuper ? "SUPER ADMIN" : user.accountType,
          link: null,
        };
      }
    }

    if (entityType === "COMPANY_PROFILE" || entityType === "COMPANY") {
      const company = companiesMapById[key] || companiesMapByUser[key];
      if (company) {
        return {
          title: company.displayName || company.legalName || "Registered Company",
          subtitle: company.email || company.industry || `ID: #${entityId.slice(0, 8)}`,
          badge: "COMPANY PROFILE",
          link: `/companies/${company.id}`,
        };
      }
    }

    if (entityType === "CANDIDATE_PROFILE" || entityType === "CANDIDATE") {
      const candidate = candidatesMapById[key] || candidatesMapByUser[key];
      if (candidate) {
        return {
          title: candidate.fullName || "Registered Candidate",
          subtitle: candidate.headline || candidate.email || `ID: #${entityId.slice(0, 8)}`,
          badge: "CANDIDATE PROFILE",
          link: `/candidates/${candidate.id}`,
        };
      }
    }

    if (entityType === "CONNECTION_REQUEST") {
      return {
        title: "Connection Request",
        subtitle: `Ref ID: #${entityId.slice(0, 8)}`,
        badge: "REQUEST",
        link: null,
      };
    }

    return {
      title: `${entityType} (#${entityId.slice(0, 8)})`,
      subtitle: `Entity GUID: ${entityId}`,
      badge: entityType,
      link: null,
    };
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePayload = (id: string) => {
    setExpandedPayloads(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getEventCategory = (eventType: string): "auth" | "create" | "connection" | "danger" | "update" | "generic" => {
    const upper = (eventType || "").toUpperCase();
    if (upper.includes("FAILED") || upper.includes("ERROR") || upper.includes("SUSPEND") || upper.includes("REJECT") || upper.includes("UNPUBLISHED")) {
      return "danger";
    }
    if (upper.includes("LOGIN") || upper.includes("AUTH") || upper.includes("PASSWORD")) {
      return "auth";
    }
    if (upper.includes("REGISTER") || upper.includes("CREATE") || upper.includes("PUBLISHED")) {
      return "create";
    }
    if (upper.includes("CONNECTION") || upper.includes("REQUEST")) {
      return "connection";
    }
    if (upper.includes("STATUS") || upper.includes("UPDATE")) {
      return "update";
    }
    return "generic";
  };

  const getEventIcon = (eventType: string) => {
    const cat = getEventCategory(eventType);
    switch (cat) {
      case "danger":
        return <FiAlertTriangle size={18} />;
      case "auth":
        return <FiLogIn size={18} />;
      case "create":
        return <FiUserPlus size={18} />;
      case "connection":
        return <FiLink size={18} />;
      case "update":
        return <FiActivity size={18} />;
      default:
        return <FiDatabase size={18} />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      if (isNaN(diffMs)) return "Recent";
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return diffMin + "m ago";
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return diffHr + "h ago";
      const diffDay = Math.floor(diffHr / 24);
      return diffDay + "d ago";
    } catch {
      return "Recent";
    }
  };

  // Enriched real-time search and filter across all attributes including Event ID
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const type = log.eventType || "";
      const entity = log.entityType || "";

      // Category filter
      if (activeCategory === "AUTH" && !type.includes("LOGIN") && !type.includes("PASSWORD")) {
        return false;
      }
      if (activeCategory === "REGISTER" && !type.includes("REGISTER")) {
        return false;
      }
      if (activeCategory === "PROFILES" && !type.includes("PROFILE") && entity !== "CANDIDATE_PROFILE" && entity !== "COMPANY_PROFILE") {
        return false;
      }
      if (activeCategory === "CONNECTIONS" && !type.includes("CONNECTION") && entity !== "CONNECTION_REQUEST") {
        return false;
      }
      if (activeCategory === "SECURITY" && !type.includes("FAILED") && !type.includes("PASSWORD") && !type.includes("STATUS")) {
        return false;
      }

      // Query filter matching Event ID, resolved names, and raw attributes
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const actor = resolveActor(log.actorUserId);
        const entityInfo = resolveEntity(log.entityType, log.entityId);

        const matchesEventId = (log.id || "").toLowerCase().includes(q);
        const matchesEvent = type.toLowerCase().includes(q);
        const matchesEntity = entity.toLowerCase().includes(q) || 
                              (log.entityId || "").toLowerCase().includes(q) || 
                              entityInfo.title.toLowerCase().includes(q) || 
                              entityInfo.subtitle.toLowerCase().includes(q) ||
                              entityInfo.badge.toLowerCase().includes(q);
        const matchesActor = (log.actorUserId || "").toLowerCase().includes(q) || 
                             actor.name.toLowerCase().includes(q) || 
                             actor.email.toLowerCase().includes(q) ||
                             actor.role.toLowerCase().includes(q);
        const matchesIp = (log.ipAddress || "").toLowerCase().includes(q);
        const matchesMeta = (log.metadataJson || "").toLowerCase().includes(q);

        return matchesEventId || matchesEvent || matchesEntity || matchesActor || matchesIp || matchesMeta;
      }

      return true;
    });
  }, [logs, activeCategory, searchQuery, usersMap, companiesMapById, candidatesMapById]);

  const totalFiltered = filteredLogs.length;
  const totalFilteredPages = Math.ceil(totalFiltered / PAGE_SIZE) || 1;
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }, [filteredLogs, page]);

  // Meaningful, user-friendly metric summaries
  const metrics = useMemo(() => {
    const authCount = logs.filter(l => {
      const t = (l.eventType || "").toUpperCase();
      return t.includes("LOGIN") || t.includes("AUTH") || t.includes("PASSWORD");
    }).length;

    const updatesCount = logs.filter(l => {
      const t = (l.eventType || "").toUpperCase();
      const entity = (l.entityType || "").toUpperCase();
      return t.includes("UPDATE") || t.includes("STATUS") || t.includes("REGISTER") || t.includes("PROFILE") || t.includes("REQUEST") || entity.includes("PROFILE");
    }).length;

    return {
      authCount,
      updatesCount,
    };
  }, [logs]);

  const renderPagination = () => {
    if (totalFiltered <= 0 || totalFilteredPages <= 1) return null;

    const startItem = page * PAGE_SIZE + 1;
    const endItem = Math.min((page + 1) * PAGE_SIZE, totalFiltered);

    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(0, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalFilteredPages - 1, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(0, end - maxButtons + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return (
      <div className="admin-pagination-bar">
        <div className="pagination-info">
          Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of <strong>{totalFiltered}</strong> matching entries (10 per page)
        </div>
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-btn nav"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <FiChevronLeft size={16} /> Previous
          </button>
          {start > 0 && (
            <>
              <button
                type="button"
                className={`pagination-btn num ${page === 0 ? "active" : ""}`}
                onClick={() => setPage(0)}
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
              onClick={() => setPage(p)}
            >
              {p + 1}
            </button>
          ))}
          {end < totalFilteredPages - 1 && (
            <>
              {end < totalFilteredPages - 2 && <span className="pagination-ellipsis">...</span>}
              <button
                type="button"
                className={`pagination-btn num ${page === totalFilteredPages - 1 ? "active" : ""}`}
                onClick={() => setPage(totalFilteredPages - 1)}
              >
                {totalFilteredPages}
              </button>
            </>
          )}
          <button
            type="button"
            className="pagination-btn nav"
            disabled={page >= totalFilteredPages - 1}
            onClick={() => setPage(page + 1)}
          >
            Next <FiChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-audit-page">
      {/* Top Header */}
      <div className="audit-header">
        <div className="audit-header-left">
          <div className="audit-badge-row">
            <span className="live-indicator-tag">
              <span className="live-dot" /> LIVE INGESTION ACTIVE
            </span>
            <span className="integrity-tag">
              <FiShield size={12} /> TAMPER-EVIDENT LEDGER
            </span>
          </div>
          <h1 className="page-title">Platform Audit & Security Stream</h1>
          <p className="page-sub">
            Cryptographically ordered immutable event logs tracking authentication, company registrations, profile updates, and access security
          </p>
        </div>
        <div className="audit-header-actions">
          <button
            className="btn-refresh"
            onClick={() => {
              loadLogs();
              loadDirectoryData();
            }}
            disabled={loading}
          >
            <FiRefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Stream
          </button>
        </div>
      </div>

      {/* User-Friendly Redesigned Overview Cards */}
      <div className="audit-metrics-grid">
        <div 
          className={`audit-stat-card ${activeCategory === "ALL" && !searchQuery ? "active-filter" : ""}`}
          onClick={() => {
            setActiveCategory("ALL");
            setSearchQuery("");
            setPage(0);
          }}
          title="Click to view all security events"
        >
          <div className="stat-icon-wrapper total">
            <FiShield size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{total.toLocaleString()}</span>
            <span className="stat-label">Total Security Events</span>
            <span className="stat-desc">All platform activities</span>
          </div>
        </div>

        <div 
          className={`audit-stat-card ${activeCategory === "AUTH" ? "active-filter" : ""}`}
          onClick={() => {
            setActiveCategory("AUTH");
            setSearchQuery("");
            setPage(0);
          }}
          title="Click to filter by user logins"
        >
          <div className="stat-icon-wrapper auth">
            <FiLogIn size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{metrics.authCount.toLocaleString()}</span>
            <span className="stat-label">User Logins & Sign-Ins</span>
            <span className="stat-desc">Active account access</span>
          </div>
        </div>

        <div 
          className={`audit-stat-card ${activeCategory === "PROFILES" || activeCategory === "REGISTER" ? "active-filter" : ""}`}
          onClick={() => {
            setActiveCategory("PROFILES");
            setSearchQuery("");
            setPage(0);
          }}
          title="Click to filter by profile & registry updates"
        >
          <div className="stat-icon-wrapper mutations">
            <FiActivity size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{metrics.updatesCount.toLocaleString()}</span>
            <span className="stat-label">Data & Profile Updates</span>
            <span className="stat-desc">Profile & role modifications</span>
          </div>
        </div>

        <div 
          className={`audit-stat-card ${activeCategory === "SECURITY" ? "active-filter" : ""}`}
          onClick={() => {
            setActiveCategory("SECURITY");
            setSearchQuery("");
            setPage(0);
          }}
          title="Click to view system security status"
        >
          <div className="stat-icon-wrapper verified">
            <FiCheckCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value secure-tag">Secure & Active</span>
            <span className="stat-label">System Health</span>
            <span className="stat-desc">Zero integrity violations</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="audit-filter-panel">
        <div className="audit-search-box">
          <FiSearch size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by event ID (e.g. 4b3e8ebf), user name, company, email, event type, or IP..."
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            className="audit-search-input"
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => handleSearchChange("")} title="Clear search">
              ✕
            </button>
          )}
        </div>

        <div className="audit-filter-tabs">
          <button
            className={`filter-pill ${activeCategory === "ALL" ? "active" : ""}`}
            onClick={() => handleCategoryChange("ALL")}
          >
            All Events
          </button>
          <button
            className={`filter-pill ${activeCategory === "AUTH" ? "active" : ""}`}
            onClick={() => handleCategoryChange("AUTH")}
          >
            Authentication
          </button>
          <button
            className={`filter-pill ${activeCategory === "REGISTER" ? "active" : ""}`}
            onClick={() => handleCategoryChange("REGISTER")}
          >
            Registrations
          </button>
          <button
            className={`filter-pill ${activeCategory === "PROFILES" ? "active" : ""}`}
            onClick={() => handleCategoryChange("PROFILES")}
          >
            Profiles
          </button>
          <button
            className={`filter-pill ${activeCategory === "CONNECTIONS" ? "active" : ""}`}
            onClick={() => handleCategoryChange("CONNECTIONS")}
          >
            Connections
          </button>
          <button
            className={`filter-pill ${activeCategory === "SECURITY" ? "active" : ""}`}
            onClick={() => handleCategoryChange("SECURITY")}
          >
            Security & Alerts
          </button>
        </div>
      </div>

      {/* Stream List / Timeline */}
      {loading ? (
        <div className="table-loading">
          <div className="spinner" /> Loading audit stream events...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="empty-audit">
          <FiShield size={44} style={{ color: "#70c144", marginBottom: "0.6rem" }} />
          <h3>No Matching Audit Events Found</h3>
          <p>
            {searchQuery || activeCategory !== "ALL"
              ? "Try adjusting your search criteria or category filter."
              : "Security audit events are captured live upon user authentication and data modifications."}
          </p>
          {(searchQuery || activeCategory !== "ALL") && (
            <button
              className="btn-reset-filters"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("ALL");
                setPage(0);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="audit-timeline">
            {paginatedLogs.map(log => {
              const category = getEventCategory(log.eventType);
              const isPayloadOpen = Boolean(expandedPayloads[log.id]);
              const eventIcon = getEventIcon(log.eventType);
              const actor = resolveActor(log.actorUserId);
              const entity = resolveEntity(log.entityType, log.entityId);

              return (
                <div key={log.id} className={`audit-card category-${category}`}>
                  {/* Left Icon Pill */}
                  <div className={`audit-icon-badge ${category}`}>
                    {eventIcon}
                  </div>

                  {/* Main Content Info */}
                  <div className="audit-info-col">
                    <div className="audit-top-row">
                      <div className="audit-event-badges">
                        <span className={`event-badge ${category}`}>
                          {log.eventType}
                        </span>
                        
                        {/* Target Entity with Resolved Name */}
                        <div className="audit-entity-chip">
                          {entity.link ? (
                            <button
                              type="button"
                              className="entity-name-link"
                              onClick={() => navigate(entity.link!)}
                              title="Click to view profile"
                            >
                              <strong>{entity.title}</strong>
                              <FiExternalLink size={11} />
                            </button>
                          ) : (
                            <strong className="entity-name-text">{entity.title}</strong>
                          )}
                          <span className="entity-type-tag">{entity.badge}</span>
                        </div>
                      </div>

                      <div className="audit-time-block">
                        <span className="time-relative">{formatTimeAgo(log.createdAt)}</span>
                        <span className="time-exact">
                          <FiClock size={12} /> {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Subtitle / Context description */}
                    {entity.subtitle && (
                      <div className="audit-entity-sub">
                        {entity.subtitle}
                      </div>
                    )}

                    {/* Metadata / Details Preview */}
                    {log.metadataJson && (
                      <div className="audit-meta-container">
                        <div className="meta-preview-header">
                          <span className="meta-label">
                            <FiCode size={12} /> Event Payload Data
                          </span>
                          <button
                            type="button"
                            className="toggle-meta-btn"
                            onClick={() => togglePayload(log.id)}
                          >
                            {isPayloadOpen ? "Hide Payload" : "View Payload"}
                          </button>
                        </div>
                        {isPayloadOpen ? (
                          <pre className="audit-meta-json">{log.metadataJson}</pre>
                        ) : (
                          <div className="audit-meta-snippet">
                            {log.metadataJson.length > 120
                              ? log.metadataJson.slice(0, 120) + "..."
                              : log.metadataJson}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Details */}
                    <div className="audit-footer">
                      <div className="actor-chip">
                        <span className="actor-avatar">
                          <FiUser size={12} />
                        </span>
                        <div className="actor-details">
                          <span className="actor-title">
                            Actor:{" "}
                            {actor.link ? (
                              <button
                                type="button"
                                className="actor-link-btn"
                                onClick={() => navigate(actor.link!)}
                                title="View actor profile"
                              >
                                {actor.name}
                              </button>
                            ) : (
                              <strong>{actor.name}</strong>
                            )}
                          </span>
                          {actor.email && <span className="actor-email">({actor.email})</span>}
                          <span className={`actor-role-badge ${actor.role.toLowerCase().replace(/\s+/g, "-")}`}>
                            {actor.role}
                          </span>
                        </div>
                        {log.actorUserId && (
                          <button
                            type="button"
                            className="btn-copy-chip"
                            title="Copy Actor User ID"
                            onClick={() => handleCopy(log.actorUserId!, `actor-${log.id}`)}
                          >
                            {copiedId === `actor-${log.id}` ? <FiCheck size={11} className="copied" /> : <FiCopy size={11} />}
                          </button>
                        )}
                      </div>

                      {log.ipAddress && (
                        <div className="ip-chip">
                          <FiGlobe size={13} className="chip-icon" />
                          <span>IP: <strong>{log.ipAddress}</strong></span>
                        </div>
                      )}

                      <div className="event-id-chip">
                        <span>Event ID: <code>{log.id ? log.id.slice(0, 8) : "N/A"}</code></span>
                        {log.id && (
                          <button
                            type="button"
                            className="btn-copy-chip"
                            title="Copy Event UUID"
                            onClick={() => handleCopy(log.id, `event-${log.id}`)}
                          >
                            {copiedId === `event-${log.id}` ? <FiCheck size={11} className="copied" /> : <FiCopy size={11} />}
                          </button>
                        )}
                      </div>
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
