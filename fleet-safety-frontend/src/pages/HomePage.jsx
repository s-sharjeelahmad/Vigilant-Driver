import { Link } from "react-router-dom";
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
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Fleet Safety Intelligence</span>
            <h1>Turn Every Drive Into a Safer Decision</h1>
            <p>
              Vigilant Driver Monitoring and Safety Assurance System helps transport companies monitor driver safety in real time,
              detect fatigue signals, and take preventive action through trusted risk analytics.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/login">Login</Link>
              <Link className="btn btn-ghost" to="/contact">Contact Us</Link>
            </div>
          </div>
          <div className="hero-panel card">
            <h3>Live Risk Snapshot</h3>
            <div className="snapshot-grid">
              <div>
                <p>Fleet Risk</p>
                <strong>42.8</strong>
              </div>
              <div>
                <p>Active Sessions</p>
                <strong>26</strong>
              </div>
              <div>
                <p>Critical Alerts</p>
                <strong>3</strong>
              </div>
              <div>
                <p>Status</p>
                <RiskPill level="Medium" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="Platform Capabilities"
            title="Built for Safety Operations"
            text="A focused toolkit for fleet managers, safety teams, and transport operators."
          />
          <div className="feature-grid">
            {features.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;
