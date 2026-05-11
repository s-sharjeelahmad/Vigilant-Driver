import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, ArrowRight, Eye, Lock, Globe, Zap } from 'lucide-react';

function HomePage() {
  // --- DYNAMIC DATA SIMULATION ---
  // In a real scenario, these could be fetched from your /stats API endpoint
  const [liveStats, setLiveStats] = useState({
    riskScore: 42.8,
    activeSessions: 26,
    alerts: 3
  });

  // Simulate live engine updates for the UI
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        ...prev,
        riskScore: +(prev.riskScore + (Math.random() * 0.4 - 0.2)).toFixed(1),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{ 
        padding: '120px 2rem 80px', 
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Responsive Container */}
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '40px' 
          }}>
            
            {/* Left Content */}
            <div style={{ flex: '1 1 500px' }}>
              <h1 style={{ 
                fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
                fontWeight: 900, 
                color: 'var(--color-text-primary)', 
                lineHeight: 1.1,
                marginBottom: '24px',
                letterSpacing: '-0.02em'
              }}>
                Precision Monitoring for <br/>
                <span style={{ color: 'var(--color-primary)' }}>Modern Fleets</span>
              </h1>

              <p style={{ 
                fontSize: '18px', 
                color: 'var(--color-text-muted)', 
                lineHeight: 1.6, 
                maxWidth: '500px',
                marginBottom: '40px' 
              }}>
                Vigilant Driver uses on-device computer vision to detect fatigue and distraction in real-time. No cloud latency. No privacy compromises.
              </p>

              <Link to="/login" className="btn-primary" style={{ 
                padding: '16px 32px', 
                fontSize: '16px', 
                fontWeight: 700, 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '12px',
                textDecoration: 'none'
              }}>
                Access Dashboard <ArrowRight size={20} />
              </Link>
            </div>

            {/* Right Visual - Dynamic Engine Card */}
            <div style={{ flex: '1 1 400px', position: 'relative' }}>
              <div style={{ 
                background: 'var(--color-surface)', 
                borderRadius: '24px', 
                padding: '32px',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-high)',
                position: 'relative',
                zIndex: 2
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                  <TextLabel label="Engine Status" value="ACTIVE" color="var(--color-success)" />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '4px', background: 'var(--color-border)' }} />)}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                  <StatItem label="Risk Index" value={liveStats.riskScore} />
                  <StatItem label="Live Links" value={liveStats.activeSessions} />
                </div>

                {/* Dynamic Waveform Visual */}
                <div style={{ 
                  height: '80px', 
                  display: 'flex', 
                  alignItems: 'flex-end', 
                  gap: '4px',
                  background: 'var(--color-bg)',
                  borderRadius: '12px',
                  padding: '12px',
                  overflow: 'hidden'
                }}>
                  {[40, 70, 45, 90, 65, 80, 30, 70, 50, 60, 85, 40].map((h, i) => (
                    <div key={i} style={{ 
                      flex: 1, 
                      height: `${h}%`, 
                      background: 'var(--color-primary)', 
                      borderRadius: '2px',
                      opacity: 0.3 + (i * 0.05) 
                    }} />
                  ))}
                </div>
              </div>
              
              {/* Background Glow */}
              <div style={{ 
                position: 'absolute', top: '50%', left: '50%', 
                transform: 'translate(-50%, -50%)', width: '120%', height: '120%',
                background: 'radial-gradient(circle, var(--color-primary-soft) 0%, transparent 70%)',
                zIndex: 1, opacity: 0.5
              }} />
            </div>

          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section style={{ padding: '80px 2rem', background: 'var(--color-surface-elevated)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>Capabilities</h2>
            <h3 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--color-text-primary)' }}>Enterprise Safety Protocols</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <FeatureCard 
              icon={<Eye color="var(--color-primary)" />} 
              title="Behavioral AI" 
              desc="Deep-learning models tracking PERCLOS and gaze deviation in 100ms windows."
            />
            <FeatureCard 
              icon={<Globe color="var(--color-info)" />} 
              title="Real-time Telemetry" 
              desc="Automatic synchronization of safety events to the central management portal."
            />
            <FeatureCard 
              icon={<Lock color="var(--color-success)" />} 
              title="Privacy Preserved" 
              desc="On-device inference ensures no driver video is ever uploaded or stored."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* <footer style={{ padding: '40px 2rem', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 600 }}>
          © 2026 Vigilant Driver • Built for FAST-NUCES FYP Evaluation
        </p>
      </footer> */}
    </div>
  );
}

// --- HELPER SUB-COMPONENTS (Keep logic organized) ---

const StatItem = ({ label, value }) => (
  <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
    <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{label}</p>
    <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 900, color: 'var(--color-text-primary)' }}>{value}</p>
  </div>
);

const TextLabel = ({ label, value, color }) => (
  <div>
    <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{label}</p>
    <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: color }}>{value}</p>
  </div>
);

const FeatureCard = ({ icon, title, desc }) => (
  <div style={{ 
    padding: '32px', 
    borderRadius: '20px', 
    background: 'var(--color-surface)', 
    border: '1px solid var(--color-border)',
    transition: 'all 0.2s ease'
  }}>
    <div style={{ marginBottom: '20px' }}>{icon}</div>
    <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '12px' }}>{title}</h4>
    <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>{desc}</p>
  </div>
);

export default HomePage;