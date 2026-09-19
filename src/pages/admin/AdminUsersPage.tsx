import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/admin";
import type { AdminUserItem, CompanyProfile, CandidateProfile, CompanyContact } from "../../types";
import {
  FiRefreshCw,
  FiSearch,
  FiAward,
  FiCheckCircle,
  FiAlertCircle,
  FiMapPin,
  FiMail,
  FiPhone,
  FiExternalLink,
  FiX,
  FiBriefcase,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import "./AdminUsers.css";

type AdminTab = "USERS" | "COMPANIES" | "CANDIDATES";

const PAGE_SIZE = 10;

const AdminUsersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("USERS");

  // Users state
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(0);
  const [userPage, setUserPage] = useState(0);
  const [userLoading, setUserLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Companies state
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [companyTotal, setCompanyTotal] = useState(0);
  const [companyTotalPages, setCompanyTotalPages] = useState(0);
  const [companyPage, setCompanyPage] = useState(0);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);

  // Candidates state
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [candidateTotal, setCandidateTotal] = useState(0);
  const [candidateTotalPages, setCandidateTotalPages] = useState(0);
  const [candidatePage, setCandidatePage] = useState(0);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);

  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // Load User Accounts
  const loadUsers = async (page = userPage) => {
    setUserLoading(true);
    try {
      const res = await adminApi.getUsers({ page, size: PAGE_SIZE });
      setUsers(res.data.data.content || []);
      setUserTotal(res.data.data.totalElements || 0);
      setUserTotalPages(res.data.data.totalPages || Math.ceil((res.data.data.totalElements || 0) / PAGE_SIZE));
      setUserPage(page);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to load platform users");
    } finally {
      setUserLoading(false);
    }
  };

  // Load Registered Companies
  const loadCompanies = async (page = companyPage) => {
    setCompanyLoading(true);
    try {
      const res = await adminApi.getCompanies({ page, size: PAGE_SIZE, search: companySearch });
      setCompanies(res.data.data.content || []);
      setCompanyTotal(res.data.data.totalElements || 0);
      setCompanyTotalPages(res.data.data.totalPages || Math.ceil((res.data.data.totalElements || 0) / PAGE_SIZE));
      setCompanyPage(page);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to load companies");
    } finally {
      setCompanyLoading(false);
    }
  };

  // Load Registered Candidates
  const loadCandidates = async (page = candidatePage) => {
    setCandidateLoading(true);
    try {
      const res = await adminApi.getCandidates({ page, size: PAGE_SIZE, search: candidateSearch });
      setCandidates(res.data.data.content || []);
      setCandidateTotal(res.data.data.totalElements || 0);
      setCandidateTotalPages(res.data.data.totalPages || Math.ceil((res.data.data.totalElements || 0) / PAGE_SIZE));
      setCandidatePage(page);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to load candidate profiles");
    } finally {
      setCandidateLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "USERS") loadUsers(0);
    else if (activeTab === "COMPANIES") loadCompanies(0);
    else if (activeTab === "CANDIDATES") loadCandidates(0);
  }, [activeTab]);

  const handleToggleStatus = async (u: AdminUserItem) => {
    const nextStatus = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setUpdatingId(u.id);
    try {
      await adminApi.updateUserStatus(u.id, nextStatus as any);
      showToast(`User ${u.email} is now ${nextStatus === "SUSPENDED" ? "INACTIVE" : nextStatus}`);
      loadUsers(userPage);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to update user status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole =
      roleFilter === "ALL" ||
      (roleFilter === "ADMIN" && (u.roles.includes("ROLE_ADMIN") || u.roles.includes("ROLE_SUPER_ADMIN"))) ||
      (roleFilter === "CANDIDATE" && u.accountType === "CANDIDATE") ||
      (roleFilter === "COMPANY" && u.accountType === "COMPANY");
    return matchSearch && matchRole;
  });

  const extractSkills = (item: any): string[] => {
    const list = item.skills || [];
    if (!Array.isArray(list)) return [];
    return list.map((s: any) => typeof s === "string" ? s : (s.skillName || s.canonicalName || s.name || "")).filter(Boolean);
  };

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    totalItems: number,
    onPageChange: (newPage: number) => void
  ) => {
    if (totalItems <= 0 || totalPages <= 1) return null;

    const startItem = currentPage * PAGE_SIZE + 1;
    const endItem = Math.min((currentPage + 1) * PAGE_SIZE, totalItems);

    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(0, currentPage - Math.floor(maxButtons / 2));
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
          Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of <strong>{totalItems}</strong> entries (10 per page)
        </div>
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-btn nav"
            disabled={currentPage === 0}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <FiChevronLeft size={16} /> Previous
          </button>
          {start > 0 && (
            <>
              <button
                type="button"
                className={`pagination-btn num ${currentPage === 0 ? "active" : ""}`}
                onClick={() => onPageChange(0)}
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
              className={`pagination-btn num ${p === currentPage ? "active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </button>
          ))}
          {end < totalPages - 1 && (
            <>
              {end < totalPages - 2 && <span className="pagination-ellipsis">...</span>}
              <button
                type="button"
                className={`pagination-btn num ${currentPage === totalPages - 1 ? "active" : ""}`}
                onClick={() => onPageChange(totalPages - 1)}
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            type="button"
            className="pagination-btn nav"
            disabled={currentPage >= totalPages - 1}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next <FiChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-users-page">
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="users-header">
        <div>
          <h1 className="page-title">Platform Directory & Governance</h1>
          <p className="page-sub">
            Administrative inspection for registered companies, user accounts, and candidate profiles
          </p>
        </div>
        <button
          className="btn-refresh"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          onClick={() => {
            if (activeTab === "USERS") loadUsers();
            if (activeTab === "COMPANIES") loadCompanies();
            if (activeTab === "CANDIDATES") loadCandidates();
          }}
        >
          <FiRefreshCw size={14} /> Refresh Directory
        </button>
      </div>

      {/* Main Tab Navigation */}
      <div className="admin-main-tabs">
        <button
          className={`main-tab-btn ${activeTab === "USERS" ? "active" : ""}`}
          onClick={() => setActiveTab("USERS")}
        >
          User Accounts ({userTotal})
        </button>
        <button
          className={`main-tab-btn ${activeTab === "COMPANIES" ? "active" : ""}`}
          onClick={() => setActiveTab("COMPANIES")}
        >
          Registered Companies & Profiles ({companyTotal})
        </button>
        <button
          className={`main-tab-btn ${activeTab === "CANDIDATES" ? "active" : ""}`}
          onClick={() => setActiveTab("CANDIDATES")}
        >
          Registered Candidates & Profiles ({candidateTotal})
        </button>
      </div>

      {/* TAB 1: USER ACCOUNTS */}
      {activeTab === "USERS" && (
        <div className="tab-section">
          <div className="filter-toolbar">
            <div style={{ position: "relative", flex: 1, maxWidth: "340px" }}>
              <input
                type="text"
                className="search-input"
                style={{ width: "100%", paddingLeft: "2.2rem" }}
                placeholder="Search by email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
              <FiSearch size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            </div>
            <div className="role-filter-btns">
              {["ALL", "ADMIN", "CANDIDATE", "COMPANY"].map(r => (
                <button
                  key={r}
                  className={`filter-btn ${roleFilter === r ? "active" : ""}`}
                  onClick={() => setRoleFilter(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {userLoading ? (
            <div className="table-loading"><div className="spinner" /> Loading user registry...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-box">No users match the selected filters.</div>
          ) : (
            <div className="users-table-card">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>User Email</th>
                    <th>Account Type</th>
                    <th>Assigned Roles</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Last Login</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => {
                    const isSuper = u.roles.includes("ROLE_SUPER_ADMIN");
                    return (
                      <tr key={u.id}>
                        <td className="user-email-col">
                          <strong>{u.email}</strong>
                          {isSuper && <FiAward size={14} color="#f59e0b" style={{ marginLeft: "6px", verticalAlign: "middle" }} title="Super Admin" />}
                        </td>
                        <td>
                          <span className="type-badge">{u.accountType}</span>
                        </td>
                        <td>
                          <div className="roles-list">
                            {u.roles.map(r => (
                              <span
                                key={r}
                                className={`role-tag ${r === "ROLE_SUPER_ADMIN" ? "super" : r === "ROLE_ADMIN" ? "admin" : ""}`}
                              >
                                {r.replace("ROLE_", "")}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill ${u.status.toLowerCase()}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                            {u.status === "ACTIVE" ? <FiCheckCircle size={12} /> : <FiAlertCircle size={12} />} {u.status}
                          </span>
                        </td>
                        <td className="date-col">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="date-col">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}</td>
                        <td>
                          {!isSuper && (
                            <button
                              className={`btn-action ${u.status === "ACTIVE" ? "suspend" : "activate"}`}
                              disabled={updatingId === u.id}
                              onClick={() => handleToggleStatus(u)}
                            >
                              {updatingId === u.id ? "..." : u.status === "ACTIVE" ? "Inactive" : "Activate"}
                            </button>
                          )}
                          {isSuper && <span className="protected-tag">Immutable</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {renderPagination(userPage, userTotalPages, userTotal, p => loadUsers(p))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REGISTERED COMPANIES & PROFILES */}
      {activeTab === "COMPANIES" && (
        <div className="tab-section">
          <div className="filter-toolbar">
            <div style={{ position: "relative", flex: 1, maxWidth: "380px" }}>
              <input
                type="text"
                className="search-input"
                style={{ width: "100%", paddingLeft: "2.2rem" }}
                placeholder="Search companies by name, industry, city..."
                value={companySearch}
                onChange={e => setCompanySearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && loadCompanies(0)}
              />
              <FiSearch size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            </div>
            <button className="filter-btn active" onClick={() => loadCompanies(0)}>
              Search
            </button>
          </div>

          {companyLoading ? (
            <div className="table-loading"><div className="spinner" /> Loading registered companies...</div>
          ) : companies.length === 0 ? (
            <div className="empty-box">No registered companies found.</div>
          ) : (
            <div className="users-table-card">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Official Email</th>
                    <th>Industry</th>
                    <th>Company Size</th>
                    <th>Headquarters</th>
                    <th>Contacts</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(c => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.displayName || c.legalName}</strong>
                        {c.legalName && c.legalName !== c.displayName && (
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{c.legalName}</div>
                        )}
                      </td>
                      <td>{c.email || "N/A"}</td>
                      <td>
                        <span className="type-badge">{c.industry || "General"}</span>
                      </td>
                      <td>{c.companySize || "11-50"}</td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <FiMapPin size={13} color="#70c144" /> {c.city ? `${c.city}, ${c.country || ""}` : "Not set"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "#475569" }}>
                          {c.contacts?.length || 0} contact(s)
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${(c.status || "ACTIVE").toLowerCase()}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <FiCheckCircle size={12} /> {c.status || "ACTIVE"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-action activate"
                          onClick={() => setSelectedCompany(c)}
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {renderPagination(companyPage, companyTotalPages, companyTotal, p => loadCompanies(p))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGISTERED CANDIDATES & PROFILES */}
      {activeTab === "CANDIDATES" && (
        <div className="tab-section">
          <div className="filter-toolbar">
            <div style={{ position: "relative", flex: 1, maxWidth: "420px" }}>
              <input
                type="text"
                className="search-input"
                style={{ width: "100%", paddingLeft: "2.2rem" }}
                placeholder="Search candidates by name, email, headline, skills..."
                value={candidateSearch}
                onChange={e => setCandidateSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && loadCandidates(0)}
              />
              <FiSearch size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            </div>
            <button className="filter-btn active" onClick={() => loadCandidates(0)}>
              Search
            </button>
          </div>

          {candidateLoading ? (
            <div className="table-loading"><div className="spinner" /> Loading registered candidates...</div>
          ) : candidates.length === 0 ? (
            <div className="empty-box">No registered candidates found.</div>
          ) : (
            <div className="users-table-card">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Candidate Name</th>
                    <th>Email</th>
                    <th>Location</th>
                    <th>Experience</th>
                    <th>Skills Overview</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(cand => {
                    const skillList = extractSkills(cand);
                    return (
                      <tr key={cand.id}>
                        <td>
                          <strong>{cand.fullName}</strong>
                          {cand.headline && (
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{cand.headline}</div>
                          )}
                        </td>
                        <td>{cand.email || "N/A"}</td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                            <FiMapPin size={13} color="#70c144" /> {cand.currentLocation || cand.location || "Not set"}
                          </span>
                        </td>
                        <td>{Math.round((cand.totalExperienceMonths || 24) / 12)} Years</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                            {skillList.slice(0, 3).map(s => (
                              <span
                                key={s}
                                style={{
                                  background: "#f0fdf4",
                                  color: "#15803d",
                                  border: "1px solid #bbf7d0",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "4px",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                }}
                              >
                                {s}
                              </span>
                            ))}
                            {skillList.length > 3 && (
                              <span style={{ fontSize: "0.75rem", color: "#64748b", alignSelf: "center" }}>
                                +{skillList.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn-action activate"
                            onClick={() => setSelectedCandidate(cand)}
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {renderPagination(candidatePage, candidateTotalPages, candidateTotal, p => loadCandidates(p))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: COMPANY PROFILE INSPECTION */}
      {selectedCompany && (
        <div className="modal-overlay" onClick={() => setSelectedCompany(null)}>
          <div className="modal-box" style={{ maxWidth: "680px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
              <div>
                <span className="type-badge" style={{ background: "#dbeafe", color: "#1e40af", fontWeight: 700 }}>
                  REGISTERED COMPANY PROFILE
                </span>
                <h2 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0.2rem", color: "var(--text-primary, #0f172a)" }}>
                  {selectedCompany.displayName || selectedCompany.legalName}
                </h2>
                {selectedCompany.legalName && (
                  <p style={{ color: "var(--text-muted, #64748b)", margin: 0, fontSize: "0.9rem" }}>
                    Legal Name: {selectedCompany.legalName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted, #64748b)", padding: "4px" }}
              >
                <FiX size={22} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "var(--bg-surface, #f8fafc)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-card, #e2e8f0)", marginBottom: "1.25rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>Official Email</span>
                <div style={{ fontWeight: 600, color: "var(--text-primary, #1e293b)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <FiMail size={13} color="#70c144" /> {selectedCompany.email || "Not specified"}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>Industry & Size</span>
                <div style={{ fontWeight: 600, color: "var(--text-primary, #1e293b)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <FiBriefcase size={13} color="#70c144" /> {selectedCompany.industry || "Information Tech"} ({selectedCompany.companySize || "50-200"})
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>Headquarters</span>
                <div style={{ fontWeight: 600, color: "var(--text-primary, #1e293b)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <FiMapPin size={13} color="#70c144" /> {selectedCompany.city ? `${selectedCompany.city}, ${selectedCompany.country || ""}` : "Not provided"}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>Website</span>
                <div style={{ fontWeight: 600 }}>
                  {selectedCompany.website ? (
                    <a href={selectedCompany.website} target="_blank" rel="noreferrer" style={{ color: "#2563eb", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      {selectedCompany.website} <FiExternalLink size={12} />
                    </a>
                  ) : (
                    <span style={{ color: "var(--text-muted, #64748b)" }}>None</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <h4 style={{ margin: "0 0 0.5rem", color: "var(--text-primary, #1e293b)" }}>About the Organization</h4>
              <p style={{ color: "var(--text-secondary, #475569)", lineHeight: 1.6, margin: 0, fontSize: "0.95rem" }}>
                {selectedCompany.description || "No detailed description provided by this company."}
              </p>
            </div>

            <div>
              <h4 style={{ margin: "0 0 0.75rem", color: "var(--text-primary, #1e293b)" }}>Recruitment Contacts</h4>
              {selectedCompany.contacts && selectedCompany.contacts.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {selectedCompany.contacts.map((contact: CompanyContact) => (
                    <div key={contact.id} style={{ background: "var(--bg-surface, #f8fafc)", border: "1px solid var(--border-card, #e2e8f0)", padding: "0.6rem 0.85rem", borderRadius: "6px", display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <strong>{contact.name}</strong> {contact.jobTitle && <span style={{ color: "var(--text-muted, #64748b)", fontSize: "0.85rem" }}>({contact.jobTitle})</span>}
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary, #475569)", display: "flex", alignItems: "center", gap: "0.8rem", marginTop: "0.25rem" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}><FiMail size={12} /> {contact.email}</span>
                          {contact.phone && <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}><FiPhone size={12} /> {contact.phone}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--text-muted, #64748b)", fontStyle: "italic", margin: 0 }}>No recruitment contacts listed.</p>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-card, #e2e8f0)", paddingTop: "1rem" }}>
              <button className="btn-modal-cancel" onClick={() => setSelectedCompany(null)}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANDIDATE PROFILE INSPECTION */}
      {selectedCandidate && (
        <div className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
          <div className="modal-box" style={{ maxWidth: "680px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
              <div>
                <span className="type-badge" style={{ background: "#dcfce7", color: "#15803d", fontWeight: 700 }}>
                  REGISTERED CANDIDATE PROFILE
                </span>
                <h2 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0.2rem", color: "var(--text-primary, #0f172a)" }}>
                  {selectedCandidate.fullName}
                </h2>
                <p style={{ color: "var(--text-muted, #64748b)", margin: 0 }}>{selectedCandidate.headline || "Professional Candidate"}</p>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted, #64748b)", padding: "4px" }}
              >
                <FiX size={22} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "var(--bg-surface, #f8fafc)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-card, #e2e8f0)", marginBottom: "1.25rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>Email Address</span>
                <div style={{ fontWeight: 600, color: "var(--text-primary, #1e293b)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <FiMail size={13} color="#70c144" /> {selectedCandidate.email || "Not specified"}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>Mobile Number</span>
                <div style={{ fontWeight: 600, color: "var(--text-primary, #1e293b)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <FiPhone size={13} color="#70c144" /> {selectedCandidate.phone || "Not provided"}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>Location</span>
                <div style={{ fontWeight: 600, color: "var(--text-primary, #1e293b)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <FiMapPin size={13} color="#70c144" /> {selectedCandidate.currentLocation || selectedCandidate.location || "Not set"}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>Total Experience</span>
                <div style={{ fontWeight: 600, color: "var(--text-primary, #1e293b)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <FiCalendar size={13} color="#70c144" /> {Math.round((selectedCandidate.totalExperienceMonths || 36) / 12)} Years ({selectedCandidate.totalExperienceMonths || 36} months)
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <h4 style={{ margin: "0 0 0.5rem", color: "var(--text-primary, #1e293b)" }}>Professional Summary & Bio</h4>
              <p style={{ color: "var(--text-secondary, #475569)", lineHeight: 1.6, margin: 0, fontSize: "0.95rem" }}>
                {selectedCandidate.summary || selectedCandidate.bio || "No summary provided by this candidate."}
              </p>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <h4 style={{ margin: "0 0 0.5rem", color: "var(--text-primary, #1e293b)" }}>Technical Skills</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {extractSkills(selectedCandidate).map(s => (
                  <span
                    key={s}
                    style={{
                      background: "var(--bg-mint, #f0fdf4)",
                      color: "#15803d",
                      border: "1px solid var(--border-mint, #bbf7d0)",
                      padding: "0.3rem 0.65rem",
                      borderRadius: "4px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {(selectedCandidate.linkedinUrl || selectedCandidate.portfolioUrl) && (
              <div style={{ marginBottom: "1.25rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", color: "var(--text-primary, #1e293b)" }}>Professional Links</h4>
                <div style={{ display: "flex", gap: "1rem" }}>
                  {selectedCandidate.linkedinUrl && (
                    <a href={selectedCandidate.linkedinUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      LinkedIn Profile <FiExternalLink size={13} />
                    </a>
                  )}
                  {selectedCandidate.portfolioUrl && (
                    <a href={selectedCandidate.portfolioUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      GitHub / Portfolio <FiExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-card, #e2e8f0)", paddingTop: "1rem" }}>
              <button className="btn-modal-cancel" onClick={() => setSelectedCandidate(null)}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
