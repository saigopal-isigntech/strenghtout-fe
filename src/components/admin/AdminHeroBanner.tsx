import React from "react";
import {
  FiShield,
  FiLock,
  FiMail,
  FiTrendingUp,
  FiInbox,
  FiUsers,
  FiFileText,
  FiCheckCircle,
  FiUser,
  FiBell,
} from "react-icons/fi";
import "./AdminHeroBanner.css";

export type HeroIllustrationType = "dashboard" | "requests" | "users" | "audit" | "notifications";

interface AdminHeroBannerProps {
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  secondBadgeText?: string;
  secondBadgeIcon?: React.ReactNode;
  title: string;
  highlightText?: string;
  subtitle: string;
  signedInEmail?: string;
  actionButton?: React.ReactNode;
  illustrationType?: HeroIllustrationType;
}

export const AdminHeroBanner: React.FC<AdminHeroBannerProps> = ({
  badgeText = "ADMIN CONTROL CENTER",
  badgeIcon = <FiShield size={14} />,
  secondBadgeText,
  secondBadgeIcon,
  title,
  highlightText,
  subtitle,
  signedInEmail,
  actionButton,
  illustrationType,
}) => {
  const renderTitle = () => {
    if (!highlightText || !title.includes(highlightText)) {
      return title;
    }
    const parts = title.split(highlightText);
    return (
      <>
        {parts[0]}
        <span className="hero-highlight">{highlightText}</span>
        {parts[1]}
      </>
    );
  };

  const getIllustration = (): HeroIllustrationType => {
    if (illustrationType) return illustrationType;
    const lower = title.toLowerCase();
    if (lower.includes("notif")) return "notifications";
    if (lower.includes("audit") || lower.includes("security")) return "audit";
    if (lower.includes("request") || lower.includes("queue") || lower.includes("tracker")) return "requests";
    if (lower.includes("directory") || lower.includes("user") || lower.includes("governance")) return "users";
    return "dashboard";
  };

  const currentIllustration = getIllustration();

  const renderIllustrationGraphic = () => {
    switch (currentIllustration) {
      case "dashboard":
        return (
          <div className="hero-browser-card card-dashboard">
            <div className="browser-header-bar">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <div className="browser-body">
              <div className="browser-left-col">
                <div className="browser-chart-bars">
                  <div className="c-bar bar-1"></div>
                  <div className="c-bar bar-2"></div>
                  <div className="c-bar bar-3"></div>
                  <div className="c-bar bar-4"></div>
                </div>
                <div className="browser-lines">
                  <div className="b-line w-75"></div>
                </div>
              </div>
              <div className="browser-right-col">
                <div className="browser-icon-badge badge-dashboard">
                  <FiTrendingUp size={20} className="badge-main-icon" />
                </div>
              </div>
            </div>
          </div>
        );

      case "requests":
        return (
          <div className="hero-browser-card card-requests">
            <div className="browser-header-bar">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <div className="browser-body">
              <div className="browser-left-col">
                <div className="browser-doc-item">
                  <FiFileText size={16} className="doc-icon" />
                  <div className="b-line w-75"></div>
                </div>
                <div className="browser-doc-item">
                  <FiCheckCircle size={14} className="check-sm-icon" />
                  <div className="b-line w-50"></div>
                </div>
              </div>
              <div className="browser-right-col">
                <div className="browser-icon-badge badge-requests">
                  <FiInbox size={20} className="badge-main-icon" />
                </div>
              </div>
            </div>
          </div>
        );

      case "users":
        return (
          <div className="hero-browser-card card-users">
            <div className="browser-header-bar">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <div className="browser-body">
              <div className="browser-left-col">
                <div className="browser-user-row">
                  <div className="mini-user-avatar">
                    <FiUser size={12} />
                  </div>
                  <div className="b-line w-75"></div>
                </div>
                <div className="browser-user-row">
                  <div className="mini-user-avatar second">
                    <FiUser size={12} />
                  </div>
                  <div className="b-line w-50"></div>
                </div>
              </div>
              <div className="browser-right-col">
                <div className="browser-icon-badge badge-users">
                  <FiUsers size={20} className="badge-main-icon" />
                </div>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="hero-browser-card card-notifications">
            <div className="browser-header-bar">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <div className="browser-body">
              <div className="browser-left-col">
                <div className="browser-notif-line">
                  <span className="n-dot dot-status-red"></span>
                  <div className="b-line w-75"></div>
                </div>
                <div className="browser-notif-line">
                  <span className="n-dot dot-status-green"></span>
                  <div className="b-line w-75"></div>
                </div>
                <div className="browser-notif-line">
                  <span className="n-dot dot-status-blue"></span>
                  <div className="b-line w-50"></div>
                </div>
              </div>
              <div className="browser-right-col">
                <div className="browser-icon-badge badge-notifications">
                  <FiBell size={20} className="badge-main-icon" />
                </div>
              </div>
            </div>
          </div>
        );

      case "audit":
      default:
        return (
          <div className="hero-browser-card card-audit">
            <div className="browser-header-bar">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <div className="browser-body">
              <div className="browser-left-col">
                <div className="browser-avatar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <div className="browser-lines">
                  <div className="b-line w-75"></div>
                  <div className="b-line w-50"></div>
                </div>
                <div className="browser-bullets">
                  <span className="b-bullet"></span>
                  <span className="b-bullet"></span>
                </div>
              </div>
              <div className="browser-right-col">
                <div className="browser-icon-badge badge-audit">
                  <FiLock size={20} className="badge-main-icon" />
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-hero-banner-container">
      {/* Background Organic Wave SVG */}
      <svg
        className="admin-hero-waves"
        viewBox="0 0 500 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0,200 C120,110 240,30 500,45 L500,200 Z"
          fill="#a7f3d0"
          opacity="0.45"
        />
        <path
          d="M70,200 C180,130 300,55 500,75 L500,200 Z"
          fill="#6ee7b7"
          opacity="0.2"
        />
      </svg>

      {/* Top-Left & Bottom-Right Dot Matrix */}
      <div className="hero-dot-matrix matrix-top-left"></div>
      <div className="hero-dot-matrix matrix-bottom-right"></div>

      {/* Floating Translucent Accent Circles */}
      <div className="hero-floating-dot dot-top-left"></div>
      <div className="hero-floating-dot dot-top-right"></div>
      <div className="hero-floating-dot dot-mid-right"></div>
      <div className="hero-floating-dot dot-bottom-right-solid"></div>

      {/* Hero Content Left */}
      <div className="hero-content-left">
        <div className="hero-badges-row">
          {badgeText && (
            <div className="hero-badge">
              {badgeIcon}
              <span>{badgeText}</span>
            </div>
          )}
          {secondBadgeText && (
            <div className="hero-badge secondary-badge">
              {secondBadgeIcon}
              <span>{secondBadgeText}</span>
            </div>
          )}
        </div>

        <h1 className="hero-main-title">{renderTitle()}</h1>

        <p className="hero-main-subtitle">{subtitle}</p>

        {signedInEmail && (
          <div className="hero-signed-chip">
            <FiMail size={14} className="chip-mail-icon" />
            <span>
              Signed in: <strong>{signedInEmail}</strong>
            </span>
            <span className="chip-active-dot">• Active</span>
          </div>
        )}
      </div>

      {/* Hero Right Illustration & Graphic / Action */}
      <div className="hero-content-right">
        {actionButton && <div className="hero-action-slot">{actionButton}</div>}
        {renderIllustrationGraphic()}
      </div>
    </div>
  );
};
