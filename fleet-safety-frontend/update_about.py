import re

with open('src/pages/AboutPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_content = """import { Github, Linkedin, Shield, Activity, Radar } from "lucide-react";

function AboutPage() {
  const teamMembers = [
    {
      id: 1,
      name: "Syed Areeb Ashraf",
      role: "Backend Development & AI Integration",
      description: "Leads backend architecture and integrates AI systems for real-time driver monitoring capabilities.",
      github: "http://github.com/S-Areeb-Ashraf",
      linkedin: "https://www.linkedin.com/in/syed-areebashraf"
    },
    {
      id: 2,
      name: "Abrar Malik",
      role: "AI/ML Model Training & Model Optimization",
      description: "Specializes in training and optimizing machine learning models for accurate driver behavior prediction.",
      github: "https://github.com/AbrarMalik4429",
      linkedin: "https://www.linkedin.com/in/your-profile"
    },
    {
      id: 3,
      name: "Sharjeel Ahmed",
      role: "App Developer & Data Augmentation",
      description: "Develops responsive frontend applications and handles data preparation for model training.",
      github: "https://github.com/s-sharjeelahmad",
      linkedin: "https://www.linkedin.com/in/your-profile"
    }
  ];

  const stats = [
    { label: "Live Driver Signals", value: "24/7" },
    { label: "Early-Warning Alerts", value: "Real-time" },
    { label: "Risk Coverage", value: "Fleet-wide" },
    { label: "Insight Windows", value: "Daily" }
  ];

  return (
    <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Hero Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '4rem' }}>
        <div>
          <span className="ds-label" style={{ color: 'var(--color-primary)' }}>About Vigilant Driver</span>
          <h1 className="ds-display-medium" style={{ margin: '1rem 0', color: 'var(--color-text-primary)' }}>A Practical Safety Platform for Real Roads</h1>
          <p className="ds-body" style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem', lineHeight: 1.7, marginBottom: '2rem' }}>
            We built this platform to reduce preventable incidents by helping organizations act earlier on driver fatigue and distraction signals.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-primary)' }}>
              <Shield size={20} color="var(--color-primary)" />
              <span className="ds-body" style={{ fontWeight: 600 }}>Safety-first monitoring</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-primary)' }}>
              <Activity size={20} color="var(--color-primary)" />
              <span className="ds-body" style={{ fontWeight: 600 }}>Real-time driver insights</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-primary)' }}>
              <Radar size={20} color="var(--color-primary)" />
              <span className="ds-body" style={{ fontWeight: 600 }}>Fleet-wide visibility</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-elevated)' }}>
          <img src="/driver-safety.svg" alt="Driver safety monitoring illustration" style={{ width: '100%', maxWidth: '400px', marginBottom: '2rem' }} />
          <p className="ds-caption" style={{ textAlign: 'center' }}>Real-time monitoring, actionable insights, and safer journeys.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <span className="metric-large">{stat.value}</span>
            <p className="ds-label" style={{ marginTop: '0.5rem' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Philosophy Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
        <article className="card" style={{ padding: '2rem' }}>
          <h3 className="ds-heading-3" style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Mission</h3>
          <p className="ds-body" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Make every commercial journey safer through data-backed visibility, proactive alerts, and measurable safety outcomes.
          </p>
        </article>
        <article className="card" style={{ padding: '2rem' }}>
          <h3 className="ds-heading-3" style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Problem We Solve</h3>
          <p className="ds-body" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Traditional monitoring reacts too late. This platform creates a continuous safety layer where early warning signals surface before risk escalates.
          </p>
        </article>
        <article className="card" style={{ padding: '2rem' }}>
          <h3 className="ds-heading-3" style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>What Makes It Practical</h3>
          <p className="ds-body" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Fast onboarding, focused dashboards, and alerts that show exactly when teams should intervene.
          </p>
        </article>
      </div>

      {/* Team Section */}
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '4rem' }}>
        <h2 className="ds-heading-1" style={{ textAlign: 'center', marginBottom: '3rem' }}>Our Development Team</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {teamMembers.map((member) => (
            <div key={member.id} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              <h3 className="ds-heading-2" style={{ margin: '0 0 0.5rem 0' }}>{member.name}</h3>
              <p className="ds-label" style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>{member.role}</p>
              <p className="ds-body" style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', flex: 1, lineHeight: 1.6 }}>{member.description}</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <a href={member.github} target="_blank" rel="noreferrer" className="btn-icon" style={{ background: 'var(--color-surface-elevated)' }}>
                  <Github size={18} />
                </a>
                <a href={member.linkedin} target="_blank" rel="noreferrer" className="btn-icon" style={{ background: 'var(--color-surface-elevated)' }}>
                  <Linkedin size={18} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AboutPage;
"""

with open('src/pages/AboutPage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('AboutPage.jsx Updated')
