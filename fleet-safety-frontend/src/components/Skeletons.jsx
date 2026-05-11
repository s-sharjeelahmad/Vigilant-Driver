import React from "react";

export function DashboardSkeleton() {
  const shimmer = {
    animation: "shimmer 2s infinite linear",
    background: "linear-gradient(to right, var(--color-surface) 4%, var(--color-surface-elevated) 25%, var(--color-surface) 36%)",
    backgroundSize: "1000px 100%",
  };

  return (
    <div>
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
        `}
      </style>
      
      {/* Top row KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card" style={{ height: '110px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '60%', height: '16px', borderRadius: '4px', ...shimmer }} />
            <div style={{ width: '40%', height: '32px', borderRadius: '4px', ...shimmer }} />
          </div>
        ))}
      </div>
      
      {/* Risk Banner */}
      <div className="card" style={{ height: '140px', marginBottom: '1.5rem', ...shimmer, borderRadius: '12px' }} />
      
      {/* Secondary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ height: '240px', ...shimmer, borderRadius: '12px' }} />
        <div className="card" style={{ height: '240px', ...shimmer, borderRadius: '12px' }} />
      </div>
    </div>
  );
}

export function TableSkeleton() {
  const shimmer = {
    animation: "shimmer 2s infinite linear",
    background: "linear-gradient(to right, var(--color-surface) 4%, var(--color-surface-elevated) 25%, var(--color-surface) 36%)",
    backgroundSize: "1000px 100%",
  };

  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ width: '200px', height: '24px', borderRadius: '4px', ...shimmer }} />
      </div>
      <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '2rem', borderBottom: '1px solid var(--color-border)' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ width: '100px', height: '16px', borderRadius: '4px', ...shimmer }} />
        ))}
      </div>
      {[1, 2, 3, 4, 5].map(row => (
        <div key={row} style={{ padding: '1rem 1.5rem', display: 'flex', gap: '2rem', borderBottom: '1px solid var(--color-border)' }}>
          {[1, 2, 3, 4, 5].map(col => (
            <div key={col} style={{ width: col === 1 ? '150px' : '80px', height: '20px', borderRadius: '4px', ...shimmer }} />
          ))}
        </div>
      ))}
    </div>
  );
}
