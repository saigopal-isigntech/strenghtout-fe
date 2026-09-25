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
  FiBookOpen,
  FiAward,
  FiCalendar,
  FiGithub,
  FiVideo,
  FiFileText,
  FiCheckCircle,
} from "react-icons/fi";
import { validateRequired } from "../../utils/validators";
import "./Discover.css";

const DiscoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get("q") || "";

  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [rolesCatalog, setRolesCatalog] = useState<RoleCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(qParam);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedExpRange, setSelectedExpRange] = useState<string>("");
  const [selectedWorkType, setSelectedWorkType] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [_page, setPage] = useState(0); void _page;

  // Candidate Details Popup Modal state
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [candidateDetail, setCandidateDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Connect modal state
  const [connectModal, setConnectModal] = useState<{ candidateId: string; name: string } | null>(null);
  const [roleTitle, setRoleTitle] = useState("");
  const [opportunitySummary, setOpportunitySummary] = useState("");
  const [workType, setWorkType] = useState("REMOTE");
  const [connectErrors, setConnectErrors] = useState<Record<string, string>>({});
  const [connectTouched, setConnectTouched] = useState(false);
  const [sending, setSending] = useState(false);

  const [toastMsg, setToastMsg] = useState("");

  // Load roles catalog on mount
  useEffect(() => {
    candidatesApi.getRolesCatalog().then(res => {
      if (res.data?.data) {
        setRolesCatalog(res.data.data);
      }
    }).catch(() => {});
  }, []);

  // Sync state if URL query parameter changes
  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  const search = useCallback(async (p = 0, searchTerms = query) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: p, size: 50 };
      if (searchTerms.trim()) params.q = searchTerms.trim();
      if (selectedRoleId) params.roleIds = [selectedRoleId];
      if (selectedWorkType) params.workTypes = [selectedWorkType];

      if (selectedExpRange === "entry") {
        params.maxExperienceMonths = 24;
      } else if (selectedExpRange === "mid") {
        params.minExperienceMonths = 24;
        params.maxExperienceMonths = 60;
      } else if (selectedExpRange === "senior") {
        params.minExperienceMonths = 60;
      }

      const res = await candidatesApi.search(params);
      const list = res.data?.data?.content || [];
      setCandidates(list);
      setTotal(res.data?.data?.totalElements || list.length || 0);
      setPage(p);
    } catch {
      setCandidates([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [query, selectedRoleId, selectedExpRange, selectedWorkType]);

  // Live letter-by-letter search trigger with 150ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      search(0, query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query, selectedRoleId, selectedExpRange, selectedWorkType, search]);

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleOpenProfile = async (c: CandidateProfile) => {
    setSelectedCandidate(c);
    setCandidateDetail(c);
    if (c.id) {
      setLoadingDetail(true);
      try {
        const res = await candidatesApi.getProfile(c.id);
        if (res.data?.data) {
          setCandidateDetail(res.data.data);
        }
      } catch {
        // keep summary candidate data
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const submitRequest = async () => {
    if (!connectModal) return;
    setConnectTouched(true);

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
        candidateId: connectModal.candidateId,
        roleTitle: roleTitle.trim(),
        opportunitySummary: opportunitySummary.trim(),
        workType,
      });

      setToastMsg(`Connection request sent successfully to ${connectModal.name}!`);
      setTimeout(() => setToastMsg(""), 4000);

      setConnectModal(null);
      setRoleTitle("");
      setOpportunitySummary("");
      setWorkType("REMOTE");
      setConnectErrors({});
      setConnectTouched(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send connection request. Please try again.";
      setConnectErrors({ roleTitle: msg });
    } finally {
      setSending(false);
    }
  };

  const extractSkills = (c: any): string[] => {
    if (!c) return [];
    if (Array.isArray(c.skills)) {
      return c.skills
        .map((s: any) => {
          if (typeof s === "string") return s;
          return s.skillName || s.name || (s.skill && s.skill.skillName) || "";
        })
        .filter(Boolean);
    }
    return [];
  };

  const filteredCandidates = useMemo(() => candidates, [candidates]);

  return (
    <div className="discover-page">
      {toastMsg && (
        <div style={{
          position: "fixed",
          top: "80px",
          right: "24px",
          background: "#15803d",
          color: "#fff",
          padding: "0.85rem 1.4rem",
          borderRadius: "8px",
          fontWeight: 600,
          boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
          zIndex: 3000
        }}>
          ✓ {toastMsg}
        </div>
      )}

      <div className="discover-header">
        <h1>Discover Candidates</h1>
        <p>Explore pre-screened talent, verified skills, and background assessments</p>
      </div>

      <div className="discover-filters">
        <input
          type="search"
          placeholder="Search by candidate name, headline, skills, or location..."
          value={query}
          onChange={e => handleInputChange(e.target.value)}
          className="filter-input"
        />

        <select
          value={selectedRoleId}
          onChange={e => setSelectedRoleId(e.target.value)}
          className="filter-select"
          style={{ padding: "0.65rem 0.9rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontSize: "0.9rem" }}
        >
          <option value="">All Target Roles</option>
          {rolesCatalog.map(r => (
            <option key={r.id} value={r.id}>{r.roleName}</option>
          ))}
        </select>

        <select
          value={selectedExpRange}
          onChange={e => setSelectedExpRange(e.target.value)}
          className="filter-select"
          style={{ padding: "0.65rem 0.9rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontSize: "0.9rem" }}
        >
          <option value="">All Experience Levels</option>
          <option value="entry">Entry Level (0 - 2 yrs)</option>
          <option value="mid">Mid Level (2 - 5 yrs)</option>
          <option value="senior">Senior Level (5+ yrs)</option>
        </select>

        <select
          value={selectedWorkType}
          onChange={e => setSelectedWorkType(e.target.value)}
          className="filter-select"
          style={{ padding: "0.65rem 0.9rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontSize: "0.9rem" }}
        >
          <option value="">All Work Types</option>
          <option value="REMOTE">Remote</option>
          <option value="HYBRID">Hybrid</option>
          <option value="ONSITE">On-Site</option>
        </select>

        <button className="btn-search" onClick={() => search(0, query)} disabled={loading}>
          {loading ? <span className="spinner" /> : "Search"}
        </button>
      </div>

      <p className="result-count">
        {total} registered candidate{total !== 1 ? "s" : ""} enrolled
      </p>

      <div className="candidate-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="candidate-card skeleton" />)
          : filteredCandidates.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              <p style={{ color: "#64748b", fontSize: "1.05rem" }}>No candidates found matching your search.</p>
            </div>
          ) : (
            filteredCandidates.map(c => {
              const skills = extractSkills(c);
              const expMonths = c.totalExperienceMonths || (c.totalExperienceYears ? c.totalExperienceYears * 12 : 0);
              const expYears = Math.round(expMonths / 12);

              return (
                <div
                  key={c.id}
                  className="candidate-card"
                  onClick={() => handleOpenProfile(c)}
                  style={{ cursor: "pointer" }}
                  title="Click to view candidate details"
                >
                  <div className="card-top">
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt={c.fullName} className="card-avatar" />
                    ) : (
                      <div className="card-avatar-placeholder">
                        {c.fullName?.[0]?.toUpperCase() || "C"}
                      </div>
                    )}
                    <div className="card-meta">
                      <h3 className="card-name">{c.fullName}</h3>
                      <p className="card-headline">{c.headline || "Professional Candidate"}</p>
                      <p className="card-location" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <FiMapPin size={12} color="#64748b" />
                        <span>{c.currentLocation || c.location || "Location not set"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="card-score">
                    <span>Experience:</span>
                    <strong>{expYears > 0 ? `${expYears} yrs` : "Entry / Fresher"}</strong>
                  </div>

                  {skills.length > 0 && (
                    <div className="card-skills">
                      {skills.slice(0, 5).map(s => (
                        <span key={s} className="skill-pill">{s}</span>
                      ))}
                      {skills.length > 5 && <span className="skill-pill extra">+{skills.length - 5} more</span>}
                    </div>
                  )}

                  <div className="card-actions">
                    <button
                      className="btn-card-primary"
                      onClick={e => {
                        e.stopPropagation();
                        setConnectModal({ candidateId: c.id!, name: c.fullName });
                        setConnectErrors({});
                        setConnectTouched(false);
                      }}
                    >
                      <FiUserPlus size={16} />
                      <span>Connect with Candidate</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
      </div>

      {/* Candidate Details Popup Modal */}
      {selectedCandidate && (
        <div className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
          <div className="candidate-detail-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="cd-modal-header">
              <div className="cd-header-left">
                {selectedCandidate.avatarUrl ? (
                  <img src={selectedCandidate.avatarUrl} alt={selectedCandidate.fullName} className="cd-avatar" />
                ) : (
                  <div className="cd-avatar-placeholder">
                    {selectedCandidate.fullName?.[0]?.toUpperCase() || "C"}
                  </div>
                )}
                <div className="cd-header-meta">
                  <h2 className="cd-name">{selectedCandidate.fullName}</h2>
                  <p className="cd-headline">{selectedCandidate.headline || "Professional Candidate"}</p>
                  <div className="cd-chips-row">
                    <span className="cd-meta-chip">
                      <FiMapPin size={13} /> {selectedCandidate.currentLocation || "Location not set"}
                    </span>
                    <span className="cd-meta-chip">
                      <FiBriefcase size={13} /> {selectedCandidate.experienceStatus || "Fresher / Entry Level"}
                    </span>
                    {selectedCandidate.noticePeriod && (
                      <span className="cd-meta-chip">
                        <FiCalendar size={13} /> Notice: {selectedCandidate.noticePeriod}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button className="cd-btn-close" onClick={() => setSelectedCandidate(null)} aria-label="Close modal">
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="cd-modal-body">
              {loadingDetail ? (
                <div style={{ textAlign: "center", padding: "2.5rem" }}>
                  <div className="spinner" style={{ margin: "0 auto 1rem", width: "32px", height: "32px" }} />
                  <p style={{ color: "#64748b", fontSize: "0.95rem" }}>Loading candidate details...</p>
                </div>
              ) : (
                <>
                  {/* Summary / Bio */}
                  {(candidateDetail?.summary || selectedCandidate.summary) && (
                    <div className="cd-section">
                      <h4 className="cd-section-title"><FiFileText size={16} color="#70c144" /> Professional Summary</h4>
                      <p className="cd-text">{candidateDetail?.summary || selectedCandidate.summary}</p>
                    </div>
                  )}

                  {/* Intro Video */}
                  {candidateDetail?.videoUrl && (
                    <div className="cd-section">
                      <h4 className="cd-section-title"><FiVideo size={16} color="#70c144" /> Introduction Video</h4>
                      <div className="cd-video-wrap">
                        <video controls src={candidateDetail.videoUrl} style={{ width: "100%", borderRadius: "8px", maxHeight: "240px", background: "#000" }}>
                          Your browser does not support HTML5 video.
                        </video>
                      </div>
                    </div>
                  )}

                  {/* Key Skills */}
                  <div className="cd-section">
                    <h4 className="cd-section-title"><FiAward size={16} color="#70c144" /> Key Skills & Competencies</h4>
                    <div className="cd-skills-grid">
                      {extractSkills(candidateDetail || selectedCandidate).length > 0 ? (
                        extractSkills(candidateDetail || selectedCandidate).map((s, i) => (
                          <span key={i} className="cd-skill-pill">{s}</span>
                        ))
                      ) : (
                        <p className="cd-empty-note">No specific skills listed.</p>
                      )}
                    </div>
                  </div>

                  {/* Internships & Experience */}
                  <div className="cd-section">
                    <h4 className="cd-section-title"><FiBriefcase size={16} color="#70c144" /> Internships & Practical Experience</h4>
                    {candidateDetail?.experiences && candidateDetail.experiences.length > 0 ? (
                      <div className="cd-timeline">
                        {candidateDetail.experiences.map((exp: any, idx: number) => (
                          <div key={exp.id || idx} className="cd-timeline-item">
                            <div className="cd-timeline-dot" />
                            <div className="cd-timeline-content">
                              <div className="cd-timeline-heading">
                                <strong className="cd-item-title">{exp.title}</strong>
                                <span className="cd-company-name">{exp.companyName}</span>
                              </div>
                              <span className="cd-item-date">
                                <FiCalendar size={12} /> {exp.startDate}{exp.isCurrent ? " - Present" : (exp.endDate ? ` - ${exp.endDate}` : "")}
                                {exp.isCurrent && <span className="cd-ongoing-tag">Ongoing</span>}
                              </span>
                              {exp.description && <p className="cd-item-desc">{exp.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="cd-empty-note">No internships or experiences added yet.</p>
                    )}
                  </div>

                  {/* Education */}
                  <div className="cd-section">
                    <h4 className="cd-section-title"><FiBookOpen size={16} color="#70c144" /> Education & Qualifications</h4>
                    {candidateDetail?.education && candidateDetail.education.length > 0 ? (
                      <div className="cd-edu-grid">
                        {candidateDetail.education.map((edu: any, idx: number) => (
                          <div key={edu.id || idx} className="cd-edu-card">
                            <strong className="cd-edu-degree">{edu.qualification}</strong>
                            <p className="cd-edu-inst">{edu.institution}</p>
                            {(edu.fieldOfStudy || edu.startYear || edu.endYear || edu.courseType) && (
                              <span className="cd-edu-meta">
                                {edu.fieldOfStudy ? `${edu.fieldOfStudy} • ` : ""}
                                {edu.startYear ? `${edu.startYear}` : ""}{edu.endYear ? ` - ${edu.endYear}` : ""}
                                {edu.courseType ? ` (${edu.courseType})` : ""}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="cd-empty-note">No education details provided.</p>
                    )}
                  </div>

                  {/* Projects */}
                  <div className="cd-section">
                    <h4 className="cd-section-title"><FiFileText size={16} color="#70c144" /> Academic & Independent Projects</h4>
                    {candidateDetail?.projects && candidateDetail.projects.length > 0 ? (
                      <div className="cd-projects-grid">
                        {candidateDetail.projects.map((proj: any, idx: number) => (
                          <div key={proj.id || idx} className="cd-project-card">
                            <div className="cd-project-header">
                              <strong className="cd-project-name">{proj.name}</strong>
                              {proj.clientCompany && <span className="cd-project-client">{proj.clientCompany}</span>}
                            </div>
                            {(proj.startDate || proj.endDate) && (
                              <span className="cd-project-date">
                                <FiCalendar size={12} /> {proj.startDate ? `${proj.startDate} - ` : ""}{proj.endDate || "Present"}
                              </span>
                            )}
                            {proj.summary && <p className="cd-project-summary">{proj.summary}</p>}
                            {proj.githubUrl && (
                              <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="cd-project-link">
                                <FiGithub size={13} /> Repository
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="cd-empty-note">No projects added yet.</p>
                    )}
                  </div>

                  {/* Assessment Evidence */}
                  {candidateDetail?.evidence && candidateDetail.evidence.length > 0 && (
                    <div className="cd-section">
                      <h4 className="cd-section-title"><FiCheckCircle size={16} color="#16a34a" /> Verified RightPath Evidence</h4>
                      <div className="cd-evidence-grid">
                        {candidateDetail.evidence.map((ev: any, idx: number) => (
                          <div key={ev.id || idx} className="cd-evidence-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong>{ev.title}</strong>
                              {ev.score != null && <span className="cd-score-badge">Score: {ev.score}%</span>}
                            </div>
                            {ev.summary && <p className="cd-evidence-summary">{ev.summary}</p>}
                            <span className="cd-verified-by">✓ Verified by {ev.sourceSystem || "RightPath"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="cd-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setSelectedCandidate(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-card-primary"
                style={{ width: "auto", padding: "0.6rem 1.4rem" }}
                onClick={() => {
                  const c = selectedCandidate;
                  setSelectedCandidate(null);
                  setConnectModal({ candidateId: c.id!, name: c.fullName });
                  setConnectErrors({});
                  setConnectTouched(false);
                }}
              >
                <FiUserPlus size={16} /> Connect with Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      {connectModal && (
        <div className="modal-overlay" onClick={() => setConnectModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2>Connect with {connectModal.name}</h2>
            <p className="modal-sub">Send a tailored introduction to evaluate this candidate for opportunities.</p>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Role Title <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={e => {
                  setRoleTitle(e.target.value);
                  if (connectErrors.roleTitle) setConnectErrors(prev => ({ ...prev, roleTitle: "" }));
                }}
                placeholder="e.g. Senior Java Developer"
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
              {connectTouched && connectErrors.roleTitle && (
                <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>{connectErrors.roleTitle}</p>
              )}
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Opportunity Summary <span style={{ color: "red" }}>*</span>
              </label>
              <textarea
                value={opportunitySummary}
                onChange={e => {
                  setOpportunitySummary(e.target.value);
                  if (connectErrors.opportunitySummary) setConnectErrors(prev => ({ ...prev, opportunitySummary: "" }));
                }}
                rows={4}
                placeholder="Describe role responsibilities, team context, and key requirements..."
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }}
              />
              {connectTouched && connectErrors.opportunitySummary && (
                <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>{connectErrors.opportunitySummary}</p>
              )}
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Work Model
              </label>
              <select
                value={workType}
                onChange={e => setWorkType(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              >
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-Site</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setConnectModal(null)}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-submit"
                onClick={submitRequest}
                disabled={sending}
              >
                {sending ? "Submitting..." : "Send Connection Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;