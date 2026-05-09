import { NavLink } from "react-router-dom";

const companyLinks = [
  { to: "/company/dashboard", label: "Dashboard" },
  { to: "/company/drivers", label: "Drivers" },
  { to: "/company/vehicles", label: "Vehicles" },
  { to: "/company/sessions", label: "Sessions" },
  { to: "/company/alerts", label: "Alerts" },
  { to: "/company/profile", label: "Profile" },
  { to: "/company/ai-advisor", label: "AI Advisor" }
];

function CompanySubnav() {
  return (
    <nav className="company-subnav" aria-label="Company Navigation">
      {companyLinks.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default CompanySubnav;
