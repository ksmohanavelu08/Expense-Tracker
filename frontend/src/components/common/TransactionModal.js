import React, { useState, useEffect } from 'react';
import { CATEGORIES, formatDateForInput } from '../../utils/helpers';

const TransactionModal = ({ isOpen, onClose, onSubmit, transaction = null, loading = false }) => {
  const isEditing = !!transaction;

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: 'Food & Dining',
    date: formatDateForInput(new Date()),
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Pre-fill form when editing
  useEffect(() => {
    if (transaction) {
      setFormData({
        title: transaction.title || '',
        amount: transaction.amount || '',
        type: transaction.type || 'expense',
        category: transaction.category || 'Other',
        date: formatDateForInput(transaction.date) || formatDateForInput(new Date()),
        notes: transaction.notes || '',
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        type: 'expense',
        category: 'Food & Dining',
        date: formatDateForInput(new Date()),
        notes: '',
      });
    }
    setErrors({});
  }, [transaction, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0)
      errs.amount = 'Please enter a valid positive amount';
    if (!formData.date) errs.date = 'Date is required';
    if (!formData.category) errs.category = 'Category is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({ ...formData, amount: parseFloat(formData.amount) });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? '✏️ Edit Transaction' : '+ New Transaction'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Type Toggle */}
          <div className="form-group">
            <label className="form-label">Type</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['expense', 'income'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, type: t }))}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${formData.type === t
                      ? t === 'expense' ? 'rgba(242,92,92,0.4)' : 'rgba(61,214,140,0.4)'
                      : 'var(--border)'}`,
                    background: formData.type === t
                      ? t === 'expense' ? 'var(--red-dim)' : 'var(--green-dim)'
                      : 'var(--bg-input)',
                    color: formData.type === t
                      ? t === 'expense' ? 'var(--red)' : 'var(--green)'
                      : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all var(--transition)',
                    fontFamily: 'var(--font-body)',
                    textTransform: 'capitalize',
                  }}
                >
                  {t === 'expense' ? '↑ Expense' : '↓ Income'}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              className="form-input"
              type="text"
              name="title"
              placeholder="e.g. Grocery Shopping"
              value={formData.title}
              onChange={handleChange}
              maxLength={100}
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          {/* Amount + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Amount *</label>
              <input
                className="form-input"
                type="number"
                name="amount"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
              />
              {errors.amount && <span className="form-error">{errors.amount}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <div style={{ position: 'relative' }}>
                <select
                  className="form-select"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <span style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none',
                  color: 'var(--text-muted)', fontSize: '0.75rem'
                }}>▾</span>
              </div>
              {errors.category && <span className="form-error">{errors.category}</span>}
            </div>
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              className="form-input"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="form-textarea"
              name="notes"
              placeholder="Any additional details..."
              value={formData.notes}
              onChange={handleChange}
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary w-full" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {isEditing ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
