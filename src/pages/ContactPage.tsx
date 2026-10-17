import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiMail,
  FiMapPin,
  FiClock,
  FiSend,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiHelpCircle,
  FiShield,
  FiCheck,
} from "react-icons/fi";
import { validateEmail, validateRequired } from "../utils/validators";
import "./ContactPage.css";

interface ContactFaq {
  id: number;
  question: string;
  answer: string;
}

const CONTACT_FAQS: ContactFaq[] = [
  {
    id: 1,
    question: "How fast does StrengthOut support respond to inquiries?",
    answer:
      "Our support and candidate advisory team responds to all inquiries within 24 business hours (Monday through Friday, 9:00 AM – 6:00 PM IST). Urgent verification issues are prioritized.",
  },
  {
    id: 2,
    question: "I am an employer. How do I request an enterprise demo or bulk talent search?",
    answer:
      "Select 'Employer / Company' as your role in the inquiry form below, or email partnerships@strengthout.com directly. Our talent operations team will schedule a customized platform walk-through within one business day.",
  },
  {
    id: 3,
    question: "How can candidates get help with RightPath skill benchmark tests?",
    answer:
      "If you experience technical issues during a RightPath assessment, contact support@strengthout.com with your registered email and challenge ID. We verify telemetry logs and provide test re-authorization if technical failure occurred.",
  },
  {
    id: 4,
    question: "Is candidate personal contact info kept private when asking questions?",
    answer:
      "Yes. Your privacy is paramount. Your contact details are only used by authorized StrengthOut support staff to address your ticket and are never shared with recruiters or third-party advertisers.",
  },
];

