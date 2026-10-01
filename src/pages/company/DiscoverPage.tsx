import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  FiChevronLeft,
  FiChevronRight,
  FiStar,
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
import { validateRequired } from "../../utils/validators";
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

  // Connect request modal state
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [connectCandidate, setConnectCandidate] = useState<CandidateProfile | null>(null);
  const [roleTitle, setRoleTitle] = useState("");
  const [opportunitySummary, setOpportunitySummary] = useState("");
  const [workType, setWorkType] = useState<"REMOTE" | "HYBRID" | "ONSITE">("HYBRID");
  const [sending, setSending] = useState(false);
  const [connectErrors, setConnectErrors] = useState<Record<string, string>>({});

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

  const handleOpenConnect = (e: React.MouseEvent, c: CandidateProfile) => {
    e.stopPropagation();
    setConnectCandidate(c);
    setRoleTitle("");
    setOpportunitySummary("");
    setWorkType("HYBRID");
    setSending(false);
    setConnectErrors({});
    setConnectModalOpen(true);
  };

  const handleSubmitConnect = async () => {
    if (!connectCandidate?.id) return;

    const errors: Record<string, string> = {};
    const rErr = validateRequired(roleTitle, "Role title", 3);
    if (rErr) errors.roleTitle = rErr;

    const oErr = validateRequired(opportunitySummary, "Opportunity summary", 10);
    if (oErr) errors.opportunitySummary = oErr;

    if (Object.keys(errors).length > 0) {
      setConnectErrors(errors);
      return;
    }

    setSending(true);
    try {
      await connectionsApi.submit({
        candidateId: connectCandidate.id,
        roleTitle: roleTitle.trim(),
        opportunitySummary: opportunitySummary.trim(),
        workType,
      });
      setToastMsg(`Successfully sent connection request to ${connectCandidate.fullName}!`);
      setConnectModalOpen(false);
      setTimeout(() => setToastMsg(""), 4000);
    } catch {
      setConnectErrors(prev => ({ ...prev, submit: "Failed to submit request. Please try again." }));
    } finally {
      setSending(false);
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
            onClick={() => setDiscoverTab("ALL")}
          >
            All Candidates
          </button>
          <button
            type="button"
            className={`tab-pill ${discoverTab === "SHORTLISTED" ? "active" : ""}`}
            onClick={() => setDiscoverTab("SHORTLISTED")}
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

      {/* 4. Results Info Bar & Sort / View Mode */}
      <div className="results-bar">
        <div className="results-count-text">
          Showing <strong>{total > 0 ? page * PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * PAGE_SIZE, total)}</strong> of <strong>{total}</strong> candidates
        </div>

        <div className="results-right-controls">
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
                className={`candidate-card-item ${isStarred ? "is-starred" : ""}`}
                onClick={() => handleOpenProfile(c)}
              >
                {/* Top Row: Initials Avatar, Name, Headline, Location, Star Button */}
                <div className="card-header-row">
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
                    onClick={e => handleOpenConnect(e, c)}
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
              <button type="button" className="btn-close-modal" onClick={() => setSelectedCandidate(null)}>
                <FiX size={18} />
              </button>
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
              <div className="profile-links-bar">
                
                
                {(selectedCandidate as any).githubUrl && (
                  <a href={(selectedCandidate as any).githubUrl} target="_blank" rel="noopener noreferrer" className="modal-link-btn github">
                    <FiGithub size={14} /> GitHub <FiExternalLink size={12} />
                  </a>
                )}
                {selectedCandidate.linkedinUrl && (
                  <a href={selectedCandidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="modal-link-btn linkedin">
                    <FiLinkedin size={14} /> LinkedIn <FiExternalLink size={12} />
                  </a>
                )}
                {selectedCandidate.portfolioUrl && (
                  <a href={selectedCandidate.portfolioUrl} target="_blank" rel="noopener noreferrer" className="modal-link-btn portfolio">
                    <FiGlobe size={14} /> Portfolio <FiExternalLink size={12} />
                  </a>
                )}
                
                {selectedCandidate.videoUrl && (
                  <button
                    type="button"
                    className="modal-link-btn video"
                    onClick={() => {
                      const el = document.getElementById('candidate-video-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <FiVideo size={14} /> Watch Video Intro
                  </button>
                )}
              </div>

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
                            {(proj.githubUrl || proj.github || proj.codeUrl || (selectedCandidate as any).githubUrl) && (
                              <a href={proj.githubUrl || proj.github || proj.codeUrl || (selectedCandidate as any).githubUrl} target="_blank" rel="noopener noreferrer" className="proj-link github-proj-link">
                                <FiGithub size={13} /> GitHub Repository <FiExternalLink size={11} />
                              </a>
                            )}
                            {(proj.demoUrl || proj.liveUrl || proj.projectUrl) && (
                              <a href={proj.demoUrl || proj.liveUrl || proj.projectUrl} target="_blank" rel="noopener noreferrer" className="proj-link demo-proj-link">
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
                  handleOpenConnect(e, c);
                }}
              >
                <FiUserPlus size={16} /> Connect with Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Request Modal */}
      {connectModalOpen && connectCandidate && (
        <div className="modal-backdrop" onClick={() => setConnectModalOpen(false)}>
          <div className="modal-dialog-connect" onClick={e => e.stopPropagation()}>
            <div className="modal-header-bar">
              <h2>Connect with Candidate</h2>
              <button type="button" className="btn-close-modal" onClick={() => setConnectModalOpen(false)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="modal-body-content">
              <p className="connect-subtitle">
                Sending connection request to <strong>{connectCandidate.fullName}</strong>
              </p>

              <div className="form-group">
                <label>Target Role Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Full Stack Developer"
                  value={roleTitle}
                  onChange={e => setRoleTitle(e.target.value)}
                />
                {connectErrors.roleTitle && <span className="field-error">{connectErrors.roleTitle}</span>}
              </div>

              <div className="form-group">
                <label>Opportunity Summary *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Provide a short description of the role and opportunity..."
                  value={opportunitySummary}
                  onChange={e => setOpportunitySummary(e.target.value)}
                />
                {connectErrors.opportunitySummary && <span className="field-error">{connectErrors.opportunitySummary}</span>}
              </div>

              <div className="form-group">
                <label>Preferred Work Type</label>
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
            </div>
            <div className="modal-footer-bar">
              <button
                type="button"
                className="btn-submit-connect"
                onClick={handleSubmitConnect}
                disabled={sending}
              >
                {sending ? "Sending..." : "Submit Connection Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;
