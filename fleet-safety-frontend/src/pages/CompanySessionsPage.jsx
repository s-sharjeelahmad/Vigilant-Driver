import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../components/SectionHeader";
import CompanySubnav from "../components/CompanySubnav";
import { companyApi } from "../lib/apiClient";
import { clearCompanySession } from "../lib/companySession";
import { formatDateTimeUS, formatDisplayValue } from "../lib/dateFormatter";

function CompanySessionsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState("all");
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState("");

  const loadSessions = async (targetView) => {
    setLoading(true);
    setError("");
    setEvents([]);
    setSelectedSessionId("");
    try {
      let data = [];
      if (targetView === "recent") {
        data = await companyApi.getRecentSessions();
      } else if (targetView === "active") {
        data = await companyApi.getActiveSessions();
      } else {
        data = await companyApi.getSessions();
      }
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      if ((err.message || "").toLowerCase().includes("no")) {
        setSessions([]);
      } else {
        setError(err.message || "Unable to load sessions.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions(view);
  }, [view]);

  const viewEvents = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setLoadingEvents(true);
    setError("");
    try {
      const data = await companyApi.getSessionEvents(sessionId, Number(limit) || 100);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      if ((err.message || "").toLowerCase().includes("not found")) {
        setEvents([]);
      } else {
        setError(err.message || "Unable to load session events.");
      }
    } finally {
      setLoadingEvents(false);
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
          <SectionHeader eyebrow="Company Sessions" title="Session Monitoring" text="Inspect all, recent, or active sessions and view events by session." />
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>Logout</button>
        </div>

        <CompanySubnav />

        <article className="card">
          <div className="tab-row">
            <button type="button" className={`btn ${view === "all" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("all")}>All Sessions</button>
            <button type="button" className={`btn ${view === "recent" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("recent")}>Recent Sessions</button>
            <button type="button" className={`btn ${view === "active" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("active")}>Active Sessions</button>
          </div>

          {loading ? <p className="state loading">Loading sessions...</p> : null}
          {error ? <p className="state error">{error}</p> : null}

          {!loading && !error ? (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Attention Score</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length ? sessions.map((session) => (
                    <tr key={session.session_id}>
                      <td>{formatDisplayValue(session.driver_name)}</td>
                      <td>{formatDisplayValue(session.session_status)}</td>
                      <td>{formatDateTimeUS(session.start_time)}</td>
                      <td>{formatDateTimeUS(session.end_time)}</td>
                      <td>{formatDisplayValue(session.attention_score)}</td>
                      <td>
                        <button type="button" className="btn btn-primary" onClick={() => viewEvents(session.session_id)}>
                          View Events
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6">No data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>

        <article className="card">
          <h3>Session Events</h3>
          <form className="admin-inline-form" onSubmit={(e) => { e.preventDefault(); if (selectedSessionId) { viewEvents(selectedSessionId); } }}>
            <label>
              Event Limit
              <input type="number" min="1" max="500" value={limit} onChange={(e) => setLimit(e.target.value)} />
            </label>
            <button type="submit" className="btn btn-primary" disabled={!selectedSessionId}>Reload Events</button>
          </form>

          {loadingEvents ? <p className="state loading">Loading events...</p> : null}
          {!loadingEvents && !selectedSessionId ? <p className="state neutral">Select a session to view events.</p> : null}

          {selectedSessionId ? (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Timestamp</th>
                    <th>State</th>
                    <th>Severity</th>
                    <th>Confidence</th>
                    <th>Alert Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length ? events.map((event) => (
                    <tr key={event.event_id}>
                      <td>{formatDisplayValue(event.driver_name)}</td>
                      <td>{formatDateTimeUS(event.timestamp)}</td>
                      <td>{formatDisplayValue(event.state)}</td>
                      <td>{formatDisplayValue(event.severity)}</td>
                      <td>{formatDisplayValue(event.confidence)}</td>
                      <td>{event.alert_generated ? "Yes" : "No"}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6">No data available</td></tr>
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

export default CompanySessionsPage;
