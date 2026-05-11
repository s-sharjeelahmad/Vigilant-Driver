import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false }) {
  
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', animation: 'fade-in 0.2s ease' }} 
      onClick={onClose}
    >
      <div 
        className="card" 
        style={{ width: '100%', maxWidth: '450px', padding: '1.5rem', boxShadow: 'var(--shadow-high)', animation: 'slide-up 0.3s ease', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ 
            flexShrink: 0, width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            background: isDestructive ? 'rgba(218, 30, 40, 0.1)' : 'var(--color-primary-subtle)', 
            color: isDestructive ? 'var(--color-error)' : 'var(--color-primary)' 
          }}>
            <AlertTriangle size={24} />
          </div>
          <div style={{ flex: 1, paddingTop: '0.25rem' }}>
            <h2 id="modal-title" className="ds-heading-3" style={{ margin: '0 0 0.5rem 0' }}>{title}</h2>
            <p className="ds-body" style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{message}</p>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer', color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '-0.25rem', marginRight: '-0.25rem' }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', padding: '0.6rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
          >
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            style={{ 
              background: isDestructive ? 'var(--color-error)' : 'var(--color-primary)', 
              color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

export default ConfirmModal;
