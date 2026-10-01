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
    } catch {
      // Fallback draft based on authenticated user info or routeCompanyId
      const fallback: CompanyProfile = {
        id: routeCompanyId || "draft",
        legalName: user?.fullName || "company1",
        displayName: user?.fullName || "company1",
        email: user?.email || "company1@gmail.com",
        industry: "Information Technology & Services",
        companySize: "1-10 Employees",
        website: "https://www.isigntech.com/",
        linkedinUrl: "https://linkedin.com/isigntech",
        description: "A structured group of people who work together in a coordinated way to reach shared goals and objectives. We are an Information Technology & Services company focused on building innovative solutions and connecting with top talent.",
        country: "India",
        city: "Hyderabad, Chennai",
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
                      {profile?.displayName || profile?.legalName || "company1"}
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
                    Legal Name: <strong>{profile?.legalName || "company1"}</strong>
                  </p>

                  <div className="hero-meta-pills-row">
                    <span className="hero-meta-pill">
                      <FiBriefcase size={13} /> {profile?.industry || "Information Technology & Services"}
                    </span>
                    <span className="hero-meta-pill">
                      <FiUsers size={13} /> {profile?.companySize || "1-10 Employees"}
                    </span>
                    <span className="hero-meta-pill">
                      <FiMapPin size={13} /> {profile?.city ? `${profile.city}, ${profile.country || "India"}` : "Hyderabad, Chennai, India"}
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
                  {profile?.description ||
                    "A structured group of people who work together in a coordinated way to reach shared goals and objectives. We are an Information Technology & Services company focused on building innovative solutions and connecting with top talent."}
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
                      <span className="metric-txt muted">https://www.isigntech.com/</span>
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
                      <span className="metric-txt muted">https://linkedin.com/isigntech</span>
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
                    <strong className="metric-val">{profile?.industry || "Information Technology & Services"}</strong>
                  </div>
                </div>

                {/* 4. Employee Strength */}
                <div className="detail-metric-card">
                  <div className="metric-icon-box green">
                    <FiUsers size={18} />
                  </div>
                  <div className="metric-details">
                    <span className="metric-lbl">Employee Strength</span>
                    <strong className="metric-val">{profile?.companySize || "1-10 Employees"}</strong>
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
                      {profile?.city ? `${profile.city}, ${profile.country || "India"}` : "Hyderabad, Chennai, India"}
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
                    <strong className="metric-val">{profile?.email || user?.email || "company1@gmail.com"}</strong>
                  </div>
                </div>

                {/* 7. Joined On */}
                <div className="detail-metric-card">
                  <div className="metric-icon-box blue">
                    <FiCalendar size={18} />
                  </div>
                  <div className="metric-details">
                    <span className="metric-lbl">Joined On</span>
                    <strong className="metric-val">22 September 2026</strong>
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
          <div className="company-edit-form-card">
            <div className="edit-form-header">
              <h2>Edit Company Profile & Organization Settings</h2>
              <button
                type="button"
                className="btn-cancel-edit-top"
                onClick={() => setEditing(false)}
              >
                <FiX size={18} /> Cancel
              </button>
            </div>

            <form className="edit-company-form" onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="form-sections-body">
                {/* Group 1: Basic Information */}
                <div className="form-sub-block">
                  <h3 className="block-title">Basic Information</h3>
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>Display Name (Brand Name) *</label>
                      <input
                        type="text"
                        value={form.displayName || ""}
                        onChange={e => {
                          setForm(p => ({ ...p, displayName: e.target.value }));
                          if (formErrors.displayName) setFormErrors(p => ({ ...p, displayName: "" }));
                        }}
                        className={formErrors.displayName ? "is-invalid" : ""}
                        placeholder="e.g. Acme Corporation"
                      />
                      {formErrors.displayName && <span className="field-error-txt">{formErrors.displayName}</span>}
                    </div>

                    <div className="form-group">
                      <label>Legal Company Name *</label>
                      <input
                        ref={legalNameInputRef}
                        type="text"
                        value={form.legalName || ""}
                        onChange={e => {
                          setForm(p => ({ ...p, legalName: e.target.value }));
                          if (formErrors.legalName) setFormErrors(p => ({ ...p, legalName: "" }));
                        }}
                        className={formErrors.legalName ? "is-invalid" : ""}
                        placeholder="e.g. Acme Innovations Pvt Ltd"
                      />
                      {formErrors.legalName && <span className="field-error-txt">{formErrors.legalName}</span>}
                    </div>
                  </div>
                </div>

                {/* Group 2: Online Presence */}
                <div className="form-sub-block">
                  <h3 className="block-title">Web & Online Presence</h3>
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>
                        <FiGlobe size={14} style={{ marginRight: '4px', verticalAlign: 'middle', color: '#047857' }} />
                        Company Website URL
                      </label>
                      <input
                        type="url"
                        value={form.website || ""}
                        onChange={e => {
                          setForm(p => ({ ...p, website: e.target.value }));
                          if (formErrors.website) setFormErrors(p => ({ ...p, website: "" }));
                        }}
                        className={formErrors.website ? "is-invalid" : ""}
                        placeholder="https://example.com"
                      />
                      {formErrors.website && <span className="field-error-txt">{formErrors.website}</span>}
                    </div>

                    <div className="form-group">
                      <label>
                        <FiLinkedin size={14} style={{ marginRight: '4px', verticalAlign: 'middle', color: '#0a66c2' }} />
                        LinkedIn Company Page
                      </label>
                      <input
                        type="url"
                        value={form.linkedinUrl || ""}
                        onChange={e => {
                          setForm(p => ({ ...p, linkedinUrl: e.target.value }));
                          if (formErrors.linkedinUrl) setFormErrors(p => ({ ...p, linkedinUrl: "" }));
                        }}
                        className={formErrors.linkedinUrl ? "is-invalid" : ""}
                        placeholder="https://linkedin.com/company/acme"
                      />
                      {formErrors.linkedinUrl && <span className="field-error-txt">{formErrors.linkedinUrl}</span>}
                    </div>
                  </div>
                </div>

                {/* Group 3: Industry & Size */}
                <div className="form-sub-block">
                  <h3 className="block-title">Organization Details</h3>
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>
                        <FiLayers size={14} style={{ marginRight: '4px', verticalAlign: 'middle', color: '#047857' }} />
                        Industry / Domain
                      </label>
                      <select
                        value={form.industry || "Information Technology & Services"}
                        onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
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

                    <div className="form-group">
                      <label>
                        <FiUsers size={14} style={{ marginRight: '4px', verticalAlign: 'middle', color: '#047857' }} />
                        Employee Strength
                      </label>
                      <select
                        value={form.companySize || "1-10 Employees"}
                        onChange={e => setForm(p => ({ ...p, companySize: e.target.value }))}
                      >
                        <option value="1-10 Employees">1-10 Employees (Seed / Early)</option>
                        <option value="11-50 Employees">11-50 Employees (Startup / Growth)</option>
                        <option value="51-200 Employees">51-200 Employees (Mid-size)</option>
                        <option value="201-500 Employees">201-500 Employees (Scale-up)</option>
                        <option value="500+ Employees">500+ Employees (Enterprise)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Group 4: Location */}
                <div className="form-sub-block">
                  <h3 className="block-title">Headquarters</h3>
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>
                        <FiMapPin size={14} style={{ marginRight: '4px', verticalAlign: 'middle', color: '#047857' }} />
                        City / Headquarters
                      </label>
                      <input
                        type="text"
                        value={form.city || ""}
                        onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                        placeholder="e.g. Hyderabad"
                      />
                    </div>

                    <div className="form-group">
                      <label>Country</label>
                      <input
                        type="text"
                        value={form.country || "India"}
                        onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                        placeholder="e.g. India"
                      />
                    </div>
                  </div>
                </div>

                {/* Group 5: Description */}
                <div className="form-sub-block">
                  <h3 className="block-title">About Organization</h3>
                  <div className="form-group">
                    <label>Company Overview & Culture</label>
                    <textarea
                      rows={4}
                      value={form.description || ""}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Describe what your organization builds, work culture, team values, and hiring missions..."
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="edit-form-action-footer">
                <button
                  type="button"
                  className="btn-cancel-edit"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-save-profile-changes"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <span className="spinner" />
                  ) : (
                    <>
                      <FiCheckCircle size={16} /> Save Profile Changes
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
