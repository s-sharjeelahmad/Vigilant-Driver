import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, ShieldCheck, Sun, Moon, Sparkles } from "lucide-react";
import { toggleTheme, getCurrentTheme } from "../lib/themeManager";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact Us" },
  { to: "/company/ai-advisor", label: "AI Advisor", icon: true }
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(getCurrentTheme());
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleThemeToggle = () => {
    const newTheme = toggleTheme();
    setTheme(newTheme);
  };

  return (
    <header 
      style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 1100,
        backgroundColor: scrolled ? 'rgba(var(--color-bg-rgb), 0.8)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: scrolled ? '12px 0' : '20px 0'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* ─── BRANDING ─── */}
        <Link 
          to="/" 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }} 
          onClick={() => setOpen(false)}
        >
          <div style={{ 
            backgroundColor: 'var(--color-primary)', 
            padding: '8px', 
            borderRadius: '10px',
            boxShadow: '0 4px 12px var(--color-primary-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck color="#FFF" size={20} />
          </div>
          <span style={{ 
            fontSize: '20px', 
            fontWeight: 900, 
            color: 'var(--color-text-primary)', 
            letterSpacing: '-0.04em',
            textTransform: 'uppercase'
          }}>
            Vigilant<span style={{ color: 'var(--color-primary)' }}>Driver</span>
          </span>
        </Link>

        {/* ─── MOBILE TOGGLE ─── */}
        <button
          style={{
            display: 'none', // Managed by CSS in styles.css for responsive media queries
            background: 'none',
            border: 'none',
            color: 'var(--color-text-primary)',
            cursor: 'pointer'
          }}
          className="menu-button-visible" // Apply this class in your CSS for @media (max-width: 768px)
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* ─── NAVIGATION LINKS ─── */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className={`nav-links ${open ? "mobile-open" : ""}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.2s ease'
              })}
            >
              {item.icon && <Sparkles size={14} color="var(--color-warning)" />}
              {item.label}
            </NavLink>
          ))}

          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--color-border)' }} className="hidden-mobile" />

          {/* ─── THEME TOGGLE ─── */}
          <button
            onClick={handleThemeToggle}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              padding: '8px',
              borderRadius: '8px',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* ─── CTA LOGIN ─── */}
          <Link 
            to="/login" 
            className="btn-primary" 
            style={{ 
              padding: '10px 24px', 
              borderRadius: '8px', 
              fontSize: '14px', 
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: scrolled ? '0 4px 10px var(--color-primary-soft)' : 'none'
            }}
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;