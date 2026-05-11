import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Activity, BellRing, Target, AlertTriangle, ShieldAlert } from "lucide-react";
import ErrorBanner from "../components/ErrorBanner";
import { DashboardSkeleton } from "../components/Skeletons";
import { companyApi } from "../lib/apiClient";
import { formatDateTimeUS, formatDisplayValue } from "../lib/dateFormatter";

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

function CompanyDashboardPage() {
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
        setError(err.message || "Unable to load fleet metrics. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const data = dashboard || {};
    const riskScore = toNumber(data.avg_risk_score || data.risk_score, 0);
    
    // Determine risk level semantics
    let riskLevel = "safe";
    let riskColor = "var(--color-success)";
    if (riskScore > 0.3) { riskLevel = "warning"; riskColor = "var(--color-warning)"; }
    if (riskScore > 0.6) { riskLevel = "critical"; riskColor = "var(--color-error)"; }

    return {
      totalDrivers: toNumber(data.total_drivers, 0),
      activeDrivers: toNumber(data.active_drivers, 0),
      totalSessions: toNumber(data.total_sessions, 0),
      activeSessions: toNumber(data.active_sessions, 0),
      totalEvents: toNumber(data.total_events, 0),
      drowsyEvents: toNumber(data.drowsy_events, 0),
      distractedEvents: toNumber(data.distracted_events, 0),
      totalAlerts: toNumber(data.total_alerts, 0),
      averageAttentionScore: toNumber(data.avg_attention_score || data.average_attention_score, 0),
      averageConfidence: toNumber(data.avg_confidence_score || data.average_confidence, 0),
      riskScore,
      riskLevel,
      riskColor,
      highRiskDrivers: toNumber(data.high_risk_drivers, 0),
      lastUpdated: data.last_updated || new Date().toISOString()
    };
  }, [dashboard]);

  if (loading) return <DashboardSkeleton />;

  // Calculate percentages for visual bars
  const totalSpecificEvents = summary.drowsyEvents + summary.distractedEvents;
  const drowsyPct = totalSpecificEvents > 0 ? (summary.drowsyEvents / totalSpecificEvents) * 100 : 0;
  const distractedPct = totalSpecificEvents > 0 ? (summary.distractedEvents / totalSpecificEvents) * 100 : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="ds-heading-1" style={{ margin: 0, color: 'var(--color-text-primary)' }}>Fleet Dashboard</h1>
          <p className="ds-body" style={{ margin: '0.25rem 0 0 0' }}>Overview of fleet operations and safety indicators.</p>
        </div>
        <div className="ds-caption">
          Last updated: {formatDateTimeUS(summary.lastUpdated)}
        </div>
      </div>

      <ErrorBanner message={error} />

      {!error && (
        <>
          {/* Primary KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', borderRadius: '8px' }}><Users size={20} /></div>
                <h3 className="ds-heading-3" style={{ margin: 0 }}>Fleet Drivers</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span className="metric-large">{formatDisplayValue(summary.activeDrivers)}</span>
                <span className="ds-body">/ {formatDisplayValue(summary.totalDrivers)} active</span>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(36, 161, 72, 0.1)', color: 'var(--color-success)', borderRadius: '8px' }}><Activity size={20} /></div>
                <h3 className="ds-heading-3" style={{ margin: 0 }}>Total Sessions</h3>
              </div>
              <span className="metric-large">{formatDisplayValue(summary.totalSessions)}</span>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(218, 30, 40, 0.1)', color: 'var(--color-error)', borderRadius: '8px' }}><BellRing size={20} /></div>
                <h3 className="ds-heading-3" style={{ margin: 0 }}>Critical Alerts</h3>
              </div>
              <span className="metric-large">{formatDisplayValue(summary.totalAlerts)}</span>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(0, 114, 195, 0.1)', color: 'var(--color-info)', borderRadius: '8px' }}><Target size={20} /></div>
                <h3 className="ds-heading-3" style={{ margin: 0 }}>Avg Attention</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span className="metric-large">{summary.averageAttentionScore ? summary.averageAttentionScore.toFixed(2) : "0.00"}</span>
                <span className="ds-body">score</span>
              </div>
            </div>
          </div>

          {/* Risk Prominence Banner */}
          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: `6px solid ${summary.riskColor}`, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <div className="ds-label" style={{ marginBottom: '0.5rem' }}>Overall Fleet Risk Profile</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="ds-display-medium" style={{ color: summary.riskColor }}>
                    {summary.riskScore ? summary.riskScore.toFixed(2) : "0.00"}
                  </span>
                  <div style={{ padding: '0.5rem 1rem', background: `rgba(${summary.riskLevel === 'critical' ? '218,30,40' : summary.riskLevel === 'warning' ? '241,194,27' : '36,161,72'}, 0.1)`, color: summary.riskColor, borderRadius: '999px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {summary.riskLevel}
                  </div>
                </div>
              </div>
              
              <div style={{ flex: 1, minWidth: '300px', maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="ds-body-small">Risk Gauge</span>
                  <span className="ds-body-small" style={{ fontWeight: 600 }}>{Math.round(summary.riskScore * 100)}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--color-divider)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(summary.riskScore * 100, 100)}%`, height: '100%', background: summary.riskColor, transition: 'width 1s ease-out' }} />
                </div>
                <p className="ds-caption" style={{ marginTop: '0.5rem' }}>
                  {summary.riskLevel === "critical" ? "Immediate action recommended. High volume of severe incidents." : 
                   summary.riskLevel === "warning" ? "Elevated risk detected. Monitor driver behavior closely." : 
                   "Fleet operating within acceptable safety parameters."}
                </p>
              </div>
            </div>
          </div>

          {/* Secondary Analytics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
            
            {/* Event Breakdown */}
            <div className="card">
              <h3 className="ds-heading-3" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} /> Event Breakdown
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="ds-body" style={{ fontWeight: 600 }}>Distracted Driving</span>
                  <span className="ds-body">{summary.distractedEvents} events</span>
                </div>
                <div style={{ height: '12px', background: 'var(--color-divider)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${distractedPct}%`, height: '100%', background: 'var(--color-warning)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="ds-body" style={{ fontWeight: 600 }}>Drowsiness Detected</span>
                  <span className="ds-body">{summary.drowsyEvents} events</span>
                </div>
                <div style={{ height: '12px', background: 'var(--color-divider)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${drowsyPct}%`, height: '100%', background: 'var(--color-error)' }} />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="ds-heading-3" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} /> Safety Management
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Link to="/company/alerts" style={{ padding: '1rem', background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                  <div>
                    <div className="ds-body" style={{ fontWeight: 600 }}>Review Unresolved Alerts</div>
                    <div className="ds-caption">Acknowledge critical safety events</div>
                  </div>
                  <div style={{ background: 'var(--color-error)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600 }}>
                    {summary.totalAlerts}
                  </div>
                </Link>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div>
                    <div className="ds-label">High Risk Drivers</div>
                    <div className="metric-small">{summary.highRiskDrivers}</div>
                  </div>
                  <div>
                    <div className="ds-label">Avg AI Confidence</div>
                    <div className="metric-small">{summary.averageConfidence ? (summary.averageConfidence * 100).toFixed(1) : 0}%</div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </>
      )}
    </div>
  );
}

export default CompanyDashboardPage;
