import React, { useEffect, useState } from "react";
import { adminApi } from "../../api/admin";
import type { AdminUserItem, CompanyProfile, CandidateProfile, CompanyContact } from "../../types";
import "./AdminUsers.css";

type AdminTab = "USERS" | "COMPANIES" | "CANDIDATES";

const AdminUsersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("USERS");

  // Users state
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userLoading, setUserLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Companies state
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [companyTotal, setCompanyTotal] = useState(0);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);

  // Candidates state
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [candidateTotal, setCandidateTotal] = useState(0);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);

  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // Load User Accounts
  const loadUsers = async () => {
    setUserLoading(true);
    try {
      const res = await adminApi.getUsers({ page: 0, size: 50 });
      setUsers(res.data.data.content || []);
      setUserTotal(res.data.data.totalElements || 0);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to load platform users");
    } finally {
      setUserLoading(false);
    }
  };

  // Load Registered Companies
  const loadCompanies = async () => {
    setCompanyLoading(true);
    try {
      const res = await adminApi.getCompanies({ page: 0, size: 50, search: companySearch });
      setCompanies(res.data.data.content || []);
      setCompanyTotal(res.data.data.totalElements || 0);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to load companies");
    } finally {
      setCompanyLoading(false);
    }
  };

  // Load Registered Candidates
  const loadCandidates = async () => {
    setCandidateLoading(true);
    try {
      const res = await adminApi.getCandidates({ page: 0, size: 50, search: candidateSearch });
      setCandidates(res.data.data.content || []);
      setCandidateTotal(res.data.data.totalElements || 0);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to load candidate profiles");
    } finally {
      setCandidateLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "USERS") loadUsers();
    else if (activeTab === "COMPANIES") loadCompanies();
    else if (activeTab === "CANDIDATES") loadCandidates();
  }, [activeTab]);

  const handleToggleStatus = async (u: AdminUserItem) => {
    const nextStatus = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setUpdatingId(u.id);
    try {
      await adminApi.updateUserStatus(u.id, nextStatus as any);
      showToast(`User ${u.email} is now ${nextStatus === "SUSPENDED" ? "INACTIVE" : nextStatus}`);
      loadUsers();
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
          onClick={() => {
            if (activeTab === "USERS") loadUsers();
            if (activeTab === "COMPANIES") loadCompanies();
            if (activeTab === "CANDIDATES") loadCandidates();
          }}
        >
          ↻ Refresh Directory
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
            <input
              type="text"
              className="search-input"
              placeholder="Search by email..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
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
                          {isSuper && <span className="super-crown">👑</span>}
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
                          <span className={`status-pill ${u.status.toLowerCase()}`}>
                            ● {u.status}
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
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REGISTERED COMPANIES & PROFILES */}
      {activeTab === "COMPANIES" && (
        <div className="tab-section">
          <div className="filter-toolbar">
            <input
              type="text"
              className="search-input"
              placeholder="Search companies by name, industry, city..."
              value={companySearch}
              onChange={e => setCompanySearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && loadCompanies()}
            />
            <button className="filter-btn active" onClick={loadCompanies}>
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
                      <td>📍 {c.city ? `${c.city}, ${c.country || ""}` : "Not set"}</td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "#475569" }}>
                          {c.contacts?.length || 0} contact(s)
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${(c.status || "ACTIVE").toLowerCase()}`}>
                          ● {c.status || "ACTIVE"}
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
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGISTERED CANDIDATES & PROFILES */}
      {activeTab === "CANDIDATES" && (
        <div className="tab-section">
          <div className="filter-toolbar">
            <input
              type="text"
              className="search-input"
              placeholder="Search candidates by name, email, headline, skills..."
              value={candidateSearch}
              onChange={e => setCandidateSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && loadCandidates()}
            />
            <button className="filter-btn active" onClick={loadCandidates}>
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
                    <th>Email ID</th>
                    <th>Mobile Number</th>
                    <th>Headline / Role</th>
                    <th>Location</th>
                    <th>Skills Preview</th>
                    <th>Experience</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(cand => {
                    const candSkills = extractSkills(cand);
                    const expMonths = cand.totalExperienceMonths || (cand.totalExperienceYears ? cand.totalExperienceYears * 12 : 0);
                    return (
                      <tr key={cand.id}>
                        <td>
                          <strong>{cand.fullName}</strong>
                        </td>
                        <td>{cand.email || "N/A"}</td>
                        <td>{cand.phone || "Not provided"}</td>
                        <td>{cand.headline || "Candidate"}</td>
                        <td>📍 {cand.currentLocation || cand.location || "N/A"}</td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", maxWidth: "200px" }}>
                            {candSkills.slice(0, 3).map(s => (
                              <span key={s} className="skill-chip">{s}</span>
                            ))}
                            {candSkills.length > 3 && (
                              <span className="skill-chip">+{candSkills.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td>{Math.round(expMonths / 12)} yr(s)</td>
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
                <span className="type-badge" style={{ background: "#ede9fe", color: "#6366f1", fontWeight: 700 }}>
                  REGISTERED COMPANY PROFILE
                </span>
                <h2 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0.2rem", color: "#0f172a" }}>
                  {selectedCompany.displayName || selectedCompany.legalName}
                </h2>
                <p style={{ color: "#64748b", margin: 0 }}>Legal Name: {selectedCompany.legalName}</p>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "#f8fafc", padding: "1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Official Email</span>
                <div style={{ fontWeight: 600, color: "#1e293b" }}>{selectedCompany.email || "Not specified"}</div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Industry & Size</span>
                <div style={{ fontWeight: 600, color: "#1e293b" }}>
                  {selectedCompany.industry || "Technology"} • {selectedCompany.companySize || "11-50"}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Headquarters</span>
                <div style={{ fontWeight: 600, color: "#1e293b" }}>
                  📍 {selectedCompany.city ? `${selectedCompany.city}, ${selectedCompany.country || ""}` : "Not provided"}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Website</span>
                <div style={{ fontWeight: 600, color: "#2563eb" }}>
                  {selectedCompany.website ? (
                    <a href={selectedCompany.website} target="_blank" rel="noreferrer">
                      {selectedCompany.website}
                    </a>
                  ) : "None"}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <h4 style={{ margin: "0 0 0.5rem", color: "#1e293b" }}>About the Organization</h4>
              <p style={{ color: "#475569", lineHeight: 1.6, margin: 0, fontSize: "0.95rem" }}>
                {selectedCompany.description || "No detailed description provided by this company."}
              </p>
            </div>

            <div>
              <h4 style={{ margin: "0 0 0.75rem", color: "#1e293b" }}>Recruitment Contacts</h4>
              {selectedCompany.contacts && selectedCompany.contacts.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {selectedCompany.contacts.map((contact: CompanyContact) => (
                    <div key={contact.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "0.6rem 0.85rem", borderRadius: "6px", display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <strong>{contact.name}</strong> {contact.jobTitle && <span style={{ color: "#64748b", fontSize: "0.85rem" }}>({contact.jobTitle})</span>}
                        <div style={{ fontSize: "0.85rem", color: "#475569" }}>✉ {contact.email} {contact.phone && `• 📞 ${contact.phone}`}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#64748b", fontStyle: "italic", margin: 0 }}>No recruitment contacts listed.</p>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: "1.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
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
                <h2 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0.2rem", color: "#0f172a" }}>
                  {selectedCandidate.fullName}
                </h2>
                <p style={{ color: "#64748b", margin: 0 }}>{selectedCandidate.headline || "Professional Candidate"}</p>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "#f8fafc", padding: "1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Email Address</span>
                <div style={{ fontWeight: 600, color: "#1e293b" }}>{selectedCandidate.email || "Not specified"}</div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Mobile Number</span>
                <div style={{ fontWeight: 600, color: "#1e293b" }}>{selectedCandidate.phone || "Not provided"}</div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Location</span>
                <div style={{ fontWeight: 600, color: "#1e293b" }}>
                  📍 {selectedCandidate.currentLocation || selectedCandidate.location || "Not set"}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Total Experience</span>
                <div style={{ fontWeight: 600, color: "#1e293b" }}>
                  {Math.round((selectedCandidate.totalExperienceMonths || 36) / 12)} Years ({selectedCandidate.totalExperienceMonths || 36} months)
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <h4 style={{ margin: "0 0 0.5rem", color: "#1e293b" }}>Professional Summary & Bio</h4>
              <p style={{ color: "#475569", lineHeight: 1.6, margin: 0, fontSize: "0.95rem" }}>
                {selectedCandidate.summary || selectedCandidate.bio || "No summary provided by this candidate."}
              </p>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <h4 style={{ margin: "0 0 0.5rem", color: "#1e293b" }}>Technical Skills</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {extractSkills(selectedCandidate).map(s => (
                  <span
                    key={s}
                    style={{
                      background: "#06080a",
                      color: "#66cc33",
                      border: "1px solid #1a2026",
                      padding: "0.3rem 0.65rem",
                      borderRadius: "4px",
                      fontSize: "0.85rem",
                      fontWeight: 600
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {(selectedCandidate.linkedinUrl || selectedCandidate.portfolioUrl) && (
              <div style={{ marginBottom: "1.25rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", color: "#1e293b" }}>Professional Links</h4>
                <div style={{ display: "flex", gap: "1rem" }}>
                  {selectedCandidate.linkedinUrl && (
                    <a href={selectedCandidate.linkedinUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 600 }}>
                      LinkedIn Profile ↗
                    </a>
                  )}
                  {selectedCandidate.portfolioUrl && (
                    <a href={selectedCandidate.portfolioUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 600 }}>
                      GitHub / Portfolio ↗
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: "1.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
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
