import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { candidatesApi } from "../../api/candidates";
import { connectionsApi } from "../../api/connections";
import type { CandidateProfile, Evidence } from "../../types";
import { FiMapPin, FiBriefcase, FiCalendar, FiExternalLink, FiX, FiCheckCircle } from "react-icons/fi";
import "./Discover.css";

const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
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

  const search = async (p = 0) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, size: 12 };
      if (query.trim()) params.q = query.trim();
      const res = await candidatesApi.search(params);
      setCandidates(res.data.data.content || []);
      setTotal(res.data.data.totalElements || 0);
      setPage(p);
    } catch {
      setCandidates([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search(0);
  }, []);

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
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search(0)}
          className="filter-input"
        />
        <button className="btn-search" onClick={() => search(0)} disabled={loading}>
          {loading ? <span className="spinner" /> : "Search Candidates"}
        </button>
      </div>

      <p className="result-count">
        {total} registered candidate{total !== 1 ? "s" : ""} enrolled
      </p>

      <div className="candidate-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="candidate-card skeleton" />)
          : candidates.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              <p style={{ color: "#64748b", fontSize: "1.05rem" }}>No candidates found matching your search.</p>
            </div>
          ) : (
            candidates.map(c => {
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
                    <strong>{expYears > 0 ? `${expYears} yr${expYears !== 1 ? "s" : ""}` : "Entry / Fresher"}</strong>
                  </div>

                  <div className="card-skills">
                    {skills.slice(0, 5).map(s => (
                      <span key={s} className="skill-chip">{s}</span>
                    ))}
                    {skills.length > 5 && (
                      <span className="skill-chip">+{skills.length - 5} more</span>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "auto" }}>
                    <button
                      className="btn-eval"
                      style={{
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        color: "#1e293b",
                        borderRadius: "6px",
                        padding: "0.55rem 0.5rem",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        cursor: "pointer"
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProfile(c);
                      }}
                    >
                      Evaluate Profile
                    </button>
                    <button
                      className="btn-request"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConnectModal({ candidateId: c.id, name: c.fullName });
                      }}
                    >
                      Connect
                    </button>
                  </div>
                </div>
              );
            })
          )}
      </div>

      {total > 12 && (
        <div className="pagination" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "2rem" }}>
          <button disabled={page === 0} onClick={() => search(page - 1)} className="page-btn">Previous</button>
          <span>Page {page + 1} of {Math.ceil(total / 12)}</span>
          <button disabled={(page + 1) * 12 >= total} onClick={() => search(page + 1)} className="page-btn">Next</button>
        </div>
      )}

      {/* Candidate Profile Dossier Modal */}
      {evalModal && activeCandidate && (
        <div className="modal-overlay" onClick={() => setEvalModal(null)}>
          <div className="modal-box" style={{ maxWidth: "680px", maxHeight: "88vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, #70c144, #5ea836)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 700, flexShrink: 0 }}>
                  {activeCandidate.fullName?.[0]?.toUpperCase() || "C"}
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", background: "#dcfce7", color: "#166534", fontWeight: 700, padding: "0.15rem 0.55rem", borderRadius: "9999px" }}>
                    VERIFIED CANDIDATE PROFILE
                  </span>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.3rem 0 0.1rem", color: "#0f172a" }}>
                    {activeCandidate.fullName}
                  </h2>
                  <p style={{ color: "#475569", margin: 0, fontSize: "0.92rem", fontWeight: 500 }}>
                    {activeCandidate.headline || "Professional Candidate"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEvalModal(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
              >
                <FiX size={18} />
              </button>
            </div>

            {loadingProfile && (
              <div style={{ textAlign: "center", padding: "1rem", color: "#64748b", fontSize: "0.88rem" }}>
                Loading verified dossier & evidence attachments...
              </div>
            )}

            {/* Quick Meta Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", background: "#f8fafc", padding: "0.85rem", borderRadius: "8px", marginBottom: "1.25rem", border: "1px solid #e2e8f0" }}>
              <div>
                <span style={{ fontSize: "0.73rem", color: "#64748b", display: "block" }}>Location</span>
                <strong style={{ fontSize: "0.9rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <FiMapPin size={14} color="#70c144" /> {activeCandidate.currentLocation || activeCandidate.location || "Not specified"}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "0.73rem", color: "#64748b", display: "block" }}>Experience</span>
                <strong style={{ fontSize: "0.9rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <FiBriefcase size={14} color="#70c144" /> {activeCandidate.totalExperienceMonths ? `${Math.round(activeCandidate.totalExperienceMonths / 12)} years` : (activeCandidate.experienceStatus || "Entry / Fresher")}
                </strong>
              </div>
              {(activeCandidate.availability || activeCandidate.noticePeriod) && (
                <div>
                  <span style={{ fontSize: "0.73rem", color: "#64748b", display: "block" }}>Notice Period / Availability</span>
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

            {/* Projects / Work History if present */}
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

            {/* Evidences if present */}
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
                  setConnectModal({ candidateId: candidateToConnect.id, name: candidateToConnect.fullName });
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