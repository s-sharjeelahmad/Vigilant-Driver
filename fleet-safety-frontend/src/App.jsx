import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { initTheme } from "./lib/themeManager";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppDashboardLayout from "./components/AppDashboardLayout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminCompaniesPage from "./pages/AdminCompaniesPage";
import AdminProfilePage from "./pages/AdminProfilePage";
import CompanyDashboardPage from "./pages/CompanyDashboardPage";
import CompanyProfilePage from "./pages/CompanyProfilePage";
import CompanyDriversPage from "./pages/CompanyDriversPage";
import CompanyVehiclesPage from "./pages/CompanyVehiclesPage";
import CompanySessionsPage from "./pages/CompanySessionsPage";
import CompanyAlertsPage from "./pages/CompanyAlertsPage";
import CompanyAIAdvisorPage from "./pages/CompanyAIAdvisorPage";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedCompanyRoute from "./components/ProtectedCompanyRoute";
import { ToastProvider } from "./components/ToastContext";

// Public layout wrapper (includes marketing navbar and footer)
const PublicLayout = ({ children }) => (
  <div className="app-shell">
    <Navbar />
    <main className="main-content">
      {children}
    </main>
    <Footer />
  </div>
);

// Admin dashboard layout wrapper
const AdminRoute = ({ children }) => (
  <ProtectedAdminRoute>
    <AppDashboardLayout role="admin">
      {children}
    </AppDashboardLayout>
  </ProtectedAdminRoute>
);

// Company dashboard layout wrapper
const CompanyRoute = ({ children }) => (
  <ProtectedCompanyRoute>
    <AppDashboardLayout role="company">
      {children}
    </AppDashboardLayout>
  </ProtectedCompanyRoute>
);

function App() {
  useEffect(() => {
    initTheme();
  }, []);

  return (
    <ToastProvider>
      <Routes>
        {/* Public Routes */}
      <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
      <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
      
      {/* Auth Route (Custom layout inside LoginPage) */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="/admin/companies" element={<AdminRoute><AdminCompaniesPage /></AdminRoute>} />
      <Route path="/admin/profile" element={<AdminRoute><AdminProfilePage /></AdminRoute>} />

      {/* Company Routes */}
      <Route path="/company/dashboard" element={<CompanyRoute><CompanyDashboardPage /></CompanyRoute>} />
      <Route path="/company/profile" element={<CompanyRoute><CompanyProfilePage /></CompanyRoute>} />
      <Route path="/company/drivers" element={<CompanyRoute><CompanyDriversPage /></CompanyRoute>} />
      <Route path="/company/vehicles" element={<CompanyRoute><CompanyVehiclesPage /></CompanyRoute>} />
      <Route path="/company/sessions" element={<CompanyRoute><CompanySessionsPage /></CompanyRoute>} />
      <Route path="/company/alerts" element={<CompanyRoute><CompanyAlertsPage /></CompanyRoute>} />
      <Route path="/company/ai-advisor" element={<CompanyRoute><CompanyAIAdvisorPage /></CompanyRoute>} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
