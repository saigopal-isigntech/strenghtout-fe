import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiMapPin,
  FiClock,
  FiArrowRight,
  FiCheckCircle,
  FiCode,
  FiZap,
  FiShield,
  FiX,
  FiSend,
  FiDollarSign,
} from "react-icons/fi";
import { validateEmail, validateRequired } from "../utils/validators";
import "./CareersPage.css";

interface JobOpening {
  id: string;
  title: string;
  department: "engineering" | "product" | "operations";
  location: string;
  type: string;
  compensation: string;
  summary: string;
  skills: string[];
}

const JOB_OPENINGS: JobOpening[] = [
  {
    id: "fs-eng",
    title: "Senior Full-Stack Engineer",
    department: "engineering",
    location: "Remote (India)",
    type: "Full-Time",
    compensation: "₹18L - ₹28L + Equity",
    summary:
      "Architect and scale core microservices across Spring Boot, PostgreSQL, and React. Build real-time candidate video pitch pipelines and telemetry services.",
    skills: ["React", "TypeScript", "Java / Spring Boot", "PostgreSQL", "Docker"],
  },
  {
    id: "prod-des",
    title: "Lead Product Designer",
    department: "product",
    location: "Remote (India)",
    type: "Full-Time",
    compensation: "₹16L - ₹24L + Equity",
    summary:
      "Craft world-class candidate and recruiter workflows. Establish our design system tokens, micro-interactions, and accessible responsive interfaces.",
    skills: ["Figma", "Design Systems", "UX Research", "Micro-animations", "Prototyping"],
  },
  {
    id: "tech-assess-lead",
    title: "Technical Assessment Lead",
    department: "engineering",
    location: "Bengaluru, India (Hybrid)",
    type: "Full-Time",
    compensation: "₹15L - ₹22L",
    summary:
      "Design and maintain standardized, tamper-proof RightPath technical challenges covering React, Python, Cloud, and algorithmic problem solving.",
    skills: ["Skill Benchmarks", "Algorithm Design", "Code Sandboxing", "Problem Formulation"],
  },
  {
    id: "ent-partner",
    title: "Enterprise Talent Partnerships Lead",
    department: "operations",
    location: "Remote (India)",
    type: "Full-Time",
    compensation: "₹14L - ₹22L + Commission",
    summary:
      "Partner with high-growth technology companies to onboard engineering managers and HR directors onto StrengthOut's pre-vetted talent discovery portal.",
    skills: ["B2B SaaS Sales", "Recruitment Operations", "Account Management", "Hiring Solutions"],
  },
  {
    id: "sec-devops",
    title: "Security & Cloud Infrastructure Engineer",
    department: "engineering",
    location: "Remote (India)",
    type: "Full-Time",
    compensation: "₹18L - ₹26L + Equity",
    summary:
      "Harden platform privacy shields, manage AWS/GCP clusters, automate CI/CD pipelines, and implement cryptographic audit logging.",
    skills: ["AWS/GCP", "Kubernetes", "DevSecOps", "Zero-Trust Architecture", "Terraform"],
  },
];

const CULTURE_VALUES = [
  {
    icon: <FiCode size={22} />,
    title: "Proof Over Pedigree",
    desc: "We judge engineers and designers by the real systems they build and deploy, not by arbitrary prestige labels or keyword-stuffed resumes.",
  },
  {
    icon: <FiDollarSign size={22} />,
    title: "Radical Transparency",
    desc: "Every open role features transparent salary bands. No bait-and-switch offers, no undisclosed parameters, and zero ghosting.",
  },
  {
    icon: <FiZap size={22} />,
    title: "High Agency & Autonomy",
    desc: "We work in small, focused squads with end-to-end ownership. You decide how to solve the problem and ship to production rapidly.",
  },
  {
    icon: <FiShield size={22} />,
    title: "Candidate-First Privacy",
    desc: "We protect job seekers from predatory recruiters and spam. Building with privacy shielding is a core architectural tenet.",
  },
];

