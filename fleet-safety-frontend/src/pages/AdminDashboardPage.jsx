import { useEffect, useMemo, useState } from "react";
import { Shield, Building2, Users, Activity, Bell, MapPin } from "lucide-react";
import RiskPill from "../components/RiskPill";
import StatusPill from "../components/StatusPill";
import { DashboardSkeleton } from "../components/Skeletons";
import { adminApi } from "../lib/apiClient";

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [dashboardData, companiesData] = await Promise.all([
          adminApi.getDashboard(),
          adminApi.getCompanies().catch(() => [])
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
  }, []);

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

  if (error) {
    return (
      <div className="state error" style={{ margin: '2rem' }}>
        <Shield size={24} style={{ marginBottom: '1rem' }} />
        <h3>System Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="ds-heading-1" style={{ margin: 0, color: 'var(--color-text-primary)' }}>System Control Center</h1>
          <p className="ds-body" style={{ margin: '0.25rem 0 0 0' }}>Cross-company safety visibility, risk tracking, and operational analytics.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div className="ds-caption" style={{ color: 'var(--color-text-muted)' }}>Global Risk Score</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <span className="ds-heading-2" style={{ margin: 0 }}>{summary.riskScore.toFixed(1)}</span>
              <RiskPill level={summary.riskLevel} />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
                <span className="ds-label">Active Companies</span>
                <Building2 size={18} />
              </div>
              <div className="ds-display-small">{summary.totalCompanies}</div>
            </div>
            
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
                <span className="ds-label">Total Drivers</span>
                <Users size={18} />
              </div>
              <div className="ds-display-small">{summary.totalDrivers}</div>
            </div>

            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
                <span className="ds-label">Active Sessions</span>
                <Activity size={18} />
              </div>
              <div className="ds-display-small">{summary.totalSessions}</div>
            </div>

            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
                <span className="ds-label">Critical Alerts</span>
                <Bell size={18} color="var(--color-error)" />
              </div>
              <div className="ds-display-small">{summary.totalAlerts}</div>
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            
            {/* Recent Companies */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 className="ds-heading-3" style={{ margin: '0 0 1.5rem 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>Registered Companies</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(companies.length ? companies.slice(0, 5) : []).map((company, idx) => (
                  <div key={`${company.company_id || idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--color-surface-elevated)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                        {company.company_name ? company.company_name.charAt(0).toUpperCase() : "C"}
                      </div>
                      <div>
                        <div className="ds-label" style={{ fontWeight: 600 }}>{company.company_name || "Unknown Company"}</div>
                        <div className="ds-caption" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-text-muted)' }}>
                          <MapPin size={12} /> {company.city || "No location"}
                        </div>
                      </div>
                    </div>
                    <div>
                      {company.subscription_status === "active" ? <StatusPill status="Active" /> : <StatusPill status="Suspended" />}
                    </div>
                  </div>
                ))}
                {!companies.length && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No companies registered yet.</div>
                )}
              </div>
            </div>

            {/* System Health */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 className="ds-heading-3" style={{ margin: '0 0 1.5rem 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>AI Model Performance</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Attention Score */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="ds-label">Average Fleet Attention</span>
                    <span className="ds-label" style={{ fontWeight: 700 }}>{(summary.avgAttention * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--color-surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, Math.max(0, summary.avgAttention * 100))}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '4px' }}></div>
                  </div>
                </div>

                {/* Confidence Score */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="ds-label">Inference Confidence</span>
                    <span className="ds-label" style={{ fontWeight: 700 }}>{(summary.avgConfidence * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--color-surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, Math.max(0, summary.avgConfidence * 100))}%`, height: '100%', background: 'var(--color-success)', borderRadius: '4px' }}></div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-surface-elevated)', borderRadius: '8px', borderLeft: '3px solid var(--color-info)' }}>
                  <p className="ds-caption" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                    System quality indicators represent the real-time average metrics reported from edge devices across the fleet network. High confidence indicates optimal camera placement and model performance.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboardPage;
