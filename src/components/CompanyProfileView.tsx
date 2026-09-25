import React, { useEffect, useState, useRef } from "react";
import { companiesApi } from "../api/companies";
import { useAuth } from "../context/AuthContext";
import type { CompanyProfile, CompanyContact } from "../types";
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
  FiUserPlus,
} from "react-icons/fi";
import "./CompanyProfileView.css";

const CompanyProfileView: React.FC = () => {
  const { user } = useAuth();
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
      const res = await companiesApi.getMyProfile();
      setProfile(res.data.data);
      setForm(res.data.data);
    } catch {
      // Fallback draft based on authenticated user info
      const fallback: CompanyProfile = {
        id: "draft",
        legalName: user?.fullName || "Acme Corporation",
        displayName: user?.fullName || "Acme Tech",
        email: user?.email || "recruiting@company.com",
        industry: "Information Technology & Services",
        companySize: "11-50 Employees",
        website: "https://example.com",
        linkedinUrl: "",
        description: "",
        country: "India",
        city: "Hyderabad",
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
  }, []);

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
          <div className="company-loading-card">
            <div className="spinner" />
            <p>Loading company profile details...</p>
          </div>
        </div>
      </div>
    );
  }

  const companyInitials = (profile?.displayName || profile?.legalName || "C").substring(0, 2).toUpperCase();

  return (
    <div className="company-profile-page-wrapper">
      <div className="company-profile-container">

        {/* Action Top Bar */}
        <div className="company-profile-action-bar">
          <div className="company-role-pill">
            <FiUserCheck size={14} /> COMPANY ACCOUNT
          </div>

          <button
            type="button"
            className="btn-toggle-edit"
            onClick={() => {
              setEditing(!editing);
              setError("");
              setSuccess("");
            }}
          >
            {editing ? (
              <>
                <FiArrowLeft size={15} /> Back to Profile View
              </>
            ) : (
              <>
                <FiEdit3 size={15} /> Edit Company Profile
              </>
            )}
          </button>
        </div>

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
            VIEW MODE
           ===================================================================== */}
        {!editing ? (
          <>
            {/* Header Profile Card (Student Profile Style) */}
            <div className="company-header-card">
              <div className="company-header-left">
                <div className="company-avatar-box">
                  <span className="company-avatar-initials">{companyInitials}</span>
                  <span className="company-verified-tag">
                    <FiCheckCircle size={12} /> ACTIVE
                  </span>
                </div>

                <div className="company-header-info">
                  <div className="company-name-row">
                    <h1 className="company-display-name">
                      {profile?.displayName || profile?.legalName}
                    </h1>
                    <button
                      className="btn-icon-edit"
                      onClick={() => setEditing(true)}
                      title="Edit Company Details"
                    >
                      <FiEdit3 size={16} />
                    </button>
                  </div>

                  <p className="company-legal-name">
                    Legal Name: <strong>{profile?.legalName || "Not specified"}</strong>
                  </p>

                  <div className="company-detail-grid">
                    <span className="cp-detail-item filled">
                      <FiBriefcase className="detail-icon" /> {profile?.industry || "Technology & Services"}
                    </span>
                    <span className="cp-detail-item filled">
                      <FiUsers className="detail-icon" /> {profile?.companySize || "11-50 Employees"}
                    </span>
                    <span className="cp-detail-item filled">
                      <FiMapPin className="detail-icon" /> {profile?.city ? `${profile.city}, ${profile.country || "India"}` : "Headquarters Global"}
                    </span>
                    <span className="cp-detail-item filled">
                      <FiMail className="detail-icon" /> {profile?.email || user?.email}
                    </span>
                    {profile?.website && (
                      <a
                        href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="cp-detail-item filled link-item"
                        title={profile.website}
                      >
                        <FiGlobe className="detail-icon" /> {profile.website.replace(/^https?:\/\//i, '').replace(/\/.*$/, '')} <FiExternalLink size={12} />
                      </a>
                    )}
                    {profile?.linkedinUrl && (
                      <a
                        href={profile.linkedinUrl.startsWith("http") ? profile.linkedinUrl : `https://${profile.linkedinUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="cp-detail-item filled link-item linkedin"
                        title={profile.linkedinUrl}
                      >
                        <FiLinkedin className="detail-icon" style={{ color: '#0a66c2' }} /> LinkedIn Page <FiExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Sections Stack */}
            <div className="company-sections-stack">

              {/* Section 1: About Organization */}
              <div className="company-section-card">
                <div className="company-section-header">
                  <h2 className="company-section-title">
                    <FiFileText size={18} color="#70c144" /> About Organization
                  </h2>
                  <button className="section-action-link" onClick={() => setEditing(true)}>
                    <FiEdit3 size={13} /> {profile?.description ? "Edit Bio" : "Add Bio"}
                  </button>
                </div>

                {profile?.description ? (
                  <p className="company-desc-content">{profile.description}</p>
                ) : (
                  <div className="company-empty-card" onClick={() => setEditing(true)}>
                    <FiFileText size={32} className="empty-card-icon" />
                    <p className="empty-card-title">No Description Provided</p>
                    <p className="empty-card-desc">
                      Add a compelling bio highlighting your organization mission, engineering culture, and hiring focus to attract top talent.
                    </p>
                    <button className="btn-empty-action" type="button">
                      <FiPlus size={14} /> Add Organization Overview
                    </button>
                  </div>
                )}
              </div>

              {/* Section 2: Key Organization Details & Online Presence */}
              <div className="company-section-card">
                <div className="company-section-header">
                  <h2 className="company-section-title">
                    <FiBriefcase size={18} color="#70c144" /> Key Organization Details
                  </h2>
                  <button className="section-action-link" onClick={() => setEditing(true)}>
                    <FiEdit3 size={13} /> Edit Details
                  </button>
                </div>

                <div className="company-info-cards-grid">
                  <div className="info-box-item">
                    <span className="info-box-label">
                      <FiGlobe size={14} /> Official Website
                    </span>
                    <span className="info-box-val">
                      {profile?.website ? (
                        <a
                          href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {profile.website}
                        </a>
                      ) : (
                        <span className="txt-muted">Not specified</span>
                      )}
                    </span>
                  </div>

                  <div className="info-box-item">
                    <span className="info-box-label">
                      <FiLinkedin size={14} style={{ color: '#0a66c2' }} /> LinkedIn Presence
                    </span>
                    <span className="info-box-val">
                      {profile?.linkedinUrl ? (
                        <a
                          href={profile.linkedinUrl.startsWith("http") ? profile.linkedinUrl : `https://${profile.linkedinUrl}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {profile.linkedinUrl}
                        </a>
                      ) : (
                        <span className="txt-muted">Not specified</span>
                      )}
                    </span>
                  </div>

                  <div className="info-box-item">
                    <span className="info-box-label">
                      <FiLayers size={14} /> Industry & Domain
                    </span>
                    <span className="info-box-val">
                      {profile?.industry || "Information Technology & Services"}
                    </span>
                  </div>

                  <div className="info-box-item">
                    <span className="info-box-label">
                      <FiUsers size={14} /> Employee Strength
                    </span>
                    <span className="info-box-val">
                      {profile?.companySize || "11-50 Employees"}
                    </span>
                  </div>

                  <div className="info-box-item">
                    <span className="info-box-label">
                      <FiMapPin size={14} /> Headquarters Location
                    </span>
                    <span className="info-box-val">
                      {profile?.city ? `${profile.city}, ${profile.country || "India"}` : "Global"}
                    </span>
                  </div>

                  <div className="info-box-item">
                    <span className="info-box-label">
                      <FiMail size={14} /> Official Account Email
                    </span>
                    <span className="info-box-val">
                      {profile?.email || user?.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Hiring & Recruitment Contacts */}
              <div className="company-section-card">
                <div className="company-section-header">
                  <h2 className="company-section-title">
                    <FiUsers size={18} color="#70c144" /> Hiring & Recruitment Contacts
                  </h2>
                  <button
                    className="section-action-link"
                    onClick={() => {
                      setShowAddContact(!showAddContact);
                      setContactErrors({});
                    }}
                  >
                    <FiPlus size={14} /> {showAddContact ? "Close Form" : "Add Contact"}
                  </button>
                </div>

                {showAddContact && (
                  <form className="company-add-contact-form" onSubmit={handleAddContact} noValidate>
                    <div className="form-header-inline">
                      <h4>New Contact Person</h4>
                      <button
                        type="button"
                        className="btn-close-form"
                        onClick={() => setShowAddContact(false)}
                      >
                        <FiX size={16} />
                      </button>
                    </div>

                    <div className="contact-form-grid">
                      <div className="form-group">
                        <label>Contact Name <span className="req-star">*</span></label>
                        <input
                          ref={contactNameInputRef}
                          type="text"
                          placeholder="e.g. Sarah Connor"
                          value={contactName}
                          onChange={e => {
                            setContactName(e.target.value);
                            if (contactErrors.name) setContactErrors(p => ({ ...p, name: "" }));
                          }}
                          className={contactErrors.name ? "is-invalid" : ""}
                        />
                        {contactErrors.name && <span className="field-error-txt">{contactErrors.name}</span>}
                      </div>

                      <div className="form-group">
                        <label>Work Email <span className="req-star">*</span></label>
                        <input
                          type="email"
                          placeholder="e.g. sarah@company.com"
                          value={contactEmail}
                          onChange={e => {
                            setContactEmail(e.target.value);
                            if (contactErrors.email) setContactErrors(p => ({ ...p, email: "" }));
                          }}
                          className={contactErrors.email ? "is-invalid" : ""}
                        />
                        {contactErrors.email && <span className="field-error-txt">{contactErrors.email}</span>}
                      </div>

                      <div className="form-group">
                        <label>Job Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Talent Acquisition Lead"
                          value={contactTitle}
                          onChange={e => setContactTitle(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          placeholder="e.g. +91 9876543210"
                          value={contactPhone}
                          onChange={e => {
                            setContactPhone(e.target.value);
                            if (contactErrors.phone) setContactErrors(p => ({ ...p, phone: "" }));
                          }}
                          className={contactErrors.phone ? "is-invalid" : ""}
                        />
                        {contactErrors.phone && <span className="field-error-txt">{contactErrors.phone}</span>}
                      </div>
                    </div>

                    <div className="contact-form-actions">
                      <button
                        type="button"
                        className="btn-cancel-contact"
                        onClick={() => setShowAddContact(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-save-contact-action">
                        Save Contact
                      </button>
                    </div>
                  </form>
                )}

                <div className="company-contacts-grid">
                  {profile?.contacts && profile.contacts.length > 0 ? (
                    profile.contacts.map((c: CompanyContact) => (
                      <div key={c.id} className="team-contact-card">
                        <div className="team-contact-avatar">
                          {c.name.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="team-contact-details">
                          <strong className="team-contact-name">{c.name}</strong>
                          {c.jobTitle && <span className="team-contact-role">{c.jobTitle}</span>}
                          <a href={`mailto:${c.email}`} className="team-contact-link">
                            <FiMail size={13} /> {c.email}
                          </a>
                          {c.phone && (
                            <a href={`tel:${c.phone}`} className="team-contact-link">
                              <FiPhone size={13} /> {c.phone}
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn-delete-team-contact"
                          onClick={() => handleDeleteContact(c.id)}
                          title="Remove Contact"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    !showAddContact && (
                      <div className="company-empty-card" onClick={() => setShowAddContact(true)}>
                        <FiUserPlus size={32} className="empty-card-icon" />
                        <p className="empty-card-title">No Recruitment Contacts Added</p>
                        <p className="empty-card-desc">
                          Add hiring managers or talent recruiters to help matched candidates reach out smoothly.
                        </p>
                        <button className="btn-empty-action" type="button">
                          <FiPlus size={14} /> Add Contact Person
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>

            </div>
          </>
        ) : (
          /* =====================================================================
              EDIT MODE (Student Profile Form Style)
             ===================================================================== */
          <div className="company-edit-card">
            <div className="edit-card-header">
              <h2 className="edit-title">
                <FiEdit3 size={20} color="#70c144" /> Edit Company Profile
              </h2>
              <p className="edit-sub">Update your organizational details, online links, and contact profile.</p>
            </div>

            <form onSubmit={e => { e.preventDefault(); handleSave(); }} noValidate>
              <div className="edit-form-sections">

                {/* Group 1: Identity */}
                <div className="form-sub-block">
                  <h3 className="block-title">Basic Information</h3>
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>
                        Company Display Name <span className="req-star">*</span>
                      </label>
                      <input
                        ref={legalNameInputRef}
                        type="text"
                        value={form.displayName || ""}
                        onChange={e => {
                          setForm(p => ({ ...p, displayName: e.target.value }));
                          if (formErrors.displayName) setFormErrors(p => ({ ...p, displayName: "" }));
                        }}
                        className={formErrors.displayName ? "is-invalid" : ""}
                        placeholder="e.g. Acme Innovations"
                      />
                      {formErrors.displayName && <span className="field-error-txt">{formErrors.displayName}</span>}
                    </div>

                    <div className="form-group">
                      <label>
                        Legal Entity Name <span className="req-star">*</span>
                      </label>
                      <input
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
                        <FiGlobe size={14} style={{ marginRight: '4px', verticalAlign: 'middle', color: '#70c144' }} />
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
                        <FiLayers size={14} style={{ marginRight: '4px', verticalAlign: 'middle', color: '#70c144' }} />
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
                        <FiUsers size={14} style={{ marginRight: '4px', verticalAlign: 'middle', color: '#70c144' }} />
                        Employee Strength
                      </label>
                      <select
                        value={form.companySize || "11-50 Employees"}
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
                        <FiMapPin size={14} style={{ marginRight: '4px', verticalAlign: 'middle', color: '#70c144' }} />
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
