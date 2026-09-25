import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiAward,
  FiVideo,
  FiCheckCircle,
  FiBriefcase,
  FiTrendingUp,
  FiArrowRight,
  FiZap,
  FiShield,
  FiX,
  FiSend,
  FiLock,
  FiLayers,
} from "react-icons/fi";
import "./ServicesPage.css";

interface ServiceItem {
  id: string;
  category: "assessment" | "profile" | "placement";
  icon: React.ReactNode;
  tag: string;
  tagColor: string;
  badgeLabel?: string;
  title: string;
  description: string;
  benefits: string[];
  actionLabel: string;
  actionLink?: string;
  isModalAction?: boolean;
}

const ServicesPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<"all" | "assessment" | "profile" | "placement">("all");
  const [modalService, setModalService] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.fullName || "",
    email: user?.email || "",
    topic: "Profile Optimization",
    note: "",
  });
  const [toastMsg, setToastMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const servicesList: ServiceItem[] = [
    {
      id: "assessment",
      category: "assessment",
      icon: <FiAward size={26} />,
      tag: "Verification",
      tagColor: "#15803d",
      badgeLabel: "Standardized",
      title: "RightPath Skill Assessments & Evidence",
      description:
        "Take standardized technical and problem-solving assessments. Earn verified benchmark score badges that prove your authentic competency directly to hiring managers without redundant initial screening tests.",
      benefits: [
        "Verified objective scores for Java, React, Python, Cloud & more",
        "Permanent tamper-proof evidence badges linked to your profile",
        "Directly bypass early-stage ATS keyword filters",
      ],
      actionLabel: "Verify Skills via RightPath",
      actionLink: "/profile/edit#roles",
    },
    {
      id: "video-pitch",
      category: "profile",
      icon: <FiVideo size={26} />,
      tag: "Personal Pitch",
      tagColor: "#2563eb",
      badgeLabel: "Free Included",
      title: "60-Second Video Pitch Studio",
      description:
        "Stand out from thousands of text resumes. Record or upload a 1-minute video introduction to showcase your communication skills, technical passion, and personal articulation before live interviews.",
      benefits: [
        "Showcase real communication, articulation & passion",
        "Direct visibility to engineering directors & recruiters",
        "Actionable tips on structuring an impactful 60-second pitch",
      ],
      actionLabel: "Upload / Update Video Pitch",
      actionLink: "/profile/edit",
    },
    {
      id: "profile-optimization",
      category: "profile",
      icon: <FiCheckCircle size={26} />,
      tag: "Portfolio Coaching",
      tagColor: "#7c3aed",
      badgeLabel: "Advisory",
      title: "Comprehensive Profile Review & Optimization",
      description:
        "Transform your StrengthOut profile into an irresistible talent portfolio. Learn how to highlight live GitHub repositories, architectural contributions, and practical internship milestones.",
      benefits: [
        "Repository & code quality presentation guidance",
        "Effective headline, summary, and skill clustering",
        "Increase inbound recruiter interest by up to 300%",
      ],
      actionLabel: "Request Profile Review",
      isModalAction: true,
    },
    {
      id: "company-matching",
      category: "placement",
      icon: <FiBriefcase size={26} />,
      tag: "Direct Inbound",
      tagColor: "#b45309",
      badgeLabel: "Direct Connect",
      title: "Curated Company Matching & Inbound Requests",
      description:
        "Gain exposure to vetted tech companies actively looking for your exact skills. Companies browse verified talent pools and send direct connection requests with clear role details and work models.",
      benefits: [
        "Zero resume spam or unread application black holes",
        "Receive direct opportunity requests from hiring teams",
        "Filter opportunities by Remote, Hybrid, or On-site preference",
      ],
      actionLabel: "Publish Profile to Discovery",
      actionLink: "/profile",
    },
    {
      id: "interview-prep",
      category: "assessment",
      icon: <FiTrendingUp size={26} />,
      tag: "Skill Growth",
      tagColor: "#0284c7",
      badgeLabel: "Advisory",
      title: "Technical Interview & Architecture Coaching",
      description:
        "Prepare for high-stakes technical interviews with curated system design guidelines, DSA problem-solving benchmarks, and practical mock assessment feedback.",
      benefits: [
        "Real-world behavioral & technical interview frameworks",
        "Live coding and architecture presentation patterns",
        "Domain-specific interview preparation kits",
      ],
      actionLabel: "Explore Preparation Tracks",
      isModalAction: true,
    },
    {
      id: "privacy-shield",
      category: "placement",
      icon: <FiShield size={26} />,
      tag: "Security",
      tagColor: "#dc2626",
      badgeLabel: "Full Privacy",
      title: "Candidate Contact Privacy Shield",
      description:
        "Take complete control over your personal data. Your phone number, email address, and home location stay protected and shielded until you mutually accept an inbound company opportunity.",
      benefits: [
        "Protection from recruitment cold-calls & data scraping",
        "Disclose contact information on your terms only",
        "Maintain confidential job hunting while currently employed",
      ],
      actionLabel: "Manage Privacy & Details",
      actionLink: "/profile",
    },
  ];

  const filteredServices = selectedCategory === "all"
    ? servicesList
    : servicesList.filter(s => s.category === selectedCategory);

  const handleServiceClick = (s: ServiceItem) => {
    if (s.isModalAction) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user?.fullName || "",
        email: prev.email || user?.email || "",
        topic: s.title,
      }));
      setModalService(s.title);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setToastMsg(`Thank you! Your request for "${formData.topic}" has been submitted. Our career advisory team will reach out shortly.`);
      setModalService(null);
      setTimeout(() => setToastMsg(""), 6000);
    }, 700);
  };

  return (
    <div className="services-page-wrapper">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="services-toast-bar">
          <FiCheckCircle size={18} />
          <span>{toastMsg}</span>
          <button type="button" onClick={() => setToastMsg("")} className="btn-toast-close">
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* Hero Header - Aligned with About Page Hero */}
      <header className="services-hero">
        <div className="services-hero-inner">
          <span className="services-badge">
            <FiZap size={14} /> Career Growth & Discovery Services
          </span>
          <h1 className="services-title">
            Services Engineered to <span className="highlight-text">Accelerate Your Career</span>
          </h1>
          <p className="services-subtitle">
            From standardized RightPath competency scoring to video pitch recording and privacy shielding,
            discover all the tools designed to get skilled candidates hired directly by top companies.
          </p>

          <div className="services-cta-row">
            <Link to="/profile" className="btn-services-primary">
              <span>View & Polish My Profile</span>
              <FiArrowRight size={16} />
            </Link>
            <Link to="/about" className="btn-services-secondary">
              Read Why StrengthOut Works
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="services-container">
        {/* Quick Highlights Bar - Aligned with About Page */}
        <div className="quick-highlights-bar">
          <div className="highlight-item">
            <FiCheckCircle size={18} color="#16a34a" />
            <span><strong>100% Free</strong> for Candidates</span>
          </div>
          <div className="highlight-item">
            <FiAward size={18} color="#16a34a" />
            <span><strong>RightPath</strong> Verified Scores</span>
          </div>
          <div className="highlight-item">
            <FiVideo size={18} color="#16a34a" />
            <span><strong>60s Video</strong> Pitch Studio</span>
          </div>
          <div className="highlight-item">
            <FiLock size={18} color="#16a34a" />
            <span><strong>Shielded</strong> Contact Privacy</span>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="services-category-nav">
          <button
            type="button"
            className={`category-tab-btn ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            <FiLayers size={15} />
            <span>All Services ({servicesList.length})</span>
          </button>
          <button
            type="button"
            className={`category-tab-btn ${selectedCategory === "assessment" ? "active" : ""}`}
            onClick={() => setSelectedCategory("assessment")}
          >
            <FiAward size={15} />
            <span>Assessment & Evidence</span>
          </button>
          <button
            type="button"
            className={`category-tab-btn ${selectedCategory === "profile" ? "active" : ""}`}
            onClick={() => setSelectedCategory("profile")}
          >
            <FiVideo size={15} />
            <span>Profile & Video Pitch</span>
          </button>
          <button
            type="button"
            className={`category-tab-btn ${selectedCategory === "placement" ? "active" : ""}`}
            onClick={() => setSelectedCategory("placement")}
          >
            <FiBriefcase size={15} />
            <span>Placement & Privacy</span>
          </button>
        </div>

        {/* Services Cards Section */}
        <section className="services-section-card">
          <div className="section-head">
            <div className="section-icon-badge candidate-badge">
              <FiZap size={24} color="#70c144" />
            </div>
            <div>
              <span className="eyebrow-tag">PORTFOLIO & CAREER ACCELERATION</span>
              <h2 className="section-main-title">Candidate Enablement Services</h2>
              <p className="section-subtitle">
                Tools and guidance designed to turn your technical skills into direct inbound interview opportunities.
              </p>
            </div>
          </div>

          <div className="services-cards-grid">
            {filteredServices.map(s => (
              <div key={s.id} className="service-card">
                <div className="service-card-top">
                  <div className="service-icon-box">{s.icon}</div>
                  <div className="service-badges-group">
                    {s.badgeLabel && (
                      <span className="service-status-pill">{s.badgeLabel}</span>
                    )}
                    <span
                      className="service-tag"
                      style={{
                        backgroundColor: `${s.tagColor}15`,
                        color: s.tagColor,
                        border: `1px solid ${s.tagColor}35`,
                      }}
                    >
                      {s.tag}
                    </span>
                  </div>
                </div>

                <h3 className="service-title">{s.title}</h3>
                <p className="service-desc">{s.description}</p>

                <div className="service-benefits">
                  <span className="benefits-label">Key Highlights:</span>
                  <ul className="benefits-list">
                    {s.benefits.map((b, idx) => (
                      <li key={idx}>
                        <FiCheckCircle size={14} className="benefit-check" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="service-card-footer">
                  {s.actionLink ? (
                    <Link to={s.actionLink} className="btn-service-action">
                      <span>{s.actionLabel}</span>
                      <FiArrowRight size={15} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="btn-service-action"
                      onClick={() => handleServiceClick(s)}
                    >
                      <span>{s.actionLabel}</span>
                      <FiArrowRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3-Step Success Pathway - Aligned with About Page */}
        <section className="services-section-card pathway-section">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span className="eyebrow-tag">STEP-BY-STEP PATHWAY</span>
            <h2 className="section-main-title">How Our Services Fast-Track Your Placement</h2>
            <p className="section-subtitle">
              Follow this proven pathway to maximize your inbound recruiter opportunities on StrengthOut.
            </p>
          </div>

          <div className="steps-container">
            <div className="step-item">
              <div className="step-num">01</div>
              <div className="pathway-step-icon">
                <FiAward size={22} />
              </div>
              <h4>Verify & Document</h4>
              <p>Complete RightPath skill assessments and link working GitHub repositories to earn verified proof badges.</p>
            </div>

            <div className="step-item">
              <div className="step-num">02</div>
              <div className="pathway-step-icon">
                <FiVideo size={22} />
              </div>
              <h4>Pitch & Publish</h4>
              <p>Record your 60-second video introduction and publish your profile to the company discovery network.</p>
            </div>

            <div className="step-item">
              <div className="step-num">03</div>
              <div className="pathway-step-icon">
                <FiBriefcase size={22} />
              </div>
              <h4>Connect & Get Hired</h4>
              <p>Receive inbound company requests, review offer parameters, and coordinate directly with hiring teams.</p>
            </div>
          </div>
        </section>

        {/* Advisory Consultation Banner - Aligned with About Page Powered By Card */}
        <section className="powered-by-card">
          <div className="powered-content">
            <span className="powered-tag">Personalized Assistance</span>
            <h3>Need Help Elevating Your Technical Portfolio?</h3>
            <p>
              Our dedicated talent advisors help review your projects, optimize your technical summaries, and guide you through RightPath verification to ensure you stand out.
            </p>
          </div>
          <div className="powered-action">
            <button
              type="button"
              className="btn-powered-cta"
              onClick={() => {
                setFormData(prev => ({ ...prev, topic: "Portfolio Consultation" }));
                setModalService("Portfolio Consultation");
              }}
            >
              Request Free Consultation
            </button>
          </div>
        </section>
      </div>

      {/* Consultation Modal */}
      {modalService && (
        <div className="modal-overlay" onClick={() => setModalService(null)}>
          <div className="service-modal-box" onClick={e => e.stopPropagation()}>
            <div className="service-modal-header">
              <h3>{modalService}</h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setModalService(null)}
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="service-modal-form">
              <p className="modal-intro">
                Fill in your details and our talent advisory team will reach out with personalized guidance and next steps.
              </p>

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alex@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Service Focus *</label>
                <input
                  type="text"
                  readOnly
                  value={formData.topic}
                  className="form-control readonly"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Specific Questions or Goals</label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your target roles, current tech stack, or specific questions..."
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="service-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setModalService(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={submitting}
                >
                  <FiSend size={15} />
                  <span>{submitting ? "Submitting..." : "Send Request"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
