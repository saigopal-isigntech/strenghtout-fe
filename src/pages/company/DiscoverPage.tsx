import React, { useState, useEffect, useCallback, useMemo } from "react";
// Helper to normalize external links with protocol
const normalizeExternalUrl = (url?: string | null): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

import { useSearchParams } from "react-router-dom";
import { candidatesApi } from "../../api/candidates";
import { connectionsApi } from "../../api/connections";
import type { CandidateProfile, RoleCatalogItem } from "../../types";
import {
  FiMapPin,
  FiUserPlus,
  FiX,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiSend,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiShare2,
  FiPrinter,
  FiRotateCcw,
  FiSearch,
  FiGrid,
  FiList,
  FiSliders,
  FiUsers,
  FiShield,
  FiGlobe,
  FiLinkedin,
  FiVideo,
  FiBookOpen,
  FiFolder,
      FiClock,
  FiExternalLink,
  FiAward,
  FiUserCheck,
  FiGithub,
} from "react-icons/fi";

import "./Discover.css";

const PAGE_SIZE = 12;

const avatarColors = [
  { bg: "#0d9488", color: "#ffffff" },
  { bg: "#0284c7", color: "#ffffff" },
  { bg: "#7c3aed", color: "#ffffff" },
  { bg: "#059669", color: "#ffffff" },
  { bg: "#d97706", color: "#ffffff" },
  { bg: "#db2777", color: "#ffffff" },
];

const getAvatarStyle = (name: string, index: number = 0) => {
  const charCode = (name || "C").charCodeAt(0);
  return avatarColors[(charCode + index) % avatarColors.length];
};

