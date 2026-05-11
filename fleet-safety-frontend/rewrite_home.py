import re

new_content = """import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Cpu, BarChart3, ArrowRight, Shield } from 'lucide-react';

function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section style={{ 
        padding: '8rem 2rem 6rem', 
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--color-border)'
      }}>
        {/* Decorative Background */}
        <div style={{
          position: 'absolute',
          top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', height: '100%',
          zIndex: 0, opacity: 0.3,
          pointerEvents: 'none'
        }}>
          <div style={{
            position: 'absolute', top: 0, left: '25%', width: '400px', height: '400px',
            background: 'var(--color-primary)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.4
          }} />
          <div style={{
            position: 'absolute', bottom: 0, right: '25%', width: '400px', height: '400px',
            background: 'var(--color-info)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.3
          }} />
        </div>

        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            <div>
              <div style={{ 
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
                padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', 
                background: 'var(--color-primary-soft)', border: '1px solid var(--color-primary)', 
                color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700, 
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem'
              }}>
                <span style={{ position: 'relative', display: 'flex', width: '8px', height: '8px' }}>
                  <span className="animate-ping" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: 'var(--color-primary)', opacity: 0.75 }} />
                  <span style={{ position: 'relative', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                </span>
                Next-Gen Fleet Intelligence
              </div>
              <h1 className="ds-display-large" style={{ marginBottom: '1.5rem', lineHeight: 1.1, textWrap: 'balance' }}>
                Turn Every Drive Into a <span style={{ 
                  background: 'linear-gradient(to right, var(--color-primary), var(--color-info))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>Safer Decision</span>
              </h1>
              <p className="ds-body" style={{ fontSize: '1.125rem', marginBottom: '2.5rem', maxWidth: '600px', lineHeight: 1.7 }}>
                Vigilant provides edge-AI driver monitoring and real-time safety assurance. Detect fatigue patterns, prevent distractions, and protect your fleet with trusted risk analytics.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link to="/login" className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Login to Dashboard
                  <ArrowRight size={18} />
                </Link>
                <a href="#contact" className="btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
                  Contact Sales
                </a>
              </div>
            </div>

            {/* Mockup Visual */}
            <div className="animate-float" style={{ position: 'relative', marginLeft: 'auto', marginRight: 'auto', width: '100%', maxWidth: '500px' }}>
              <div className="card" style={{ padding: '1.5rem', boxShadow: 'var(--shadow-high)', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>Live Fleet Risk Snapshot</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-error)' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-warning)' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-success)' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Fleet Risk Score</span>
                    <span className="tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>42.8</span>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Active Sessions</span>
                    <span className="tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>26</span>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-error)', display: 'block', marginBottom: '0.25rem' }}>Critical Alerts</span>
                    <span className="tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-error)' }}>03</span>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Status</span>
                    <div style={{ marginTop: '0.25rem' }}>
                      <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)', fontSize: '0.65rem', fontWeight: 800 }}>MEDIUM RISK</span>
                    </div>
                  </div>
                </div>
                
                {/* Mock Chart */}
                <div style={{ height: '8rem', width: '100%', background: 'var(--color-surface-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 1rem', overflow: 'hidden' }}>
                  {[50, 75, 33, 66, 100, 60].map((h, i) => (
                    <div key={i} style={{ width: '15%', height: `${h}%`, background: 'var(--color-primary)', borderTopLeftRadius: '4px', borderTopRightRadius: '4px', opacity: 0.8 }} />
                  ))}
                </div>
              </div>

              {/* Floating badge */}
              <div style={{ position: 'absolute', bottom: '-1.5rem', left: '-1.5rem', background: 'var(--color-success)', color: '#fff', padding: '1rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-high)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-sm)' }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 0.25rem', opacity: 0.9 }}>Safety Up</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>+22%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section style={{ padding: '3rem 2rem', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2rem' }}>Trusted by leading logistics fleets</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem 4rem', opacity: 0.4, filter: 'grayscale(1)' }}>
            {['TRANS-LNK', 'GLOBALWAY', 'ROUTEMASTER', 'FLEETCORE', 'CARGOX'].map(brand => (
              <span key={brand} style={{ fontSize: '1.5rem', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.05em', color: 'var(--color-text-primary)' }}>{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '6rem 2rem', background: 'var(--color-bg)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 4rem' }}>
            <h2 style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Platform Capabilities</h2>
            <h3 className="ds-display-medium" style={{ marginBottom: '1rem' }}>Built for Safety Operations</h3>
            <p className="ds-body" style={{ fontSize: '1.125rem' }}>A high-performance toolkit designed for fleet managers and safety teams to mitigate risks before they escalate.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {[
              { title: "Drowsiness Detection", desc: "Continuous eye and face monitoring to detect fatigue patterns in real-time.", icon: <Activity size={24} />, color: "var(--color-primary)" },
              { title: "Distraction Alerts", desc: "Instant audio-visual alerts to drivers and push notifications to dispatchers.", icon: <Shield size={24} />, color: "var(--color-info)" },
              { title: "Risk Score Engine", desc: "Deterministic safety scoring to prioritize interventions and improve driver accountability.", icon: <Cpu size={24} />, color: "var(--color-warning)" },
              { title: "Analytics Insights", desc: "Clear, period-based metrics for sessions, events, and overall fleet health.", icon: <BarChart3 size={24} />, color: "var(--color-success)" }
            ].map((feat, i) => (
              <div key={i} className="card" style={{ padding: '2rem', transition: 'all 0.2s', border: '1px solid var(--color-border)', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-primary)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                <div style={{ width: '48px', height: '48px', background: `${feat.color}20`, color: feat.color, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  {feat.icon}
                </div>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>{feat.title}</h4>
                <p className="ds-body" style={{ margin: 0 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '6rem 2rem', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h3 className="ds-display-medium">Seamless Integration in 3 Steps</h3>
          </div>
          
          <div style={{ position: 'relative' }}>
            {/* Desktop connecting line */}
            <div style={{ position: 'absolute', top: '24px', left: 0, width: '100%', height: '2px', background: 'var(--color-border)', zIndex: 0 }} className="hidden lg:block" />
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem', position: 'relative', zIndex: 1 }}>
              {[
                { step: 1, title: "Install Hardware", desc: "Easily mount our plug-and-play AI cameras in any fleet vehicle within minutes." },
                { step: 2, title: "Monitor Real-time", desc: "Data is streamed to our cloud engine for instant threat detection and analysis." },
                { step: 3, title: "Take Action", desc: "Receive alerts and use the dashboard to intervene or coach drivers effectively." }
              ].map((item) => (
                <div key={item.step} style={{ background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', background: 'var(--color-primary)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)' }}>
                    {item.step}
                  </div>
                  <h5 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>{item.title}</h5>
                  <p className="ds-body" style={{ maxWidth: '280px' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" style={{ padding: '6rem 2rem', background: '#0f172a', color: '#fff', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '250px', height: '250px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none' }} />
              <div style={{ padding: '2rem', background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(12px)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--color-info)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                  <ShieldCheck size={32} color="#fff" />
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.5rem', color: '#f8fafc' }}>Enterprise-Grade Security</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    "End-to-end encrypted data transmission",
                    "99.9% Uptime SLA for critical safety monitoring",
                    "GDPR & Fleet Privacy Compliant storage"
                  ].map((text, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#cbd5e1' }}>
                      <ShieldCheck size={20} color="var(--color-success)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.875rem' }}>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h2 style={{ color: 'var(--color-info)', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Reliability First</h2>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem', color: '#f8fafc', lineHeight: 1.2 }}>Data protection you can trust.</h3>
              <p style={{ color: '#94a3b8', fontSize: '1.125rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                We understand that fleet safety involves sensitive data. Vigilant is built with a security-first architecture, ensuring that your company and driver information is protected by industry-leading standards.
              </p>
              <a href="#compliance" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-info)', fontWeight: 700, textDecoration: 'none' }}>
                View Compliance Documentation
                <ArrowRight size={16} />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '6rem 2rem', background: 'var(--color-bg)' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <div style={{ 
            background: 'linear-gradient(to bottom right, var(--color-primary), #312e81)', 
            borderRadius: 'var(--radius-xl)', padding: '4rem 2rem', textAlign: 'center', 
            color: '#fff', boxShadow: 'var(--shadow-high)', position: 'relative', overflow: 'hidden' 
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, transform: 'translate(50%, -50%)', width: '250px', height: '250px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(50px)' }} />
            
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>Ready to secure your fleet?</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.125rem', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem', position: 'relative', zIndex: 1 }}>
              Join hundreds of companies reducing accidents and insurance premiums with Vigilant AI.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
              <Link to="/login" style={{ padding: '1rem 2.5rem', background: '#fff', color: 'var(--color-primary)', fontWeight: 800, borderRadius: 'var(--radius-lg)', textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                Get Started Now
              </Link>
              <a href="#contact" style={{ padding: '1rem 2.5rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800, borderRadius: 'var(--radius-lg)', textDecoration: 'none' }}>
                Schedule a Demo
              </a>
            </div>
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
print("HomePage.jsx rewritten without Tailwind")
