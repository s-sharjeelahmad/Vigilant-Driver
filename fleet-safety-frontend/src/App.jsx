import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { initTheme } from "./lib/themeManager";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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

function App() {
  useEffect(() => {
    initTheme();
  }, []);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboardPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/companies"
            element={
              <ProtectedAdminRoute>
                <AdminCompaniesPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedAdminRoute>
                <AdminProfilePage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/company/dashboard"
            element={
              <ProtectedCompanyRoute>
                <CompanyDashboardPage />
              </ProtectedCompanyRoute>
            }
          />
          <Route
            path="/company/profile"
            element={
              <ProtectedCompanyRoute>
                <CompanyProfilePage />
              </ProtectedCompanyRoute>
            }
          />
          <Route
            path="/company/drivers"
            element={
              <ProtectedCompanyRoute>
                <CompanyDriversPage />
              </ProtectedCompanyRoute>
            }
          />
          <Route
            path="/company/vehicles"
            element={
              <ProtectedCompanyRoute>
                <CompanyVehiclesPage />
              </ProtectedCompanyRoute>
            }
          />
          <Route
            path="/company/sessions"
            element={
              <ProtectedCompanyRoute>
                <CompanySessionsPage />
              </ProtectedCompanyRoute>
            }
          />
          <Route
            path="/company/alerts"
            element={
              <ProtectedCompanyRoute>
                <CompanyAlertsPage />
              </ProtectedCompanyRoute>
            }
          />
          <Route
            path="/company/ai-advisor"
            element={
              <ProtectedCompanyRoute>
                <CompanyAIAdvisorPage />
              </ProtectedCompanyRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
