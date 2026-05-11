import { useEffect, useState } from "react";
import { Filter, CheckCircle2 } from "lucide-react";
import ErrorBanner from "../components/ErrorBanner";
import StatusPill from "../components/StatusPill";
import { TableSkeleton } from "../components/Skeletons";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/ToastContext";
import { companyApi } from "../lib/apiClient";
import { formatDateTimeUS, formatDisplayValue } from "../lib/dateFormatter";

function toIsoFromDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function CompanyAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [status, setStatus] = useState("unread");
  const [since, setSince] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const loadAlerts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await companyApi.getAlerts({ status, since: toIsoFromDateTimeLocal(since) || undefined });
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [status]);

  const handleFilterSubmit = async (event) => {
    event.preventDefault();
    await loadAlerts();
  };

  const acknowledgeAlert = async (alertId) => {
    setError("");
    try {
      await companyApi.ackAlert(alertId);
      showToast("Alert acknowledged successfully.", "success");
      await loadAlerts();
    } catch (err) {
      setError(err.message || "Unable to acknowledge alert.");
      showToast("Unable to acknowledge alert.", "error");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="ds-heading-1" style={{ margin: 0, color: 'var(--color-text-primary)' }}>Alert Monitoring</h1>
          <p className="ds-body" style={{ margin: '0.25rem 0 0 0' }}>Review and acknowledge safety alerts for your fleet.</p>
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              Alert Status
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '180px', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none' }}
              >
                <option value="unread">Action Required (Unread)</option>
                <option value="all">All Alerts</option>
              </select>
            </label>
            <label className="ds-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              Timeframe (Since)
              <input 
                type="datetime-local" 
                value={since} 
                onChange={(e) => setSince(e.target.value)} 
                style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none' }}
              />
            </label>
            <button 
              type="submit" 
              style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', height: '40px' }}
            >
              <Filter size={16} /> Apply Filters
            </button>
          </form>
        </div>

        {loading ? <TableSkeleton /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Event State</th>
                  <th>Alert Type</th>
                  <th>Message</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.length ? alerts.map((alert) => (
                  <tr key={alert.alert_id}>
                    <td style={{ fontWeight: 600 }}>{formatDisplayValue(alert.driver_name)}</td>
                    <td><StatusPill status={alert.event_state} /></td>
                    <td><StatusPill status={alert.alert_type} /></td>
                    <td><span className="ds-body-small">{formatDisplayValue(alert.alert_message)}</span></td>
                    <td className="ds-body-small">{formatDateTimeUS(alert.created_at)}</td>
                    <td>
                      {alert.acknowledged ? <StatusPill status="Acknowledged" /> : <StatusPill status="Unread" />}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!alert.acknowledged ? (
                        <button 
                          type="button" 
                          onClick={() => acknowledgeAlert(alert.alert_id)}
                          style={{
                            background: 'transparent',
                            color: 'var(--color-primary)',
                            border: `1px solid var(--color-primary)`,
                            padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => { e.target.style.background = 'var(--color-primary)'; e.target.style.color = 'white'; }}
                          onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--color-primary)'; }}
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <span className="ds-caption" style={{ color: 'var(--color-text-muted)' }}>Resolved</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{ padding: 0 }}>
                      <EmptyState 
                        icon={CheckCircle2} 
                        title="No alerts found" 
                        description="All clear! You're caught up on fleet safety events." 
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompanyAlertsPage;
