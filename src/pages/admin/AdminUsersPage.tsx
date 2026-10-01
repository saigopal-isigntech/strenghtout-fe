import { useNavigate, useSearchParams } from "react-router-dom";
import React, { useEffect, useState, useMemo } from "react";
import { adminApi } from "../../api/admin";
import type { AdminUserItem, CompanyProfile, CandidateProfile } from "../../types";
import { AdminHeroBanner } from "../../components/admin/AdminHeroBanner";
import {
  FiRefreshCw,
  FiSearch,
  FiMapPin,
  FiExternalLink,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiUsers,
  FiBriefcase,
  FiFilter,
  FiArrowRight,
  FiMoreVertical,
  FiEye,
  FiShield,
} from "react-icons/fi";
import "./AdminUsers.css";

type AdminTab = "USERS" | "COMPANIES" | "CANDIDATES";

const PAGE_SIZE = 10;

const getInitials = (emailOrName?: string) => {
  if (!emailOrName) return "US";
  const name = emailOrName.split("@")[0];
  const parts = name.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const AVATAR_COLORS = [
  { bg: "#dcfce7", text: "#166534" },
  { bg: "#dbeafe", text: "#1e40af" },
  { bg: "#f3e8ff", text: "#6b21a8" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#ccfbf1", text: "#115e59" },
];

const getAvatarStyle = (str?: string) => {
  if (!str) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

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
  const [inspectingUser, setInspectingUser] = useState<AdminUserItem | null>(null);
  
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

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

  const fmtDate = (iso?: string | null) => {
    if (!iso) return "28/09/2026";
    try {
      return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return "28/09/2026";
    }
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

      {/* Hero Banner matching exact reference design */}
      <AdminHeroBanner
          illustrationType="users"
        badgeText="PLATFORM GOVERNANCE"
        badgeIcon={<FiShield size={14} />}
        title="Platform Directory & Governance"
        highlightText="Directory & Governance"
        subtitle="Administrative inspection for registered companies, user accounts, and candidate profiles."
      />

      {/* 3 KPI Summary Stat Cards Row */}
      <div className="au-kpi-grid">
        <div className={`au-kpi-card ${activeTab === "USERS" ? "selected" : ""}`} onClick={() => handleTabChange("USERS")}>
          <div className="au-kpi-top">
            <div className="au-kpi-icon bg-purple"><FiUsers size={20} /></div>
            <span className="au-card-arrow"><FiArrowRight size={14} /></span>
          </div>
          <div className="au-kpi-body">
            <span className="au-kpi-num">{userTotal}</span>
            <span className="au-kpi-title">User Accounts</span>
            <span className="au-kpi-sub">Registered user accounts</span>
          </div>
        </div>

        <div className={`au-kpi-card ${activeTab === "COMPANIES" ? "selected" : ""}`} onClick={() => handleTabChange("COMPANIES")}>
          <div className="au-kpi-top">
            <div className="au-kpi-icon bg-blue"><FiBriefcase size={20} /></div>
            <span className="au-card-arrow"><FiArrowRight size={14} /></span>
          </div>
          <div className="au-kpi-body">
            <span className="au-kpi-num">{companyTotal}</span>
            <span className="au-kpi-title">Companies</span>
            <span className="au-kpi-sub">Registered companies</span>
          </div>
        </div>

        <div className={`au-kpi-card ${activeTab === "CANDIDATES" ? "selected" : ""}`} onClick={() => handleTabChange("CANDIDATES")}>
          <div className="au-kpi-top">
            <div className="au-kpi-icon bg-orange"><FiUser size={20} /></div>
            <span className="au-card-arrow"><FiArrowRight size={14} /></span>
          </div>
          <div className="au-kpi-body">
            <span className="au-kpi-num">{candidateTotal}</span>
            <span className="au-kpi-title">Candidates</span>
            <span className="au-kpi-sub">Registered candidate profiles</span>
          </div>
        </div>
      </div>

      {/* Main Directory Tab Navigation & Refresh Button */}
      <div className="au-tabs-bar">
        <div className="au-tabs-left">
          <button
            className={`au-tab-btn ${activeTab === "USERS" ? "active" : ""}`}
            onClick={() => handleTabChange("USERS")}
          >
            <FiUsers size={15} /> User Accounts ({userTotal})
          </button>
          <button
            className={`au-tab-btn ${activeTab === "COMPANIES" ? "active" : ""}`}
            onClick={() => handleTabChange("COMPANIES")}
          >
            <FiBriefcase size={15} /> Registered Companies & Profiles ({companyTotal})
          </button>
          <button
            className={`au-tab-btn ${activeTab === "CANDIDATES" ? "active" : ""}`}
            onClick={() => handleTabChange("CANDIDATES")}
          >
            <FiUser size={15} /> Registered Candidates & Profiles ({candidateTotal})
          </button>
        </div>

        <button
          className="au-refresh-btn"
          onClick={() => {
            if (activeTab === "USERS") loadUsers();
            if (activeTab === "COMPANIES") loadCompanies();
            if (activeTab === "CANDIDATES") loadCandidates();
          }}
        >
          <FiRefreshCw size={14} /> Refresh Directory
        </button>
      </div>

      {/* Control Card Box: Search, Role Filters & Filter Dropdown */}
      <div className="au-controls-card">
        <div className="au-search-bar">
          <FiSearch size={16} className="au-search-icon" />
          <input
            type="text"
            placeholder={
              activeTab === "USERS"
                ? "Search users by email address, name, role, or company..."
                : activeTab === "COMPANIES"
                ? "Search companies by legal name, email, industry, or city..."
                : "Search candidates by name, email, title, or skills..."
            }
            value={activeTab === "USERS" ? userSearch : activeTab === "COMPANIES" ? companySearch : candidateSearch}
            onChange={(e) => {
              if (activeTab === "USERS") handleUserSearchChange(e.target.value);
              else if (activeTab === "COMPANIES") handleCompanySearchChange(e.target.value);
              else handleCandidateSearchChange(e.target.value);
            }}
          />
          {(activeTab === "USERS" ? userSearch : activeTab === "COMPANIES" ? companySearch : candidateSearch) && (
            <button
              className="au-search-clear"
              onClick={() => {
                if (activeTab === "USERS") handleUserSearchChange("");
                else if (activeTab === "COMPANIES") handleCompanySearchChange("");
                else handleCandidateSearchChange("");
              }}
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {activeTab === "USERS" && (
          <div className="au-role-pills">
            {["ALL", "ADMIN", "CANDIDATE", "COMPANY"].map((r) => (
              <button
                key={r}
                className={`au-role-pill ${roleFilter === r ? "active" : ""}`}
                onClick={() => handleRoleFilterChange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <button className="au-filter-btn">
          <FiFilter size={14} />
          <span>Filters</span>
        </button>
      </div>

      {/* TAB 1: USER ACCOUNTS TABLE */}
      {activeTab === "USERS" && (
        <div className="au-table-card">
          {userLoading ? (
            <div className="au-loading-state">
              <FiRefreshCw className="spin" size={28} />
              <p>Loading user accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="au-empty-state">
              <FiUsers size={42} />
              <h3>No matching user accounts found</h3>
              <p>Try clearing your search term or adjusting role filters.</p>
            </div>
          ) : (
            <>
              <table className="au-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}><input type="checkbox" /></th>
                    <th>USER EMAIL ↕</th>
                    <th>ACCOUNT TYPE</th>
                    <th>ASSIGNED ROLES</th>
                    <th>STATUS ↕</th>
                    <th>CREATED ↕</th>
                    <th>LAST LOGIN ↕</th>
                    <th>ACTIONS ↕</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u) => {
                    const avatarStyle = getAvatarStyle(u.email);
                    const initials = getInitials(u.email);
                    const isCandidate = u.accountType === "CANDIDATE" || u.roles?.includes("ROLE_CANDIDATE");
                    const isCompany = u.accountType === "COMPANY" || u.roles?.includes("ROLE_COMPANY");
                    const isSuper = u.roles?.includes("ROLE_SUPER_ADMIN");
                    const accountLabel = isSuper
                      ? "Super Admin"
                      : u.accountType === "ADMIN"
                      ? "Admin"
                      : isCompany
                      ? "Company Admin"
                      : "Candidate User";

                    return (
                      <tr key={u.id} className="au-table-row">
                        <td><input type="checkbox" /></td>

                        {/* USER EMAIL */}
                        <td>
                          <div className="au-user-cell">
                            <div
                              className="au-avatar"
                              style={{ background: avatarStyle.bg, color: avatarStyle.text }}
                            >
                              {initials}
                            </div>
                            <div className="au-user-info">
                              <strong className="au-user-email">{u.email}</strong>
                              <span className="au-user-sublabel">{accountLabel}</span>
                            </div>
                          </div>
                        </td>

                        {/* ACCOUNT TYPE */}
                        <td>
                          {isCompany ? (
                            <span className="au-badge-type company">
                              <FiBriefcase size={12} /> COMPANY
                            </span>
                          ) : isCandidate ? (
                            <span className="au-badge-type candidate">
                              <FiUser size={12} /> CANDIDATE
                            </span>
                          ) : (
                            <span className="au-badge-type admin">
                              <FiShield size={12} /> ADMIN
                            </span>
                          )}
                        </td>

                        {/* ASSIGNED ROLES */}
                        <td>
                          <div className="au-roles-wrap">
                            {u.roles.map((r) => (
                              <span key={r} className="au-role-tag">
                                {r.replace("ROLE_", "")}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* STATUS */}
                        <td>
                          <span className={`au-status-pill ${u.status === "ACTIVE" ? "active" : "suspended"}`}>
                            <span className="status-dot" />
                            {u.status === "ACTIVE" ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* CREATED */}
                        <td>
                          <span className="au-date-text">{fmtDate(u.createdAt)}</span>
                        </td>

                        {/* LAST LOGIN */}
                        <td>
                          <span className="au-date-text">{fmtDate(u.lastLoginAt || u.createdAt)}</span>
                        </td>

                        {/* ACTIONS */}
                        <td>
                          <div className="au-actions-wrap">
                            <button
                              className="au-btn-profile"
                              onClick={() => handleInspectUser(u)}
                            >
                              <FiEye size={13} /> View Profile
                            </button>

                            <button
                              className={`au-btn-toggle ${u.status === "ACTIVE" ? "inactive" : "active"}`}
                              disabled={updatingId === u.id || isSuper}
                              onClick={() => handleToggleStatus(u)}
                            >
                              <FiUser size={13} /> {u.status === "ACTIVE" ? "Inactive" : "Active"}
                            </button>

                            <button className="au-btn-dots" title="More Options">
                              <FiMoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {renderPagination(userPage, userTotalPages, totalFilteredUsers, setUserPage)}
            </>
          )}
        </div>
      )}

      {/* TAB 2: REGISTERED COMPANIES */}
      {activeTab === "COMPANIES" && (
        <div className="au-table-card">
          {companyLoading ? (
            <div className="au-loading-state">
              <FiRefreshCw className="spin" size={28} />
              <p>Loading company profiles...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="au-empty-state">
              <FiBriefcase size={42} />
              <h3>No matching companies found</h3>
              <p>Try adjusting your search query.</p>
            </div>
          ) : (
            <>
              <table className="au-table">
                <thead>
                  <tr>
                    <th>COMPANY NAME</th>
                    <th>EMAIL ADDRESS</th>
                    <th>INDUSTRY</th>
                    <th>LOCATION</th>
                    <th>REGISTRATION DATE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCompanies.map((c) => {
                    const cName = c.displayName || c.legalName || c.companyName || "Company";
                    const avatarStyle = getAvatarStyle(cName);
                    const initials = getInitials(cName);

                    return (
                      <tr key={c.id} className="au-table-row">
                        <td>
                          <div className="au-user-cell">
                            <div className="au-avatar" style={{ background: avatarStyle.bg, color: avatarStyle.text }}>
                              {initials}
                            </div>
                            <div className="au-user-info">
                              <strong className="au-user-email">{cName}</strong>
                              <span className="au-user-sublabel">{c.website || "Company Profile"}</span>
                            </div>
                          </div>
                        </td>
                        <td><span className="au-date-text">{c.email || "N/A"}</span></td>
                        <td><span className="au-role-tag">{c.industry || "General"}</span></td>
                        <td>
                          <div className="au-location-flex">
                            <FiMapPin size={12} />
                            <span>{c.city || c.headquartersCity || "Unspecified"}</span>
                          </div>
                        </td>
                        <td><span className="au-date-text">{fmtDate(c.createdAt)}</span></td>
                        <td>
                          <div className="au-actions-wrap">
                            <button className="au-btn-profile" onClick={() => navigate('/companies/' + c.id)}>
                              <FiExternalLink size={13} /> View Company
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {renderPagination(companyPage, companyTotalPages, totalFilteredCompanies, setCompanyPage)}
            </>
          )}
        </div>
      )}

      {/* TAB 3: REGISTERED CANDIDATES */}
      {activeTab === "CANDIDATES" && (
        <div className="au-table-card">
          {candidateLoading ? (
            <div className="au-loading-state">
              <FiRefreshCw className="spin" size={28} />
              <p>Loading candidate profiles...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="au-empty-state">
              <FiUser size={42} />
              <h3>No matching candidates found</h3>
              <p>Try adjusting your search query.</p>
            </div>
          ) : (
            <>
              <table className="au-table">
                <thead>
                  <tr>
                    <th>CANDIDATE NAME</th>
                    <th>EMAIL ADDRESS</th>
                    <th>HEADLINE</th>
                    <th>LOCATION</th>
                    <th>REGISTRATION DATE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCandidates.map((cand) => {
                    const candName = cand.fullName || (cand.firstName ? `${cand.firstName} ${cand.lastName || ""}` : "Candidate");
                    const avatarStyle = getAvatarStyle(candName);
                    const initials = getInitials(candName);

                    return (
                      <tr key={cand.id} className="au-table-row">
                        <td>
                          <div className="au-user-cell">
                            <div className="au-avatar" style={{ background: avatarStyle.bg, color: avatarStyle.text }}>
                              {initials}
                            </div>
                            <div className="au-user-info">
                              <strong className="au-user-email">{candName}</strong>
                              <span className="au-user-sublabel">{cand.headline || "Candidate Profile"}</span>
                            </div>
                          </div>
                        </td>
                        <td><span className="au-date-text">{cand.email || "N/A"}</span></td>
                        <td><span className="au-candidate-headline-cell">{cand.headline || "Professional"}</span></td>
                        <td>
                          <div className="au-location-flex">
                            <FiMapPin size={12} />
                            <span>{cand.currentLocation || cand.location || "Unspecified"}</span>
                          </div>
                        </td>
                        <td><span className="au-date-text">{fmtDate(cand.createdAt)}</span></td>
                        <td>
                          <div className="au-actions-wrap">
                            <button className="au-btn-profile" onClick={() => handleInspectCandidate(cand)}>
                              <FiExternalLink size={13} /> View Candidate
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {renderPagination(candidatePage, candidateTotalPages, totalFilteredCandidates, setCandidatePage)}
            </>
          )}
        </div>
      )}

      {/* MODAL: ADMIN USER INSPECTION */}
      {inspectingUser && (
        <div className="modal-overlay" onClick={() => setInspectingUser(null)}>
          <div className="modal-box" style={{ maxWidth: "560px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
              <div>
                <span className="type-badge" style={{ background: "#dbeafe", color: "#1e40af", fontWeight: 700 }}>
                  ADMINISTRATIVE USER ACCOUNT
                </span>
                <h2 style={{ fontSize: "1.6rem", margin: "0.4rem 0 0.2rem", color: "var(--text-primary, #0f172a)" }}>
                  {inspectingUser.email}
                </h2>
                <p style={{ color: "var(--text-muted, #64748b)", margin: 0 }}>System Administrative User</p>
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
                  {fmtDate(inspectingUser.createdAt)}
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
    </div>
  );
};

export default AdminUsersPage;
