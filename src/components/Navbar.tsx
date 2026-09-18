import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/logo.png";
import { notificationsApi } from "../api/notifications";

/* react-icons */
import { FiSearch, FiBell, FiChevronDown, FiLogOut, FiSettings, FiMenu, FiX } from "react-icons/fi";
import { HiOutlineUser, HiOutlineUsers, HiOutlineClipboardList } from "react-icons/hi";

import "./Navbar.css";

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const isFetchingUnreadRef = useRef(false);
  const lastFetchedPathRef  = useRef<string>("");

  /* fetch unread count with strict deduplication guard */
  const fetchUnread = useCallback(async () => {
    if (!isAuthenticated || isFetchingUnreadRef.current) return;
    isFetchingUnreadRef.current = true;
    try {
      const res = await notificationsApi.getUnreadCount();
      const val = (res.data?.data as any)?.unreadCount ?? (res.data?.data as any)?.count ?? 0;
      setUnreadCount(Number(val));
    } catch {
      /* silent */
    } finally {
      isFetchingUnreadRef.current = false;
    }
  }, [isAuthenticated]);

  /* Single effect: fetches unread count cleanly on route changes without background polling leaks */
  useEffect(() => {
    if (!isAuthenticated) return;
    if (lastFetchedPathRef.current !== location.pathname) {
      lastFetchedPathRef.current = location.pathname;
      fetchUnread();
    }
  }, [isAuthenticated, location.pathname, fetchUnread]);

  /* close mobile drawer on route change */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };
  const isSuperAdmin = user?.role === "ROLE_SUPER_ADMIN" || user?.accountType === "SUPER_ADMIN";
  const userInitial  = user?.fullName?.[0]?.toUpperCase() || "U";

  const isActive = (path: string) => {
    if (path === "/dashboard" && (location.pathname === "/dashboard" || location.pathname === "/")) return true;
    return location.pathname === path;
  };

  const navLinks = () => {
    if (!user) return [
      { to: "/",         label: "Home" },
      { to: "/about",    label: "About" },
      { to: "/careers",  label: "Careers" },
      { to: "/services", label: "Services" },
      { to: "/contact",  label: "Contact" },
    ];
    if (isAdmin()) return [
      { to: "/dashboard",      label: "Home" },
      { to: "/admin/requests", label: "Requests" },
      { to: "/admin/users",    label: "Users" },
      { to: "/admin/audit",    label: "Audit" },
    ];
    if (user.role === "ROLE_COMPANY") return [
      { to: "/dashboard",   label: "Home" },
      { to: "/discover",    label: "Discover" },
      { to: "/my-requests", label: "My Requests" },
    ];
    return [
      { to: "/dashboard", label: "Home" },
      { to: "/discover",  label: "Discover" },
      { to: "/about",     label: "About" },
      { to: "/services",  label: "Services" },
    ];
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleBellClick = () => {
    /* optimistically clear badge when user navigates to notifications */
    setUnreadCount(0);
  };

  const displayCount = unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : "";

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">

        {/* Logo */}
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="nav-brand" aria-label="StrengthOut Home">
          <img src={logoImg} alt="StrengthOut" className="nav-brand-logo" />
          {isAdmin() && (
            <span className={`brand-role-tag ${isSuperAdmin ? "super" : ""}`}>
              {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
            </span>
          )}
        </Link>

        {/* Nav links */}
        <div className="nav-links">
          {navLinks().map(link => (
            <Link
              key={link.to + link.label}
              to={link.to}
              className={`nav-item ${isActive(link.to) ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Search */}
        <form className="nav-search" onSubmit={handleSearch} role="search">
          <input
            id="nav-search-input"
            className="nav-search-input"
            type="search"
            placeholder="Search profiles, skills..."
            value={searchQuery}
            
            aria-label="Search"
          />
          <button type="submit" className="nav-search-btn" aria-label="Search">
            <FiSearch size={15} strokeWidth={2.5} />
          </button>
        </form>

        {/* Hamburger (mobile only) */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

        {/* Mobile Drawer */}
        {mobileOpen && <div className="mobile-backdrop" onClick={() => setMobileOpen(false)} />}
        <div className={`mobile-drawer ${mobileOpen ? "open" : ""}`}>
          <div className="mobile-drawer-links">
            {navLinks().map(link => (
              <Link
                key={link.to + link.label}
                to={link.to}
                className={`mobile-nav-link ${isActive(link.to) ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          {isAuthenticated && (
            <div className="mobile-drawer-search">
              <form onSubmit={(e) => { handleSearch(e); setMobileOpen(false); }}>
                <input
                  type="search"
                  className="mobile-search-input"
                  placeholder="Search profiles, skills..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </form>
            </div>
          )}
          {!isAuthenticated && (
            <div className="mobile-auth-btns">
              <Link to="/login" className="nav-btn-login" onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link to="/register" className="nav-btn-register" onClick={() => setMobileOpen(false)}>Get Started</Link>
            </div>
          )}
        </div>

        {/* Right cluster */}
        <div className="nav-right">

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
                onClick={() => setMenuOpen(o => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <div className={`nav-avatar ${isSuperAdmin ? "super" : ""}`}>
                  {isSuperAdmin ? "SA" : userInitial}
                </div>
                <span className="user-firstname">{user?.fullName?.split(" ")[0]}</span>
                <FiChevronDown
                  size={13}
                  strokeWidth={2.5}
                  className={`user-caret-icon ${menuOpen ? "open" : ""}`}
                />
              </button>

              {menuOpen && (
                <div className="nav-dropdown" role="menu">
                  <div className="dropdown-user-header">
                    <div className="dropdown-user-name">{user?.fullName}</div>
                    <div className="dropdown-user-email">{user?.email}</div>
                    <span className={`role-badge-tag ${isSuperAdmin ? "super" : ""}`}>
                      {isSuperAdmin ? "SUPER ADMIN" : (user?.role || "").replace("ROLE_", "")}
                    </span>
                  </div>
                  <hr className="dropdown-divider" />

                  <Link to="/profile" className="dropdown-link" onClick={() => setMenuOpen(false)} role="menuitem">
                    <HiOutlineUser size={14} /> View My Profile
                  </Link>

                  {isAdmin() && (
                    <>
                      <Link to="/admin/requests" className="dropdown-link" onClick={() => setMenuOpen(false)} role="menuitem">
                        <HiOutlineClipboardList size={14} /> Admin Request Queue
                      </Link>
                      <Link to="/admin/users" className="dropdown-link" onClick={() => setMenuOpen(false)} role="menuitem">
                        <HiOutlineUsers size={14} /> User Management
                      </Link>
                    </>
                  )}

                  <Link to="/settings" className="dropdown-link" onClick={() => setMenuOpen(false)} role="menuitem">
                    <FiSettings size={14} /> Settings
                  </Link>
                  <hr className="dropdown-divider" />
                  <button className="dropdown-link logout-btn" onClick={handleLogout} role="menuitem">
                    <FiLogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Unauthenticated */}
          {!isAuthenticated && (
            <div className="nav-auth-actions">
              <Link to="/login"    className="nav-btn-login">Sign In</Link>
              <Link to="/register" className="nav-btn-register">Get Started</Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;