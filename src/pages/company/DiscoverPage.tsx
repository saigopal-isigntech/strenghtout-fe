import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { candidatesApi } from "../../api/candidates";
import { connectionsApi } from "../../api/connections";
import type { CandidateProfile, Evidence } from "../../types";
import { FiMapPin, FiBriefcase, FiCalendar, FiExternalLink, FiX, FiCheckCircle, FiUserPlus } from "react-icons/fi";
import "./Discover.css";

const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get("q") || "";

  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(qParam);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  // Connect modal state
  const [connectModal, setConnectModal] = useState<{ candidateId: string; name: string } | null>(null);
  const [roleTitle, setRoleTitle] = useState("");
  const [opportunitySummary, setOpportunitySummary] = useState("");
  const [workType, setWorkType] = useState("REMOTE");
  const [sending, setSending] = useState(false);

  // Evaluation / Profile Detail modal state
  const [evalModal, setEvalModal] = useState<CandidateProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [fullProfile, setFullProfile] = useState<CandidateProfile | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);

  const [toastMsg, setToastMsg] = useState("");

  // Sync state if URL query parameter changes
  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  const search = useCallback(async (p = 0, searchTerms = query) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, size: 50 };
      if (searchTerms.trim()) params.q = searchTerms.trim();
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
  }, [query]);

  // Live letter-by-letter search trigger with 150ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      search(0, query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleOpenProfile = async (c: CandidateProfile) => {
    setEvalModal(c);
    setFullProfile(null);
    setEvidences([]);
    setLoadingProfile(true);

    try {
      if (c.id) {
        const [profRes, evRes] = await Promise.allSettled([
          candidatesApi.getProfile(c.id),
          candidatesApi.getEvidences(c.id),
        ]);
        if (profRes.status === "fulfilled" && profRes.value?.data) {
          const fetched = (profRes.value.data as any).data || profRes.value.data;
          setFullProfile(fetched);
        }
        if (evRes.status === "fulfilled" && evRes.value?.data) {
          const evList = (evRes.value.data as any).data || evRes.value.data;
          if (Array.isArray(evList)) setEvidences(evList);
        }
      }
    } catch {
      // fallback to basic candidate object
    } finally {
      setLoadingProfile(false);
    }
  };

  const submitRequest = async () => {
    if (!connectModal) return;
    setSending(true);
    try {
      await connectionsApi.submit({
        candidateId: connectModal.candidateId,
        roleTitle,
        opportunitySummary,
        workType,
      });
      setToastMsg(`Connection request sent to ${connectModal.name}!`);
      setConnectModal(null);
      setRoleTitle("");
      setOpportunitySummary("");
      setWorkType("REMOTE");
      setTimeout(() => { setToastMsg(""); navigate('/my-requests'); }, 2500);
    } catch (err: any) {
      setToastMsg(err?.response?.data?.message || "Failed to send connection request.");
      setTimeout(() => setToastMsg(""), 4000);
    } finally {
      setSending(false);
    }
  };

  const extractSkills = (item: any): string[] => {
    const list = item?.topSkills || item?.skills || [];
    if (!Array.isArray(list)) return [];
    return list.map((s: any) => typeof s === "string" ? s : (s.skillName || s.canonicalName || s.name || "")).filter(Boolean);
  };

  const activeCandidate = fullProfile || evalModal;

  // Instant letter-by-letter client filter fallback
  const filteredCandidates = useMemo(() => {
    if (!query.trim()) return candidates;
    const qLower = query.trim().toLowerCase();
    return candidates.filter(c => {
      const nameMatch = c.fullName?.toLowerCase().includes(qLower);
      const headlineMatch = c.headline?.toLowerCase().includes(qLower);
      const locationMatch = (c.currentLocation || c.location || "").toLowerCase().includes(qLower);
      const skills = Array.isArray(c.skills) ? c.skills.map((s: any) => (typeof s === "string" ? s : s.skillName || s.name || "").toLowerCase()) : [];
      const skillMatch = skills.some(s => s.includes(qLower));
      return nameMatch || headlineMatch || locationMatch || skillMatch;
    });
  }, [candidates, query]);

  return (
    <div className="discover-page">
      {toastMsg && <div className="discover-toast">{toastMsg}</div>}
      
      <div className="discover-header">
        <div style={{ display: "inline-block", background: "#ede9fe", color: "#6366f1", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "9999px", marginBottom: "0.5rem" }}>
          TALENT RECRUITMENT DIRECTORY
        </div>
        <h1>Candidate Discovery</h1>
        <p>Explore enrolled candidates, review verified skills, and evaluate top talent for recruitment</p>
      </div>

      <div className="discover-filters">
        <input
          type="search"
          placeholder="Search by candidate name, headline, skills, or location..."
          value={query}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search(0, query)}
          className="filter-input"
        />
        <button className="btn-search" onClick={() => search(0, query)} disabled={loading}>
          {loading ? <span className="spinner" /> : "Search Candidates"}
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
                  title="Click to view full candidate profile"
                >
                  <div className="card-top">
                    <div className="card-avatar-placeholder">
                      {c.fullName?.[0]?.toUpperCase() || "C"}
                    </div>
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

      {/* Profile Detail / Evaluation Modal */}
      {evalModal && activeCandidate && (
        <div className="modal-overlay" onClick={() => setEvalModal(null)}>
          <div className="modal-box candidate-eval-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div className="modal-avatar-lg">
                  {activeCandidate.fullName?.[0]?.toUpperCase() || "C"}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.35rem", color: "#0f172a" }}>{activeCandidate.fullName}</h3>
                  <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "0.9rem" }}>{activeCandidate.headline || "Professional Candidate"}</p>
                </div>
              </div>
              <button className="btn-modal-close" onClick={() => setEvalModal(null)}>
                <FiX size={20} />
              </button>
            </div>

            {loadingProfile && (
              <div style={{ padding: "1rem 0", color: "#64748b", fontSize: "0.9rem" }}>
                Loading full candidate details...
              </div>
            )}

            {/* Core Candidate Overview Info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "#f8fafc", padding: "1rem", borderRadius: "8px", margin: "1rem 0" }}>
              <div>
                <span style={{ fontSize: "0.78rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Current Location</span>
                <strong style={{ fontSize: "0.9rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <FiMapPin size={14} color="#70c144" /> {activeCandidate.currentLocation || activeCandidate.location || "Location not specified"}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "0.78rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Experience Level</span>
                <strong style={{ fontSize: "0.9rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <FiBriefcase size={14} color="#70c144" /> {activeCandidate.experienceStatus || "Entry / Fresher"}
                </strong>
              </div>
              {(activeCandidate.availability || activeCandidate.noticePeriod) && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Availability / Notice Period</span>
                  <strong style={{ fontSize: "0.9rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <FiCalendar size={14} color="#70c144" /> {activeCandidate.availability || activeCandidate.noticePeriod}
                  </strong>
                </div>
              )}
            </div>

            {/* Summary */}
            <div style={{ marginBottom: "1.25rem" }}>
              <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.4rem" }}>Professional Overview</h4>
              <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.6, margin: 0, background: "#fff", padding: "0.75rem", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                {activeCandidate.summary || activeCandidate.bio || "Candidate has registered their profile on StrengthOut and validated core technical competencies."}
              </p>
            </div>

            {/* Skills */}
            <div style={{ marginBottom: "1.25rem" }}>
              <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.5rem" }}>Verified Competencies & Skills</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                {extractSkills(activeCandidate).map((s: string) => (
                  <span
                    key={s}
                    style={{
                      background: "#f0fdf4",
                      color: "#15803d",
                      border: "1px solid #bbf7d0",
                      padding: "0.3rem 0.65rem",
                      borderRadius: "6px",
                      fontSize: "0.84rem",
                      fontWeight: 600
                    }}
                  >
                    <FiCheckCircle size={12} style={{ marginRight: 4 }} />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Projects */}
            {Array.isArray(activeCandidate.projects) && activeCandidate.projects.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.5rem" }}>Featured Projects</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {activeCandidate.projects.map((proj: any, idx: number) => (
                    <div key={idx} style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>{proj.name || proj.title}</strong>
                      {proj.summary && <p style={{ fontSize: "0.83rem", color: "#475569", margin: "0.2rem 0 0" }}>{proj.summary}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidences */}
            {evidences.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.5rem" }}>Verifiable Evidences</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {evidences.map((ev: any) => (
                    <a
                      key={ev.id}
                      href={ev.url || ev.mediaUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                        padding: "0.35rem 0.65rem",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        textDecoration: "none"
                      }}
                    >
                      <FiExternalLink size={13} /> {ev.title || "Evidence Attachment"}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
              <button
                className="btn-modal-cancel"
                onClick={() => setEvalModal(null)}
              >
                Close
              </button>
              <button
                className="btn-modal-submit"
                onClick={() => {
                  const candidateToConnect = activeCandidate;
                  setEvalModal(null);
                  setConnectModal({ candidateId: candidateToConnect.id!, name: candidateToConnect.fullName });
                }}
              >
                Connect with Candidate
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
                onChange={e => setRoleTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                style={{ width: "100%", padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" as const }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Work Type
              </label>
              <select
                value={workType}
                onChange={e => setWorkType(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "6px" }}
              >
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-site</option>
              </select>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Opportunity Summary <span style={{ color: "red" }}>*</span>
              </label>
              <textarea
                rows={4}
                value={opportunitySummary}
                onChange={e => setOpportunitySummary(e.target.value)}
                placeholder="Share information about the role, technical requirements, and why you are interested in their profile..."
              />
            </div>

            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setConnectModal(null)}>
                Cancel
              </button>
              <button
                className="btn-modal-submit"
                onClick={submitRequest}
                disabled={sending || !roleTitle.trim() || !opportunitySummary.trim()}
              >
                {sending ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;