import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiZap,
  FiAward,
  FiSearch,
  FiLayers,
  FiCompass,
  FiVideo,
  FiCode,
  FiArrowRight,
  FiCheckCircle,
  FiShield,
  FiLock,
  FiUserCheck,
} from "react-icons/fi";
import "./LandingPage.css";

const LandingPage: React.FC = () => {
  const { isAuthenticated, user, isAdmin } = useAuth();

  const getCandidateLink = () => {
    if (isAuthenticated) {
      if (isAdmin()) return "/admin/dashboard";
      if (user?.role === "ROLE_COMPANY") return "/company/dashboard";
      return "/candidate/profile";
    }
    return "/register";
  };

  const getCompanyLink = () => {
    if (isAuthenticated) {
      if (isAdmin()) return "/admin/dashboard";
      if (user?.role === "ROLE_COMPANY") return "/company/discover";
      return "/candidate/dashboard";
    }
    return "/company/discover";
  };

  return (
    <div className="crisp-landing-root">
      {/* ============================================================
          1. HERO HEADER (Clean, Compact, Brand Focused)
          ============================================================ */}
      <section className="crisp-hero-section">
        <div className="crisp-container">
          <div className="crisp-badge">
            <FiZap className="crisp-zap-icon" />
            <span>COMPETENCY-FIRST TALENT DISCOVERY</span>
          </div>

          <h1 className="crisp-hero-title">
            Where Skills Speak Louder Than Resumes.
            <br />
            <span className="crisp-accent">Verified Talent Recognition</span>, Not an ATS Black Hole.
          </h1>

          <p className="crisp-hero-sub">
            StrengthOut replaces automated keyword filtering with tamper-proof RightPath skill benchmarks,
            60-second video introductions, and authentic project codebases.
          </p>

          <div className="crisp-hero-cta-row">
            <Link to={getCandidateLink()} className="crisp-btn crisp-btn-primary">
              <span>{isAuthenticated ? "Go to My Dashboard" : "Get Started as Candidate"}</span>
              <FiArrowRight size={16} />
            </Link>
            <Link to={getCompanyLink()} className="crisp-btn crisp-btn-secondary">
              <FiSearch size={16} />
              <span>{isAuthenticated ? "Search Talent Pool" : "Discover Verified Talent"}</span>
            </Link>
          </div>

          {/* Quick Trust Badges Strip */}
          <div className="crisp-trust-strip">
            <div className="crisp-trust-item">
              <FiShield className="trust-icon" />
              <span>100% Free for Candidates</span>
            </div>
            <div className="crisp-trust-dot" />
            <div className="crisp-trust-item">
              <FiAward className="trust-icon" />
              <span>RightPath Benchmark Tests</span>
            </div>
            <div className="crisp-trust-dot" />
            <div className="crisp-trust-item">
              <FiUserCheck className="trust-icon" />
              <span>Direct Inbound Matching</span>
            </div>
            <div className="crisp-trust-dot" />
            <div className="crisp-trust-item">
              <FiLock className="trust-icon" />
              <span>Shielded Contact Privacy</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. CORE NAVIGATION GATEWAY (Direct Links to Navbar Pages)
          ============================================================ */}
      <section className="crisp-gateway-section" aria-label="Explore platform pathways">
        <div className="crisp-container">
          <div className="crisp-section-header">
            <span className="crisp-eyebrow">EXPLORE STRENGTHOUT</span>
            <h2 className="crisp-section-title">Everything You Need In One Ecosystem</h2>
            <p className="crisp-section-sub">
              Quickly navigate between candidate portfolios, employer talent discovery, and platform services.
            </p>
          </div>

          <div className="crisp-gateway-grid">
            {/* Gateway 1: Candidate Portfolio */}
            <div className="crisp-gateway-card card-candidate">
              <div className="gateway-icon-wrap green">
                <FiAward size={22} />
              </div>
              <div className="gateway-badge green">FOR CANDIDATES</div>
              <h3>Showcase Real Capability</h3>
              <p>
                Build your verified talent profile, complete RightPath skill assessments, record your 60-second video pitch, and receive inbound company requests.
              </p>
              <div className="gateway-features">
                <span><FiCheckCircle size={13} /> Bypass keyword filters</span>
                <span><FiCheckCircle size={13} /> 60s video elevator pitch</span>
              </div>
              <Link to={getCandidateLink()} className="gateway-action-link green">
                <span>{isAuthenticated ? "View My Profile" : "Create Candidate Account"}</span>
                <FiArrowRight size={15} />
              </Link>
            </div>

            {/* Gateway 2: Employer Discovery */}
            <div className="crisp-gateway-card card-employer">
              <div className="gateway-icon-wrap blue">
                <FiSearch size={22} />
              </div>
              <div className="gateway-badge blue">FOR EMPLOYERS</div>
              <h3>Discover Pre-Vetted Engineers</h3>
              <p>
                Search candidates by validated technical percentiles, review authentic GitHub repositories, and send direct connection requests with clear compensation.
              </p>
              <div className="gateway-features">
                <span><FiCheckCircle size={13} /> Cut screening time by 70%</span>
                <span><FiCheckCircle size={13} /> Verified GitHub repo evidence</span>
              </div>
              <Link to={getCompanyLink()} className="gateway-action-link blue">
                <span>Explore Candidate Discovery</span>
                <FiArrowRight size={15} />
              </Link>
            </div>

            {/* Gateway 3: Platform Services (Top Nav Link /services) */}
            <div className="crisp-gateway-card card-services">
              <div className="gateway-icon-wrap teal">
                <FiLayers size={22} />
              </div>
              <div className="gateway-badge teal">PLATFORM SERVICES</div>
              <h3>RightPath & Career Services</h3>
              <p>
                Explore standardized skill testing benchmarks, candidate profile optimization, technical challenge badges, and assisted talent matching.
              </p>
              <div className="gateway-features">
                <span><FiCheckCircle size={13} /> Standardized testing</span>
                <span><FiCheckCircle size={13} /> Placement assistance</span>
              </div>
              <Link to="/services" className="gateway-action-link teal">
                <span>Explore Services</span>
                <FiArrowRight size={15} />
              </Link>
            </div>

            {/* Gateway 4: About Platform (Top Nav Link /about) */}
            <div className="crisp-gateway-card card-about">
              <div className="gateway-icon-wrap purple">
                <FiCompass size={22} />
              </div>
              <div className="gateway-badge purple">ABOUT STRENGTHOUT</div>
              <h3>Our Mission & Methodology</h3>
              <p>
                Learn why competency discovery solves the broken hiring pipeline, protects candidate privacy, and helps honest builders get recognized.
              </p>
              <div className="gateway-features">
                <span><FiCheckCircle size={13} /> Comparison vs ATS portals</span>
                <span><FiCheckCircle size={13} /> Frequently asked questions</span>
              </div>
              <Link to="/about" className="gateway-action-link purple">
                <span>Read About Us</span>
                <FiArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. COMPACT 3-PILLARS STRIP (Short & Crispy)
          ============================================================ */}
      <section className="crisp-pillars-section">
        <div className="crisp-container">
          <div className="crisp-pillars-strip">
            <div className="crisp-pillar-item">
              <div className="pillar-mini-icon green"><FiAward size={20} /></div>
              <div className="pillar-mini-text">
                <strong>RightPath Benchmarks</strong>
                <span>Standardized skill scores proving capability upfront</span>
              </div>
            </div>
            <div className="crisp-pillar-divider" />
            <div className="crisp-pillar-item">
              <div className="pillar-mini-icon blue"><FiVideo size={20} /></div>
              <div className="pillar-mini-text">
                <strong>60s Video Pitch</strong>
                <span>Direct human impression replacing initial phone screens</span>
              </div>
            </div>
            <div className="crisp-pillar-divider" />
            <div className="crisp-pillar-item">
              <div className="pillar-mini-icon purple"><FiCode size={20} /></div>
              <div className="pillar-mini-text">
                <strong>Verified Code Evidence</strong>
                <span>Real GitHub repositories evaluated on actual structure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          4. COMPACT BOTTOM CALL TO ACTION
          ============================================================ */}
      <section className="crisp-bottom-cta">
        <div className="crisp-container">
          <div className="crisp-cta-box">
            <div className="crisp-cta-text">
              <h3>Ready to Experience Competency-First Talent Discovery?</h3>
              <p>Join thousands of skilled developers and hiring teams building the future of authentic hiring.</p>
            </div>
            <div className="crisp-cta-btns">
              {!isAuthenticated ? (
                <>
                  <Link to="/register" className="crisp-btn crisp-btn-primary">
                    <span>Create Free Account</span>
                    <FiArrowRight size={15} />
                  </Link>
                  <Link to="/login" className="crisp-btn crisp-btn-ghost">
                    <span>Sign In</span>
                  </Link>
                </>
              ) : (
                <Link to="/dashboard" className="crisp-btn crisp-btn-primary">
                  <span>Go to My Dashboard</span>
                  <FiArrowRight size={15} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
