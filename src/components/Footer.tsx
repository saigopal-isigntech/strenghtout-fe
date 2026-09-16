import React from "react";
import { Link } from "react-router-dom";
import {
  FaLinkedinIn,
  FaXTwitter,
  FaInstagram,
  FaYoutube,
  FaGlobe,
} from "react-icons/fa6";
import "./Footer.css";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  const links = [
    { to: "/about",    label: "About Us" },
    { to: "/careers",  label: "Careers" },
    { to: "/services", label: "Services" },
    { to: "/contact",  label: "Help Center" },
  ];

  const socials = [
    { href: "https://linkedin.com",  icon: <FaLinkedinIn size={14} />,  label: "LinkedIn"  },
    { href: "https://twitter.com",   icon: <FaXTwitter   size={14} />,  label: "Twitter"   },
    { href: "https://instagram.com", icon: <FaInstagram  size={14} />,  label: "Instagram" },
    { href: "https://youtube.com",   icon: <FaYoutube    size={14} />,  label: "YouTube"   },
  ];

  return (
    <footer className="footer" aria-label="Site footer">
      <div className="footer-bar">

        {/* Copyright */}
        <p className="footer-copy">
          Copyright &copy; {year} StrengthOut
        </p>

        {/* Links */}
        <nav className="footer-links" aria-label="Footer links">
          {links.map((l, i) => (
            <React.Fragment key={l.label}>
              {i > 0 && <span className="footer-sep" aria-hidden="true" />}
              <Link to={l.to} className="footer-link">
                {l.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>

        {/* Right: socials + locale */}
        <div className="footer-right">
          {socials.map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="footer-social-icon"
            >
              {s.icon}
            </a>
          ))}

          <span className="footer-locale">
            <FaGlobe size={12} />
            India
          </span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;