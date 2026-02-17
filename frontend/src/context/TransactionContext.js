import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TransactionContext = createContext(null);

const DEFAULT_FILTERS = {
  search: '',
  category: 'All',
  type: 'All',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  sortBy: 'date',
  sortOrder: 'desc',
};

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  // Preserve scroll position when navigating back from detail view
  const scrollPositionRef = useRef(0);

  /**
   * Fetch transactions with current filters and pagination
   */
  const fetchTransactions = useCallback(async (page = 1, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 15,
        ...Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v && v !== 'All')
        ),
      });

      const response = await api.get(`/transactions?${params}`);
      const { data, pagination: paginationData } = response.data;

      if (append) {
        // Infinite scroll — append new data
        setTransactions((prev) => [...prev, ...data]);
      } else {
        setTransactions(data);
      }
      setPagination(paginationData);
      setCurrentPage(page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Load the next page of transactions (for load more / infinite scroll)
   */
  const loadMore = useCallback(async () => {
    if (!pagination?.hasNextPage || loading) return;
    await fetchTransactions(currentPage + 1, true);
  }, [pagination, loading, currentPage, fetchTransactions]);

  /**
   * Update filter values and reset to page 1
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  /**
   * Reset all filters to defaults
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  /**
   * Add a new transaction
   */
  const addTransaction = useCallback(async (transactionData) => {
    const response = await api.post('/transactions', transactionData);
    toast.success('Transaction added!');
    return response.data.data;
  }, []);

  /**
   * Update an existing transaction
   */
  const updateTransaction = useCallback(async (id, transactionData) => {
    const response = await api.put(`/transactions/${id}`, transactionData);
    // Update in local state if it exists
    setTransactions((prev) =>
      prev.map((t) => (t._id === id ? response.data.data : t))
    );
    toast.success('Transaction updated!');
    return response.data.data;
  }, []);

  /**
   * Delete a transaction
   */
  const deleteTransaction = useCallback(async (id) => {
    await api.delete(`/transactions/${id}`);
    setTransactions((prev) => prev.filter((t) => t._id !== id));
    toast.success('Transaction deleted!');
  }, []);

  /**
   * Save and restore scroll position for the explorer
   */
  const saveScrollPosition = useCallback((pos) => {
    scrollPositionRef.current = pos;
  }, []);

  const getScrollPosition = useCallback(() => scrollPositionRef.current, []);

  const value = {
    transactions,
    pagination,
    loading,
    filters,
    currentPage,
    fetchTransactions,
    loadMore,
    updateFilters,
    resetFilters,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    saveScrollPosition,
    getScrollPosition,
    DEFAULT_FILTERS,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) throw new Error('useTransactions must be used within TransactionProvider');
  return context;
};
