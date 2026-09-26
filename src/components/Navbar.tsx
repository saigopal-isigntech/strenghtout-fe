import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/logo.png";
import { notificationsApi } from "../api/notifications";
import { candidatesApi } from "../api/candidates";
import { companiesApi } from "../api/companies";
import { isValidUserAvatar } from "../utils/validators";

/* react-icons */
import {
  FiEdit3,
  FiBell,
  FiChevronDown,
  FiLogOut,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { HiOutlineUser, HiOutlineUsers, HiOutlineClipboardList } from "react-icons/hi";

import "./Navbar.css";

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin, updateUserAvatar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const isFetchingUnreadRef = useRef(false);
  const lastFetchedPathRef = useRef<string>("");

  /* Profile Avatar Image resolution - only show user uploaded avatar, never hardcoded dummy image */
  const [avatarSrc, setAvatarSrc] = useState<string | null>(() => {
    if (!user) return null;
    return isValidUserAvatar(user.avatarUrl) ? user.avatarUrl! : null;
  });
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
    if (!user || !isValidUserAvatar(user.avatarUrl)) {
      setAvatarSrc(null);
    } else {
      setAvatarSrc(user.avatarUrl!);
    }
  }, [user?.avatarUrl, user?.userId]);

  /* Listen for real-time photo update events across the app */
  useEffect(() => {
    const handleAvatarUpdate = (e: any) => {
      const newUrl = e.detail?.avatarUrl;
      if (isValidUserAvatar(newUrl)) {
        setAvatarSrc(newUrl);
        setImgError(false);
      } else {
        setAvatarSrc(null);
        setImgError(false);
      }
    };
    window.addEventListener("profilePhotoUpdated", handleAvatarUpdate);
    return () => window.removeEventListener("profilePhotoUpdated", handleAvatarUpdate);
  }, []);

  /* Fetch live candidate/company avatar to ensure navbar is always synced with what is set by candidate */
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role === "ROLE_CANDIDATE") {
      candidatesApi
        .getMyProfile()
        .then((res) => {
          const pic = res.data?.data?.avatarUrl;
          if (isValidUserAvatar(pic)) {
            setAvatarSrc(pic);
            setImgError(false);
            updateUserAvatar(pic);
          } else {
            setAvatarSrc(null);
            if (user.avatarUrl) {
              updateUserAvatar("");
            }
          }
        })
        .catch(() => {});
    } else if (user.role === "ROLE_COMPANY") {
      companiesApi
        .getMyProfile()
        .then((res) => {
          const logo = res.data?.data?.logoUrl;
          if (isValidUserAvatar(logo)) {
            setAvatarSrc(logo);
            setImgError(false);
            updateUserAvatar(logo);
          } else {
            setAvatarSrc(null);
            if (user.avatarUrl) {
              updateUserAvatar("");
            }
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, user?.userId, user?.role, updateUserAvatar]);

  /* Theme state: default is 'light' */
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("strengthout_theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
    localStorage.setItem("strengthout_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  /* fetch unread count with strict deduplication guard */
  const fetchUnread = useCallback(async () => {
    if (!isAuthenticated || isFetchingUnreadRef.current) return;
    if (location.pathname === "/notifications") {
      setUnreadCount(0);
      return;
    }
    isFetchingUnreadRef.current = true;
    try {
      const res = await notificationsApi.getUnreadCount();
      const val =
        (res.data?.data as any)?.unreadCount ?? (res.data?.data as any)?.count ?? 0;
      setUnreadCount(location.pathname === "/notifications" ? 0 : Number(val));
    } catch {
      /* silent */
    } finally {
      isFetchingUnreadRef.current = false;
    }
  }, [isAuthenticated, location.pathname]);

  /* listen for notificationsRead custom event */
  useEffect(() => {
    const handleRead = () => setUnreadCount(0);
    window.addEventListener("notificationsRead", handleRead);
    return () => window.removeEventListener("notificationsRead", handleRead);
  }, []);

  /* Single effect: fetches unread count cleanly on route changes without background polling leaks */
  useEffect(() => {
    if (!isAuthenticated) return;
    if (lastFetchedPathRef.current !== location.pathname) {
      lastFetchedPathRef.current = location.pathname;
      fetchUnread();
    }
  }, [isAuthenticated, location.pathname, fetchUnread]);

  /* close mobile drawer on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  const isSuperAdmin =
    user?.role === "ROLE_SUPER_ADMIN" || user?.accountType === "SUPER_ADMIN";
  const userInitial = user?.fullName
    ? user.fullName
        .split(" ")
        .filter(Boolean)
        .map((n: string) => n.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("")
    : (user?.fullName?.[0]?.toUpperCase() || "U");

  const isActive = (path: string) => {
    if (path === "/admin/dashboard" || path === "/company/dashboard" || path === "/candidate/dashboard") {
      return (
        location.pathname === path ||
        location.pathname === "/dashboard" ||
        (location.pathname === "/" && isAuthenticated)
      );
    }
    if (path.includes("discover")) {
      return location.pathname === "/company/discover" || location.pathname === "/discover";
    }
    if (path.includes("requests")) {
      if (path.startsWith("/admin")) {
        return location.pathname === "/admin/requests";
      }
      return location.pathname === "/company/requests" || location.pathname === "/my-requests";
    }
    if (path.includes("profile")) {
      if (path.startsWith("/company")) {
        return location.pathname === "/company/profile";
      }
      return (
        location.pathname === "/candidate/profile" ||
        location.pathname === "/candidate/profile/edit" ||
        location.pathname === "/profile" ||
        location.pathname === "/profile/edit"
      );
    }
    return location.pathname === path;
  };

  const getBrandHomeLink = () => {
    if (!user) return "/";
    if (isAdmin()) return "/admin/dashboard";
    if (user.role === "ROLE_COMPANY") return "/company/dashboard";
    return "/candidate/dashboard";
  };

  const navLinks = () => {
    if (!user)
      return [
        { to: "/", label: "Home" },
        { to: "/about", label: "About" },
        { to: "/services", label: "Services" },
      ];
    if (isAdmin())
      return [
        { to: "/admin/dashboard", label: "Home" },
        { to: "/admin/requests", label: "Requests" },
        { to: "/admin/users", label: "Users" },
        { to: "/admin/audit", label: "Audit" },
      ];
    if (user.role === "ROLE_COMPANY")
      return [
        { to: "/company/dashboard", label: "Home" },
        { to: "/company/discover", label: "Discover" },
        { to: "/company/requests", label: "Requests" },
        { to: "/company/profile", label: "Profile" },
        { to: "/about", label: "About" },
      ];
    return [
      { to: "/candidate/dashboard", label: "Home" },
      { to: "/candidate/profile", label: "Profile" },
      { to: "/services", label: "Services" },
      { to: "/about", label: "About" },
    ];
  };

  
  const handleBellClick = () => {
    /* optimistically clear badge when user navigates to notifications */
    setUnreadCount(0);
  };

  
  const displayCount =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : "";

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        {/* Logo */}
        <Link
          to={getBrandHomeLink()}
          className="nav-brand"
          aria-label="StrengthOut Home"
        >
          <img src={logoImg} alt="StrengthOut" className="nav-brand-logo" />
          {isAdmin() && (
            <span className={`brand-role-tag ${isSuperAdmin ? "super" : ""}`}>
              {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
            </span>
          )}
        </Link>

        {/* Nav links */}
        <div className="nav-links">
          {navLinks().map((link) => (
            <Link
              key={link.to + link.label}
              to={link.to}
              className={`nav-item ${isActive(link.to) ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        

        {/* Hamburger (mobile only) */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div
            className="mobile-backdrop"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <div className={`mobile-drawer ${mobileOpen ? "open" : ""}`}>
          {isAuthenticated && (
            <div className="mobile-drawer-user">
              <div className="mobile-drawer-avatar">
                {avatarSrc && !imgError ? (
                  <img
                    src={avatarSrc}
                    alt={user?.fullName || "User Avatar"}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span>{isSuperAdmin ? "SA" : userInitial}</span>
                )}
              </div>
              <div className="mobile-drawer-user-meta">
                <span className="mobile-drawer-user-name">{user?.fullName || "User"}</span>
                <span className="mobile-drawer-user-role">
                  {isSuperAdmin ? "SUPER ADMIN" : (user?.role || "").replace("ROLE_", "")}
                </span>
              </div>
            </div>
          )}

          <div className="mobile-drawer-links">
            {navLinks().map((link) => (
              <Link
                key={link.to + link.label}
                to={link.to}
                className={`mobile-nav-link ${isActive(link.to) ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated && (
              <Link
                to="/notifications"
                className={`mobile-nav-link ${isActive("/notifications") ? "active" : ""}`}
                onClick={() => {
                  setMobileOpen(false);
                  handleBellClick();
                }}
              >
                <FiBell size={16} style={{ marginRight: "0.5rem" }} />
                Notifications {unreadCount > 0 && `(${displayCount})`}
              </Link>
            )}

            {isAuthenticated && user?.role === "ROLE_CANDIDATE" && (
              <Link
                to="/candidate/profile/edit"
                className={`mobile-nav-link ${isActive("/profile/edit") ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <FiEdit3 size={16} style={{ marginRight: "0.5rem" }} />
                Edit Profile Details
              </Link>
            )}
          </div>

          {/* Mobile Theme Toggle */}
          <div
            className="mobile-theme-row"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.6rem 0.5rem",
              borderTop: "1px solid var(--border-subtle, #f1f5f9)",
            }}
          >
            <span
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "var(--text-secondary, #4b5563)",
              }}
            >
              {theme === "dark" ? "Dark Theme" : "Light Theme"}
            </span>
            <button
              type="button"
              className="nav-icon-btn"
              onClick={toggleTheme}
              aria-label={
                theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
              }
              title={
                theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
              }
            >
              {theme === "dark" ? (
                <FiSun size={18} color="#f59e0b" />
              ) : (
                <FiMoon size={18} />
              )}
            </button>
          </div>

          {isAuthenticated ? (
            <button
              type="button"
              className="mobile-drawer-logout-btn"
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
            >
              <FiLogOut size={16} /> Sign Out
            </button>
          ) : (
            <div className="mobile-auth-btns">
              <Link
                to="/login"
                className="nav-btn-login"
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="nav-btn-register"
                onClick={() => setMobileOpen(false)}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Right cluster */}
        <div className="nav-right">
          {/* Theme of icon / Theme Mode Switcher */}
          <button
            type="button"
            className="nav-icon-btn theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
            }
            title={
              theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
          >
            {theme === "dark" ? (
              <FiSun size={18} color="#f59e0b" />
            ) : (
              <FiMoon size={18} />
            )}
          </button>

          {/* Bell with unread badge */}
          {isAuthenticated && (
            <Link
              to="/notifications"
              className="nav-icon-btn"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
              title="Notifications"
              onClick={handleBellClick}
            >
              <FiBell size={18} />
              {displayCount && (
                <span className="nav-icon-badge" aria-hidden="true">
                  {displayCount}
                </span>
              )}
            </Link>
          )}

          {/* Avatar dropdown */}
          {isAuthenticated && (
            <div className="nav-user" ref={menuRef}>
              <button
                className="nav-user-trigger"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <div
                  className={`nav-avatar ${isSuperAdmin ? "super" : ""} ${
                    avatarSrc && !imgError ? "has-image" : ""
                  }`}
                >
                  {avatarSrc && !imgError ? (
                    <img
                      src={avatarSrc}
                      alt={user?.fullName || "User Avatar"}
                      className="nav-avatar-img"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <span>{isSuperAdmin ? "SA" : userInitial}</span>
                  )}
                </div>
                <span className="user-firstname">
                  {user?.fullName?.split(" ")[0]}
                </span>
                <FiChevronDown
                  size={13}
                  strokeWidth={2.5}
                  className={`user-caret-icon ${menuOpen ? "open" : ""}`}
                />
              </button>

              {menuOpen && (
                <div className="nav-dropdown" role="menu">
                  <div className="dropdown-user-header">
                    <div className="dropdown-user-profile-row">
                      <div
                        className={`dropdown-avatar ${
                          avatarSrc && !imgError ? "has-image" : ""
                        }`}
                      >
                        {avatarSrc && !imgError ? (
                          <img
                            src={avatarSrc}
                            alt={user?.fullName || "User Avatar"}
                            className="dropdown-avatar-img"
                          />
                        ) : (
                          <span>{isSuperAdmin ? "SA" : userInitial}</span>
                        )}
                      </div>
                      <div className="dropdown-user-info">
                        <div className="dropdown-user-name">{user?.fullName}</div>
                        <div className="dropdown-user-email">{user?.email}</div>
                        <span
                          className={`role-badge-tag ${
                            isSuperAdmin ? "super" : ""
                          }`}
                        >
                          {isSuperAdmin
                            ? "SUPER ADMIN"
                            : (user?.role || "").replace("ROLE_", "")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <hr className="dropdown-divider" />

                  {!isAdmin() && (
                    <Link
                      to={user?.role === "ROLE_COMPANY" ? "/company/profile" : "/candidate/profile"}
                      className="dropdown-link"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      <HiOutlineUser size={14} /> View My Profile
                    </Link>
                  )}

                  {user?.role === "ROLE_CANDIDATE" && (
                    <Link
                      to="/candidate/profile/edit"
                      className="dropdown-link"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      <FiEdit3 size={14} /> Edit Profile Details
                    </Link>
                  )}

                  {isAdmin() && (
                    <>
                      <Link
                        to="/admin/requests"
                        className="dropdown-link"
                        onClick={() => setMenuOpen(false)}
                        role="menuitem"
                      >
                        <HiOutlineClipboardList size={14} /> Admin Request Queue
                      </Link>
                      <Link
                        to="/admin/users"
                        className="dropdown-link"
                        onClick={() => setMenuOpen(false)}
                        role="menuitem"
                      >
                        <HiOutlineUsers size={14} /> User Management
                      </Link>
                    </>
                  )}

                  <hr className="dropdown-divider" />
                  <button
                    className="dropdown-link logout-btn"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <FiLogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Unauthenticated */}
          {!isAuthenticated && (
            <div className="nav-auth-actions">
              <Link to="/login" className="nav-btn-login">
                Sign In
              </Link>
              <Link to="/register" className="nav-btn-register">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
