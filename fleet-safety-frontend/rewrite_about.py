import re

new_content = """import React from 'react';
import { Shield, Activity, Radar, CheckCircle2 } from "lucide-react";

function AboutPage() {
  const teamMembers = [
    {
      id: 1,
      name: "Syed Areeb Ashraf",
      role: "Backend Development & AI Integration",
      description: "Leads backend architecture and integrates AI systems for real-time driver monitoring capabilities."
    },
    {
      id: 2,
      name: "Abrar Malik",
      role: "AI/ML Model Training & Optimization",
      description: "Specializes in training and optimizing machine learning models for accurate driver behavior prediction."
    },
    {
      id: 3,
      name: "Sharjeel Ahmed",
      role: "App Developer & Data Augmentation",
      description: "Develops responsive frontend applications and handles data preparation for model training."
    }
  ];

  const stats = [
    { label: "Live Driver Signals", value: "24/7" },
    { label: "Early-Warning Alerts", value: "Real-time" },
    { label: "Risk Coverage", value: "Fleet-wide" },
    { label: "Insight Windows", value: "Daily" }
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
      
      {/* Hero Section */}
      <section style={{ marginBottom: '6rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '1rem', display: 'block' }}>
              About Vigilant Driver
            </span>
            <h1 className="ds-display-medium" style={{ marginBottom: '1.5rem', lineHeight: 1.1, textWrap: 'balance' }}>
              A Practical Safety Platform for Real Roads
            </h1>
            <p className="ds-body" style={{ fontSize: '1.125rem', marginBottom: '2.5rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              We built this platform to reduce preventable incidents by helping organizations act earlier on driver fatigue and distraction signals.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { text: "Safety-first monitoring", icon: <Shield size={20} /> },
                { text: "Real-time driver insights", icon: <Activity size={20} /> },
                { text: "Fleet-wide visibility", icon: <Radar size={20} /> }
              ].map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--color-surface-elevated)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    {item.icon}
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Featured Illustration */}
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-low)' }}>
            <div style={{ width: '100%', maxWidth: '400px', aspectRatio: '1/1', background: '#000', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '1.5rem', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.4), transparent, transparent)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                <div style={{ width: '6px', height: '6px', background: '#60a5fa', borderRadius: '50%', boxShadow: '0 0 15px rgba(96,165,250,0.8)' }} />
                <div style={{ marginTop: '1rem', display: 'flex', gap: '4px', alignItems: 'flex-end', height: '32px' }}>
                  <div style={{ width: '2px', background: 'rgba(59, 130, 246, 0.4)', height: '8px' }} />
                  <div style={{ width: '2px', background: 'rgba(59, 130, 246, 0.6)', height: '16px' }} />
                  <div style={{ width: '2px', background: 'rgba(59, 130, 246, 1)', height: '24px' }} />
                  <div style={{ width: '2px', background: '#60a5fa', height: '32px' }} />
                  <div style={{ width: '2px', background: 'rgba(59, 130, 246, 1)', height: '24px' }} />
                  <div style={{ width: '2px', background: 'rgba(59, 130, 246, 0.6)', height: '16px' }} />
                  <div style={{ width: '2px', background: 'rgba(59, 130, 246, 0.4)', height: '8px' }} />
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
              Real-time monitoring, actionable insights, and safer journeys.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '6rem' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--color-border)' }}>
            <span className="metric-large tabular-nums" style={{ display: 'block', color: 'var(--color-text-primary)' }}>{stat.value}</span>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '0.5rem', display: 'block' }}>{stat.label}</span>
          </div>
        ))}
      </section>

      {/* Philosophy Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', marginBottom: '6rem', paddingTop: '3rem', borderTop: '1px solid var(--color-border)' }}>
        <article>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--color-primary)', borderRadius: '50%' }} />
            Mission
          </h3>
          <p className="ds-body" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
            Make every commercial journey safer through data-backed visibility, proactive alerts, and measurable safety outcomes.
          </p>
        </article>
        <article>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--color-info)', borderRadius: '50%' }} />
            Problem We Solve
          </h3>
          <p className="ds-body" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
            Traditional monitoring reacts too late. This platform creates a continuous safety layer where early warning signals surface before risk escalates.
          </p>
        </article>
        <article>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--color-success)', borderRadius: '50%' }} />
            What Makes It Practical
          </h3>
          <p className="ds-body" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
            Fast onboarding, focused dashboards, and alerts that show exactly when teams should intervene.
          </p>
        </article>
      </section>

      {/* Team Section */}
      <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 className="ds-display-medium">Our Development Team</h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {teamMembers.map((member) => (
            <div key={member.id} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--color-border)', background: 'var(--color-surface-elevated)' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>{member.name}</h3>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{member.role}</p>
              </div>
              <p className="ds-body" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {member.description}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default AboutPage;
"""

with open('src/pages/AboutPage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("AboutPage.jsx rewritten without Tailwind")
