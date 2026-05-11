import React from 'react';
import { Database } from 'lucide-react';

function EmptyState({ icon: Icon = Database, title = "No data available", description = "There is nothing to display here yet.", actionButton = null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
        <Icon size={32} />
      </div>
      <h3 className="ds-heading-3" style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>{title}</h3>
      <p className="ds-body" style={{ margin: 0, maxWidth: '400px', lineHeight: 1.5, marginBottom: actionButton ? '1.5rem' : '0' }}>{description}</p>
      {actionButton && (
        <div>
          {actionButton}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