const CareersPage: React.FC = () => {
  const [activeDept, setActiveDept] = useState<"all" | "engineering" | "product" | "operations">("all");
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);

  // Application form fields
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [pitchNote, setPitchNote] = useState("");

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    note?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  const filteredJobs = activeDept === "all"
    ? JOB_OPENINGS
    : JOB_OPENINGS.filter((j) => j.department === activeDept);

  const handleOpenApplyModal = (job: JobOpening) => {
    setSelectedJob(job);
    setApplicantName("");
    setApplicantEmail("");
    setPortfolioUrl("");
    setPitchNote("");
    setFieldErrors({});
    setApplySuccess(false);
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: typeof fieldErrors = {};
    const nameErr = validateRequired(applicantName, "Full name", 2);
    if (nameErr) errors.name = nameErr;

    const emailErr = validateEmail(applicantEmail, "Email address");
    if (emailErr) errors.email = emailErr;

    const noteErr = validateRequired(pitchNote, "Introduction note", 10);
    if (noteErr) errors.note = noteErr;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setApplySuccess(true);
      setTimeout(() => {
        setSelectedJob(null);
        setApplySuccess(false);
      }, 3000);
    }, 700);
  };

  return (
    <div className="careers-page-wrapper">
      <div className="careers-page-container">
        {/* Dark Hero Card */}
        <header className="careers-dark-hero">
          <div className="careers-hero-content">
            <div className="careers-hero-badge">
              <FiZap size={14} /> JOIN OUR MISSION
            </div>
            <h1 className="careers-hero-title">
              Build the Future of <span className="accent-text">Competency-First</span> Hiring
            </h1>
            <p className="careers-hero-subtitle">
              We&apos;re eliminating the resume black hole and empowering honest builders to get recognized for their authentic technical skills. Help us create an ecosystem where capability speaks louder than keywords.
            </p>
            <div className="careers-hero-cta">
              <a href="#open-roles" className="btn-careers-primary">
                View Open Positions ({JOB_OPENINGS.length}) <FiArrowRight size={16} />
              </a>
              <Link to="/about" className="btn-careers-secondary">
                Read About Our Methodology
              </Link>
            </div>
          </div>
        </header>

        {/* Culture & Values */}
        <section className="careers-values-section">
          <div className="section-header-center">
            <h2 className="section-title">Why Build at StrengthOut?</h2>
            <p className="section-subtitle">
              We operate on high agency, transparent communication, and deep engineering standards.
            </p>
          </div>

          <div className="values-grid">
            {CULTURE_VALUES.map((val) => (
              <div key={val.title} className="value-card">
                <div className="value-icon-box">{val.icon}</div>
                <h3 className="value-title">{val.title}</h3>
                <p className="value-desc">{val.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Open Roles Section */}
        <section id="open-roles" className="open-roles-section">
          <div className="roles-header-row">
            <div>
              <h2 className="section-title">Open Opportunities</h2>
              <p className="section-subtitle">Join our distributed team across product, engineering, and operations.</p>
            </div>

            {/* Department Filter Tabs */}
            <div className="dept-tabs">
              <button
                type="button"
                className={`dept-tab-btn ${activeDept === "all" ? "active" : ""}`}
                onClick={() => setActiveDept("all")}
              >
                All Roles ({JOB_OPENINGS.length})
              </button>
              <button
                type="button"
                className={`dept-tab-btn ${activeDept === "engineering" ? "active" : ""}`}
                onClick={() => setActiveDept("engineering")}
              >
                Engineering
              </button>
              <button
                type="button"
                className={`dept-tab-btn ${activeDept === "product" ? "active" : ""}`}
                onClick={() => setActiveDept("product")}
              >
                Product & Design
              </button>
              <button
                type="button"
                className={`dept-tab-btn ${activeDept === "operations" ? "active" : ""}`}
                onClick={() => setActiveDept("operations")}
              >
                Operations
              </button>
            </div>
          </div>

          {/* Job Openings Grid */}
          <div className="jobs-list">
            {filteredJobs.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-card-main">
                  <div className="job-card-header">
                    <span className="job-dept-badge">{job.department}</span>
                    <span className="job-comp-badge">{job.compensation}</span>
                  </div>
                  <h3 className="job-title">{job.title}</h3>
                  <div className="job-meta-row">
                    <span className="job-meta-item">
                      <FiMapPin size={14} /> {job.location}
                    </span>
                    <span className="job-meta-item">
                      <FiClock size={14} /> {job.type}
                    </span>
                  </div>
                  <p className="job-summary">{job.summary}</p>
                  <div className="job-skills-wrap">
                    {job.skills.map((s) => (
                      <span key={s} className="job-skill-pill">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="job-card-action">
                  <button
                    type="button"
                    className="btn-apply-job"
                    onClick={() => handleOpenApplyModal(job)}
                  >
                    <span>Apply Now</span>
                    <FiArrowRight size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Open Talent Pool Card */}
        <section className="talent-pool-card">
          <div className="talent-pool-content">
            <h3 className="talent-pool-title">Don&apos;t see an exact match for your skills?</h3>
            <p className="talent-pool-desc">
              We are constantly scouting for exceptional engineers, assessment creators, and design system specialists. Submit an open inquiry or build your verified talent portfolio.
            </p>
          </div>
          <div className="talent-pool-actions">
            <Link to="/contact" className="btn-talent-inquiry">
              Drop an Inquiry
            </Link>
            <Link to="/register" className="btn-talent-register">
              Join as Candidate &rarr;
            </Link>
          </div>
        </section>

        {/* Application Modal */}
        {selectedJob && (
          <div className="careers-modal-overlay" onClick={() => setSelectedJob(null)}>
            <div className="careers-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <span className="modal-role-badge">{selectedJob.department}</span>
                  <h3 className="modal-job-title">{selectedJob.title}</h3>
                  <span className="modal-loc">{selectedJob.location} &bull; {selectedJob.type}</span>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedJob(null)}
                  title="Close application modal"
                >
                  <FiX size={20} />
                </button>
              </div>

              {applySuccess ? (
                <div className="apply-success-box">
                  <FiCheckCircle size={48} className="success-icon" />
                  <h4>Application Submitted!</h4>
                  <p>
                    Thank you for applying to <strong>{selectedJob.title}</strong>. Our engineering leads review all portfolios directly. We will be in touch via {applicantEmail}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="modal-form" noValidate>
                  <div className="modal-form-group">
                    <label className="modal-label">
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className={`modal-input ${fieldErrors.name ? "error" : ""}`}
                      placeholder="e.g. Priyanshu Mehta"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                    />
                    {fieldErrors.name && <span className="modal-error">{fieldErrors.name}</span>}
                  </div>

                  <div className="modal-form-group">
                    <label className="modal-label">
                      Email Address <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      className={`modal-input ${fieldErrors.email ? "error" : ""}`}
                      placeholder="e.g. priyanshu@example.com"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                    />
                    {fieldErrors.email && <span className="modal-error">{fieldErrors.email}</span>}
                  </div>

                  <div className="modal-form-group">
                    <label className="modal-label">GitHub / Portfolio URL</label>
                    <input
                      type="url"
                      className="modal-input"
                      placeholder="https://github.com/your-username"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                    />
                  </div>

                  <div className="modal-form-group">
                    <label className="modal-label">
                      Why StrengthOut? (Brief Introduction) <span className="req">*</span>
                    </label>
                    <textarea
                      rows={3}
                      className={`modal-textarea ${fieldErrors.note ? "error" : ""}`}
                      placeholder="Tell us what excites you about competency-first hiring and what you've built..."
                      value={pitchNote}
                      onChange={(e) => setPitchNote(e.target.value)}
                    />
                    {fieldErrors.note && <span className="modal-error">{fieldErrors.note}</span>}
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-modal-cancel"
                      onClick={() => setSelectedJob(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-modal-submit"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : (
                        <>
                          <FiSend size={15} />
                          <span>Submit Application</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareersPage;
