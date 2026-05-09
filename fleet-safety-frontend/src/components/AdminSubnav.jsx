import { NavLink } from "react-router-dom";

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/companies", label: "Companies" },
  { to: "/admin/profile", label: "My Profile" }
];

function AdminSubnav() {
  return (
    <nav className="admin-subnav" aria-label="Admin Navigation">
      {adminLinks.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default AdminSubnav;
