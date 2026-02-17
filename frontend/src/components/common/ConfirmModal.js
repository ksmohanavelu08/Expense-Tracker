import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, loading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--red-dim)', margin: '0 auto 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem',
          }}>
            🗑️
          </div>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
            {title || 'Delete Transaction'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {message || 'Are you sure you want to delete this transaction? This action cannot be undone.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary w-full" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="btn btn-danger w-full" onClick={onConfirm} disabled={loading}>
              {loading ? <span className="spinner" /> : '🗑️ Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
