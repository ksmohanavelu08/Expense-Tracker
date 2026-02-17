import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import {
  formatCurrency, formatDate, getCategoryColor,
  getCategoryIcon, CATEGORIES, debounce,
} from '../utils/helpers';
import TransactionModal from '../components/common/TransactionModal';
import ConfirmModal from '../components/common/ConfirmModal';
import toast from 'react-hot-toast';
import './Explorer.css';

const Explorer = () => {
  const { user } = useAuth();
  const {
    transactions, pagination, loading, filters,
    fetchTransactions, loadMore, updateFilters,
    resetFilters, addTransaction, updateTransaction,
    deleteTransaction, saveScrollPosition, getScrollPosition,
  } = useTransactions();

  // Local UI state
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, transaction: null });
  const [submitting, setSubmitting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const listRef = useRef(null);
  const observerRef = useRef(null); // IntersectionObserver for infinite scroll
  const loadMoreTriggerRef = useRef(null);

  // ─── Initial fetch + restore scroll position ───────────────────────────────
  useEffect(() => {
    fetchTransactions(1);
  }, [filters]);

  // Restore scroll position when navigating back from detail
  useEffect(() => {
    const savedPos = getScrollPosition();
    if (savedPos && listRef.current) {
      setTimeout(() => {
        window.scrollTo(0, savedPos);
      }, 100);
    }
  }, []);

  // ─── Infinite Scroll via IntersectionObserver ──────────────────────────────
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination?.hasNextPage && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [pagination, loading, loadMore]);

  // ─── Debounced search ─────────────────────────────────────────────────────
  const debouncedSearch = useCallback(
    debounce((val) => updateFilters({ search: val }), 400),
    [updateFilters]
  );

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    debouncedSearch(e.target.value);
  };

  // ─── Filter handlers ──────────────────────────────────────────────────────
  const handleFilterChange = (key, value) => {
    updateFilters({ [key]: value });
  };

  const handleReset = () => {
    setSearchInput('');
    resetFilters();
  };

  // ─── Transaction CRUD ─────────────────────────────────────────────────────
  const handleAddSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await addTransaction(formData);
      setModalOpen(false);
      fetchTransactions(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await updateTransaction(editingTransaction._id, formData);
      setEditingTransaction(null);
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setSubmitting(true);
    try {
      await deleteTransaction(deleteModal.transaction._id);
      setDeleteModal({ open: false, transaction: null });
    } catch (err) {
      toast.error('Failed to delete transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (t) => {
    setEditingTransaction(t);
    setModalOpen(true);
  };

  const openDelete = (t) => {
    setDeleteModal({ open: true, transaction: t });
  };

  const handleViewDetails = (t) => {
    saveScrollPosition(window.scrollY);
    setSelectedTransaction(t);
  };

  const hasActiveFilters =
    filters.search ||
    filters.category !== 'All' ||
    filters.type !== 'All' ||
    filters.startDate ||
    filters.endDate ||
    filters.minAmount ||
    filters.maxAmount;

  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">Transaction Explorer</h1>
          <p className="page-subtitle">
            {pagination?.totalCount ?? 0} transactions found
            {hasActiveFilters ? ' (filtered)' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingTransaction(null); setModalOpen(true); }}>
          + Add Transaction
        </button>
      </div>

      {/* ─── Filters ─────────────────────────────────────────────────────────── */}
      <div className="card explorer-filters">
        {/* Search */}
        <div className="search-wrapper">
          <span className="search-icon">⌕</span>
          <input
            className="form-input search-input"
            type="text"
            placeholder="Search by title or notes..."
            value={searchInput}
            onChange={handleSearchChange}
          />
          {searchInput && (
            <button className="search-clear" onClick={() => { setSearchInput(''); updateFilters({ search: '' }); }}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-row">
          {/* Category */}
          <div style={{ position: 'relative' }}>
            <select
              className="form-select filter-select"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{getCategoryIcon(cat)} {cat}</option>
              ))}
            </select>
            <span className="select-arrow">▾</span>
          </div>

          {/* Type */}
          <div style={{ position: 'relative' }}>
            <select
              className="form-select filter-select"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <span className="select-arrow">▾</span>
          </div>

          {/* Date Range */}
          <input
            className="form-input filter-select"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            placeholder="From date"
            title="From date"
            style={{ color: filters.startDate ? 'var(--text-primary)' : 'var(--text-muted)' }}
          />
          <input
            className="form-input filter-select"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            placeholder="To date"
            title="To date"
            style={{ color: filters.endDate ? 'var(--text-primary)' : 'var(--text-muted)' }}
          />

          {/* Amount Range */}
          <input
            className="form-input filter-select"
            type="number"
            placeholder="Min $"
            value={filters.minAmount}
            onChange={(e) => handleFilterChange('minAmount', e.target.value)}
            min="0"
          />
          <input
            className="form-input filter-select"
            type="number"
            placeholder="Max $"
            value={filters.maxAmount}
            onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
            min="0"
          />

          {/* Sort */}
          <div style={{ position: 'relative' }}>
            <select
              className="form-select filter-select"
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split(':');
                updateFilters({ sortBy, sortOrder });
              }}
            >
              <option value="date:desc">Newest First</option>
              <option value="date:asc">Oldest First</option>
              <option value="amount:desc">Highest Amount</option>
              <option value="amount:asc">Lowest Amount</option>
              <option value="title:asc">Title A→Z</option>
            </select>
            <span className="select-arrow">▾</span>
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button className="btn btn-secondary btn-sm" onClick={handleReset}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* ─── Transaction Table ─────────────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: '1rem', padding: 0 }}>
        {loading && transactions.length === 0 ? (
          <div className="loading-center" style={{ padding: '4rem' }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No transactions found</h3>
            <p>
              {hasActiveFilters
                ? 'Try adjusting your filters or search query'
                : 'Add your first transaction to get started'}
            </p>
            {hasActiveFilters ? (
              <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={handleReset}>
                Clear filters
              </button>
            ) : (
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setModalOpen(true)}>
                + Add Transaction
              </button>
            )}
          </div>
        ) : (
          <div ref={listRef}>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t._id} className="transaction-row">
                      <td>
                        <div
                          className="transaction-title"
                          onClick={() => handleViewDetails(t)}
                          title="Click to view details"
                        >
                          {t.title}
                        </div>
                        {t.notes && (
                          <div className="transaction-notes">
                            {t.notes.length > 45 ? t.notes.slice(0, 45) + '…' : t.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="category-badge" style={{
                          background: getCategoryColor(t.category) + '18',
                          color: getCategoryColor(t.category),
                          border: `1px solid ${getCategoryColor(t.category)}30`,
                        }}>
                          {getCategoryIcon(t.category)} {t.category}
                        </span>
                      </td>
                      <td className="text-secondary text-sm">{formatDate(t.date)}</td>
                      <td>
                        <span className={`badge badge-${t.type}`}>
                          {t.type === 'expense' ? '↑' : '↓'} {t.type}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`amount-value ${t.type === 'income' ? 'text-green' : 'text-red'}`}>
                          {t.type === 'income' ? '+' : '-'}
                          {formatCurrency(t.amount, user?.currency)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons">
                          <button
                            className="btn btn-ghost btn-icon action-btn"
                            onClick={() => handleViewDetails(t)}
                            title="View details"
                          >
                            👁
                          </button>
                          <button
                            className="btn btn-ghost btn-icon action-btn"
                            onClick={() => openEdit(t)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-ghost btn-icon action-btn action-btn-delete"
                            onClick={() => openDelete(t)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Infinite scroll trigger / load more indicator */}
            <div ref={loadMoreTriggerRef} style={{ padding: '1.5rem', textAlign: 'center' }}>
              {loading && (
                <div className="flex-center gap-1" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <span className="spinner" /> Loading more...
                </div>
              )}
              {!loading && !pagination?.hasNextPage && transactions.length > 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  All {pagination?.totalCount} transactions loaded
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Transaction Detail Drawer ────────────────────────────────────────── */}
      {selectedTransaction && (
        <TransactionDetail
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onEdit={() => { openEdit(selectedTransaction); setSelectedTransaction(null); }}
          onDelete={() => { openDelete(selectedTransaction); setSelectedTransaction(null); }}
          currency={user?.currency}
        />
      )}

      {/* ─── Modals ───────────────────────────────────────────────────────────── */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTransaction(null); }}
        onSubmit={editingTransaction ? handleEditSubmit : handleAddSubmit}
        transaction={editingTransaction}
        loading={submitting}
      />

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, transaction: null })}
        onConfirm={handleDeleteConfirm}
        loading={submitting}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${deleteModal.transaction?.title}"? This cannot be undone.`}
      />
    </div>
  );
};

