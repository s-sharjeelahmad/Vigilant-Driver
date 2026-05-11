import React from "react";
import { AlertCircle } from "lucide-react";

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '1rem',
      backgroundColor: 'rgba(218, 30, 40, 0.1)',
      borderLeft: '4px solid var(--color-error)',
      borderRadius: '4px',
      color: 'var(--color-error)',
      marginBottom: '1.5rem',
      fontFamily: 'Manrope, sans-serif'
    }}>
      <AlertCircle size={20} />
      <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{message}</span>
    </div>
  );
}

export default ErrorBanner;
