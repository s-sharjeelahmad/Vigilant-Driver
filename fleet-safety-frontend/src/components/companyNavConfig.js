import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Activity, 
  BellRing, 
  UserCircle,
  MessageSquare
} from "lucide-react";

export const companyNavConfig = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", path: "/company/dashboard", icon: LayoutDashboard }
    ]
  },
  {
    title: "Fleet Operations",
    items: [
      { name: "Drivers", path: "/company/drivers", icon: Users },
      { name: "Vehicles", path: "/company/vehicles", icon: Car },
      { name: "Sessions", path: "/company/sessions", icon: Activity }
    ]
  },
  {
    title: "Safety & AI",
    items: [
      { name: "Alerts", path: "/company/alerts", icon: BellRing },
      { name: "AI Advisor", path: "/company/ai-advisor", icon: MessageSquare }
    ]
  }
];

export const companyFooterNav = [
  { name: "Profile Settings", path: "/company/profile", icon: UserCircle }
];