// ─── Transaction Detail Drawer ────────────────────────────────────────────────

const TransactionDetail = ({ transaction: t, onClose, onEdit, onDelete, currency }) => {
  return (
    <div className="detail-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="detail-drawer">
        <div className="detail-header">
          <h3>Transaction Details</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="detail-amount-block" style={{
          background: t.type === 'income' ? 'var(--green-dim)' : 'var(--red-dim)',
          borderColor: t.type === 'income' ? 'rgba(61,214,140,0.2)' : 'rgba(242,92,92,0.2)',
        }}>
          <div className="detail-type-label" style={{
            color: t.type === 'income' ? 'var(--green)' : 'var(--red)',
          }}>
            {t.type === 'income' ? '↓ Income' : '↑ Expense'}
          </div>
          <div className="detail-amount" style={{
            color: t.type === 'income' ? 'var(--green)' : 'var(--red)',
          }}>
            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
          </div>
        </div>

        <div className="detail-fields">
          <DetailField label="Title" value={t.title} />
          <DetailField label="Category" value={`${getCategoryIcon(t.category)} ${t.category}`} />
          <DetailField label="Date" value={formatDate(t.date, 'MMMM dd, yyyy')} />
          {t.notes && <DetailField label="Notes" value={t.notes} />}
        </div>

        <div className="detail-actions">
          <button className="btn btn-secondary w-full" onClick={onEdit}>
            ✏️ Edit Transaction
          </button>
          <button className="btn btn-danger w-full" onClick={onDelete}>
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailField = ({ label, value }) => (
  <div className="detail-field">
    <span className="detail-field-label">{label}</span>
    <span className="detail-field-value">{value}</span>
  </div>
);

export default Explorer;
