import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { candidatesApi } from "../../api/candidates";
import { connectionsApi } from "../../api/connections";
import type { CandidateProfile, RoleCatalogItem } from "../../types";
import { FiMapPin, FiUserPlus } from "react-icons/fi";
import { validateRequired } from "../../utils/validators";
import "./Discover.css";

const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
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

  // Connect modal state
  const [connectModal, setConnectModal] = useState<{ candidateId: string; name: string } | null>(null);
  const [roleTitle, setRoleTitle] = useState("");
  const [opportunitySummary, setOpportunitySummary] = useState("");
  const [workType, setWorkType] = useState("REMOTE");
  const [connectErrors, setConnectErrors] = useState<Record<string, string>>({});
  const [connectTouched, setConnectTouched] = useState(false);
  const [sending, setSending] = useState(false);

  // Direct candidate profile routing handles full candidate profile inspection

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

  const handleOpenProfile = (c: CandidateProfile) => {
    if (c.id) {
      navigate('/candidates/' + c.id);
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

    setConnectErrors({});
    setSending(true);
    try {
      await connectionsApi.submit({
        candidateId: connectModal.candidateId,
        roleTitle: roleTitle.trim(),
        opportunitySummary: opportunitySummary.trim(),
        workType,
      });
      setToastMsg(`Connection request sent to ${connectModal.name}!`);
      setConnectModal(null);
      setRoleTitle("");
      setOpportunitySummary("");
      setWorkType("REMOTE");
      setConnectTouched(false);
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

      <div className="discover-filters" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search by candidate name, headline, skills, or location..."
          value={query}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search(0, query)}
          className="filter-input"
          style={{ flex: "1 1 280px" }}
        />

        {/* Target Role Filter */}
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

        {/* Experience Level Filter */}
        <select
          value={selectedExpRange}
          onChange={e => setSelectedExpRange(e.target.value)}
          className="filter-select"
          style={{ padding: "0.65rem 0.9rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontSize: "0.9rem" }}
        >
          <option value="">All Experience Levels</option>
          <option value="entry">Entry / Fresher (&lt; 2 yrs)</option>
          <option value="mid">Mid-Level (2 – 5 yrs)</option>
          <option value="senior">Senior (5+ yrs)</option>
        </select>

        {/* Work Type Filter */}
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
                  title="Click to view full candidate profile"
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
