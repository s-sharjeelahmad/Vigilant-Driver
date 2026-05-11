import { 
  LayoutDashboard, 
  Building2, 
  UserCircle 
} from "lucide-react";

export const adminNavConfig = [
  {
    title: "System Overview",
    items: [
      { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard }
    ]
  },
  {
    title: "Management",
    items: [
      { name: "Companies", path: "/admin/companies", icon: Building2 }
    ]
  }
];

export const adminFooterNav = [
  { name: "Profile Settings", path: "/admin/profile", icon: UserCircle }
];
