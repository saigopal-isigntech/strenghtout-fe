import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { candidatesApi } from "../api/candidates";
import {
  FiSearch,
  FiCommand,
  FiCompass,
  FiUserCheck,
  FiClock,
  FiBell,
  FiLogOut,
  FiShield,
  FiUsers,
  FiFileText,
  FiStar,
  FiCopy,
  FiX,
  FiChevronRight,
  FiUser,
  FiGrid,
} from "react-icons/fi";
import "./CommandPalette.css";

interface CommandItem {
  id: string;
  category: "Navigation" | "Candidates" | "Actions" | "Admin Tools";
  label: string;
  subtext?: string;
  icon: React.ReactNode;
  action: () => void;
  badge?: string;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [liveCandidates, setLiveCandidates] = useState<any[]>([]);
  const [isSearchingCandidates, setIsSearchingCandidates] = useState(false);

  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  
  // Helper to copy current URL
  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Current URL copied to clipboard!");
  };

  // Keyboard shortcut listener for Ctrl+K / Cmd+K / Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle palette on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      // Close on Escape
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("openCommandPalette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("openCommandPalette", handleCustomOpen);
    };
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Live candidates search API call
  useEffect(() => {
    if (!isOpen || !query.trim() || query.length < 2) {
      setLiveCandidates([]);
      setIsSearchingCandidates(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearchingCandidates(true);
      candidatesApi
        .search({ query: query.trim(), page: 0, size: 5 })
        .then((res) => {
          const content = res.data?.data?.content || [];
          setLiveCandidates(content);
        })
        .catch(() => setLiveCandidates([]))
        .finally(() => setIsSearchingCandidates(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Build commands pool
  const buildCommands = useCallback((): CommandItem[] => {
    const items: CommandItem[] = [];

    // --- NAVIGATION ---
    if (isAuthenticated) {
      if (user?.role === "ROLE_COMPANY") {
        items.push({
          id: "nav-company-dashboard",
          category: "Navigation",
          label: "Company Dashboard",
          subtext: "Overview of stats & candidate matches",
          icon: <FiGrid className="cmd-icon-nav" />,
          action: () => navigate("/company/dashboard"),
          badge: "Go",
        });
        items.push({
          id: "nav-discover",
          category: "Navigation",
          label: "Discover Candidates",
          subtext: "Search, filter & request candidate connections",
          icon: <FiCompass className="cmd-icon-nav" />,
          action: () => navigate("/company/discover"),
          badge: "Go",
        });
        items.push({
          id: "nav-my-requests",
          category: "Navigation",
          label: "My Connection Requests",
          subtext: "Track status of requested candidate profiles",
          icon: <FiClock className="cmd-icon-nav" />,
          action: () => navigate("/company/requests"),
          badge: "Go",
        });
        items.push({
          id: "nav-company-profile",
          category: "Navigation",
          label: "Company Profile",
          subtext: "Manage company details & hiring preferences",
          icon: <FiUserCheck className="cmd-icon-nav" />,
          action: () => navigate("/company/profile"),
          badge: "Go",
        });
      } else if (user?.role === "ROLE_CANDIDATE") {
        items.push({
          id: "nav-candidate-dashboard",
          category: "Navigation",
          label: "Candidate Dashboard",
          subtext: "Track profile strength & incoming requests",
          icon: <FiGrid className="cmd-icon-nav" />,
          action: () => navigate("/candidate/dashboard"),
          badge: "Go",
        });
        items.push({
          id: "nav-candidate-opps",
          category: "Navigation",
          label: "My Opportunities",
          subtext: "View company connection requests & offers",
          icon: <FiClock className="cmd-icon-nav" />,
          action: () => navigate("/candidate/opportunities"),
          badge: "Go",
        });
        items.push({
          id: "nav-candidate-profile",
          category: "Navigation",
          label: "My Professional Profile",
          subtext: "Update skills, experience, education & evidence",
          icon: <FiUser className="cmd-icon-nav" />,
          action: () => navigate("/candidate/profile"),
          badge: "Go",
        });
      }

      items.push({
        id: "nav-notifications",
        category: "Navigation",
        label: "Notifications Center",
        subtext: "View system alerts, status updates & requests",
        icon: <FiBell className="cmd-icon-nav" />,
        action: () => navigate("/notifications"),
        badge: "Go",
      });
    }

    // --- ADMIN TOOLS ---
    if (isAdmin()) {
      items.push({
        id: "admin-dashboard",
        category: "Admin Tools",
        label: "Admin Command Center",
        subtext: "Platform metrics, queue summary & system health",
        icon: <FiShield className="cmd-icon-admin" />,
        action: () => navigate("/admin/dashboard"),
        badge: "Admin",
      });
      items.push({
        id: "admin-requests",
        category: "Admin Tools",
        label: "Pending Request Approvals",
        subtext: "Review and approve company connection requests",
        icon: <FiClock className="cmd-icon-admin" />,
        action: () => navigate("/admin/requests"),
        badge: "Admin",
      });
      items.push({
        id: "admin-users",
        category: "Admin Tools",
        label: "User Accounts Management",
        subtext: "Manage candidates, companies & admin roles",
        icon: <FiUsers className="cmd-icon-admin" />,
        action: () => navigate("/admin/users"),
        badge: "Admin",
      });
      items.push({
        id: "admin-audit",
        category: "Admin Tools",
        label: "Security Audit Logs",
        subtext: "View platform activities and transaction history",
        icon: <FiFileText className="cmd-icon-admin" />,
        action: () => navigate("/admin/audit"),
        badge: "Admin",
      });
    }

    // --- ACTIONS ---
    
    if (user?.role === "ROLE_COMPANY") {
      items.push({
        id: "act-shortlisted",
        category: "Actions",
        label: "View Shortlisted Candidates",
        subtext: "Jump to your starred candidate shortlist",
        icon: <FiStar className="cmd-icon-act" />,
        action: () => navigate("/company/discover?tab=shortlisted"),
        badge: "Saved",
      });
    }

    items.push({
      id: "act-copy-link",
      category: "Actions",
      label: "Copy Page Share Link",
      subtext: "Copy current URL to clipboard",
      icon: <FiCopy className="cmd-icon-act" />,
      action: () => copyShareLink(),
      badge: "Share",
    });

    if (isAuthenticated) {
      items.push({
        id: "act-logout",
        category: "Actions",
        label: "Log Out of StrengthOut",
        subtext: "Securely end current session",
        icon: <FiLogOut className="cmd-icon-danger" />,
        action: () => {
          logout();
          navigate("/login");
        },
        badge: "Exit",
      });
    }

    // --- LIVE CANDIDATES SEARCH RESULTS ---
    if (liveCandidates.length > 0) {
      liveCandidates.forEach((cand) => {
        const skillsText = Array.isArray(cand.skills)
          ? cand.skills.map((s: any) => (typeof s === "string" ? s : s.name || s.skillName)).join(", ")
          : "";
        items.unshift({
          id: `cand-${cand.id || cand.candidateId}`,
          category: "Candidates",
          label: `${cand.firstName || "Candidate"} ${cand.lastName || ""}`.trim(),
          subtext: cand.headline || cand.title || skillsText || "Verified Talent",
          icon: <FiUser className="cmd-icon-cand" />,
          action: () => {
            navigate(`/company/discover?candidateId=${cand.id || cand.candidateId}`);
          },
          badge: cand.location || "Candidate",
        });
      });
    }

    return items;
  }, [isAuthenticated, user?.role, isAdmin, navigate, logout, liveCandidates]);

  const allCommands = buildCommands();

  // Filter commands by search query
  const filteredCommands = allCommands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      (cmd.subtext && cmd.subtext.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  // Handle arrow key navigation & Enter press
  useEffect(() => {
    const handleListKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleListKeyDown);
    return () => window.removeEventListener("keydown", handleListKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Ensure active element is scrolled into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(".cmd-item.active");
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group filtered items by category
  const categories = Array.from(new Set(filteredCommands.map((c) => c.category)));

  let currentGlobalIndex = 0;

  return (
    <div className="cmd-overlay" onClick={() => setIsOpen(false)}>
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header Search Bar */}
        <div className="cmd-header">
          <FiSearch className="cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command, candidate name, skill, or page..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          {query && (
            <button className="cmd-clear-btn" onClick={() => setQuery("")} title="Clear search">
              <FiX />
            </button>
          )}
          <span className="cmd-esc-badge">ESC</span>
        </div>

        {/* Command Options List */}
        <div className="cmd-body" ref={listRef}>
          {isSearchingCandidates && (
            <div className="cmd-loading">
              <div className="cmd-spinner" /> Searching verified candidates...
            </div>
          )}

          {filteredCommands.length === 0 && !isSearchingCandidates ? (
            <div className="cmd-empty">
              <FiSearch className="cmd-empty-icon" />
              <p className="cmd-empty-title">No matching commands or candidates found</p>
              <p className="cmd-empty-sub">Try typing "Dashboard", "React", "Admin", or "Theme"</p>
            </div>
          ) : (
            categories.map((cat) => {
              const catCommands = filteredCommands.filter((c) => c.category === cat);
              if (catCommands.length === 0) return null;

              return (
                <div key={cat} className="cmd-group">
                  <div className="cmd-group-title">{cat}</div>
                  {catCommands.map((cmd) => {
                    const itemIndex = currentGlobalIndex++;
                    const isActive = itemIndex === selectedIndex;

                    return (
                      <div
                        key={cmd.id}
                        className={`cmd-item ${isActive ? "active" : ""}`}
                        onClick={() => {
                          cmd.action();
                          setIsOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                      >
                        <div className="cmd-item-icon">{cmd.icon}</div>
                        <div className="cmd-item-content">
                          <span className="cmd-item-label">{cmd.label}</span>
                          {cmd.subtext && <span className="cmd-item-subtext">{cmd.subtext}</span>}
                        </div>
                        {cmd.badge && <span className="cmd-item-badge">{cmd.badge}</span>}
                        <FiChevronRight className="cmd-item-arrow" />
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Shortcuts */}
        <div className="cmd-footer">
          <div className="cmd-shortcut-hint">
            <span className="cmd-key">↑</span>
            <span className="cmd-key">↓</span> Navigate
          </div>
          <div className="cmd-shortcut-hint">
            <span className="cmd-key">↵</span> Select
          </div>
          <div className="cmd-shortcut-hint">
            <span className="cmd-key">ESC</span> Close
          </div>
          <div className="cmd-shortcut-hint cmd-brand-hint">
            <FiCommand /> StrengthOut Command Palette
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
