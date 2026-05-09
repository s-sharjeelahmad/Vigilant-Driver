import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import RiskPill from "../components/RiskPill";
import AdminSubnav from "../components/AdminSubnav";
import { adminApi } from "../lib/apiClient";
import { clearAdminSession, getAdminToken } from "../lib/adminSession";

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [dashboardData, companiesData] = await Promise.all([
          adminApi.getDashboard(),
          adminApi.getCompanies()
        ]);

        setDashboard(dashboardData || {});
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
      } catch (err) {
        setError(err.message || "Unable to load admin dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const summary = useMemo(() => {
    const data = dashboard || {};
    return {
      totalCompanies: toNumber(data.total_companies, companies.length),
      totalDrivers: toNumber(data.total_drivers, 0),
      totalSessions: toNumber(data.total_sessions, 0),
      totalEvents: toNumber(data.total_events, 0),
      totalAlerts: toNumber(data.total_alerts, 0),
      riskScore: toNumber(data.risk_score, 0),
      riskLevel: data.risk_level || "unknown",
      avgAttention: toNumber(data.average_attention_score, 0),
      avgConfidence: toNumber(data.average_confidence, 0)
    };
  }, [dashboard, companies.length]);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/login", { replace: true });
  };

  return (
    <section className="section">
      <div className="container container-wide admin-dash-wrap">
        <div className="admin-dash-head">
          <SectionHeader
            eyebrow="Admin Console"
            title="Vigilant Driver Monitoring and Safety Assurance System"
            text="Cross-company safety visibility, risk tracking, and operational analytics."
          />
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <AdminSubnav />

        {loading ? <p className="state loading">Loading admin dashboard...</p> : null}
        {error ? <p className="state error">{error}</p> : null}

        {!loading && !error ? (
          <>
            <div className="admin-metric-grid">
              <article className="card metric-card">
                <h4>Total Companies</h4>
                <strong>{summary.totalCompanies}</strong>
              </article>
              <article className="card metric-card">
                <h4>Total Drivers</h4>
                <strong>{summary.totalDrivers}</strong>
              </article>
              <article className="card metric-card">
                <h4>Total Sessions</h4>
                <strong>{summary.totalSessions}</strong>
              </article>
              <article className="card metric-card">
                <h4>Total Events</h4>
                <strong>{summary.totalEvents}</strong>
              </article>
              <article className="card metric-card">
                <h4>Total Alerts</h4>
                <strong>{summary.totalAlerts}</strong>
              </article>
              <article className="card metric-card">
                <h4>Risk Status</h4>
                <div className="metric-risk">
                  <span>{summary.riskScore.toFixed(2)}</span>
                  <RiskPill level={summary.riskLevel} />
                </div>
              </article>
            </div>

            <div className="admin-secondary-grid">
              <article className="card">
                <h3>System Quality Indicators</h3>
                <p>Average Attention: {summary.avgAttention.toFixed(2)}</p>
                <p>Average Confidence: {summary.avgConfidence.toFixed(2)}</p>
              </article>

              <article className="card">
                <h3>Recent Companies</h3>
                <ul className="company-list">
                  {(companies.length ? companies.slice(0, 6) : []).map((company, idx) => (
                    <li key={`${company.company_name || "company"}-${idx}`}>
                      <div>
                        <strong>{company.company_name || "N/A"}</strong>
                        <p>{company.city || "N/A"}</p>
                      </div>
                      <span>{company.subscription_status || "N/A"}</span>
                    </li>
                  ))}
                </ul>
                {!companies.length ? <p className="state neutral">No data available</p> : null}
              </article>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

export default AdminDashboardPage;
