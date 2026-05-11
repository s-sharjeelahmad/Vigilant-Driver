import { useEffect, useState } from "react";
import { Activity, Clock, PlayCircle } from "lucide-react";
import ErrorBanner from "../components/ErrorBanner";
import StatusPill from "../components/StatusPill";
import { TableSkeleton } from "../components/Skeletons";
import EmptyState from "../components/EmptyState";
import { companyApi } from "../lib/apiClient";
import { formatDateTimeUS, formatDisplayValue } from "../lib/dateFormatter";

function CompanySessionsPage() {
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="ds-heading-1" style={{ margin: 0, color: 'var(--color-text-primary)' }}>Session Monitoring</h1>
          <p className="ds-body" style={{ margin: '0.25rem 0 0 0' }}>Inspect all, recent, or active sessions and view events by session.</p>
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <button 
            type="button" 
            onClick={() => setView("all")}
            style={{ 
              background: view === "all" ? 'var(--color-primary-soft)' : 'transparent',
              color: view === "all" ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
            <Activity size={16} /> All Sessions
          </button>
          <button 
            type="button" 
            onClick={() => setView("recent")}
            style={{ 
              background: view === "recent" ? 'var(--color-primary-soft)' : 'transparent',
              color: view === "recent" ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
            <Clock size={16} /> Recent Sessions
          </button>
          <button 
            type="button" 
            onClick={() => setView("active")}
            style={{ 
              background: view === "active" ? 'var(--color-primary-soft)' : 'transparent',
              color: view === "active" ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
            <PlayCircle size={16} /> Active Sessions
          </button>
        </div>

        {loading ? <TableSkeleton /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Attention Score</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length ? sessions.map((session) => (
                  <tr key={session.session_id}>
                    <td style={{ fontWeight: 600 }}>{formatDisplayValue(session.driver_name)}</td>
                    <td><StatusPill status={session.session_status} /></td>
                    <td className="ds-body-small">{formatDateTimeUS(session.start_time)}</td>
                    <td className="ds-body-small">{formatDateTimeUS(session.end_time)}</td>
                    <td><span className="ds-label">{formatDisplayValue(session.attention_score)}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        type="button" 
                        onClick={() => viewEvents(session.session_id)}
                        style={{
                          background: selectedSessionId === session.session_id ? 'var(--color-primary)' : 'transparent',
                          color: selectedSessionId === session.session_id ? 'white' : 'var(--color-primary)',
                          border: `1px solid var(--color-primary)`,
                          padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {selectedSessionId === session.session_id ? "Viewing Events" : "View Events"}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{ padding: 0 }}>
                      <EmptyState title="No sessions found" description="There are no sessions matching the current filter." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedSessionId && (
        <div className="card" style={{ padding: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h3 className="ds-heading-3" style={{ margin: 0 }}>Session Events Timeline</h3>
            <form onSubmit={(e) => { e.preventDefault(); if (selectedSessionId) viewEvents(selectedSessionId); }} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label className="ds-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Event Limit
                <input 
                  type="number" min="1" max="500" value={limit} onChange={(e) => setLimit(e.target.value)} 
                  style={{ width: '80px', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                />
              </label>
              <button type="submit" style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                Reload
              </button>
            </form>
          </div>

          {loadingEvents ? <TableSkeleton /> : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Driver</th>
                    <th>State</th>
                    <th>Severity</th>
                    <th>Confidence</th>
                    <th>Alert Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length ? events.map((event) => {
                    const isSevere = event.severity && event.severity.toLowerCase() === 'critical';
                    return (
                      <tr key={event.event_id} style={{ borderLeft: isSevere ? '3px solid var(--color-error)' : 'none' }}>
                        <td className="ds-body-small">{formatDateTimeUS(event.timestamp)}</td>
                        <td>{formatDisplayValue(event.driver_name)}</td>
                        <td><StatusPill status={event.state} /></td>
                        <td><StatusPill status={event.severity} /></td>
                        <td><span className="ds-label">{formatDisplayValue(event.confidence)}</span></td>
                        <td>{event.alert_generated ? <StatusPill status="Yes" /> : <span className="ds-caption">No</span>}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="6" style={{ padding: 0 }}>
                        <EmptyState title="No events recorded" description="No safety events were recorded during this session." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CompanySessionsPage;
