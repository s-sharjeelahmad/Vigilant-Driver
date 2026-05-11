import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { LogOut, Menu, X, ShieldCheck } from "lucide-react";
import { companyNavConfig, companyFooterNav } from "./companyNavConfig";
import { adminNavConfig, adminFooterNav } from "./adminNavConfig";
import { clearAdminSession } from "../lib/adminSession";
import { clearCompanySession } from "../lib/companySession";

const AppDashboardLayout = ({ role, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isCompany = role === "company";
  const navConfig = isCompany ? companyNavConfig : adminNavConfig;
  const footerNav = isCompany ? companyFooterNav : adminFooterNav;

  const handleLogout = () => {
    if (isCompany) {
      clearCompanySession();
    } else {
      clearAdminSession();
    }
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="dash-layout" data-theme="dark-sidebar">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={closeSidebar}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 30 }}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <ShieldCheck size={24} className="text-primary" style={{ color: "var(--color-primary)" }} />
          <span>Vigilant Driver</span>
          <button 
            className="mobile-sidebar-toggle ml-auto md:hidden" 
            onClick={toggleSidebar}
            style={{ marginLeft: 'auto' }}
          >
            <X size={20} color="var(--color-sidebar-text)" />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navConfig.map((section, idx) => (
            <div key={idx} className="mb-6" style={{ marginBottom: '1.5rem' }}>
              <div className="ds-caption" style={{ padding: '0 0.75rem', marginBottom: '0.5rem' }}>
                {section.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`sidebar-link ${isActive ? "active" : ""}`}
                      onClick={closeSidebar}
                    >
                      <Icon size={18} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {footerNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                  onClick={closeSidebar}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dash-main">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-left">
            <button className="mobile-sidebar-toggle" onClick={toggleSidebar}>
              <Menu size={20} />
            </button>
            <div className="ds-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isCompany ? "Fleet Operations" : "System Administration"}
            </div>
          </div>
          <div className="top-bar-right">
            {/* Optional: Add a subtle logout icon button here for quick access */}
            <button 
              onClick={handleLogout}
              className="btn-icon" 
              title="Logout"
              style={{ color: "var(--color-text-secondary)", background: "transparent", border: "1px solid var(--color-border)" }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="dash-content">
          <div className="dash-content-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppDashboardLayout;
