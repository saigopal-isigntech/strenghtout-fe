import React, { useEffect, useState, useRef } from "react";
import { companiesApi } from "../api/companies";
import { useAuth } from "../context/AuthContext";
import type { CompanyProfile, CompanyContact } from "../types";
import { validateEmail, validatePhone, validateRequired, validateUrl } from "../utils/validators";
import { FiAlertCircle, FiTrash2, FiMail, FiPhone, FiMapPin, FiCheckCircle } from "react-icons/fi";
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
        industry: "Information Technology",
        companySize: "50-200 Employees",
        website: "https://example.com",
        description: "Innovative enterprise building next-generation digital workforce solutions.",
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
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update company profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const nameErr = validateRequired(contactName, "Contact name", 2);
    if (nameErr) errors.name = nameErr;

    const emailErr = validateEmail(contactEmail, "Contact work email");
    if (emailErr) errors.email = emailErr;

    if (contactPhone.trim()) {
      const phErr = validatePhone(contactPhone, "Phone number");
      if (phErr) errors.phone = phErr;
    }

    if (Object.keys(errors).length > 0) {
      setContactErrors(errors);
      return;
    }

    setContactErrors({});
    try {
      await companiesApi.addContact({
        name: contactName.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
        jobTitle: contactTitle.trim(),
        isPrimary: false
      });
      setShowAddContact(false);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactTitle("");
      loadProfile();
      setSuccess("Recruitment contact added successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to add contact.");
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await companiesApi.deleteContact(contactId);
      loadProfile();
      setSuccess("Contact removed.");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to remove contact.");
    }
  };

  const setField = (field: keyof CompanyProfile) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (loading) {
    return (
      <div className="company-profile-loading">
        <div className="spinner-lg" />
        <p>Loading company profile...</p>
      </div>
    );
  }

  return (
    <div className="company-profile-wrap">
      {success && <div className="company-alert success">{success}</div>}
      {error && <div className="company-alert error">{error}</div>}

      <div className="company-action-bar">
        <div className="badge-role-company">COMPANY ACCOUNT</div>
        <button className="btn-edit-company" onClick={() => { setEditing(!editing); setFormErrors({}); }}>
          {editing ? "Cancel Editing" : "✎ Edit Company Profile"}
        </button>
      </div>

      {editing ? (
        <div className="company-edit-panel">
          <h2 className="edit-heading">Edit Company Profile</h2>
          <div className="edit-form-grid">
            <div className="form-group">
              <label>Company Display Name *</label>
              <input
                type="text"
                value={form.displayName || ""}
                onChange={setField("displayName")}
                placeholder="Brand name"
                className={formErrors.displayName ? "is-invalid" : ""}
              />
              {formErrors.displayName && (
                <span className="field-hint error" style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: 3 }}>
                  <FiAlertCircle size={12} /> {formErrors.displayName}
                </span>
              )}
            </div>
            <div className="form-group">
              <label>Legal Name *</label>
              <input
                type="text"
                value={form.legalName || ""}
                onChange={setField("legalName")}
                placeholder="Full legal entity name"
                className={formErrors.legalName ? "is-invalid" : ""}
              />
              {formErrors.legalName && (
                <span className="field-hint error" style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: 3 }}>
                  <FiAlertCircle size={12} /> {formErrors.legalName}
                </span>
              )}
            </div>
            <div className="form-group">
              <label>Website URL</label>
              <input
                type="url"
                value={form.website || ""}
                onChange={setField("website")}
                placeholder="https://company.com"
                className={formErrors.website ? "is-invalid" : ""}
              />
              {formErrors.website && (
                <span className="field-hint error" style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: 3 }}>
                  <FiAlertCircle size={12} /> {formErrors.website}
                </span>
              )}
            </div>
            <div className="form-group">
              <label>Industry</label>
              <input
                type="text"
                value={form.industry || ""}
                onChange={setField("industry")}
                placeholder="e.g. Software, Healthcare, Finance"
              />
            </div>
            <div className="form-group">
              <label>Company Size</label>
              <select value={form.companySize || "11-50"} onChange={setField("companySize")}>
                <option value="1-10">1-10 Employees</option>
                <option value="11-50">11-50 Employees</option>
                <option value="51-200">51-200 Employees</option>
                <option value="201-500">201-500 Employees</option>
                <option value="500+">500+ Employees</option>
              </select>
            </div>
            <div className="form-group">
              <label>Headquarters City</label>
              <input
                type="text"
                value={form.city || ""}
                onChange={setField("city")}
                placeholder="e.g. Hyderabad"
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                value={form.country || ""}
                onChange={setField("country")}
                placeholder="e.g. India"
              />
            </div>
          </div>
          <div className="form-group full-width">
            <label>About Company</label>
            <textarea
              rows={4}
              value={form.description || ""}
              onChange={setField("description")}
              placeholder="Describe your organization, mission, and culture..."
            />
          </div>
          <div className="edit-actions">
            <button className="btn-save-company" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button className="btn-cancel-company" onClick={() => { setEditing(false); setFormErrors({}); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="company-display-card">
          <div className="company-header-hero">
            <div className="company-logo-avatar">
              {profile?.displayName?.[0]?.toUpperCase() || "C"}
            </div>
            <div className="company-header-info">
              <h1 className="company-title">{profile?.displayName || profile?.legalName}</h1>
              <p className="company-legal-subtitle">Legal Name: {profile?.legalName}</p>
              <div className="company-tags">
                <span className="info-chip industry">{profile?.industry || "Technology"}</span>
                <span className="info-chip size">{profile?.companySize || "10-50 Employees"}</span>
                <span className="info-chip location"><FiMapPin size={13} /> {profile?.city ? `${profile.city}, ${profile?.country || ""}` : "Remote"}</span>
                <span className="info-chip status"><FiCheckCircle size={13} /> {profile?.status || "ACTIVE"}</span>
              </div>
            </div>
          </div>

          <div className="company-body-grid">
            <div className="body-col-main">
              <div className="detail-section">
                <h3>About Organization</h3>
                <p className="company-desc">
                  {profile?.description || "No description provided yet. Click 'Edit Company Profile' to add company bio and details."}
                </p>
              </div>

              <div className="detail-section">
                <div className="contacts-header">
                  <h3>Hiring & Recruitment Contacts</h3>
                  <button className="btn-add-contact-sm" onClick={() => { setShowAddContact(!showAddContact); setContactErrors({}); }}>
                    {showAddContact ? "Cancel" : "+ Add Contact"}
                  </button>
                </div>

                {showAddContact && (
                  <form className="add-contact-box" onSubmit={handleAddContact} noValidate>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <input
                        type="text"
                        placeholder="Contact Name *"
                        value={contactName}
                        onChange={e => { setContactName(e.target.value); if (contactErrors.name) setContactErrors(p => ({ ...p, name: "" })); }}
                        className={contactErrors.name ? "is-invalid" : ""}
                      />
                      {contactErrors.name && <span style={{ color: "#dc2626", fontSize: "0.78rem" }}>{contactErrors.name}</span>}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <input
                        type="email"
                        placeholder="Work Email *"
                        value={contactEmail}
                        onChange={e => { setContactEmail(e.target.value); if (contactErrors.email) setContactErrors(p => ({ ...p, email: "" })); }}
                        className={contactErrors.email ? "is-invalid" : ""}
                      />
                      {contactErrors.email && <span style={{ color: "#dc2626", fontSize: "0.78rem" }}>{contactErrors.email}</span>}
                    </div>

                    <input
                      type="text"
                      placeholder="Job Title (e.g. Lead Recruiter)"
                      value={contactTitle}
                      onChange={e => setContactTitle(e.target.value)}
                    />

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <input
                        type="tel"
                        placeholder="Phone Number (e.g. 9876543210)"
                        value={contactPhone}
                        onChange={e => { setContactPhone(e.target.value); if (contactErrors.phone) setContactErrors(p => ({ ...p, phone: "" })); }}
                        className={contactErrors.phone ? "is-invalid" : ""}
                      />
                      {contactErrors.phone && <span style={{ color: "#dc2626", fontSize: "0.78rem" }}>{contactErrors.phone}</span>}
                    </div>

                    <button type="submit" className="btn-save-contact">Save Contact</button>
                  </form>
                )}

                <div className="contacts-list">
                  {profile?.contacts && profile.contacts.length > 0 ? (
                    profile.contacts.map((c: CompanyContact) => (
                      <div key={c.id} className="contact-card">
                        <div className="contact-info">
                          <strong>{c.name}</strong>
                          {c.jobTitle && <span className="contact-title">{c.jobTitle}</span>}
                          <span className="contact-email"><FiMail size={13} /> {c.email}</span>
                          {c.phone && <span className="contact-phone"><FiPhone size={13} /> {c.phone}</span>}
                        </div>
                        <button className="btn-delete-contact" onClick={() => handleDeleteContact(c.id)} title="Delete Contact">
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="no-contacts-txt">No recruitment contacts listed yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="body-col-side">
              <div className="side-card">
                <h4>Company Account Overview</h4>
                <div className="overview-row">
                  <span className="row-lbl">Official Email:</span>
                  <span className="row-val">{profile?.email || user?.email}</span>
                </div>
                <div className="overview-row">
                  <span className="row-lbl">Website:</span>
                  <span className="row-val">
                    {profile?.website ? (
                      <a href={profile.website} target="_blank" rel="noreferrer">
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : "Not set"}
                  </span>
                </div>
                <div className="overview-row">
                  <span className="row-lbl">Headquarters:</span>
                  <span className="row-val">{profile?.city ? `${profile.city}, ${profile.country}` : "Global"}</span>
                </div>
                <div className="overview-row">
                  <span className="row-lbl">Account Type:</span>
                  <span className="row-val highlight">COMPANY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyProfileView;
