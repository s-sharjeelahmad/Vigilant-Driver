import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    let timeout;
    if (toast.duration && toast.duration > 0) {
      timeout = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(onRemove, 300); // Wait for animation
      }, toast.duration);
    }
    return () => clearTimeout(timeout);
  }, [toast.duration, onRemove]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onRemove, 300);
  };

  const icons = {
    success: <CheckCircle2 size={20} color="var(--color-success)" />,
    error: <AlertCircle size={20} color="var(--color-error)" />,
    info: <Info size={20} color="var(--color-info)" />
  };

  return (
    <div
      style={{
        pointerEvents: 'auto',
        background: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-high)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        minWidth: '300px',
        maxWidth: '400px',
        borderLeft: `4px solid var(--color-${toast.type === 'error' ? 'error' : toast.type === 'info' ? 'info' : 'success'})`,
        animation: isLeaving ? 'toast-slide-out 0.3s ease forwards' : 'toast-slide-in 0.3s ease forwards',
      }}
      role="alert"
    >
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        {icons[toast.type] || icons.success}
      </div>
      <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5 }}>
        {toast.message}
      </div>
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          padding: '2px',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          flexShrink: 0
        }}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>

      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toast-slide-out {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
