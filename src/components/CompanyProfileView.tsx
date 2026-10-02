import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../api/admin";
import { companiesApi } from "../api/companies";
import { useAuth } from "../context/AuthContext";
import type { CompanyProfile } from "../types";
import { validateEmail, validatePhone, validateRequired, validateUrl } from "../utils/validators";
import {
  FiEdit3,
  FiTrash2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCheckCircle,
  FiLinkedin,
  FiGlobe,
  FiBriefcase,
  FiUsers,
  FiLayers,
  FiFileText,
  FiPlus,
  FiX,
  FiArrowLeft,
  FiExternalLink,
  FiUserCheck,
  FiCalendar,
  FiRotateCcw,
  FiImage,
  FiShield,
  FiCheck,
  FiCamera,
  FiLink,
} from "react-icons/fi";
import "./CompanyProfileView.css";

const CompanyProfileView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: routeCompanyId } = useParams<{ id?: string }>();
  const isExternalView = Boolean(routeCompanyId);
  const isReadOnly = isExternalView && user?.role !== "ROLE_COMPANY";

  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  const [form, setForm] = useState<Partial<CompanyProfile>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Contact modal / form state
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const contactNameInputRef = useRef<HTMLInputElement>(null);
  const legalNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddContact) {
      setTimeout(() => contactNameInputRef.current?.focus(), 60);
    }
  }, [showAddContact]);

  useEffect(() => {
    if (editing) {
      setTimeout(() => legalNameInputRef.current?.focus(), 60);
    }
  }, [editing]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      if (routeCompanyId) {
        if (user?.role === "ROLE_ADMIN" || user?.role === "ROLE_SUPER_ADMIN") {
          try {
            const adminRes = await adminApi.getCompanyDetail(routeCompanyId);
            if (adminRes.data?.data) {
              setProfile(adminRes.data.data);
              setForm(adminRes.data.data);
              return;
            }
          } catch {
            // fallback
          }
        }
        try {
          const res = await adminApi.getCompanies({ search: routeCompanyId, size: 5 });
          const list = res.data?.data?.content || [];
          const matched = list.find((c: any) => c.id === routeCompanyId || c.email === routeCompanyId || (c as any).userId === routeCompanyId) || list[0];
          if (matched) {
            setProfile(matched);
            setForm(matched);
            return;
          }
        } catch {
          // fallback
        }
      }
      const res = await companiesApi.getMyProfile();
      setProfile(res.data.data);
      setForm(res.data.data);
    } catch (err) {
      console.warn("Could not load company profile from DB, initializing with user info", err);
      const fallback: CompanyProfile = {
        id: routeCompanyId || "",
        legalName: user?.fullName || "",
        displayName: user?.fullName || "",
        email: user?.email || "",
        industry: "",
        companySize: "",
        website: "",
        linkedinUrl: "",
        description: "",
        country: "",
        city: "",
        status: "ACTIVE",
        contacts: []
      };
      setProfile(fallback);
      setForm(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [routeCompanyId]);

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    const dErr = validateRequired(form.displayName || "", "Company display name", 2);
    if (dErr) errors.displayName = dErr;

    const lErr = validateRequired(form.legalName || "", "Legal company name", 2);
    if (lErr) errors.legalName = lErr;

    if (form.website) {
      const wErr = validateUrl(form.website, "Website URL");
      if (wErr) errors.website = wErr;
    }

    if (form.linkedinUrl) {
      const lkErr = validateUrl(form.linkedinUrl, "LinkedIn URL");
      if (lkErr) errors.linkedinUrl = lkErr;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await companiesApi.updateMyProfile(form);
      setProfile(res.data.data);
      setForm(res.data.data);
      setEditing(false);
      setSuccess("Company profile updated successfully!");
      setTimeout(() => setSuccess(""), 3500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update company profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const nErr = validateRequired(contactName, "Contact name", 2);
    if (nErr) errors.name = nErr;

    const eErr = validateEmail(contactEmail, "Work email");
    if (eErr) errors.email = eErr;

    if (contactPhone) {
      const pErr = validatePhone(contactPhone, "Phone number");
      if (pErr) errors.phone = pErr;
    }

    if (Object.keys(errors).length > 0) {
      setContactErrors(errors);
      return;
    }

    setContactErrors({});
    try {
      const newContact = {
        name: contactName.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
        jobTitle: contactTitle.trim(),
      };
      const res = await companiesApi.addContact(newContact);
      setProfile(prev => prev ? {
        ...prev,
        contacts: [...(prev.contacts || []), res.data.data]
      } : null);
      setShowAddContact(false);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactTitle("");
      setSuccess("Contact added successfully!");
      setTimeout(() => setSuccess(""), 3500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to add contact.");
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm("Are you sure you want to remove this contact person?")) return;
    try {
      await companiesApi.deleteContact(contactId);
      setProfile(prev => prev ? {
        ...prev,
        contacts: (prev.contacts || []).filter(c => c.id !== contactId)
      } : null);
      setSuccess("Contact removed successfully.");
      setTimeout(() => setSuccess(""), 3500);
    } catch {
      setError("Failed to delete contact.");
    }
  };

  if (loading) {
    return (
      <div className="company-profile-page-wrapper">
        <div className="company-profile-container">
          {isExternalView && (
            <div style={{ marginBottom: "1rem" }}>
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="btn-back-directory"
              >
                <FiArrowLeft size={16} /> Back to Directory
              </button>
            </div>
          )}
          <div className="company-loading-card">
            <div className="spinner" />
            <p>Loading company profile details...</p>
          </div>
        </div>
      </div>
    );
  }

  const companyInitials = (profile?.displayName || profile?.legalName || "CO").substring(0, 2).toUpperCase();

  return (
    <div className="company-profile-page-wrapper">
      <div className="company-profile-container">

        {/* Back link for external view */}
        {isExternalView && (
          <div style={{ marginBottom: "1rem" }}>
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="btn-back-directory"
            >
              <FiArrowLeft size={16} /> Back to Directory
            </button>
          </div>
        )}

        {/* Alert Notifications */}
        {success && (
          <div className="company-alert-banner success">
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="btn-alert-close">
              <FiX size={15} />
            </button>
          </div>
        )}

        {error && (
          <div className="company-alert-banner error">
            <span>{error}</span>
            <button onClick={() => setError("")} className="btn-alert-close">
              <FiX size={15} />
            </button>
          </div>
        )}

        {/* =====================================================================
            VIEW MODE vs EDIT MODE
           ===================================================================== */}
        {!editing ? (
          <>
            {/* 1. Header Profile Banner matching reference mockup */}
            <div className="company-header-hero-banner">
              <svg
                className="hero-bg-waves"
                viewBox="0 0 1000 220"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <path d="M380,220 C380,120 480,30 1000,45 L1000,220 Z" fill="#a7f3d0" opacity="0.45" />
                <path d="M440,220 C440,140 580,55 1000,75 L1000,220 Z" fill="#6ee7b7" opacity="0.2" />
              </svg>

              <div className="hero-top-bar">
                <div className="hero-badge-pill">
                  <FiUserCheck size={13} /> COMPANY ACCOUNT
                </div>

                {!isReadOnly && (
                  <button
                    type="button"
                    className="btn-edit-header"
                    onClick={() => setEditing(true)}
                  >
                    <FiEdit3 size={15} /> Edit Company Profile
                  </button>
                )}
              </div>

              <div className="hero-main-content">
                <div className="company-logo-avatar-box">
                  <span className="logo-initials-txt">{companyInitials}</span>
                  <span className="logo-active-tag">
                    <FiCheckCircle size={11} /> ACTIVE
                  </span>
                </div>

                <div className="company-header-details">
                  <div className="company-title-edit-row">
                    <h1 className="company-name-title">
                      {profile?.displayName || profile?.legalName || user?.fullName || "Company"}
                    </h1>
                    {!isReadOnly && (
                      <button
                        type="button"
                        className="btn-inline-edit"
                        onClick={() => setEditing(true)}
                        title="Edit Details"
                      >
                        <FiEdit3 size={15} />
                      </button>
                    )}
                  </div>

                  <p className="company-legal-subtitle">
                    Legal Name: <strong>{profile?.legalName || "Not specified"}</strong>
                  </p>

                  <div className="hero-meta-pills-row">
                    <span className="hero-meta-pill">
                      <FiBriefcase size={13} /> {profile?.industry || "Not specified"}
                    </span>
                    <span className="hero-meta-pill">
                      <FiUsers size={13} /> {profile?.companySize || "1-10 Employees"}
                    </span>
                    <span className="hero-meta-pill">
                      <FiMapPin size={13} /> {profile?.city ? `${profile.city}${profile.country ? `, ${profile.country}` : ""}` : (profile?.country || "Not specified")}
                    </span>
                  </div>

                  <div className="hero-meta-pills-row links-row">
                    {(profile?.email || user?.email) && (
                      <span className="hero-meta-pill link-pill">
                        <FiMail size={13} /> {profile?.email || user?.email}
                      </span>
                    )}
                    {profile?.website && (
                      <a
                        href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hero-meta-pill link-pill clickable"
                      >
                        <FiGlobe size={13} /> {profile.website.replace("https://", "").replace("http://", "").replace(/\/$/, "")} <FiExternalLink size={11} />
                      </a>
                    )}
                    {profile?.linkedinUrl && (
                      <a
                        href={profile.linkedinUrl.startsWith("http") ? profile.linkedinUrl : `https://${profile.linkedinUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hero-meta-pill link-pill linkedin"
                      >
                        <FiLinkedin size={13} /> LinkedIn Page <FiExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>



            {/* 3. About Organization Section Card matching mockup */}
            <div className="company-card-block">
              <div className="card-header-bar">
                <h2 className="card-title-heading">
                  <span className="title-icon-box green">
                    <FiFileText size={18} />
                  </span>
                  <span>About Organization</span>
                </h2>
                {!isReadOnly && (
                  <button
                    type="button"
                    className="btn-card-action"
                    onClick={() => setEditing(true)}
                  >
                    <FiEdit3 size={13} /> Edit Bio
                  </button>
                )}
              </div>

              <div className="about-org-content">
                <p className="org-bio-text">
                  {profile?.description || "No description or company overview provided yet."}
                </p>
              </div>
            </div>

            {/* 4. Key Organization Details Grid Card matching mockup */}
            <div className="company-card-block">
              <div className="card-header-bar">
                <h2 className="card-title-heading">
                  <span className="title-icon-box green">
                    <FiBriefcase size={18} />
                  </span>
                  <span>Key Organization Details</span>
                </h2>
                {!isReadOnly && (
                  <button
                    type="button"
                    className="btn-card-action"
                    onClick={() => setEditing(true)}
                  >
                    <FiEdit3 size={13} /> Edit Details
                  </button>
                )}
              </div>

              <div className="org-details-cards-grid">
                {/* 1. Official Website */}
                <div className="detail-metric-card">
                  <div className="metric-icon-box mint">
                    <FiGlobe size={18} />
                  </div>
                  <div className="metric-details">
                    <span className="metric-lbl">Official Website</span>
                    {profile?.website ? (
                      <a
                        href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="metric-link"
                      >
                        {profile.website} <FiExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="metric-txt muted">Not specified</span>
                    )}
                  </div>
                </div>

                {/* 2. LinkedIn Presence */}
                <div className="detail-metric-card">
                  <div className="metric-icon-box blue">
                    <FiLinkedin size={18} />
                  </div>
                  <div className="metric-details">
                    <span className="metric-lbl">LinkedIn Presence</span>
                    {profile?.linkedinUrl ? (
                      <a
                        href={profile.linkedinUrl.startsWith("http") ? profile.linkedinUrl : `https://${profile.linkedinUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="metric-link"
                      >
                        {profile.linkedinUrl} <FiExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="metric-txt muted">Not specified</span>
                    )}
                  </div>
                </div>

                {/* 3. Industry & Domain */}
                <div className="detail-metric-card">
                  <div className="metric-icon-box blue">
                    <FiLayers size={18} />
                  </div>
                  <div className="metric-details">
                    <span className="metric-lbl">Industry & Domain</span>
                    <strong className="metric-val">{profile?.industry || "Not specified"}</strong>
                  </div>
                </div>

                {/* 4. Employee Strength */}
                <div className="detail-metric-card">
                  <div className="metric-icon-box green">
                    <FiUsers size={18} />
                  </div>
                  <div className="metric-details">
                    <span className="metric-lbl">Employee Strength</span>
                    <strong className="metric-val">{profile?.companySize || "Not specified"}</strong>
                  </div>
                </div>

                {/* 5. Location */}
                <div className="detail-metric-card">
                  <div className="metric-icon-box blue">
                    <FiMapPin size={18} />
                  </div>
                  <div className="metric-details">
                    <span className="metric-lbl">Location</span>
                    <strong className="metric-val">
                      {profile?.city ? `${profile.city}${profile.country ? `, ${profile.country}` : ""}` : (profile?.country || "Not specified")}
                    </strong>
                  </div>
                </div>

                {/* 6. Contact Information */}
                <div className="detail-metric-card">
                  <div className="metric-icon-box mint">
                    <FiMail size={18} />
                  </div>
                  <div className="metric-details">
                    <span className="metric-lbl">Contact Information</span>
                    <strong className="metric-val">{profile?.email || user?.email || "Not specified"}</strong>
                  </div>
                </div>

                {/* 7. Joined On */}
                <div className="detail-metric-card">
                  <div className="metric-icon-box blue">
                    <FiCalendar size={18} />
                  </div>
                  <div className="metric-details">
                    <span className="metric-lbl">Joined On</span>
                    <strong className="metric-val">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Recently"}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Hiring & Recruitment Contacts Section */}
            <div className="company-card-block">
              <div className="card-header-bar">
                <h2 className="card-title-heading">
                  <span className="title-icon-box green">
                    <FiUsers size={18} />
                  </span>
                  <span>Hiring & Recruitment Contacts</span>
                </h2>
                {!isReadOnly && (
                  <button
                    type="button"
                    className="btn-card-action"
                    onClick={() => {
                      setShowAddContact(!showAddContact);
                      setContactErrors({});
                    }}
                  >
                    <FiPlus size={14} /> {showAddContact ? "Close Form" : "Add Contact"}
                  </button>
                )}
              </div>

              {showAddContact && (
                <form className="company-add-contact-form" onSubmit={handleAddContact} noValidate>
                  <div className="form-header-inline">
                    <h4>New Contact Person</h4>
                    <button type="button" onClick={() => setShowAddContact(false)} className="btn-close-form">
                      <FiX size={16} />
                    </button>
                  </div>
                  <div className="contact-form-grid">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        ref={contactNameInputRef}
                        type="text"
                        value={contactName}
                        onChange={e => setContactName(e.target.value)}
                        placeholder="e.g. John Doe"
                      />
                      {contactErrors.name && <span className="field-error-txt">{contactErrors.name}</span>}
                    </div>
                    <div className="form-group">
                      <label>Work Email *</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        placeholder="john@company.com"
                      />
                      {contactErrors.email && <span className="field-error-txt">{contactErrors.email}</span>}
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                        placeholder="+91 9876543210"
                      />
                      {contactErrors.phone && <span className="field-error-txt">{contactErrors.phone}</span>}
                    </div>
                    <div className="form-group">
                      <label>Job Title / Designation</label>
                      <input
                        type="text"
                        value={contactTitle}
                        onChange={e => setContactTitle(e.target.value)}
                        placeholder="e.g. Head of Talent Acquisition"
                      />
                    </div>
                  </div>
                  <div className="form-actions-row">
                    <button type="button" className="btn-cancel" onClick={() => setShowAddContact(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-submit-contact">
                      Save Contact
                    </button>
                  </div>
                </form>
              )}

              {profile?.contacts && profile.contacts.length > 0 ? (
                <div className="contacts-cards-list">
                  {profile.contacts.map(c => (
                    <div key={c.id} className="contact-person-card">
                      <div className="contact-card-top">
                        <div className="contact-avatar-sm">
                          {(c.name || "C")[0].toUpperCase()}
                        </div>
                        <div className="contact-main-info">
                          <h4 className="contact-person-name">{c.name}</h4>
                          <span className="contact-job-title">{c.jobTitle || "Recruitment Manager"}</span>
                        </div>
                        {!isReadOnly && (
                          <button
                            type="button"
                            className="btn-delete-contact"
                            onClick={() => handleDeleteContact(c.id)}
                            title="Remove contact"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="contact-card-details">
                        <span className="contact-item">
                          <FiMail size={13} /> {c.email}
                        </span>
                        {c.phone && (
                          <span className="contact-item">
                            <FiPhone size={13} /> {c.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-contacts-placeholder">
                  <FiUsers size={28} />
                  <p>No hiring contact persons listed yet.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* EDIT MODE FORM */
          <div className="company-edit-redesign-root">
            {/* Top Hero Gradient Banner */}
            <div className="comp-edit-banner">
              <div className="comp-edit-banner-left">
                <div className="comp-banner-badge-icon">
                  <FiEdit3 size={22} />
                </div>
                <div className="comp-banner-headings">
                  <h1 className="comp-banner-title">Edit Company Profile &amp; Organization Settings</h1>
                  <p className="comp-banner-sub">
                    Update your company information, online presence, and organizational details to attract the right talent.
                  </p>
                </div>
              </div>
              <div className="comp-edit-banner-right">
                {/* Decorative Building Graphic with Gear */}
                <div className="comp-banner-art" aria-hidden="true">
                  <svg viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="comp-art-svg">
                    <rect x="15" y="24" width="22" height="46" rx="4" fill="#A7F3D0" />
                    <rect x="20" y="32" width="4" height="6" rx="1" fill="#FFFFFF" />
                    <rect x="28" y="32" width="4" height="6" rx="1" fill="#FFFFFF" />
                    <rect x="20" y="44" width="4" height="6" rx="1" fill="#FFFFFF" />
                    <rect x="28" y="44" width="4" height="6" rx="1" fill="#FFFFFF" />
                    <rect x="20" y="56" width="4" height="6" rx="1" fill="#FFFFFF" />
                    <rect x="28" y="56" width="4" height="6" rx="1" fill="#FFFFFF" />

                    <rect x="42" y="10" width="30" height="60" rx="4" fill="#6EE7B7" />
                    <rect x="48" y="18" width="5" height="7" rx="1" fill="#047857" />
                    <rect x="61" y="18" width="5" height="7" rx="1" fill="#047857" />
                    <rect x="48" y="30" width="5" height="7" rx="1" fill="#047857" />
                    <rect x="61" y="30" width="5" height="7" rx="1" fill="#047857" />
                    <rect x="48" y="42" width="5" height="7" rx="1" fill="#047857" />
                    <rect x="61" y="42" width="5" height="7" rx="1" fill="#047857" />

                    <rect x="76" y="20" width="24" height="50" rx="4" fill="#D1FAE5" />
                    <rect x="82" y="28" width="4" height="6" rx="1" fill="#059669" />
                    <rect x="90" y="28" width="4" height="6" rx="1" fill="#059669" />
                    <rect x="82" y="40" width="4" height="6" rx="1" fill="#059669" />
                    <rect x="90" y="40" width="4" height="6" rx="1" fill="#059669" />

                    <circle cx="72" cy="54" r="14" fill="#059669" />
                    <path d="M72 45v3m0 12v3m9-9h-3m-12 0h-3m15.5-6.5l-2.1 2.1m-8.8 8.8l-2.1 2.1m13-2.1l-2.1-2.1m-8.8-8.8l-2.1-2.1" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="72" cy="54" r="5" fill="#047857" />
                  </svg>
                </div>
                <button
                  type="button"
                  className="comp-banner-cancel-btn"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  <FiX size={15} /> Cancel
                </button>
              </div>
            </div>

            {/* Error / Success Banners */}
            {error && <div className="profile-alert alert-error" style={{ margin: '14px 0' }}>{error}</div>}
            {success && <div className="profile-alert alert-success" style={{ margin: '14px 0' }}>{success}</div>}

            <form className="comp-edit-form" onSubmit={e => { e.preventDefault(); handleSave(); }}>
              {/* Row 1: Basic Information (Left) + Company Logo (Right) */}
              <div className="comp-edit-top-grid">
                {/* Left Card: Basic Information */}
                <div className="comp-card-section">
                  <div className="comp-card-header">
                    <div className="comp-card-icon-badge">
                      <FiShield size={18} />
                    </div>
                    <div className="comp-card-title-wrap">
                      <h2 className="comp-card-title">Basic Information</h2>
                      <p className="comp-card-subtitle">Provide your company's official name and brand details.</p>
                    </div>
                  </div>
                  <div className="comp-card-body">
                    <div className="comp-card-2col">
                      <div className="comp-field-group">
                        <label className="comp-field-label">
                          <FiBriefcase size={14} className="comp-label-icon" />
                          Display Name (Brand Name) <span className="req-star">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.displayName || ""}
                          onChange={e => {
                            setForm(p => ({ ...p, displayName: e.target.value }));
                            if (formErrors.displayName) setFormErrors(p => ({ ...p, displayName: "" }));
                          }}
                          className={"comp-input" + (formErrors.displayName ? " comp-input-error" : "")}
                          placeholder="e.g. Acme Technologies"
                        />
                        <span className="comp-field-hint">This name will be visible to candidates.</span>
                        {formErrors.displayName && <span className="comp-error-msg">{formErrors.displayName}</span>}
                      </div>

                      <div className="comp-field-group">
                        <label className="comp-field-label">
                          <FiShield size={14} className="comp-label-icon" />
                          Legal Company Name <span className="req-star">*</span>
                        </label>
                        <input
                          ref={legalNameInputRef}
                          type="text"
                          value={form.legalName || ""}
                          onChange={e => {
                            setForm(p => ({ ...p, legalName: e.target.value }));
                            if (formErrors.legalName) setFormErrors(p => ({ ...p, legalName: "" }));
                          }}
                          className={"comp-input" + (formErrors.legalName ? " comp-input-error" : "")}
                          placeholder="e.g. Acme Technologies Inc."
                        />
                        <span className="comp-field-hint">Enter your registered legal company name.</span>
                        {formErrors.legalName && <span className="comp-error-msg">{formErrors.legalName}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Company Logo */}
                <div className="comp-card-section comp-logo-card">
                  <div className="comp-card-header">
                    <div className="comp-card-icon-badge">
                      <FiImage size={18} />
                    </div>
                    <div className="comp-card-title-wrap">
                      <h2 className="comp-card-title">Company Logo</h2>
                    </div>
                  </div>
                  <div className="comp-card-body">
                    <label className="comp-logo-dropzone">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              alert("Logo image must be smaller than 2MB");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setForm(p => ({ ...p, logoUrl: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {form.logoUrl ? (
                        <div className="comp-logo-preview-wrap">
                          <img src={form.logoUrl} alt="Company Logo" className="comp-logo-preview-img" />
                          <div className="comp-logo-preview-hover">
                            <FiCamera size={18} />
                            <span>Change Logo</span>
                          </div>
                        </div>
                      ) : (
                        <div className="comp-logo-placeholder">
                          <div className="comp-logo-camera-icon">
                            <FiCamera size={18} />
                          </div>
                          <span className="comp-logo-upload-title">Upload Company Logo</span>
                          <span className="comp-logo-upload-types">JPG, PNG (Max 2 MB)</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Card 2: Web & Online Presence */}
              <div className="comp-card-section">
                <div className="comp-card-header">
                  <div className="comp-card-icon-badge">
                    <FiGlobe size={18} />
                  </div>
                  <div className="comp-card-title-wrap">
                    <h2 className="comp-card-title">Web &amp; Online Presence</h2>
                    <p className="comp-card-subtitle">Add your company's website and social media links.</p>
                  </div>
                </div>
                <div className="comp-card-body">
                  <div className="comp-card-2col">
                    <div className="comp-field-group">
                      <label className="comp-field-label">
                        <FiLink size={14} className="comp-label-icon" />
                        Company Website URL
                      </label>
                      <input
                        type="url"
                        value={form.website || ""}
                        onChange={e => {
                          setForm(p => ({ ...p, website: e.target.value }));
                          if (formErrors.website) setFormErrors(p => ({ ...p, website: "" }));
                        }}
                        className={"comp-input" + (formErrors.website ? " comp-input-error" : "")}
                        placeholder="https://www.isigntech.com/"
                      />
                      <span className="comp-field-hint">Enter your official company website.</span>
                      {formErrors.website && <span className="comp-error-msg">{formErrors.website}</span>}
                    </div>

                    <div className="comp-field-group">
                      <label className="comp-field-label">
                        <FiLinkedin size={14} className="comp-label-icon comp-icon-linkedin" />
                        LinkedIn Company Page
                      </label>
                      <input
                        type="url"
                        value={form.linkedinUrl || ""}
                        onChange={e => {
                          setForm(p => ({ ...p, linkedinUrl: e.target.value }));
                          if (formErrors.linkedinUrl) setFormErrors(p => ({ ...p, linkedinUrl: "" }));
                        }}
                        className={"comp-input" + (formErrors.linkedinUrl ? " comp-input-error" : "")}
                        placeholder="https://linkedin.com/isigntech"
                      />
                      <span className="comp-field-hint">Add your LinkedIn company page URL.</span>
                      {formErrors.linkedinUrl && <span className="comp-error-msg">{formErrors.linkedinUrl}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Organization Details */}
              <div className="comp-card-section">
                <div className="comp-card-header">
                  <div className="comp-card-icon-badge">
                    <FiBriefcase size={18} />
                  </div>
                  <div className="comp-card-title-wrap">
                    <h2 className="comp-card-title">Organization Details</h2>
                    <p className="comp-card-subtitle">Help candidates understand your industry and company size.</p>
                  </div>
                </div>
                <div className="comp-card-body">
                  <div className="comp-card-2col">
                    <div className="comp-field-group">
                      <label className="comp-field-label">
                        <FiLayers size={14} className="comp-label-icon" />
                        Industry / Domain
                      </label>
                      <div className="comp-select-wrap">
                        <select
                          value={form.industry || "Information Technology & Services"}
                          onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                          className="comp-select"
                        >
                          <option value="Information Technology & Services">Information Technology & Services</option>
                          <option value="Software Development & SaaS">Software Development & SaaS</option>
                          <option value="Financial Services & Fintech">Financial Services & Fintech</option>
                          <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                          <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                          <option value="Telecommunications">Telecommunications</option>
                          <option value="Consulting & Professional Services">Consulting & Professional Services</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <span className="comp-field-hint">Select your primary industry.</span>
                    </div>

                    <div className="comp-field-group">
                      <label className="comp-field-label">
                        <FiUsers size={14} className="comp-label-icon" />
                        Employee Strength
                      </label>
                      <div className="comp-select-wrap">
                        <select
                          value={form.companySize || "1-10 Employees"}
                          onChange={e => setForm(p => ({ ...p, companySize: e.target.value }))}
                          className="comp-select"
                        >
                          <option value="1-10 Employees">1-10 Employees (Seed / Early)</option>
                          <option value="11-50 Employees">11-50 Employees (Startup / Growth)</option>
                          <option value="51-200 Employees">51-200 Employees (Mid-size)</option>
                          <option value="201-500 Employees">201-500 Employees (Scale-up)</option>
                          <option value="500+ Employees">500+ Employees (Enterprise)</option>
                        </select>
                      </div>
                      <span className="comp-field-hint">Select total number of employees.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Headquarters */}
              <div className="comp-card-section">
                <div className="comp-card-header">
                  <div className="comp-card-icon-badge">
                    <FiMapPin size={18} />
                  </div>
                  <div className="comp-card-title-wrap">
                    <h2 className="comp-card-title">Headquarters</h2>
                    <p className="comp-card-subtitle">Specify your main office location.</p>
                  </div>
                </div>
                <div className="comp-card-body">
                  <div className="comp-card-2col">
                    <div className="comp-field-group">
                      <label className="comp-field-label">
                        <FiMapPin size={14} className="comp-label-icon" />
                        City / Headquarters
                      </label>
                      <input
                        type="text"
                        value={form.city || ""}
                        onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                        className="comp-input"
                        placeholder="e.g. Hyderabad, Chennai"
                      />
                      <span className="comp-field-hint">Enter your primary office location.</span>
                    </div>

                    <div className="comp-field-group">
                      <label className="comp-field-label">
                        <FiGlobe size={14} className="comp-label-icon" />
                        Country
                      </label>
                      <div className="comp-select-wrap">
                        <select
                          value={form.country || "India"}
                          onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                          className="comp-select"
                        >
                          <option value="India">India</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Canada">Canada</option>
                          <option value="Australia">Australia</option>
                          <option value="Singapore">Singapore</option>
                          <option value="Germany">Germany</option>
                          <option value="United Arab Emirates">United Arab Emirates</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <span className="comp-field-hint">Select your country.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5: About Organization */}
              <div className="comp-card-section">
                <div className="comp-card-header">
                  <div className="comp-card-icon-badge">
                    <FiFileText size={18} />
                  </div>
                  <div className="comp-card-title-wrap">
                    <h2 className="comp-card-title">About Organization</h2>
                    <p className="comp-card-subtitle">Tell candidates about your company, mission, and what makes you unique.</p>
                  </div>
                </div>
                <div className="comp-card-body">
                  <div className="comp-field-group" style={{ position: 'relative' }}>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={form.description || ""}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      className="comp-textarea"
                      placeholder="Write a short description about your company, culture, vision, and opportunities..."
                    />
                    <div className="comp-char-counter">
                      {(form.description || "").length}/500
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="comp-edit-footer">
                <button
                  type="button"
                  className="comp-btn-discard"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  <FiRotateCcw size={15} /> Discard Changes
                </button>
                <button
                  type="submit"
                  className="comp-btn-save"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="spinner" />
                  ) : (
                    <>
                      <FiCheck size={16} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfileView;
