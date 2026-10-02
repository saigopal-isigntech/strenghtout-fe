import React, { useEffect, useState } from "react";
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
  FiCheck,
} from "react-icons/fi";
import "./ServicesPage.css";

interface ServiceItem {
  id: string;
  category: "assessment" | "profile" | "placement";
  icon: React.ReactNode;
  tag1: string;
  tag2: string;
  isFeatured?: boolean;
  title: string;
  description: string;
  benefitsHeader: string;
  benefits: string[];
  actionLabel: string;
  actionLink?: string;
  isModalAction?: boolean;
  bulletIcon: "check" | "dot";
}

const ServicesPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<"all" | "assessment" | "profile" | "placement">("all");
  const [modalService, setModalService] = useState<string | null>(null);

  // Prevent background scrolling when service modal is open
  useEffect(() => {
    if (modalService) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [modalService]);
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
      icon: <FiAward size={22} />,
      tag1: "STANDARDIZED",
      tag2: "VERIFICATION",
      title: "RightPath Skill Assessments & Evidence",
      description:
        "Take standardized technical and problem-solving assessments. Earn verified benchmark score badges that prove your authentic competency directly to hiring managers without redundant initial screening tests.",
      benefitsHeader: "KEY HIGHLIGHTS:",
      bulletIcon: "check",
      benefits: [
        "Directly bypass early-stage ATS keyword filters",
        "Proves real coding & problem-solving capability",
      ],
      actionLabel: "Verify Skills via RightPath",
      actionLink: "/candidate/profile",
    },
    {
      id: "video-pitch",
      category: "profile",
      icon: <FiVideo size={22} />,
      tag1: "FREE INCLUDED",
      tag2: "PERSONAL PITCH",
      isFeatured: true,
      title: "60-Second Video Pitch Studio",
      description:
        "Stand out from thousands of text resumes. Record or upload a 1-minute video introduction to showcase your communication skills, technical passion, and personal articulation before live interviews.",
      benefitsHeader: "KEY HIGHLIGHTS:",
      bulletIcon: "check",
      benefits: [
        "Actionable tips on structuring an impactful 60-second pitch",
        "Integrated browser teleprompter and camera tuning",
      ],
      actionLabel: "Upload / Update Video Pitch",
      actionLink: "/candidate/profile",
    },
    {
      id: "profile-optimization",
      category: "profile",
      icon: <FiCheckCircle size={22} />,
      tag1: "ADVISORY",
      tag2: "PORTFOLIO COACHING",
      title: "Comprehensive Profile Review & Optimization",
      description:
        "Transform your StrengthOut profile into an irresistible talent portfolio. Learn how to highlight live GitHub repositories, architectural contributions, and practical internship milestones.",
      benefitsHeader: "KEY HIGHLIGHTS:",
      bulletIcon: "check",
      benefits: [
        "Increase inbound recruiter interest by up to 300%",
        "Actionable code repo and readme feedback",
      ],
      actionLabel: "Request Profile Review",
      isModalAction: true,
    },
    {
      id: "company-matching",
      category: "placement",
      icon: <FiBriefcase size={22} />,
      tag1: "DIRECT CONNECT",
      tag2: "DIRECT INBOUND",
      title: "Curated Company Matching & Inbound Requests",
      description:
        "Gain exposure to vetted tech companies actively looking for your exact skills. Companies browse verified talent pools and send direct connection requests with clear role details and work models.",
      benefitsHeader: "KEY HIGHLIGHTS:",
      bulletIcon: "dot",
      benefits: [
        "Zero resume spam or unread application black holes",
        "Receive direct opportunity requests from hiring teams",
        "Filter opportunities by Remote, Hybrid, or On-site preference",
      ],
      actionLabel: "View Match Preferences",
      actionLink: "/candidate/opportunities",
    },
    {
      id: "interview-prep",
      category: "assessment",
      icon: <FiTrendingUp size={22} />,
      tag1: "ADVISORY",
      tag2: "SKILL GROWTH",
      title: "Technical Interview & Architecture Coaching",
      description:
        "Prepare for high-stakes technical interviews with curated system design guidelines, DSA problem-solving benchmarks, and practical mock assessment feedback.",
      benefitsHeader: "KEY HIGHLIGHTS:",
      bulletIcon: "dot",
      benefits: [
        "Real-world behavioral & technical interview frameworks",
        "Live coding and architecture presentation patterns",
        "Domain-specific interview preparation kits",
      ],
      actionLabel: "Book Mock Session",
      isModalAction: true,
    },
    {
      id: "privacy-shield",
      category: "placement",
      icon: <FiShield size={22} />,
      tag1: "FULL PRIVACY",
      tag2: "SECURITY",
      title: "Candidate Contact Privacy Shield",
      description:
        "Take complete control over your personal data. Your phone number, email address, and home location stay protected and shielded until you mutually accept an inbound company opportunity.",
      benefitsHeader: "KEY HIGHLIGHTS:",
      bulletIcon: "dot",
      benefits: [
        "Protection from recruitment cold-calls & data scraping",
        "Disclose contact information on your terms only",
        "Maintain confidential job hunting while currently employed",
      ],
      actionLabel: "Privacy Shield Active (100%)",
      actionLink: "/candidate/profile",
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
      setToastMsg("Thank you! Your request for \"" + formData.topic + "\" has been submitted. Our career advisory team will reach out shortly.");
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

      {/* Main Page Layout Container */}
      <div className="services-page-container">
        {/* 1. Hero Banner - Dark Card Block matching reference */}
        <header className="services-dark-hero">
          <div className="dark-hero-content">
            <div className="dark-hero-badge">
              <FiZap size={13} /> CAREER GROWTH & DISCOVERY SERVICES
            </div>
            <h1 className="dark-hero-title">
              Services Engineered to<br />
              <span className="accent-text">Accelerate Your Career</span>
            </h1>
            <svg className="wavy-underline" viewBox="0 0 400 20" fill="none">
              <path d="M5 12 Q 55 2, 105 12 T 205 12 T 305 12 T 395 12" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <p className="dark-hero-subtitle">
              From standardized RightPath competency scoring to video pitch recording and privacy shielding,
              discover all the tools designed to get skilled candidates hired directly by top companies.
            </p>

            <div className="dark-hero-cta">
              <Link to="/candidate/profile" className="btn-hero-primary">
                <span>View & Polish My Profile</span>
                <FiArrowRight size={16} />
              </Link>
              <Link to="/about" className="btn-hero-secondary">
                Read Why StrengthOut Works
              </Link>
            </div>
          </div>
        </header>

        {/* 2. Value Highlights White Bar matching reference */}
        <div className="value-highlights-bar">
          <div className="v-highlight-item">
            <FiCheckCircle size={16} className="v-check-icon" />
            <span><strong>100% Free</strong> for Candidates</span>
          </div>
          <div className="v-highlight-item">
            <FiCheckCircle size={16} className="v-check-icon" />
            <span><strong>RightPath</strong> Verified Scoring</span>
          </div>
          <div className="v-highlight-item">
            <FiVideo size={16} className="v-icon" />
            <span><strong>60s Video</strong> Pitch Studio</span>
          </div>
          <div className="v-highlight-item">
            <FiShield size={16} className="v-icon" />
            <span><strong>Shielded</strong> Contact Privacy</span>
          </div>
        </div>

        {/* 3. Category Filter Tabs Row */}
        <div className="services-filter-row">
          <button
            type="button"
            className={"filter-tab-btn " + (selectedCategory === "all" ? "active" : "")}
            onClick={() => setSelectedCategory("all")}
          >
            All Services (6)
          </button>
          <button
            type="button"
            className={"filter-tab-btn " + (selectedCategory === "assessment" ? "active" : "")}
            onClick={() => setSelectedCategory("assessment")}
          >
            <FiAward size={14} /> Assessment & Evidence
          </button>
          <button
            type="button"
            className={"filter-tab-btn " + (selectedCategory === "profile" ? "active" : "")}
            onClick={() => setSelectedCategory("profile")}
          >
            <FiVideo size={14} /> Profile & Video Pitch
          </button>
          <button
            type="button"
            className={"filter-tab-btn " + (selectedCategory === "placement" ? "active" : "")}
            onClick={() => setSelectedCategory("placement")}
          >
            <FiShield size={14} /> Placement & Privacy
          </button>
        </div>

        {/* 4. Candidate Enablement Services Grid Section */}
        <section className="services-grid-section">
          <div className="section-head-wrap">
            <div className="section-pill-tag">
              <FiZap size={13} /> PORTFOLIO & CAREER ACCELERATION
            </div>
            <h2 className="section-main-heading">Candidate Enablement Services</h2>
            <p className="section-main-sub">
              Tools and guidance designed to turn your technical skills into direct inbound interview opportunities.
            </p>
          </div>

          <div className="services-cards-grid">
            {filteredServices.map((s) => (
              <div
                key={s.id}
                className={"service-item-card " + (s.isFeatured ? "featured" : "")}
              >
                <div className="card-top-head">
                  <div className="icon-badge-box">
                    {s.icon}
                  </div>
                  <div className="tags-row">
                    <span className="tag-pill tag-muted">{s.tag1}</span>
                    <span className={"tag-pill " + (s.isFeatured ? "tag-emerald" : "tag-purple")}>
                      {s.tag2}
                    </span>
                  </div>
                </div>

                <h3 className="card-title">{s.title}</h3>
                <p className="card-description">{s.description}</p>

                <div className="card-highlights-box">
                  <span className="highlights-title">{s.benefitsHeader}</span>
                  <ul className="highlights-list">
                    {s.benefits.map((b, idx) => (
                      <li key={idx}>
                        {s.bulletIcon === "check" ? (
                          <FiCheck size={14} className="h-check-icon" />
                        ) : (
                          <span className="h-dot">•</span>
                        )}
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card-action-wrap">
                  {s.actionLink ? (
                    <Link
                      to={s.actionLink}
                      className={"btn-card-action " + (s.isFeatured ? "btn-featured" : "btn-outline")}
                    >
                      <span>{s.actionLabel}</span>
                      {s.id === "privacy-shield" ? (
                        <FiLock size={14} />
                      ) : (
                        <FiArrowRight size={14} />
                      )}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={"btn-card-action " + (s.isFeatured ? "btn-featured" : "btn-outline")}
                      onClick={() => handleServiceClick(s)}
                    >
                      <span>{s.actionLabel}</span>
                      <FiArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. 3-Step Success Pathway Section */}
        <section className="services-pathway-card">
          <div className="pathway-head">
            <div className="section-pill-tag">
              STEP-BY-STEP PATHWAY
            </div>
            <h2>How Our Services Fast-Track Your Placement</h2>
            <p>
              Follow this proven pathway to maximize your inbound recruiter opportunities on StrengthOut.
            </p>
          </div>

          <div className="pathway-steps-grid">
            <div className="p-step-box">
              <span className="step-big-num">01</span>
              <div className="step-icon-wrap">
                <FiAward size={20} />
              </div>
              <h4>Verify & Document</h4>
              <p>
                Complete RightPath skill assessments and link working GitHub repositories to earn verified proof badges.
              </p>
            </div>

            <div className="p-step-box">
              <span className="step-big-num">02</span>
              <div className="step-icon-wrap">
                <FiVideo size={20} />
              </div>
              <h4>Pitch & Publish</h4>
              <p>
                Record your 60-second video introduction and publish your profile to the company discovery network.
              </p>
            </div>

            <div className="p-step-box">
              <span className="step-big-num">03</span>
              <div className="step-icon-wrap">
                <FiBriefcase size={20} />
              </div>
              <h4>Connect & Get Hired</h4>
              <p>
                Receive inbound company requests, review offer parameters, and coordinate directly with hiring teams.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Advisory Consultation Callout Banner matching reference */}
        <section className="services-consultation-banner">
          <div className="consultation-left">
            <span className="consultation-tag">PERSONALIZED ASSISTANCE</span>
            <h3>Need Help Elevating Your Technical Portfolio?</h3>
            <p>
              Our dedicated talent advisors help review your projects, optimize your technical summaries, and guide you through RightPath verification to ensure you stand out.
            </p>
          </div>
          <div className="consultation-right">
            <button
              type="button"
              className="btn-consultation-cta"
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
