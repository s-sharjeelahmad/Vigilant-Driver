import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import CompanySubnav from "../components/CompanySubnav";
import { companyApi } from "../lib/apiClient";
import { clearCompanySession } from "../lib/companySession";
import { formatDateTimeUS, formatDisplayValue } from "../lib/dateFormatter";

function toIsoFromDateTimeLocal(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function CompanyAlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [status, setStatus] = useState("unread");
  const [since, setSince] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setSuccess("");
    try {
      await companyApi.ackAlert(alertId);
      setSuccess("Alert acknowledged successfully.");
      await loadAlerts();
    } catch (err) {
      setError(err.message || "Unable to acknowledge alert.");
    }
  };

  const handleLogout = () => {
    clearCompanySession();
    navigate("/login", { replace: true });
  };

  return (
    <section className="section">
      <div className="container container-wide company-page-wrap">
        <div className="company-head">
          <SectionHeader eyebrow="Company Alerts" title="Alert Monitoring" text="Review and acknowledge safety alerts for your company." />
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>Logout</button>
        </div>

        <CompanySubnav />

        <article className="card">
          <form className="admin-inline-form" onSubmit={handleFilterSubmit}>
            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="unread">Unread</option>
                <option value="all">All</option>
              </select>
            </label>
            <label>
              Since
              <input type="datetime-local" value={since} onChange={(e) => setSince(e.target.value)} />
            </label>
            <button type="submit" className="btn btn-primary">Apply</button>
          </form>

          {loading ? <p className="state loading">Loading alerts...</p> : null}
          {error ? <p className="state error">{error}</p> : null}
          {success ? <p className="state success">{success}</p> : null}

          {!loading && !error ? (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>State</th>
                    <th>Type</th>
                    <th>Message</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.length ? alerts.map((alert) => (
                    <tr key={alert.alert_id}>
                      <td>{formatDisplayValue(alert.driver_name)}</td>
                      <td>{formatDisplayValue(alert.event_state)}</td>
                      <td>{formatDisplayValue(alert.alert_type)}</td>
                      <td>{formatDisplayValue(alert.alert_message)}</td>
                      <td>{formatDateTimeUS(alert.created_at)}</td>
                      <td>{alert.acknowledged ? "Acknowledged" : "Unread"}</td>
                      <td>
                        {!alert.acknowledged ? (
                          <button type="button" className="btn btn-primary" onClick={() => acknowledgeAlert(alert.alert_id)}>
                            Acknowledge
                          </button>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7">No data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}

export default CompanyAlertsPage;
