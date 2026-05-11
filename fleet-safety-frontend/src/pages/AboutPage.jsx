import React from 'react';
import { Shield, Activity, Radar, Github, Linkedin, Cpu, Code, Database, UserCheck } from "lucide-react";

function AboutPage() {
  const teamMembers = [
    {
      id: 1,
      name: "Syed Areeb Ashraf",
      role: "Backend Lead & AI Integration",
      icon: <Database size={20} />,
      description: "Architected the resilient backend infrastructure and high-throughput AI pipelines for sub-100ms processing.",
      github: "http://github.com/S-Areeb-Ashraf",
      linkedin: "https://www.linkedin.com/in/syed-areebashraf"
    },
    {
      id: 2,
      name: "Abrar Malik",
      role: "AI/ML Optimization Engineer",
      icon: <Cpu size={20} />,
      description: "Specialized in temporal Bi-LSTM model training and hyperparameter tuning for maximum behavior accuracy.",
      github: "https://github.com/AbrarMalik4429",
      linkedin: "#"
    },
    {
      id: 3,
      name: "Sharjeel Ahmed",
      role: "App Architect & Data lead",
      icon: <Code size={20} />,
      description: "Engineered the React Native frontend and led the data augmentation strategy to bridge training-serving skew.",
      github: "https://github.com/s-sharjeelahmad",
      linkedin: "#"
    }
  ];

  const stats = [
    { label: "Telemetry Uptime", value: "24/7" },
    { label: "Processing Latency", value: "<100ms" },
    { label: "Safety Accuracy", value: "98.8%" },
    { label: "Edge-Ready", value: "100%" }
  ];

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '160px 2rem 100px' }}>
        
        {/* ─── HERO SECTION ─── */}
        <section style={{ marginBottom: '120px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '80px', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--color-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px', marginBottom: '16px' }}>
                Engineering Safety
              </div>
              <h1 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, marginBottom: '24px', lineHeight: 1.1, letterSpacing: '-0.04em' }}>
                Bridging the Gap Between <span style={{ color: 'var(--color-primary)' }}>Vision & Vigilance.</span>
              </h1>
              <p style={{ fontSize: '18px', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '40px' }}>
                Vigilant Driver is more than a project; it's a technical response to a global safety crisis. We leverage Edge-AI to turn standard devices into proactive safety monitors.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <FeatureItem icon={<Shield size={18} />} text="Safety-First Edge Inference" />
                <FeatureItem icon={<Activity size={18} />} text="Real-time Driver Biometrics" />
                <FeatureItem icon={<Radar size={18} />} text="Fleet-Wide Risk Telemetry" />
              </div>
            </div>
            
            {/* Visual Technical Badge */}
            <div style={{ 
              background: 'var(--color-surface)', border: '1px solid var(--color-border)', 
              padding: '40px', borderRadius: '32px', textAlign: 'center',
              boxShadow: 'var(--shadow-high)'
            }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--color-primary-soft)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={40} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>FAST-NUCES Karachi</h3>
              <p style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Computer Science Batch 2022-2026</p>
            </div>
          </div>
        </section>

        {/* ─── DYNAMIC STATS ─── */}
        <section style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '20px', marginBottom: '120px' 
        }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ 
              padding: '32px', borderRadius: '24px', background: 'var(--color-surface)', 
              border: '1px solid var(--color-border)', textAlign: 'center'
            }}>
              <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--color-primary)', display: 'block' }}>{stat.value}</span>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--color-text-muted)', letterSpacing: '1px', marginTop: '8px', display: 'block' }}>{stat.label}</span>
            </div>
          ))}
        </section>

        {/* ─── TEAM SECTION ─── */}
        <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.02em' }}>The Architects</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '18px' }}>Meet the team behind the Vigilant Engine.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {teamMembers.map((member) => (
              <div key={member.id} style={{ 
                padding: '40px', borderRadius: '28px', background: 'var(--color-surface)', 
                border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column',
                transition: 'transform 0.3s ease, border-color 0.3s ease'
              }} className="team-card-hover">
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '12px', 
                  background: 'var(--color-bg)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
                  border: '1px solid var(--color-border)', color: 'var(--color-primary)'
                }}>
                  {member.icon}
                </div>
                
                <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '4px' }}>{member.name}</h3>
                <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px' }}>{member.role}</p>
                
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '32px', flexGrow: 1, fontSize: '15px' }}>
                  {member.description}
                </p>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <SocialLink href={member.github} icon={<Github size={18} />} />
                  <SocialLink href={member.linkedin} icon={<Linkedin size={18} />} />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

const FeatureItem = ({ icon, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ width: '36px', height: '36px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
      {icon}
    </div>
    <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-text-primary)' }}>{text}</span>
  </div>
);

const SocialLink = ({ href, icon }) => (
  <a href={href} target="_blank" rel="noreferrer" style={{ 
    width: '40px', height: '40px', background: 'var(--color-bg)', 
    border: '1px solid var(--color-border)', borderRadius: '10px', 
    color: 'var(--color-text-primary)', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
  }}>
    {icon}
  </a>
);

export default AboutPage;