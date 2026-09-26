import { useNavigate, useSearchParams } from "react-router-dom";
import React, { useEffect, useState, useMemo } from "react";
import { adminApi } from "../../api/admin";
import type { AdminUserItem, CompanyProfile, CandidateProfile } from "../../types";
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
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import "./AdminUsers.css";

type AdminTab = "USERS" | "COMPANIES" | "CANDIDATES";

const PAGE_SIZE = 10;

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialTab = (): AdminTab => {
    const param = (searchParams.get("tab") || "").toUpperCase();
    if (param === "COMPANIES" || param === "COMPANY") return "COMPANIES";
    if (param === "CANDIDATES" || param === "CANDIDATE") return "CANDIDATES";
    return "USERS";
  };

  const getInitialRole = (): string => {
    const role = (searchParams.get("role") || "ALL").toUpperCase();
    if (["ADMIN", "CANDIDATE", "COMPANY"].includes(role)) return role;
    return "ALL";
  };

  const initialTab = getInitialTab();
  const initialQ = searchParams.get("q") || "";

  const [activeTab, setActiveTabState] = useState<AdminTab>(initialTab);
  const [roleFilter, setRoleFilterState] = useState<string>(getInitialRole);
  
  // Real-time search states
  const [userSearch, setUserSearchState] = useState<string>(() => (initialTab === "USERS" ? initialQ : ""));
  const [companySearch, setCompanySearchState] = useState<string>(() => (initialTab === "COMPANIES" ? initialQ : ""));
  const [candidateSearch, setCandidateSearchState] = useState<string>(() => (initialTab === "CANDIDATES" ? initialQ : ""));

  const updateUrlParams = (newTab = activeTab, newRole = roleFilter, newSearch?: string) => {
    const params: Record<string, string> = { tab: newTab.toLowerCase() };
    if (newRole && newRole !== "ALL") params.role = newRole.toLowerCase();
    
    let searchVal = newSearch;
    if (searchVal === undefined) {
      if (newTab === "USERS") searchVal = userSearch;
      else if (newTab === "COMPANIES") searchVal = companySearch;
      else if (newTab === "CANDIDATES") searchVal = candidateSearch;
    }

    if (searchVal && searchVal.trim()) {
      params.q = searchVal.trim();
    }
    setSearchParams(params, { replace: true });
  };

  const handleTabChange = (tab: AdminTab) => {
    setActiveTabState(tab);
    let currentSearch = "";
    if (tab === "USERS") currentSearch = userSearch;
    else if (tab === "COMPANIES") currentSearch = companySearch;
    else if (tab === "CANDIDATES") currentSearch = candidateSearch;
    updateUrlParams(tab, roleFilter, currentSearch);
  };

  const handleRoleFilterChange = (r: string) => {
    setRoleFilterState(r);
    setUserPage(0);
    updateUrlParams(activeTab, r, userSearch);
  };

  const handleUserSearchChange = (val: string) => {
    setUserSearchState(val);
    setUserPage(0);
    updateUrlParams("USERS", roleFilter, val);
  };

  const handleCompanySearchChange = (val: string) => {
    setCompanySearchState(val);
    setCompanyPage(0);
    updateUrlParams("COMPANIES", roleFilter, val);
  };

  const handleCandidateSearchChange = (val: string) => {
    setCandidateSearchState(val);
    setCandidatePage(0);
    updateUrlParams("CANDIDATES", roleFilter, val);
  };

  // Sync activeTab, roleFilter, and search query if URL params change externally
  useEffect(() => {
    const param = (searchParams.get("tab") || "").toUpperCase();
    if ((param === "COMPANIES" || param === "COMPANY") && activeTab !== "COMPANIES") {
      setActiveTabState("COMPANIES");
    } else if ((param === "CANDIDATES" || param === "CANDIDATE") && activeTab !== "CANDIDATES") {
      setActiveTabState("CANDIDATES");
    } else if ((param === "USERS" || param === "USER") && activeTab !== "USERS") {
      setActiveTabState("USERS");
    }

    const roleParam = (searchParams.get("role") || "").toUpperCase();
    if (["ADMIN", "CANDIDATE", "COMPANY", "ALL"].includes(roleParam)) {
      if (roleParam !== roleFilter) setRoleFilterState(roleParam);
    }

    const qParam = searchParams.get("q") || "";
    if (activeTab === "USERS" && qParam !== userSearch) {
      setUserSearchState(qParam);
    } else if (activeTab === "COMPANIES" && qParam !== companySearch) {
      setCompanySearchState(qParam);
    } else if (activeTab === "CANDIDATES" && qParam !== candidateSearch) {
      setCandidateSearchState(qParam);
    }
  }, [searchParams, activeTab]);

  // Users state
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(0);
  const [userLoading, setUserLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Companies state
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [companyTotal, setCompanyTotal] = useState(0);
  const [companyPage, setCompanyPage] = useState(0);
  const [companyLoading, setCompanyLoading] = useState(false);

  // Candidates state
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [candidateTotal, setCandidateTotal] = useState(0);
  const [candidatePage, setCandidatePage] = useState(0);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [inspectingUser, setInspectingUser] = useState<AdminUserItem | null>(null);
  
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // Load User Accounts
  const loadUsers = async () => {
    setUserLoading(true);
    try {
      const res = await adminApi.getUsers({ page: 0, size: 100 });
      const list = res.data.data.content || [];
      setUsers(list);
      setUserTotal(res.data.data.totalElements || list.length);
    } catch {
      /* silent */
    } finally {
      setUserLoading(false);
    }
  };

  // Load Companies
  const loadCompanies = async () => {
    setCompanyLoading(true);
    try {
      const res = await adminApi.getCompanies({ page: 0, size: 100 });
      const list = res.data.data.content || [];
      setCompanies(list);
      setCompanyTotal(res.data.data.totalElements || list.length);
    } catch {
      /* silent */
    } finally {
      setCompanyLoading(false);
    }
  };

  // Load Candidates
  const loadCandidates = async () => {
    setCandidateLoading(true);
    try {
      const res = await adminApi.getCandidates({ page: 0, size: 100 });
      const list = res.data.data.content || [];
      setCandidates(list);
      setCandidateTotal(res.data.data.totalElements || list.length);
    } catch {
      /* silent */
    } finally {
      setCandidateLoading(false);
    }
  };

  // Pre-fetch counts for all 3 tabs on initial load
  const refreshAllCounts = async () => {
    try {
      const [uRes, cRes, candRes] = await Promise.allSettled([
        adminApi.getUsers({ page: 0, size: 100 }),
        adminApi.getCompanies({ page: 0, size: 100 }),
        adminApi.getCandidates({ page: 0, size: 100 }),
      ]);
      if (uRes.status === "fulfilled" && uRes.value.data?.data) {
        const uList = uRes.value.data.data.content || [];
        setUsers(uList);
        setUserTotal(uRes.value.data.data.totalElements || uList.length);
      }
      if (cRes.status === "fulfilled" && cRes.value.data?.data) {
        const cList = cRes.value.data.data.content || [];
        setCompanies(cList);
        setCompanyTotal(cRes.value.data.data.totalElements || cList.length);
      }
      if (candRes.status === "fulfilled" && candRes.value.data?.data) {
        const candList = candRes.value.data.data.content || [];
        setCandidates(candList);
        setCandidateTotal(candRes.value.data.data.totalElements || candList.length);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    refreshAllCounts();
  }, []);

  useEffect(() => {
    if (activeTab === "USERS") loadUsers();
    else if (activeTab === "COMPANIES") loadCompanies();
    else if (activeTab === "CANDIDATES") loadCandidates();
  }, [activeTab]);

  const handleInspectCandidate = (cand: CandidateProfile) => {
    navigate('/candidates/' + cand.id);
  };

  const handleInspectUser = async (u: AdminUserItem) => {
    if (u.accountType === "CANDIDATE" || u.roles.includes("ROLE_CANDIDATE")) {
      const existing = candidates.find(c => c.email?.toLowerCase() === u.email.toLowerCase() || (c as any).userId === u.id);
      if (existing && existing.id) {
        navigate('/candidates/' + existing.id);
        return;
      }
      try {
        const res = await adminApi.getCandidates({ search: u.email, size: 5 });
        const list = res.data?.data?.content || [];
        const matched = list.find((c: any) => c.email?.toLowerCase() === u.email.toLowerCase() || (c as any).userId === u.id) || list[0];
        if (matched && matched.id) {
          navigate('/candidates/' + matched.id);
          return;
        }
      } catch (err) {
        console.error('Error finding candidate profile:', err);
      }
      navigate('/candidates/' + u.id);
    } else if (u.accountType === "COMPANY" || u.roles.includes("ROLE_COMPANY")) {
      const existingComp = companies.find(c => c.email?.toLowerCase() === u.email.toLowerCase() || (c as any).userId === u.id);
      if (existingComp && existingComp.id) {
        navigate('/companies/' + existingComp.id);
        return;
      }
      try {
        const res = await adminApi.getCompanies({ search: u.email, size: 5 });
        const list = res.data?.data?.content || [];
        const matched = list.find((c: any) => c.email?.toLowerCase() === u.email.toLowerCase() || (c as any).userId === u.id) || list[0];
        if (matched && matched.id) {
          navigate('/companies/' + matched.id);
          return;
        }
      } catch (err) {
        console.error('Error finding company profile:', err);
      }
      navigate('/companies/' + u.id);
    } else {
      setInspectingUser(u);
    }
  };

  // Toggle user status
  const handleToggleStatus = async (u: AdminUserItem) => {
    const isSuper = u.roles.includes("ROLE_SUPER_ADMIN");
    if (isSuper) {
      showToast("Cannot modify a Super Admin status.");
      return;
    }
    const nextStatus = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (!window.confirm(`Are you sure you want to mark ${u.email} as ${nextStatus === "SUSPENDED" ? "Inactive" : "Active"}?`)) {
      return;
    }
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

  // Real-time filtering for Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = !userSearch.trim() || u.email.toLowerCase().includes(userSearch.trim().toLowerCase());
      const isCandidate = u.accountType === "CANDIDATE" || u.roles?.includes("ROLE_CANDIDATE");
      const isCompany = u.accountType === "COMPANY" || u.roles?.includes("ROLE_COMPANY");
      const isAdminUser = u.accountType === "ADMIN" || u.accountType === "SUPER_ADMIN" || u.roles?.some(r => r.includes("ADMIN"));

      let matchRole = true;
      if (roleFilter === "ADMIN") matchRole = isAdminUser;
      else if (roleFilter === "CANDIDATE") matchRole = isCandidate;
      else if (roleFilter === "COMPANY") matchRole = isCompany;

      return matchSearch && matchRole;
    });
  }, [users, userSearch, roleFilter]);

  const totalFilteredUsers = filteredUsers.length;
  const userTotalPages = Math.ceil(totalFilteredUsers / PAGE_SIZE) || 1;
  const paginatedUsers = filteredUsers.slice(userPage * PAGE_SIZE, (userPage + 1) * PAGE_SIZE);

  const extractSkills = (item: any): string[] => {
    const list = item.skills || [];
    if (!Array.isArray(list)) return [];
    return list.map((s: any) => typeof s === "string" ? s : (s.skillName || s.canonicalName || s.name || "")).filter(Boolean);
  };

  // Real-time filtering for Companies as words are entered
  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return companies;
    const q = companySearch.toLowerCase().trim();
    return companies.filter(c => {
      const name = ((c.displayName || "") + " " + (c.legalName || "") + " " + (c.companyName || "")).toLowerCase();
      const email = (c.email || "").toLowerCase();
      const industry = (c.industry || "").toLowerCase();
      const location = ((c.city || "") + " " + (c.country || "") + " " + (c.headquartersCity || "")).toLowerCase();
      return name.includes(q) || email.includes(q) || industry.includes(q) || location.includes(q);
    });
  }, [companies, companySearch]);

  const totalFilteredCompanies = filteredCompanies.length;
  const companyTotalPages = Math.ceil(totalFilteredCompanies / PAGE_SIZE) || 1;
  const paginatedCompanies = filteredCompanies.slice(companyPage * PAGE_SIZE, (companyPage + 1) * PAGE_SIZE);

  // Real-time filtering for Candidates as words are entered
  const filteredCandidates = useMemo(() => {
    if (!candidateSearch.trim()) return candidates;
    const q = candidateSearch.toLowerCase().trim();
    return candidates.filter(c => {
      const name = ((c.fullName || "") + " " + (c.firstName || "") + " " + (c.lastName || "")).toLowerCase();
      const email = (c.email || "").toLowerCase();
      const headline = ((c.headline || "") + " " + (c.bio || "") + " " + (c.summary || "")).toLowerCase();
      const location = ((c.currentLocation || "") + " " + (c.location || "")).toLowerCase();
      const skills = extractSkills(c).join(" ").toLowerCase();
      return name.includes(q) || email.includes(q) || headline.includes(q) || location.includes(q) || skills.includes(q);
    });
  }, [candidates, candidateSearch]);

  const totalFilteredCandidates = filteredCandidates.length;
  const candidateTotalPages = Math.ceil(totalFilteredCandidates / PAGE_SIZE) || 1;
  const paginatedCandidates = filteredCandidates.slice(candidatePage * PAGE_SIZE, (candidatePage + 1) * PAGE_SIZE);

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
          Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of <strong>{totalItems}</strong> entries
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
              type="button"
              key={p}
              className={`pagination-btn num ${currentPage === p ? "active" : ""}`}
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
          onClick={() => handleTabChange("USERS")}
        >
          User Accounts ({userTotal})
        </button>
        <button
          className={`main-tab-btn ${activeTab === "COMPANIES" ? "active" : ""}`}
          onClick={() => handleTabChange("COMPANIES")}
        >
          Registered Companies & Profiles ({companyTotal})
        </button>
        <button
          className={`main-tab-btn ${activeTab === "CANDIDATES" ? "active" : ""}`}
          onClick={() => handleTabChange("CANDIDATES")}
        >
          Registered Candidates & Profiles ({candidateTotal})
        </button>
      </div>

      {/* TAB 1: USER ACCOUNTS */}
      {activeTab === "USERS" && (
        <div className="tab-section">
          <div className="filter-toolbar">
            <div style={{ position: "relative", maxWidth: "340px", width: "100%" }}>
              <input
                type="text"
                className="search-input"
                style={{ width: "100%", paddingLeft: "2.2rem" }}
                placeholder="Search users by email address..."
                value={userSearch}
                onChange={e => handleUserSearchChange(e.target.value)}
              />
              <FiSearch size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => handleUserSearchChange("")}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "2px",
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="role-filters">
              {["ALL", "ADMIN", "CANDIDATE", "COMPANY"].map(r => (
                <button
                  key={r}
                  type="button"
                  className={`filter-btn ${roleFilter === r ? "active" : ""}`}
                  onClick={() => handleRoleFilterChange(r)}
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
                  {paginatedUsers.map(u => {
                    const isSuper = u.roles.includes("ROLE_SUPER_ADMIN");
                    return (
                      <tr key={u.id} className="clickable-row">
                        <td
                          className="user-email-col"
                          onClick={() => handleInspectUser(u)}
                          style={{ cursor: "pointer" }}
                          title="Click to view full details profile"
                        >
                          <span className="user-email-clickable">
                            {u.email}
                          </span>
                          {isSuper && <FiAward size={14} color="#f59e0b" style={{ marginLeft: "6px", verticalAlign: "middle" }} title="Super Admin" />}
                        </td>
                        <td onClick={() => handleInspectUser(u)} style={{ cursor: "pointer" }}>
                          <span className="type-badge">{u.accountType}</span>
                        </td>
                        <td onClick={() => handleInspectUser(u)} style={{ cursor: "pointer" }}>
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
                          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                            <button
                              type="button"
                              className="btn-action view"
                              onClick={() => handleInspectUser(u)}
                              title="Inspect Member Profile"
                            >
                              View Profile
                            </button>
                            {!isSuper && (
                              <button
                                className={`btn-action ${u.status === "ACTIVE" ? "suspend" : "activate"}`}
                                disabled={updatingId === u.id}
                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(u); }}
                              >
                                {updatingId === u.id ? "..." : u.status === "ACTIVE" ? "Inactive" : "Activate"}
                              </button>
                            )}
                            {isSuper && <span className="protected-tag">Immutable</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {renderPagination(userPage, userTotalPages, totalFilteredUsers, p => setUserPage(p))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REGISTERED COMPANIES & PROFILES */}
      {activeTab === "COMPANIES" && (
        <div className="tab-section">
          <div className="filter-toolbar">
            <div style={{ position: "relative", maxWidth: "380px", width: "100%" }}>
              <input
                type="text"
                className="search-input"
                style={{ width: "100%", paddingLeft: "2.2rem" }}
                placeholder="Search companies by name, industry, city..."
                value={companySearch}
                onChange={e => handleCompanySearchChange(e.target.value)}
              />
              <FiSearch size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              {companySearch && (
                <button
                  type="button"
                  onClick={() => handleCompanySearchChange("")}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "2px",
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {companyLoading ? (
            <div className="table-loading"><div className="spinner" /> Loading registered companies...</div>
          ) : filteredCompanies.length === 0 ? (
            <div className="empty-box">No registered companies match your search.</div>
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCompanies.map(c => (
                    <tr key={c.id} className="clickable-row">
                      <td onClick={() => navigate('/companies/' + c.id)} style={{ cursor: "pointer" }} title="Click to view company profile">
                        <strong className="user-email-clickable">{c.displayName || c.legalName}</strong>
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
                          type="button"
                          className="btn-action view"
                          onClick={() => navigate('/companies/' + c.id)}
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {renderPagination(companyPage, companyTotalPages, totalFilteredCompanies, p => setCompanyPage(p))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGISTERED CANDIDATES & PROFILES */}
      {activeTab === "CANDIDATES" && (
        <div className="tab-section">
          <div className="filter-toolbar">
            <div style={{ position: "relative", maxWidth: "420px", width: "100%" }}>
              <input
                type="text"
                className="search-input"
                style={{ width: "100%", paddingLeft: "2.2rem" }}
                placeholder="Search candidates by name, email, headline, skills..."
                value={candidateSearch}
                onChange={e => handleCandidateSearchChange(e.target.value)}
              />
              <FiSearch size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              {candidateSearch && (
                <button
                  type="button"
                  onClick={() => handleCandidateSearchChange("")}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "2px",
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {candidateLoading ? (
            <div className="table-loading"><div className="spinner" /> Loading registered candidates...</div>
          ) : filteredCandidates.length === 0 ? (
            <div className="empty-box">No registered candidates match your search.</div>
          ) : (
            <div className="users-table-card">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Candidate Name</th>
                    <th>Email Address</th>
                    <th>Professional Headline</th>
                    <th>Location</th>
                    <th>Experience</th>
                    <th>Key Skills</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCandidates.map(cand => {
                    const candidateSkills = extractSkills(cand);
                    return (
                      <tr key={cand.id} className="clickable-row">
                        <td onClick={() => handleInspectCandidate(cand)} style={{ cursor: "pointer" }} title="Click to view candidate profile">
                          <strong className="user-email-clickable">{cand.fullName}</strong>
                          {cand.phone && (
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{cand.phone}</div>
                          )}
                        </td>
                        <td>{cand.email || "N/A"}</td>
                        <td>
                          <div style={{ maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={cand.headline || ""}>
                            {cand.headline || "Candidate Profile"}
                          </div>
                        </td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                            <FiMapPin size={13} color="#70c144" /> {cand.currentLocation || cand.location || "Not specified"}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                            <FiCalendar size={13} color="#70c144" /> {Math.round((cand.totalExperienceMonths || 36) / 12)} Yrs
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", maxWidth: "250px" }}>
                            {candidateSkills.slice(0, 3).map(s => (
                              <span key={s} className="skill-pill">
                                {s}
                              </span>
                            ))}
                            {candidateSkills.length > 3 && (
                              <span className="skill-pill extra">+{candidateSkills.length - 3}</span>
                            )}
                            {candidateSkills.length === 0 && <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>None listed</span>}
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-action view"
                            onClick={() => handleInspectCandidate(cand)}
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {renderPagination(candidatePage, candidateTotalPages, totalFilteredCandidates, p => setCandidatePage(p))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: SUPER ADMIN / USER INSPECTION */}
      {inspectingUser && (
        <div className="modal-overlay" onClick={() => setInspectingUser(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
              <div>
                <span className="type-badge" style={{ background: "#e0e7ff", color: "#4338ca", fontWeight: 700 }}>
                  SYSTEM USER ACCOUNT
                </span>
                <h2 style={{ fontSize: "1.6rem", margin: "0.4rem 0 0.2rem", color: "var(--text-primary, #0f172a)" }}>
                  {inspectingUser.email}
                </h2>
                <p style={{ color: "var(--text-muted, #64748b)", margin: 0 }}>ID: {inspectingUser.id}</p>
              </div>
              <button
                onClick={() => setInspectingUser(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted, #64748b)", padding: "4px" }}
              >
                <FiX size={22} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "var(--bg-surface, #f8fafc)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-card, #e2e8f0)", marginBottom: "1.25rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>Account Type</span>
                <div style={{ fontWeight: 600, color: "var(--text-primary, #1e293b)" }}>{inspectingUser.accountType}</div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>Account Status</span>
                <div>
                  <span className={`status-pill ${inspectingUser.status.toLowerCase()}`}>
                    {inspectingUser.status}
                  </span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>Registered Date</span>
                <div style={{ fontWeight: 600, color: "var(--text-primary, #1e293b)" }}>
                  {new Date(inspectingUser.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>Last Login</span>
                <div style={{ fontWeight: 600, color: "var(--text-primary, #1e293b)" }}>
                  {inspectingUser.lastLoginAt ? new Date(inspectingUser.lastLoginAt).toLocaleString() : "Never"}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <h4 style={{ margin: "0 0 0.5rem", color: "var(--text-primary, #1e293b)" }}>Assigned Administrative Roles</h4>
              <div className="roles-list">
                {inspectingUser.roles.map(r => (
                  <span
                    key={r}
                    className={`role-tag ${r === "ROLE_SUPER_ADMIN" ? "super" : r === "ROLE_ADMIN" ? "admin" : ""}`}
                    style={{ fontSize: "0.85rem", padding: "0.3rem 0.65rem" }}
                  >
                    {r.replace("ROLE_", "")}
                  </span>
                ))}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-card, #e2e8f0)", paddingTop: "1rem" }}>
              <button className="btn-modal-cancel" onClick={() => setInspectingUser(null)}>
                Close
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
