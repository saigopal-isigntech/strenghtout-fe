import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiCheckCircle,
  FiTarget,
  FiAward,
  FiUsers,
  FiVideo,
  FiLayers,
  FiArrowRight,
  FiShield,
  FiZap,
  FiBriefcase,
  FiCode,
  FiTrendingUp,
  FiCheck,
  FiCompass,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import "./AboutPage.css";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

const AboutPage: React.FC = () => {
  const { user } = useAuth();
  const isCompanyUser = user?.role === "ROLE_COMPANY";

  // Default tab based on current logged in user role
  const [activeTab, setActiveTab] = useState<"candidate" | "company">(
    isCompanyUser ? "company" : "candidate"
  );

  // FAQ open states
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const toggleFaq = (id: number) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const faqList: FaqItem[] = [
    {
      id: 1,
      question: "Is StrengthOut completely free for students and freshers?",
      answer:
        "Yes! StrengthOut is 100% free for candidates. You can create your verified talent portfolio, record 60-second video introductions, take RightPath skill assessments, and receive direct inbound connection requests from top hiring companies without any charges.",
    },
    {
      id: 2,
      question: "How does company matching work once I publish?",
      answer:
        "Once your profile is completed and verified, verified companies and recruiters search our talent discovery pool by technical skills, work preference (Remote/Hybrid/Onsite), and experience. When a matching role opens, companies send a direct connection request specifying role parameters and compensation.",
    },
    {
      id: 3,
      question: "What is the RightPath skill assessment benchmark?",
      answer:
        "RightPath provides standardized, tamper-proof technical skill assessments covering Java, React, Python, Cloud Architecture, and core Problem Solving. Earning verified score badges proves your capability upfront without requiring redundant initial screening tests.",
    },
    {
      id: 4,
      question: "How is my personal contact information shielded from recruiters?",
      answer:
        "Your privacy is fully protected. Your phone number, personal email address, and exact location remain shielded until you explicitly accept a company's inbound connection request.",
    },
  ];

  return (
    <div className="about-page-wrapper">
      <div className="about-page-container">
        {/* Dark Hero Card Block matching reference image */}
        <header className="about-dark-hero">
          <div className="dark-hero-content">
            <div className="dark-hero-badge">
              <FiZap size={13} /> THE NEXT-GEN TALENT & DISCOVERY ECOSYSTEM
            </div>

            {activeTab === "candidate" ? (
              <>
                <h1 className="dark-hero-title">
                  Your Skills Deserve <span className="accent-text">Direct Recognition</span>, Not an ATS Black Hole
                </h1>
                <svg className="wavy-underline" viewBox="0 0 400 20" fill="none">
                  <path d="M5 12 Q 55 2, 105 12 T 205 12 T 305 12 T 395 12" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <p className="dark-hero-subtitle">
                  StrengthOut empowers skilled candidates, freshers, and experienced engineers to break past traditional resume filters. Showcase verified RightPath assessment evidence, 60-second video introductions, and authentic project codebases that prove what you can build.
                </p>
              </>
            ) : (
              <>
                <h1 className="dark-hero-title">
                  Empowering Companies with <span className="accent-text">Verified, High-Impact</span> Talent
                </h1>
                <svg className="wavy-underline" viewBox="0 0 400 20" fill="none">
                  <path d="M5 12 Q 55 2, 105 12 T 205 12 T 305 12 T 395 12" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <p className="dark-hero-subtitle">
                  StrengthOut bridges the gap between ambitious professionals and innovative organizations. By substituting unverified claims with authentic assessment evidence, video introductions, and real-world project portfolios, we make hiring transparent, fast, and reliable.
                </p>
              </>
            )}

            {/* Perspective Switcher Tabs */}
            <div className="about-tab-switcher">
              <button
                type="button"
                className={"about-tab-btn " + (activeTab === "candidate" ? "active" : "")}
                onClick={() => setActiveTab("candidate")}
              >
                <FiAward size={15} /> For Skilled Candidates
              </button>
              <button
                type="button"
                className={"about-tab-btn " + (activeTab === "company" ? "active" : "")}
                onClick={() => setActiveTab("company")}
              >
                <FiBriefcase size={15} /> For Hiring Companies
              </button>
            </div>

            <div className="dark-hero-cta">
              {activeTab === "candidate" ? (
                <>
                  <Link to="/candidate/profile" className="btn-hero-primary">
                    <span>View & Polish My Profile</span>
                    <FiArrowRight size={16} />
                  </Link>
                  <Link to="/services" className="btn-hero-secondary">
                    Explore Candidate Services
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/company/discover" className="btn-hero-primary">
                    <span>Start Discovering Talent</span>
                    <FiArrowRight size={16} />
                  </Link>
                  <Link to="/services" className="btn-hero-secondary">
                    Explore Platform Services
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* CANDIDATE PERSPECTIVE CONTENT */}
        {activeTab === "candidate" && (
          <>
            {/* The Motive for Candidates */}
            <section className="about-section-card motive-card">
              <div className="section-head">
                <div className="section-icon-badge candidate-badge">
                  <FiTarget size={22} color="#047857" />
                </div>
                <div>
                  <span className="eyebrow-tag">THE PROBLEM & OUR MOTIVE</span>
                  <h2 className="section-main-title">The Motive of StrengthOut for Skilled Candidates</h2>
                  <p className="section-subtitle">
                    Why we created a competency-first platform to ensure genuine talent gets discovered and respected.
                  </p>
                </div>
              </div>

              <div className="motive-grid">
                <div className="motive-box">
                  <div className="motive-box-header">
                    <FiShield size={20} className="motive-icon" />
                    <h3>Eliminating ATS Rejections</h3>
                  </div>
                  <p>
                    Traditional automated job portals discard qualified candidates due to missing arbitrary keywords or formatting flaws. StrengthOut replaces passive keyword filtering with active skill verification and direct company discovery.
                  </p>
                </div>

                <div className="motive-box">
                  <div className="motive-box-header">
                    <FiAward size={20} className="motive-icon" />
                    <h3>Proof Over Paper Promises</h3>
                  </div>
                  <p>
                    Resume inflation is widespread. StrengthOut allows honest, skilled candidates to stand apart by presenting verified assessment scores from RightPath and working code repositories that recruiters can trust immediately.
                  </p>
                </div>

                <div className="motive-box">
                  <div className="motive-box-header">
                    <FiTrendingUp size={20} className="motive-icon" />
                    <h3>Direct Inbound Opportunities</h3>
                  </div>
                  <p>
                    Instead of applying to hundreds of job listings into an endless queue, companies search pre-verified talent pools and send direct connection requests with specific roles tailored to your preferences.
                  </p>
                </div>
              </div>
            </section>

            {/* Traditional Portals vs StrengthOut Comparison */}
            <section className="about-section-card comparison-section">
              <div className="section-head">
                <div className="section-icon-badge candidate-badge">
                  <FiCompass size={22} color="#047857" />
                </div>
                <div>
                  <span className="eyebrow-tag">COMPARISON BREAKDOWN</span>
                  <h2 className="section-main-title">Traditional Job Portals vs. StrengthOut</h2>
                  <p className="section-subtitle">
                    See why skilled candidates get dramatically better visibility and outcomes on StrengthOut.
                  </p>
                </div>
              </div>

              <div className="comparison-table-wrap">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th style={{ width: "22%" }}>Hiring Factor</th>
                      <th style={{ width: "38%" }}>Traditional Job Portals</th>
                      <th style={{ width: "40%" }} className="highlight-col">StrengthOut Advantage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Discovery Method</strong></td>
                      <td>Submit hundreds of applications into unread resume stacks</td>
                      <td className="highlight-col"><span className="check-tag"><FiCheck size={14} /> Direct Inbound:</span> Employers search by verified skills & send direct connection invites</td>
                    </tr>
                    <tr>
                      <td><strong>Screening Criteria</strong></td>
                      <td>Robotic ATS bots screening for keywords and pedigree</td>
                      <td className="highlight-col"><span className="check-tag"><FiCheck size={14} /> Proof of Competence:</span> RightPath standardized assessment scores & code quality</td>
                    </tr>
                    <tr>
                      <td><strong>First Impression</strong></td>
                      <td>Flat 1-page PDF text that fails to show communication ability</td>
                      <td className="highlight-col"><span className="check-tag"><FiCheck size={14} /> 60s Video Pitch:</span> Showcase articulation, confidence, and passion upfront</td>
                    </tr>
                    <tr>
                      <td><strong>Project Proof</strong></td>
                      <td>Unverifiable bullet points on text documents</td>
                      <td className="highlight-col"><span className="check-tag"><FiCheck size={14} /> Real Repositories:</span> Working GitHub codebases, architecture, and live projects</td>
                    </tr>
                    <tr>
                      <td><strong>Data Privacy</strong></td>
                      <td>Contact details often sold or spammed by third-party recruiters</td>
                      <td className="highlight-col"><span className="check-tag"><FiCheck size={14} /> Shielded Privacy:</span> Direct phone & email remain protected until you connect</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Core Pillars */}
            <section className="about-pillars-section">
              <span className="eyebrow-tag" style={{ display: "inline-block", marginBottom: "0.5rem" }}>CANDIDATE ADVANTAGES</span>
              <h2 className="pillars-title">How StrengthOut Helps You Stand Out</h2>
              <p className="pillars-subtitle">
                Key features designed to showcase your true potential to recruiters and engineering leaders.
              </p>

              <div className="pillars-grid">
                <div className="pillar-card">
                  <div className="pillar-icon-box">
                    <FiVideo size={22} />
                  </div>
                  <h3>60-Second Video Pitch</h3>
                  <p>
                    Record a quick 1-minute video introduction. Share your technical passion, problem-solving mindset, and communication skills to establish immediate rapport before formal interview rounds.
                  </p>
                </div>

                <div className="pillar-card">
                  <div className="pillar-icon-box">
                    <FiCheckCircle size={22} />
                  </div>
                  <h3>RightPath Assessment Evidence</h3>
                  <p>
                    Complete standardized assessments on RightPath and link verified score badges to your profile. Companies see objective proof of your technical problem-solving and domain competence.
                  </p>
                </div>

                <div className="pillar-card">
                  <div className="pillar-icon-box">
                    <FiCode size={22} />
                  </div>
                  <h3>Live Projects & GitHub Repositories</h3>
                  <p>
                    Showcase academic, personal, or freelance projects with rich summaries and direct repository links. Demonstrate real software architecture, clean code practices, and delivery capability.
                  </p>
                </div>

                <div className="pillar-card">
                  <div className="pillar-icon-box">
                    <FiBriefcase size={22} />
                  </div>
                  <h3>Curated Direct Connections</h3>
                  <p>
                    Receive connection invitations directly from hiring teams looking for your specific skills, eliminating unread applications and unhelpful automated emails.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* COMPANY PERSPECTIVE CONTENT */}
        {activeTab === "company" && (
          <>
            {/* Motive & Mission Section */}
            <section className="about-section-card motive-card">
              <div className="section-head">
                <div className="section-icon-badge">
                  <FiTarget size={22} color="#047857" />
                </div>
                <div>
                  <span className="eyebrow-tag">THE PROBLEM & OUR MOTIVE</span>
                  <h2 className="section-main-title">The Motive Behind StrengthOut</h2>
                  <p className="section-subtitle">
                    Why we built a dedicated talent platform focused on genuine capability over traditional resume text.
                  </p>
                </div>
              </div>

              <div className="motive-grid">
                <div className="motive-box">
                  <div className="motive-box-header">
                    <FiShield size={20} className="motive-icon" />
                    <h3>Overcoming Resume Uncertainty</h3>
                  </div>
                  <p>
                    Traditional recruitment relies on text-heavy resumes that often mask true competence or leave hiring managers with weeks of guesswork. StrengthOut introduces verifiable competency scoring and authentic artifacts.
                  </p>
                </div>

                <div className="motive-box">
                  <div className="motive-box-header">
                    <FiAward size={20} className="motive-icon" />
                    <h3>Evidence-Backed Evaluation</h3>
                  </div>
                  <p>
                    Candidates showcase verified RightPath assessments, verified skill certifications, live GitHub repositories, and recorded video introductions so recruiters evaluate real ability before the first call.
                  </p>
                </div>

                <div className="motive-box">
                  <div className="motive-box-header">
                    <FiZap size={20} className="motive-icon" />
                    <h3>Fast & Direct Company Connections</h3>
                  </div>
                  <p>
                    Companies can search by role, skill, and work model, preview candidate portfolios in interactive detail, and send personalized opportunity requests in a single frictionless click.
                  </p>
                </div>
              </div>
            </section>

            {/* Pillars / Features Grid */}
            <section className="about-pillars-section">
              <span className="eyebrow-tag" style={{ display: "inline-block", marginBottom: "0.5rem" }}>ENTERPRISE PILLARS</span>
              <h2 className="pillars-title">Core Pillars of the StrengthOut Platform</h2>
              <p className="pillars-subtitle">
                Designed specifically to meet the high standards of modern engineering and business teams.
              </p>

              <div className="pillars-grid">
                <div className="pillar-card">
                  <div className="pillar-icon-box">
                    <FiVideo size={22} />
                  </div>
                  <h3>Introduction Videos</h3>
                  <p>
                    Watch 1-minute candidate pitch videos to evaluate communication skills, articulation, confidence, and culture alignment before inviting them to formal rounds.
                  </p>
                </div>

                <div className="pillar-card">
                  <div className="pillar-icon-box">
                    <FiCheckCircle size={22} />
                  </div>
                  <h3>RightPath Verified Evidence</h3>
                  <p>
                    Standardized, tamper-proof assessment scores from RightPath give employers objective benchmarks for problem-solving, domain knowledge, and technical aptitude.
                  </p>
                </div>

                <div className="pillar-card">
                  <div className="pillar-icon-box">
                    <FiLayers size={22} />
                  </div>
                  <h3>Projects & Code Repositories</h3>
                  <p>
                    Inspect academic and independent projects with live summaries, client context, and direct links to code repositories to assess code structure and architectural discipline.
                  </p>
                </div>

                <div className="pillar-card">
                  <div className="pillar-icon-box">
                    <FiUsers size={22} />
                  </div>
                  <h3>Privacy-First Engagement</h3>
                  <p>
                    Candidate personal contact data remains protected until a mutual connection is established, creating a professional, spam-free talent marketplace.
                  </p>
                </div>
              </div>
            </section>

            {/* How It Works for Companies */}
            <section className="about-section-card how-it-works-card">
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <span className="eyebrow-tag">RECRUITMENT WORKFLOW</span>
                <h2 className="section-main-title">
                  How StrengthOut Works for Companies
                </h2>
                <p className="section-subtitle">
                  Four streamlined steps to scale your team with pre-verified talent.
                </p>
              </div>

              <div className="steps-container">
                <div className="step-item">
                  <div className="step-num">01</div>
                  <h4>Discover Candidates</h4>
                  <p>Search across verified talent pools by target role, tech stack, experience level, and work type.</p>
                </div>

                <div className="step-item">
                  <div className="step-num">02</div>
                  <h4>Inspect Artifacts</h4>
                  <p>Click on any candidate card to inspect their video pitch, verified evidence, projects, and education.</p>
                </div>

                <div className="step-item">
                  <div className="step-num">03</div>
                  <h4>Send Connection Request</h4>
                  <p>Specify the role title, opportunity details, and work model to initiate a direct connection.</p>
                </div>

                <div className="step-item">
                  <div className="step-num">04</div>
                  <h4>Track & Hire</h4>
                  <p>Monitor connection statuses in "My Requests", coordinate interviews, and extend offers.</p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* FREQUENTLY ASKED QUESTIONS SECTION matching reference screenshot */}
        <section className="faq-section-card">
          <h2 className="faq-section-title">Frequently Asked Questions</h2>
          <div className="faq-accordion-stack">
            {faqList.map((f) => {
              const isOpen = openFaqId === f.id;
              return (
                <div key={f.id} className={"faq-item-drawer " + (isOpen ? "open" : "")}>
                  <div
                    className="faq-question-bar"
                    onClick={() => toggleFaq(f.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleFaq(f.id);
                    }}
                  >
                    <span className="faq-question-text">{f.question}</span>
                    <div className="faq-toggle-icon">
                      {isOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                    </div>
                  </div>
                  {isOpen && (
                    <div className="faq-answer-body">
                      <p>{f.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Powered by Banner */}
        <section className="about-consultation-banner">
          <div className="consultation-left">
            <span className="consultation-tag">ENTERPRISE FOUNDATION</span>
            <h3>Powered by iSignTech & RightPath Technologies</h3>
            <p>
              StrengthOut is engineered by iSignTech with rigorous validation architecture, empowering both skilled candidates and forward-thinking hiring companies worldwide.
            </p>
          </div>
          <div className="consultation-right">
            {isCompanyUser ? (
              <Link to="/company/discover" className="btn-consultation-cta">
                Start Discovering Talent
              </Link>
            ) : (
              <Link to="/candidate/profile" className="btn-consultation-cta">
                Enhance My Profile
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
