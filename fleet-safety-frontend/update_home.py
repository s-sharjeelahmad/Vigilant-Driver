import re

with open('src/pages/HomePage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_content = """import { Link } from "react-router-dom";
import { AlarmSmoke, BrainCircuit, Gauge, ShieldAlert } from "lucide-react";
import SectionHeader from "../components/SectionHeader";
import FeatureCard from "../components/FeatureCard";
import RiskPill from "../components/RiskPill";

const features = [
  {
    icon: BrainCircuit,
    title: "Drowsiness Detection",
    description: "Continuous face-state monitoring to detect fatigue patterns before they become dangerous."
  },
  {
    icon: AlarmSmoke,
    title: "Distraction Alerts",
    description: "Instant safety alerts to driver app and company dashboard during risky behavior."
  },
  {
    icon: Gauge,
    title: "Risk Score Engine",
    description: "Deterministic safety scoring to prioritize intervention and improve accountability."
  },
  {
    icon: ShieldAlert,
    title: "Analytics Dashboard",
    description: "Clear, period-based metrics for sessions, events, alerts, and overall fleet health."
  }
];

function HomePage() {
  return (
    <>
      <section style={{ padding: '6rem 2rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div>
            <span className="ds-label" style={{ color: 'var(--color-primary)' }}>Fleet Safety Intelligence</span>
            <h1 className="ds-display-medium" style={{ margin: '1rem 0', color: 'var(--color-text-primary)' }}>Turn Every Drive Into a Safer Decision</h1>
            <p className="ds-body" style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '58ch' }}>
              Vigilant Driver Monitoring and Safety Assurance System helps transport companies monitor driver safety in real time,
              detect fatigue signals, and take preventive action through trusted risk analytics.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link className="btn btn-primary" to="/login" style={{ padding: '0.875rem 1.5rem', textDecoration: 'none', display: 'inline-block' }}>Login to Dashboard</Link>
              <Link className="btn btn-secondary" to="/contact" style={{ padding: '0.875rem 1.5rem', textDecoration: 'none', display: 'inline-block' }}>Contact Sales</Link>
            </div>
          </div>
          <div className="card" style={{ padding: '2rem', boxShadow: 'var(--shadow-high)' }}>
            <h3 className="ds-heading-3" style={{ margin: '0 0 1.5rem 0', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>Live Risk Snapshot</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <p className="ds-caption" style={{ marginBottom: '0.25rem' }}>Fleet Risk</p>
                <strong className="metric-large tabular-nums" style={{ margin: 0 }}>42.8</strong>
              </div>
              <div>
                <p className="ds-caption" style={{ marginBottom: '0.25rem' }}>Active Sessions</p>
                <strong className="metric-large tabular-nums" style={{ margin: 0 }}>26</strong>
              </div>
              <div>
                <p className="ds-caption" style={{ marginBottom: '0.25rem' }}>Critical Alerts</p>
                <strong className="metric-large tabular-nums" style={{ margin: 0, color: 'var(--color-error)' }}>3</strong>
              </div>
              <div>
                <p className="ds-caption" style={{ marginBottom: '0.5rem' }}>Status</p>
                <RiskPill level="Medium" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '4rem 2rem', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem', maxWidth: '600px' }}>
            <span className="ds-label" style={{ color: 'var(--color-primary)' }}>Platform Capabilities</span>
            <h2 className="ds-heading-1" style={{ margin: '0.5rem 0 1rem 0' }}>Built for Safety Operations</h2>
            <p className="ds-body" style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>A focused toolkit for fleet managers, safety teams, and transport operators.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {features.map((item) => (
              <div key={item.title} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={24} />
                </div>
                <div>
                  <h3 className="ds-heading-3" style={{ margin: '0 0 0.5rem 0' }}>{item.title}</h3>
                  <p className="ds-body" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;
"""

with open('src/pages/HomePage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('HomePage.jsx Updated')
