import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import RiskPill from "../components/RiskPill";
import CompanySubnav from "../components/CompanySubnav";
import { companyApi } from "../lib/apiClient";
import { clearCompanySession } from "../lib/companySession";
import { formatDateTimeUS, formatDisplayValue } from "../lib/dateFormatter";

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

function CompanyDashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await companyApi.getDashboard();
        setDashboard(data || {});
      } catch (err) {
        setError(err.message || "Unable to load company dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const data = dashboard || {};
    return {
      totalSessions: toNumber(data.total_sessions, 0),
      totalEvents: toNumber(data.total_events, 0),
      drowsyEvents: toNumber(data.drowsy_events, 0),
      distractedEvents: toNumber(data.distracted_events, 0),
      highRiskEvents: toNumber(data.high_risk_events, 0),
      totalAlerts: toNumber(data.total_alerts, 0),
      averageAttentionScore: toNumber(data.average_attention_score, 0),
      averageConfidence: toNumber(data.average_confidence, 0),
      riskScore: toNumber(data.risk_score, 0),
      riskLevel: data.risk_level || "unknown",
      lastUpdated: data.last_updated || null
    };
  }, [dashboard]);

  const handleLogout = () => {
    clearCompanySession();
    navigate("/login", { replace: true });
  };

  return (
    <section className="section">
      <div className="container container-wide company-page-wrap">
        <div className="company-head">
          <SectionHeader
            eyebrow="Company Console"
            title="Company Safety Dashboard"
            text="Monitor operational safety indicators and access company actions from one place."
          />
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <CompanySubnav />

        {loading ? <p className="state loading">Loading dashboard...</p> : null}
        {error ? <p className="state error">{error}</p> : null}

        {!loading && !error ? (
          <>
            <div className="company-metric-grid">
              <article className="card metric-card"><h4>Total Sessions</h4><strong>{formatDisplayValue(summary.totalSessions)}</strong></article>
              <article className="card metric-card"><h4>Total Events</h4><strong>{formatDisplayValue(summary.totalEvents)}</strong></article>
              <article className="card metric-card"><h4>Drowsy Events</h4><strong>{formatDisplayValue(summary.drowsyEvents)}</strong></article>
              <article className="card metric-card"><h4>Distracted Events</h4><strong>{formatDisplayValue(summary.distractedEvents)}</strong></article>
              <article className="card metric-card"><h4>High Risk Events</h4><strong>{formatDisplayValue(summary.highRiskEvents)}</strong></article>
              <article className="card metric-card"><h4>Total Alerts</h4><strong>{formatDisplayValue(summary.totalAlerts)}</strong></article>
              <article className="card metric-card"><h4>Average Attention</h4><strong>{summary.averageAttentionScore ? summary.averageAttentionScore.toFixed(2) : "-"}</strong></article>
              <article className="card metric-card"><h4>Average Confidence</h4><strong>{summary.averageConfidence ? summary.averageConfidence.toFixed(2) : "-"}</strong></article>
            </div>

            <div className="company-secondary-grid">
              <article className="card">
                <h3>Risk Overview</h3>
                <div className="metric-risk">
                  <span>{summary.riskScore ? summary.riskScore.toFixed(2) : "-"}</span>
                  <RiskPill level={summary.riskLevel} />
                </div>
                <p>Last Updated: {formatDateTimeUS(summary.lastUpdated)}</p>
              </article>
              <article className="card">
                <h3>Quick Navigation</h3>
                <p>Use the navigation tabs above to manage drivers, vehicles, sessions, alerts, and profile information.</p>
              </article>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

export default CompanyDashboardPage;