const ContactPage: React.FC = () => {
  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Candidate / Job Seeker");
  const [subject, setSubject] = useState("General Support");
  const [message, setMessage] = useState("");

  // Validation & blur state
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    message?: string;
  }>({});
  const [touched, setTouched] = useState<{
    fullName?: boolean;
    email?: boolean;
    message?: boolean;
  }>({});

  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [openFaqId, setOpenFaqId] = useState<number | null>(1);

  const handleBlur = (field: "fullName" | "email" | "message") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: "fullName" | "email" | "message") => {
    const errors = { ...fieldErrors };
    if (field === "fullName") {
      const err = validateRequired(fullName, "Full name", 2);
      if (err) errors.fullName = err;
      else delete errors.fullName;
    }
    if (field === "email") {
      const err = validateEmail(email, "Email address");
      if (err) errors.email = err;
      else delete errors.email;
    }
    if (field === "message") {
      const err = validateRequired(message, "Message", 10);
      if (err) errors.message = err;
      else delete errors.message;
    }
    setFieldErrors(errors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, message: true });

    const errors: typeof fieldErrors = {};
    const nameErr = validateRequired(fullName, "Full name", 2);
    if (nameErr) errors.fullName = nameErr;
    const emailErr = validateEmail(email, "Email address");
    if (emailErr) errors.email = emailErr;
    const msgErr = validateRequired(message, "Message", 10);
    if (msgErr) errors.message = msgErr;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      const ticketId = `SO-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicket(ticketId);
    }, 600);
  };

  const copyEmail = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  return (
    <div className="contact-page-wrapper">
      <div className="contact-page-container">
        {/* Dark Hero Header */}
        <header className="contact-dark-hero">
          <div className="contact-hero-content">
            <div className="contact-hero-badge">
              <FiHelpCircle size={14} /> 24/7 SUPPORT & ADVISORY
            </div>
            <h1 className="contact-hero-title">
              We&apos;re Here to <span className="accent-text">Help You Succeed</span>
            </h1>
            <p className="contact-hero-subtitle">
              Have questions about RightPath competency scoring, company hiring partnerships, or account security? Connect directly with the StrengthOut team.
            </p>
          </div>
        </header>

        {/* Main Content: Info Cards & Form */}
        <div className="contact-main-grid">
          {/* Left Column: Direct Contact Info */}
          <div className="contact-info-col">
            <div className="contact-channels-card">
              <h2 className="channels-title">Direct Inquiries</h2>
              <p className="channels-sub">
                Choose the channel that best matches your request for priority handling.
              </p>

              <div className="channel-item">
                <div className="channel-icon-box">
                  <FiMail size={20} />
                </div>
                <div className="channel-meta">
                  <div className="channel-label">General Support & Candidates</div>
                  <button
                    type="button"
                    className="channel-value-btn"
                    onClick={() => copyEmail("support@strengthout.com")}
                    title="Click to copy email"
                  >
                    support@strengthout.com
                    {copiedEmail === "support@strengthout.com" ? (
                      <span className="copied-pill"><FiCheck size={12} /> Copied</span>
                    ) : null}
                  </button>
                </div>
              </div>

              <div className="channel-item">
                <div className="channel-icon-box">
                  <FiShield size={20} />
                </div>
                <div className="channel-meta">
                  <div className="channel-label">Enterprise & Company Hiring</div>
                  <button
                    type="button"
                    className="channel-value-btn"
                    onClick={() => copyEmail("partnerships@strengthout.com")}
                    title="Click to copy email"
                  >
                    partnerships@strengthout.com
                    {copiedEmail === "partnerships@strengthout.com" ? (
                      <span className="copied-pill"><FiCheck size={12} /> Copied</span>
                    ) : null}
                  </button>
                </div>
              </div>

              <div className="channel-item">
                <div className="channel-icon-box">
                  <FiClock size={20} />
                </div>
                <div className="channel-meta">
                  <div className="channel-label">Operating Hours</div>
                  <div className="channel-text">Monday &ndash; Friday: 9:00 AM &ndash; 6:00 PM IST</div>
                </div>
              </div>

              <div className="channel-item">
                <div className="channel-icon-box">
                  <FiMapPin size={20} />
                </div>
                <div className="channel-meta">
                  <div className="channel-label">Technology Headquarters</div>
                  <div className="channel-text">iSign Technologies, Bengaluru &bull; India</div>
                </div>
              </div>
            </div>

            {/* Quick Support Assurance */}
            <div className="contact-assurance-card">
              <div className="assurance-badge">
                <FiCheckCircle size={18} />
                <span>Guaranteed Response SLA</span>
              </div>
              <p className="assurance-desc">
                Every candidate and enterprise inquiry is logged into our tracked queue and resolved within 24 business hours.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="contact-form-col">
            <div className="contact-form-card">
              {submittedTicket ? (
                <div className="contact-success-state">
                  <div className="success-icon-wrap">
                    <FiCheckCircle size={44} />
                  </div>
                  <h3 className="success-title">Message Received!</h3>
                  <p className="success-text">
                    Thank you, <strong>{fullName}</strong>. Your inquiry has been submitted under ticket ID:
                  </p>
                  <div className="ticket-badge">
                    <code>{submittedTicket}</code>
                  </div>
                  <p className="success-note">
                    A confirmation has been sent to <strong>{email}</strong>. Our team will follow up within 24 business hours.
                  </p>
                  <button
                    type="button"
                    className="btn-send-another"
                    onClick={() => {
                      setSubmittedTicket(null);
                      setFullName("");
                      setEmail("");
                      setMessage("");
                      setTouched({});
                      setFieldErrors({});
                    }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <h2 className="form-card-title">Send Us a Message</h2>
                  <p className="form-card-sub">
                    Fill out the form below and our specialized team will get back to you promptly.
                  </p>

                  {/* Name field */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-name">
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      className={`form-input ${touched.fullName && fieldErrors.fullName ? "error" : ""}`}
                      placeholder="e.g. Alex Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => handleBlur("fullName")}
                    />
                    {touched.fullName && fieldErrors.fullName && (
                      <span className="field-error-msg">{fieldErrors.fullName}</span>
                    )}
                  </div>

                  {/* Email field */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-email">
                      Email Address <span className="req">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      className={`form-input ${touched.email && fieldErrors.email ? "error" : ""}`}
                      placeholder="e.g. alex@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur("email")}
                    />
                    {touched.email && fieldErrors.email && (
                      <span className="field-error-msg">{fieldErrors.email}</span>
                    )}
                  </div>

                  {/* Role selector */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-role">
                      I am reaching out as a
                    </label>
                    <select
                      id="contact-role"
                      className="form-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="Candidate / Job Seeker">Candidate / Job Seeker</option>
                      <option value="Employer / Company">Employer / Hiring Manager</option>
                      <option value="Institutional Partner">College / University Partner</option>
                      <option value="General Inquiry">General / Other</option>
                    </select>
                  </div>

                  {/* Subject selector */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-subject">
                      Subject
                    </label>
                    <select
                      id="contact-subject"
                      className="form-select"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    >
                      <option value="General Support">General Platform Support</option>
                      <option value="RightPath Assessments">RightPath Assessment Query</option>
                      <option value="Video Pitch Guidance">60-Second Video Pitch Help</option>
                      <option value="Employer Talent Search">Employer Talent Search & Hiring</option>
                      <option value="Account & Privacy">Account Security & Contact Privacy</option>
                    </select>
                  </div>

                  {/* Message field */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-message">
                      How can we help? <span className="req">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      className={`form-textarea ${touched.message && fieldErrors.message ? "error" : ""}`}
                      placeholder="Please describe your question or issue in detail..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onBlur={() => handleBlur("message")}
                    />
                    {touched.message && fieldErrors.message && (
                      <span className="field-error-msg">{fieldErrors.message}</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-contact-submit"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span>Sending message...</span>
                    ) : (
                      <>
                        <FiSend size={16} />
                        <span>Submit Inquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Contact FAQ Accordion */}
        <section className="contact-faq-section">
          <div className="faq-header">
            <h2 className="faq-title">Frequently Asked Support Questions</h2>
            <p className="faq-subtitle">Quick answers to common questions about StrengthOut accounts and verification.</p>
          </div>

          <div className="faq-list">
            {CONTACT_FAQS.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className={`faq-card ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="faq-question-text">{faq.question}</span>
                    <span className="faq-chevron">
                      {isOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="faq-answer-panel">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer Gateway Strip */}
        <div className="contact-bottom-cta">
          <div className="cta-meta">
            <h3>New to StrengthOut?</h3>
            <p>Discover how authentic skills and RightPath score benchmarks replace traditional resume screening.</p>
          </div>
          <div className="cta-actions">
            <Link to="/about" className="cta-btn secondary">
              Read About Us
            </Link>
            <Link to="/register" className="cta-btn primary">
              Create Free Account &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