const getInitials = (name?: string) => {
  if (!name) return "CD";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const DiscoverPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Shortlisting state
  const [discoverTab, setDiscoverTab] = useState<"ALL" | "SHORTLISTED">("ALL");
  const [shortlist, setShortlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("strengthout_shortlist") || "[]"); } catch { return []; }
  });

  const toggleShortlist = (e: React.MouseEvent, candidateId: string) => {
    e.stopPropagation();
    setShortlist(prev => {
      const isStarred = prev.includes(candidateId);
      const next = isStarred ? prev.filter(id => id !== candidateId) : [...prev, candidateId];
      localStorage.setItem("strengthout_shortlist", JSON.stringify(next));
      setToastMsg(isStarred ? "Removed candidate from your shortlist" : "Added candidate to your shortlist!");
      setTimeout(() => setToastMsg(""), 3000);
      return next;
    });
  };

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"relevance" | "completion" | "name">("relevance");

  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [rolesCatalog, setRolesCatalog] = useState<RoleCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedExpRange, setSelectedExpRange] = useState("");
  const [selectedWorkType, setSelectedWorkType] = useState("");

  // Profile modal state
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Candidate selection & Connect request modal state
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [connectCandidates, setConnectCandidates] = useState<CandidateProfile[]>([]);
  const [roleTitle, setRoleTitle] = useState("");
  const [opportunitySummary, setOpportunitySummary] = useState("");
  const [workType, setWorkType] = useState<"REMOTE" | "HYBRID" | "ONSITE">("HYBRID");
  const [companyLocation, setCompanyLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [workTimings, setWorkTimings] = useState("");
  const [experienceRequired, setExperienceRequired] = useState("");
  const [openingsCount, setOpeningsCount] = useState<string | number>("1");
  const [expectedStart, setExpectedStart] = useState("");
  const [sending, setSending] = useState(false);
  const [connectErrors, setConnectErrors] = useState<Record<string, string>>({});

  // Prevent background scrolling when any modal popup is open
  useEffect(() => {
    if (selectedCandidate || connectModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedCandidate, connectModalOpen]);

  useEffect(() => {
    candidatesApi
      .getRolesCatalog()
      .then(res => setRolesCatalog(res.data?.data || []))
      .catch(() => setRolesCatalog([]));
  }, []);

  const search = useCallback(
    async (p: number, searchQ: string) => {
      setLoading(true);
      try {
        const apiParams: Record<string, any> = {
          page: p,
          size: PAGE_SIZE,
        };

        if (searchQ.trim()) {
          apiParams.q = searchQ.trim();
          apiParams.query = searchQ.trim();
        }

        if (selectedRoleId) {
          apiParams.roleIds = selectedRoleId;
          apiParams.roleId = selectedRoleId;
          apiParams.targetRoleId = selectedRoleId;
        }

        if (selectedExpRange === "entry") {
          apiParams.minExperienceMonths = 0;
          apiParams.maxExperienceMonths = 24;
          apiParams.minExperienceYears = 0;
          apiParams.maxExperienceYears = 2;
        } else if (selectedExpRange === "mid") {
          apiParams.minExperienceMonths = 24;
          apiParams.maxExperienceMonths = 60;
          apiParams.minExperienceYears = 2;
          apiParams.maxExperienceYears = 5;
        } else if (selectedExpRange === "senior") {
          apiParams.minExperienceMonths = 60;
          apiParams.maxExperienceMonths = 1200;
          apiParams.minExperienceYears = 5;
          apiParams.maxExperienceYears = 100;
        }

        if (selectedWorkType) {
          apiParams.workTypes = selectedWorkType;
          apiParams.preferredWorkType = selectedWorkType;
        }

        const res = await candidatesApi.search(apiParams);
        const content = res.data?.data?.content || [];
        const totalElements = res.data?.data?.totalElements ?? content.length;

        setCandidates(content);
        setTotal(totalElements);
        setPage(p);
      } catch {
        setCandidates([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [selectedRoleId, selectedExpRange, selectedWorkType]
  );

  useEffect(() => {
    const qFromUrl = searchParams.get("query") || "";
    if (qFromUrl) setQuery(qFromUrl);
    search(0, qFromUrl);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(0, query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, selectedRoleId, selectedExpRange, selectedWorkType, search]);

  const handleInputChange = (val: string) => {
    setQuery(val);
  };

  const handleResetFilters = () => {
    setQuery("");
    setSelectedRoleId("");
    setSelectedExpRange("");
    setSelectedWorkType("");
    search(0, "");
  };

  const hasActiveFilters = Boolean(
    query.trim() || selectedRoleId || selectedExpRange || selectedWorkType
  );

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= Math.ceil(total / PAGE_SIZE)) return;
    search(newPage, query);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  
  const handleCopyShareLink = (cId?: string) => {
    if (!cId) {
      setToastMsg("Candidate profile link is not available");
      setTimeout(() => setToastMsg(""), 3000);
      return;
    }
    const shareUrl = `${window.location.origin}/candidate/${cId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setToastMsg("✓ Candidate profile link copied to clipboard!");
          setTimeout(() => setToastMsg(""), 3500);
        })
        .catch(() => {
          setToastMsg("✓ Profile URL: " + shareUrl);
          setTimeout(() => setToastMsg(""), 5000);
        });
    } else {
      setToastMsg("✓ Profile URL: " + shareUrl);
      setTimeout(() => setToastMsg(""), 5000);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleOpenProfile = async (c: CandidateProfile) => {
    setSelectedCandidate(c);
    setLoadingProfile(true);
    try {
      const candidateId = c.id || (c as any).candidateId;
      if (candidateId) {
        const res = await candidatesApi.getProfile(candidateId);
        if (res.data?.data) {
          setSelectedCandidate(res.data.data);
        }
      }
    } catch (err) {
      console.error("Error loading detailed profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Filter candidates by tab
  const displayedCandidates = useMemo(() => {
    let list = candidates;

    // Filter by Tab
    if (discoverTab === "SHORTLISTED") {
      list = list.filter(c => c.id && shortlist.includes(c.id));
    }

    // Filter by Search Query
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(c => {
        const name = (c.fullName || "").toLowerCase();
        const headline = (c.headline || "").toLowerCase();
        const location = (c.location || (c as any).currentLocation || "").toLowerCase();
        const skillStr = (c.skills || (c as any).topSkills || [])
          .map((s: any) => (typeof s === "string" ? s : (s.skillName || s.name || "")))
          .join(" ")
          .toLowerCase();
        return name.includes(q) || headline.includes(q) || location.includes(q) || skillStr.includes(q);
      });
    }

    // Filter by Experience Range
    if (selectedExpRange) {
      list = list.filter(c => {
        const months = (c as any).totalExperienceMonths ?? (c.totalExperienceYears ? c.totalExperienceYears * 12 : 0);
        const years = months / 12;
        if (selectedExpRange === "entry") return years <= 2;
        if (selectedExpRange === "mid") return years > 2 && years <= 5;
        if (selectedExpRange === "senior") return years > 5;
        return true;
      });
    }

    // Sorting
    if (sortBy === "name") {
      return [...list].sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
    }
    if (sortBy === "completion") {
      return [...list].sort((a, b) => (b.completionPct || 0) - (a.completionPct || 0));
    }
    return list;
  }, [candidates, discoverTab, shortlist, sortBy, query, selectedRoleId, selectedExpRange, selectedWorkType]);

  // Multi-selection handlers
  const toggleSelectCandidate = (e: React.MouseEvent, candidateId: string) => {
    e.stopPropagation();
    setSelectedCandidateIds(prev =>
      prev.includes(candidateId) ? prev.filter(id => id !== candidateId) : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    const pageIds = displayedCandidates.map(c => c.id!).filter(Boolean);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedCandidateIds.includes(id));
    if (allSelected) {
      setSelectedCandidateIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedCandidateIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedCandidateIds([]);
  };

  const handleOpenConnectSingle = (e: React.MouseEvent, candidate: CandidateProfile) => {
    e.stopPropagation();
    setConnectCandidates([candidate]);
    setRoleTitle("");
    setOpportunitySummary("");
    setWorkType("HYBRID");
    setCompanyLocation(candidate.location || (candidate as any).currentLocation || "");
    setSalaryRange("");
    setWorkTimings("");
    setExperienceRequired("");
    setOpeningsCount("1");
    setExpectedStart("");
    setSending(false);
    setConnectErrors({});
    setConnectModalOpen(true);
  };

  const handleOpenConnectSelected = () => {
    const targets = displayedCandidates.filter(c => c.id && selectedCandidateIds.includes(c.id));
    if (targets.length === 0) return;
    setConnectCandidates(targets);
    setRoleTitle("");
    setOpportunitySummary("");
    setWorkType("HYBRID");
    setCompanyLocation("");
    setSalaryRange("");
    setWorkTimings("");
    setExperienceRequired("");
    setOpeningsCount(String(targets.length));
    setExpectedStart("");
    setSending(false);
    setConnectErrors({});
    setConnectModalOpen(true);
  };

  const handleOpenConnectAll = () => {
    if (displayedCandidates.length === 0) return;
    setConnectCandidates(displayedCandidates);
    setRoleTitle("");
    setOpportunitySummary("");
    setWorkType("HYBRID");
    setCompanyLocation("");
    setSalaryRange("");
    setWorkTimings("");
    setExperienceRequired("");
    setOpeningsCount(String(displayedCandidates.length));
    setExpectedStart("");
    setSending(false);
    setConnectErrors({});
    setConnectModalOpen(true);
  };

  const handleSubmitConnect = async () => {
    if (!connectCandidates || connectCandidates.length === 0) return;
    const errors: Record<string, string> = {};
    if (!roleTitle.trim()) errors.roleTitle = "Role title is required";
    if (!opportunitySummary.trim()) errors.opportunitySummary = "Opportunity summary is required";
    if (Object.keys(errors).length > 0) {
      setConnectErrors(errors);
      return;
    }

    setSending(true);
    const totalCount = connectCandidates.length;
    let successCount = 0;
    let conflictCount = 0;
    let failMsg = "";

    try {
      const results = await Promise.allSettled(
        connectCandidates.map(c =>
          connectionsApi.submit({
            candidateId: c.id!,
            roleTitle: roleTitle.trim(),
            opportunitySummary: opportunitySummary.trim(),
            workType,
            location: companyLocation.trim() || undefined,
            salaryRange: salaryRange.trim() || undefined,
            workTimings: workTimings.trim() || undefined,
            experienceRequired: experienceRequired.trim() || undefined,
            openingsCount: openingsCount ? parseInt(String(openingsCount), 10) || 1 : 1,
            expectedStart: expectedStart.trim() || undefined,
          })
        )
      );

      results.forEach(res => {
        if (res.status === "fulfilled") {
          successCount++;
        } else {
          const errMsg = res.reason?.response?.data?.message || res.reason?.message || "";
          if (errMsg.toLowerCase().includes("active connection request already exists") || res.reason?.response?.status === 409) {
            conflictCount++;
          } else {
            failMsg = errMsg;
          }
        }
      });

      if (successCount > 0) {
        if (totalCount === 1) {
          setToastMsg(`Connection request sent to ${connectCandidates[0].fullName}!`);
        } else {
          let msg = `Successfully sent connection requests to ${successCount} candidate${successCount > 1 ? "s" : ""}!`;
          if (conflictCount > 0) {
            msg += ` (${conflictCount} already had active requests).`;
          }
          setToastMsg(msg);
        }
        setSelectedCandidateIds([]);
        setConnectModalOpen(false);
        setTimeout(() => setToastMsg(""), 4000);
      } else {
        if (conflictCount > 0) {
          setConnectErrors({ form: totalCount === 1 ? "An active connection request already exists for this candidate." : `All ${conflictCount} selected candidate(s) already have active requests.` });
        } else {
          setConnectErrors({ form: failMsg || "Failed to send connection requests. Please try again." });
        }
      }
    } catch (err: any) {
      setConnectErrors({ form: err.response?.data?.message || "Failed to send connection request. Please try again." });
    } finally {
      setSending(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="discover-page-container">
      {toastMsg && (
        <div className="toast-notification">
          <FiCheckCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Hero Header Banner matching reference mockup */}
      <div className="discover-hero-banner">
        <svg
          className="hero-bg-waves"
          viewBox="0 0 1000 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M380,220 C380,120 480,30 1000,45 L1000,220 Z"
            fill="#a7f3d0"
            opacity="0.45"
          />
          <path
            d="M440,220 C440,140 580,55 1000,75 L1000,220 Z"
            fill="#6ee7b7"
            opacity="0.2"
          />
        </svg>

        <div className="hero-left-col">
          <h1 className="discover-hero-title">Discover Candidates</h1>
          <p className="discover-hero-sub">
            Explore pre-screened talent, verified skills, and background assessments to build stronger teams.
          </p>


        </div>

        <div className="hero-right-col">
          <div className="hero-feature-card">
            <div className="feature-item">
              <FiCheckCircle size={15} className="check-icon" />
              <span>Verified Profiles</span>
            </div>
            <div className="feature-item">
              <FiCheckCircle size={15} className="check-icon" />
              <span>Skill Assessments</span>
            </div>
            <div className="feature-item">
              <FiCheckCircle size={15} className="check-icon" />
              <span>Video Introductions</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. View Filter Pills (All Candidates vs Shortlisted Candidates) */}
      <div className="view-tabs-row">
        <div className="tabs-pill-group">
          <button
            type="button"
            className={`tab-pill ${discoverTab === "ALL" ? "active" : ""}`}
            onClick={() => { setDiscoverTab("ALL"); setSelectedCandidateIds([]); }}
          >
            All Candidates
          </button>
          <button
            type="button"
            className={`tab-pill ${discoverTab === "SHORTLISTED" ? "active" : ""}`}
            onClick={() => { setDiscoverTab("SHORTLISTED"); setSelectedCandidateIds([]); }}
          >
            <FiStar size={14} className="star-icon" />
            <span>Shortlisted Candidates</span>
            <span className="count-pill">{shortlist.length}</span>
          </button>
        </div>
      </div>

      {/* 3. Search & Filter Bar Row */}
      <div className="discover-toolbar">
        <div className="search-input-box">
          <FiSearch size={18} className="search-icon-left" />
          <input
            type="text"
            className="search-field"
            placeholder="Search by candidate name, headline, skills, or location..."
            value={query}
            onChange={e => handleInputChange(e.target.value)}
          />
          {query && (
            <button type="button" className="clear-search-btn" onClick={() => handleInputChange("")}>×</button>
          )}
        </div>

        <select
          value={selectedRoleId}
          onChange={e => setSelectedRoleId(e.target.value)}
          className="toolbar-select"
        >
          <option value="">All Target Roles</option>
          {rolesCatalog.map(r => (
            <option key={r.id} value={r.id}>{r.roleName}</option>
          ))}
        </select>

        <select
          value={selectedExpRange}
          onChange={e => setSelectedExpRange(e.target.value)}
          className="toolbar-select"
        >
          <option value="">All Experience Levels</option>
          <option value="entry">Entry Level (0 - 2 yrs)</option>
          <option value="mid">Mid Level (2 - 5 yrs)</option>
          <option value="senior">Senior Level (5+ yrs)</option>
        </select>

        <select
          value={selectedWorkType}
          onChange={e => setSelectedWorkType(e.target.value)}
          className="toolbar-select"
        >
          <option value="">All Work Types</option>
          <option value="REMOTE">Remote</option>
          <option value="HYBRID">Hybrid</option>
          <option value="ONSITE">On-Site</option>
        </select>

        <button
          type="button"
          className="btn-search-primary"
          onClick={() => search(0, query)}
          disabled={loading}
        >
          <FiSearch size={15} />
          <span>{loading ? "Searching..." : "Search"}</span>
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn-reset-filters"
            onClick={handleResetFilters}
            title="Reset all search filters"
          >
            <FiRotateCcw size={14} /> Clear
          </button>
        )}
      </div>

      {/* 4. Results Info Bar, Selection Actions & Sort / View Mode */}
      <div className="results-bar" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            {discoverTab === "SHORTLISTED" && displayedCandidates.length > 0 && (
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  background: "#f1f5f9",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  userSelect: "none",
                }}
                onClick={handleSelectAll}
              >
                <input
                  type="checkbox"
                  checked={displayedCandidates.length > 0 && displayedCandidates.every(c => c.id && selectedCandidateIds.includes(c.id))}
                  onChange={() => {}}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#059669" }}
                />
                <span>Select All ({displayedCandidates.length})</span>
              </label>
            )}

            <div className="results-count-text">
              Showing <strong>{total > 0 ? page * PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * PAGE_SIZE, total)}</strong> of <strong>{total}</strong> candidates
            </div>
          </div>

          <div className="results-right-controls">
            {/* Quick Connect with All Shortlisted Button */}
            {discoverTab === "SHORTLISTED" && displayedCandidates.length > 0 && (
              <button
                type="button"
                className="btn-connect-all-header"
                onClick={handleOpenConnectAll}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#ecfdf5",
                  color: "#047857",
                  border: "1px solid #a7f3d0",
                  padding: "0 14px",
                  height: "38px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                title="Send connection request to all shortlisted candidates"
              >
                <FiSend size={14} /> Connect with All Shortlisted ({displayedCandidates.length})
              </button>
            )}

            <div className="sort-dropdown-wrapper">
              <FiSliders size={14} className="sort-icon" />
              <span className="sort-label">Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="sort-select"
              >
                <option value="relevance">Most Relevant</option>
                <option value="completion">Profile Completion</option>
                <option value="name">Candidate Name</option>
              </select>
            </div>

            <div className="view-mode-toggle">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <FiGrid size={16} />
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List View"
              >
                <FiList size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Floating / Active Bulk Selection Bar (Only in Shortlisted view) */}
        {discoverTab === "SHORTLISTED" && selectedCandidateIds.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(135deg, #065f46, #047857)",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "12px",
              boxShadow: "0 4px 14px rgba(5, 150, 105, 0.25)",
              flexWrap: "wrap",
              gap: "10px",
              animation: "fadeIn 0.2s ease-in-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontWeight: 700, fontSize: "0.92rem", letterSpacing: "0.2px" }}>
                ✓ {selectedCandidateIds.length} candidate{selectedCandidateIds.length > 1 ? "s" : ""} selected
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={handleOpenConnectSelected}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  background: "#ffffff",
                  color: "#065f46",
                  border: "none",
                  padding: "7px 16px",
                  borderRadius: "8px",
                  fontSize: "0.88rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                }}
              >
                <FiUserPlus size={16} /> Connect with Selected ({selectedCandidateIds.length})
              </button>

              <button
                type="button"
                onClick={handleClearSelection}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "rgba(255,255,255,0.2)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.4)",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <FiX size={14} /> Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Candidates Grid / List Stream */}
      {loading ? (
        <div className="discover-loading-state">
          <div className="spinner" />
          <span>Searching verified candidate profiles...</span>
        </div>
      ) : displayedCandidates.length === 0 ? (
        <div className="discover-empty-state">
          <div className="empty-icon-wrapper">
            <FiUsers size={32} />
          </div>
          <h3>No candidates match your criteria</h3>
          <p>Try adjusting your search keywords, role filter, or experience level.</p>
          {hasActiveFilters && (
            <button type="button" className="btn-reset-filters-large" onClick={handleResetFilters}>
              <FiRotateCcw size={15} /> Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className={`candidates-container ${viewMode === "list" ? "mode-list" : "mode-grid"}`}>
          {displayedCandidates.map((c, idx) => {
            const isStarred = c.id && shortlist.includes(c.id);
            const avatarStyle = getAvatarStyle(c.fullName || "", idx);
            const initials = getInitials(c.fullName);

            const skillList = c.skills || (c as any).topSkills || [];

            return (
              <div
                key={c.id || idx}
                className={`candidate-card-item ${isStarred ? "is-starred" : ""} ${c.id && selectedCandidateIds.includes(c.id) ? "is-card-selected" : ""}`}
                onClick={() => handleOpenProfile(c)}
                style={discoverTab === "SHORTLISTED" && c.id && selectedCandidateIds.includes(c.id) ? { borderColor: "#059669", background: "#f0fdf4", boxShadow: "0 4px 14px rgba(5, 150, 105, 0.12)" } : {}}
              >
                {/* Top Row: Selection Checkbox (Shortlisted tab only), Initials Avatar, Name, Headline, Location, Star Button */}
                <div className="card-header-row" style={{ position: "relative" }}>
                  {discoverTab === "SHORTLISTED" && c.id && (
                    <div
                      style={{
                        marginRight: "2px",
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        padding: "2px",
                      }}
                      onClick={e => toggleSelectCandidate(e, c.id!)}
                      title={selectedCandidateIds.includes(c.id) ? "Deselect candidate" : "Select candidate for bulk connect"}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCandidateIds.includes(c.id)}
                        onChange={() => {}}
                        style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#059669" }}
                      />
                    </div>
                  )}
                  {(c.avatarUrl || (c as any).avatarUrl) ? (
                    <img
                      src={c.avatarUrl || (c as any).avatarUrl}
                      alt={c.fullName || "Candidate"}
                      className="avatar-photo-box"
                      onError={e => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const sibling = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement;
                        if (sibling) sibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="avatar-initials-box"
                    style={{
                      background: avatarStyle.bg,
                      color: avatarStyle.color,
                      display: (c.avatarUrl || (c as any).avatarUrl) ? 'none' : 'flex'
                    }}
                  >
                    {initials}
                  </div>

                  <div className="candidate-info-col">
                    <div className="candidate-name-row">
                      <h3 className="candidate-name" title={c.fullName}>{c.fullName || "Candidate User"}</h3>
                    </div>
                    <p className="candidate-headline" title={c.headline}>
                      {c.headline || "Professional Candidate Profile"}
                    </p>
                    <div className="candidate-location">
                      <FiMapPin size={13} className="loc-icon" />
                      <span>{c.location || (c as any).currentLocation || "Location not set"}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`btn-star-bookmark ${isStarred ? "starred" : ""}`}
                    onClick={e => toggleShortlist(e, c.id!)}
                    title={isStarred ? "Remove from shortlist" : "Add to shortlist"}
                  >
                    <FiStar size={18} fill={isStarred ? "#f59e0b" : "none"} color={isStarred ? "#f59e0b" : "#9ca3af"} />
                  </button>
                </div>

                {/* Skill Pills */}
                {skillList && skillList.length > 0 && (
                  <div className="skills-row">
                    {skillList.slice(0, 3).map((sk: any, sIdx: number) => (
                      <span key={sIdx} className="skill-pill-tag">
                        {typeof sk === "string" ? sk : (sk.name || sk.skillName || "Skill")}
                      </span>
                    ))}
                    {skillList.length > 3 && (
                      <span className="skill-more-tag">+{skillList.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Meta details (Experience level, years) */}
                <div className="card-meta-row">
                  <div className="meta-item">
                    <FiBriefcase size={13} className="meta-icon" />
                    <span>{c.experienceStatus || "Entry / Fresher"}</span>
                  </div>
                  <div className="meta-item">
                    <FiCalendar size={13} className="meta-icon" />
                    <span>{c.totalExperienceYears || ((c as any).totalExperienceMonths ? Math.round((c as any).totalExperienceMonths / 12) : 0)} years exp</span>
                  </div>
                </div>

                {/* Bottom Connect Action Button */}
                <div className="card-action-footer">
                  <button
                    type="button"
                    className="btn-connect-candidate"
                    onClick={e => handleOpenConnectSingle(e, c)}
                  >
                    <FiUserPlus size={15} />
                    <span>Connect with Candidate</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="discover-pagination-bar">
          <button
            type="button"
            className="pagination-nav-btn"
            disabled={page === 0}
            onClick={() => handlePageChange(page - 1)}
          >
            <FiChevronLeft size={16} /> Previous
          </button>
          <div className="pagination-page-nums">
            {Array.from({ length: totalPages }, (_, i) => i).map(p => (
              <button
                key={p}
                type="button"
                className={`page-num-btn ${p === page ? "active" : ""}`}
                onClick={() => handlePageChange(p)}
              >
                {p + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="pagination-nav-btn"
            disabled={page >= totalPages - 1}
            onClick={() => handlePageChange(page + 1)}
          >
            Next <FiChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Comprehensive Candidate Public Profile Modal */}
      {selectedCandidate && (
        <div className="modal-backdrop" onClick={() => setSelectedCandidate(null)}>
          <div className="modal-dialog-large candidate-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-bar">
              <div className="modal-header-title-group">
                <h2>Candidate Profile Details</h2>
                <span className="profile-verified-badge">
                  <FiShield size={13} /> Verified Talent
                </span>
              </div>
              <div className="modal-header-actions">
                <button
                  type="button"
                  className="btn-modal-action-header"
                  onClick={() => handleCopyShareLink(selectedCandidate.id || (selectedCandidate as any).candidateId)}
                  title="Share candidate profile link"
                >
                  <FiShare2 size={14} /> <span>Share Profile</span>
                </button>
                <button
                  type="button"
                  className="btn-modal-action-header"
                  onClick={handleExportPDF}
                  title="Export candidate profile as PDF"
                >
                  <FiPrinter size={14} /> <span>Export as PDF</span>
                </button>
                <button type="button" className="btn-close-modal" onClick={() => setSelectedCandidate(null)}>
                  <FiX size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body-content candidate-profile-scroll-body">
              {/* Top Profile Card */}
              <div className="profile-modal-top-card">
                {(selectedCandidate.avatarUrl || (selectedCandidate as any).avatarUrl) ? (
                  <img
                    src={selectedCandidate.avatarUrl || (selectedCandidate as any).avatarUrl}
                    alt={selectedCandidate.fullName || "Candidate"}
                    className="avatar-photo-large"
                    onError={e => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      const sibling = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement;
                      if (sibling) sibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="avatar-initials-large"
                  style={{
                    background: getAvatarStyle(selectedCandidate.fullName).bg,
                    color: getAvatarStyle(selectedCandidate.fullName).color,
                    display: (selectedCandidate.avatarUrl || (selectedCandidate as any).avatarUrl) ? 'none' : 'flex'
                  }}
                >
                  {getInitials(selectedCandidate.fullName)}
                </div>
                <div className="profile-top-main-info">
                  <h3 className="modal-candidate-name">{selectedCandidate.fullName}</h3>
                  <p className="modal-candidate-headline">{selectedCandidate.headline || "Professional Candidate Profile"}</p>
                  <div className="modal-meta-pills-row">
                    <span className="modal-meta-pill">
                      <FiMapPin size={13} /> {selectedCandidate.location || (selectedCandidate as any).currentLocation || "Location not set"}
                    </span>
                    <span className="modal-meta-pill">
                      <FiBriefcase size={13} /> {selectedCandidate.totalExperienceYears || ((selectedCandidate as any).totalExperienceMonths ? Math.round((selectedCandidate as any).totalExperienceMonths / 12) : 0)} Years Exp
                    </span>
                    {selectedCandidate.noticePeriod && (
                      <span className="modal-meta-pill highlight">
                        <FiClock size={13} /> {selectedCandidate.noticePeriod} Notice
                      </span>
                    )}
                    {selectedCandidate.experienceStatus && (
                      <span className="modal-meta-pill">
                        <FiUserCheck size={13} /> {selectedCandidate.experienceStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact & External Links */}
              {((selectedCandidate as any).githubUrl || selectedCandidate.linkedinUrl || selectedCandidate.portfolioUrl) && (
                <div className="profile-links-bar">
                  {(selectedCandidate as any).githubUrl && (
                    <a href={normalizeExternalUrl((selectedCandidate as any).githubUrl)} target="_blank" rel="noopener noreferrer" className="modal-link-btn github">
                      <FiGithub size={14} /> GitHub Profile <FiExternalLink size={12} />
                    </a>
                  )}
                  {selectedCandidate.linkedinUrl && (
                    <a href={normalizeExternalUrl(selectedCandidate.linkedinUrl)} target="_blank" rel="noopener noreferrer" className="modal-link-btn linkedin">
                      <FiLinkedin size={14} /> LinkedIn <FiExternalLink size={12} />
                    </a>
                  )}
                  {selectedCandidate.portfolioUrl && (
                    <a href={normalizeExternalUrl(selectedCandidate.portfolioUrl)} target="_blank" rel="noopener noreferrer" className="modal-link-btn portfolio">
                      <FiGlobe size={14} /> Portfolio <FiExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}

              {loadingProfile && (
                <div className="modal-loading-inline">
                  <div className="spinner-sm" />
                  <span>Loading full candidate profile details...</span>
                </div>
              )}

              {/* Summary / Bio */}
              {selectedCandidate.videoUrl && (
                <div id="candidate-video-section" className="modal-profile-section video-intro-section">
                  <h4 className="section-title"><FiVideo size={16} /> Candidate Video Introduction</h4>
                  <div className="video-player-container">
                    <video
                      src={selectedCandidate.videoUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="candidate-video-player"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}

              {(selectedCandidate.summary || (selectedCandidate as any).bio) && (
                <div className="modal-profile-section">
                  <h4 className="section-title"><FiUserCheck size={16} /> Professional Summary</h4>
                  <p className="section-body-text">{selectedCandidate.summary || (selectedCandidate as any).bio}</p>
                </div>
              )}

              {/* Skills */}
              {((selectedCandidate.skills && selectedCandidate.skills.length > 0) || ((selectedCandidate as any).topSkills && (selectedCandidate as any).topSkills.length > 0)) && (
                <div className="modal-profile-section">
                  <h4 className="section-title"><FiAward size={16} /> Technical Skills & Competencies</h4>
                  <div className="modal-skills-grid">
                    {(selectedCandidate.skills || (selectedCandidate as any).topSkills || []).map((sk: any, idx: number) => {
                      const skillName = typeof sk === "string" ? sk : (sk.skillName || sk.name || sk.skill?.name || "Skill");
                      return (
                        <div key={idx} className="modal-skill-card-badge">
                          <span className="skill-badge-name">{skillName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {selectedCandidate.experiences && selectedCandidate.experiences.length > 0 && (
                <div className="modal-profile-section">
                  <h4 className="section-title"><FiBriefcase size={16} /> Work Experience</h4>
                  <div className="modal-timeline-list">
                    {selectedCandidate.experiences.map((exp: any, idx: number) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-bullet" />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <h5 className="timeline-role">{exp.title || "Role Title"}</h5>
                            <span className="timeline-dates">
                              {exp.startDate || "N/A"} — {exp.isCurrent ? "Present" : (exp.endDate || "N/A")}
                            </span>
                          </div>
                          <div className="timeline-company">{exp.companyName || "Company"}</div>
                          {exp.description && <p className="timeline-desc">{exp.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {selectedCandidate.projects && selectedCandidate.projects.length > 0 && (
                <div className="modal-profile-section">
                  <h4 className="section-title"><FiFolder size={16} /> Key Projects</h4>
                  <div className="modal-projects-grid">
                    {selectedCandidate.projects.map((proj: any, idx: number) => (
                      <div key={idx} className="modal-project-card">
                        <div className="project-card-header">
                          <h5>{proj.name || "Project"}</h5>
                          <div className="project-links-row">
                            {(() => {
                              const rawUrl = proj.githubUrl || proj.github || proj.codeUrl || (selectedCandidate as any).githubUrl;
                              const finalUrl = normalizeExternalUrl(rawUrl) || `https://github.com/search?q=${encodeURIComponent(proj.name || 'project')}`;
                              return (
                                <a
                                  href={finalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="proj-link github-proj-link"
                                  onClick={e => e.stopPropagation()}
                                  title={`Open ${proj.name || 'Project'} repository`}
                                >
                                  <FiGithub size={13} /> GitHub Repository <FiExternalLink size={11} />
                                </a>
                              );
                            })()}
                            {(proj.demoUrl || proj.liveUrl || proj.projectUrl) && (
                              <a
                                href={normalizeExternalUrl(proj.demoUrl || proj.liveUrl || proj.projectUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="proj-link demo-proj-link"
                                onClick={e => e.stopPropagation()}
                              >
                                <FiExternalLink size={13} /> Live Demo
                              </a>
                            )}
                          </div>
                        </div>
                        {proj.summary && <p className="proj-summary">{proj.summary}</p>}
                        {proj.responsibilities && <p className="proj-resp"><strong>Key Contributions:</strong> {proj.responsibilities}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {((selectedCandidate.education && selectedCandidate.education.length > 0) || ((selectedCandidate as any).educations && (selectedCandidate as any).educations.length > 0)) && (
                <div className="modal-profile-section">
                  <h4 className="section-title"><FiBookOpen size={16} /> Education & Academic Credentials</h4>
                  <div className="modal-education-list">
                    {(selectedCandidate.education || (selectedCandidate as any).educations || []).map((edu: any, idx: number) => (
                      <div key={idx} className="education-item-row">
                        <div className="edu-icon-box"><FiBookOpen size={16} /></div>
                        <div className="edu-info">
                          <h5 className="edu-degree">{edu.qualification} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}</h5>
                          <div className="edu-school">{edu.institution}</div>
                          {(edu.startYear || edu.endYear) && (
                            <div className="edu-years">{edu.startYear || ""} - {edu.endYear || "Present"}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Role Interests */}
              {selectedCandidate.roleInterests && selectedCandidate.roleInterests.length > 0 && (
                <div className="modal-profile-section">
                  <h4 className="section-title"><FiUsers size={16} /> Target Role Interests</h4>
                  <div className="modal-interests-list">
                    {selectedCandidate.roleInterests.map((ri: any, idx: number) => (
                      <div key={idx} className="role-interest-chip">
                        <strong>{ri.roleName || "Target Role"}</strong>
                        {ri.workType && <span className="work-type-badge">{ri.workType}</span>}
                        {ri.preferredLocation && <span className="pref-loc"><FiMapPin size={11} /> {ri.preferredLocation}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer-bar">
              <div className="modal-footer-left">
                <button
                  type="button"
                  className="btn-modal-action-secondary"
                  onClick={() => handleCopyShareLink(selectedCandidate.id || (selectedCandidate as any).candidateId)}
                  title="Share Candidate Profile link"
                >
                  <FiShare2 size={15} /> Share Profile
                </button>
                <button
                  type="button"
                  className="btn-modal-action-secondary"
                  onClick={handleExportPDF}
                  title="Export Candidate Profile as PDF"
                >
                  <FiPrinter size={15} /> Export as PDF
                </button>
              </div>
              <div className="modal-footer-right">
                <button
                  type="button"
                  className="btn-close-secondary"
                  onClick={() => setSelectedCandidate(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-connect-modal"
                  onClick={e => {
                    const c = selectedCandidate;
                    setSelectedCandidate(null);
                    handleOpenConnectSingle(e, c);
                  }}
                >
                  <FiUserPlus size={16} /> Connect with Candidate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Request Modal */}
      {connectModalOpen && connectCandidates.length > 0 && (
        <div className="modal-backdrop" onClick={() => setConnectModalOpen(false)}>
          <div className="modal-dialog-connect" onClick={e => e.stopPropagation()}>
            <div className="modal-header-bar">
              <h2>{connectCandidates.length > 1 ? `Connect with ${connectCandidates.length} Candidates` : "Connect with Candidate"}</h2>
              <button type="button" className="btn-close-modal" onClick={() => setConnectModalOpen(false)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="modal-body-content" style={{ maxHeight: "78vh", overflowY: "auto" }}>
              <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                {connectCandidates.length === 1 ? (
                  <p className="connect-subtitle" style={{ margin: 0, color: "#334155", fontSize: "0.92rem" }}>
                    Sending connection request to <strong>{connectCandidates[0].fullName}</strong>
                  </p>
                ) : (
                  <div>
                    <p style={{ margin: "0 0 6px 0", color: "#1e293b", fontSize: "0.9rem", fontWeight: 700 }}>
                      Sending connection request to {connectCandidates.length} candidates:
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "80px", overflowY: "auto" }}>
                      {connectCandidates.map(c => (
                        <span key={c.id} style={{ background: "#e2e8f0", color: "#334155", padding: "3px 8px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 600 }}>
                          {c.fullName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {connectErrors.form && (
                <div style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "10px 14px", borderRadius: "8px", fontSize: "0.88rem" }}>
                  {connectErrors.form}
                </div>
              )}

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1e293b", marginBottom: "4px", display: "block" }}>
                  Target Role Title <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Senior Full Stack Developer / Data Engineer"
                  value={roleTitle}
                  onChange={e => setRoleTitle(e.target.value)}
                />
                {connectErrors.roleTitle && <span className="field-error" style={{ color: "#ef4444", fontSize: "0.82rem" }}>{connectErrors.roleTitle}</span>}
              </div>

              <div className="form-row-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1e293b", marginBottom: "4px", display: "block" }}>
                    Work Type
                  </label>
                  <select
                    className="form-input"
                    value={workType}
                    onChange={e => setWorkType(e.target.value as any)}
                  >
                    <option value="HYBRID">Hybrid</option>
                    <option value="REMOTE">Remote</option>
                    <option value="ONSITE">On-Site</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1e293b", marginBottom: "4px", display: "block" }}>
                    Company / Job Location
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hyderabad, India / Bengaluru"
                    value={companyLocation}
                    onChange={e => setCompanyLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1e293b", marginBottom: "4px", display: "block" }}>
                    Salary / Compensation Range
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ₹12 - 18 LPA / $90,000 - $120,000"
                    value={salaryRange}
                    onChange={e => setSalaryRange(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1e293b", marginBottom: "4px", display: "block" }}>
                    Work Timings / Shift
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 9:00 AM - 6:00 PM IST / Flexible"
                    value={workTimings}
                    onChange={e => setWorkTimings(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1e293b", marginBottom: "4px", display: "block" }}>
                    Experience Required
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 2+ Years / Fresher / 3-5 Years"
                    value={experienceRequired}
                    onChange={e => setExperienceRequired(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1e293b", marginBottom: "4px", display: "block" }}>
                    No. of Openings / Members to Hire
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="e.g. 1, 2, 5 profiles"
                    value={openingsCount}
                    onChange={e => setOpeningsCount(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1e293b", marginBottom: "4px", display: "block" }}>
                  Expected Joining Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={expectedStart}
                  onChange={e => setExpectedStart(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1e293b", marginBottom: "4px", display: "block" }}>
                  Opportunity Summary <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Describe key responsibilities, role perks, and candidate expectations..."
                  value={opportunitySummary}
                  onChange={e => setOpportunitySummary(e.target.value)}
                />
                {connectErrors.opportunitySummary && <span className="field-error" style={{ color: "#ef4444", fontSize: "0.82rem" }}>{connectErrors.opportunitySummary}</span>}
              </div>
            </div>
            <div className="modal-footer-bar">
              <button
                type="button"
                className="btn-submit-connect"
                onClick={handleSubmitConnect}
                disabled={sending}
              >
                {sending ? `Sending to ${connectCandidates.length} candidate${connectCandidates.length > 1 ? "s" : ""}...` : connectCandidates.length > 1 ? `Submit Request for ${connectCandidates.length} Candidates` : "Submit Connection Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;
