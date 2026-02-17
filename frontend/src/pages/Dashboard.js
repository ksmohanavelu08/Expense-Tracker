import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
} from 'chart.js';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import api from '../utils/api';
import {
  formatCurrency, formatDate, getCategoryColor,
  getCategoryIcon, getMonthName,
} from '../utils/helpers';
import TransactionModal from '../components/common/TransactionModal';
import toast from 'react-hot-toast';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const PERIOD_OPTIONS = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { addTransaction } = useTransactions();
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/transactions/summary?period=${period}`);
      setSummaryData(response.data.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleAddTransaction = async (formData) => {
    setSubmitting(true);
    try {
      await addTransaction(formData);
      setModalOpen(false);
      fetchSummary(); // Refresh dashboard data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const { summary, categoryBreakdown = [], recentTransactions = [], monthlyTrend = [] } =
    summaryData || {};

  const netBalance = (summary?.totalIncome || 0) - (summary?.totalExpenses || 0);

  // Doughnut chart data
  const donutData = {
    labels: categoryBreakdown.map((c) => c._id),
    datasets: [{
      data: categoryBreakdown.map((c) => c.total),
      backgroundColor: categoryBreakdown.map((c) => getCategoryColor(c._id)),
      borderColor: categoryBreakdown.map((c) => getCategoryColor(c._id) + '40'),
      borderWidth: 1,
      hoverOffset: 6,
    }],
  };

  // Build monthly bar chart data
  const buildMonthlyChartData = () => {
    const monthMap = {};
    monthlyTrend.forEach((m) => {
      const key = `${m._id.year}-${m._id.month}`;
      if (!monthMap[key]) monthMap[key] = { label: `${getMonthName(m._id.month)} ${m._id.year}`, expense: 0, income: 0 };
      monthMap[key][m._id.type] = m.total;
    });
    const entries = Object.values(monthMap);
    return {
      labels: entries.map((e) => e.label),
      datasets: [
        {
          label: 'Expenses',
          data: entries.map((e) => e.expense),
          backgroundColor: 'rgba(242, 92, 92, 0.7)',
          borderColor: 'rgba(242, 92, 92, 0.9)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Income',
          data: entries.map((e) => e.income),
          backgroundColor: 'rgba(61, 214, 140, 0.7)',
          borderColor: 'rgba(61, 214, 140, 0.9)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(22, 22, 31, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#f0f0f5',
        bodyColor: '#8888a0',
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#8888a0', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#8888a0', font: { size: 11 },
          callback: (v) => '$' + v.toLocaleString(),
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading-center" style={{ height: '60vh' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's your financial overview</p>
        </div>
        <div className="flex gap-1">
          {/* Period selector */}
          <div className="period-selector">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`period-btn ${period === opt.value ? 'active' : ''}`}
                onClick={() => setPeriod(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            + Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-stats">
        <StatCard
          label="Total Expenses"
          value={formatCurrency(summary?.totalExpenses || 0, user?.currency)}
          icon="↑"
          iconColor="var(--red)"
          iconBg="var(--red-dim)"
          trend={`${summary?.expenseCount || 0} transactions`}
        />
        <StatCard
          label="Total Income"
          value={formatCurrency(summary?.totalIncome || 0, user?.currency)}
          icon="↓"
          iconColor="var(--green)"
          iconBg="var(--green-dim)"
          trend={`${(summary?.transactionCount || 0) - (summary?.expenseCount || 0)} transactions`}
        />
        <StatCard
          label="Net Balance"
          value={formatCurrency(Math.abs(netBalance), user?.currency)}
          icon="≈"
          iconColor={netBalance >= 0 ? 'var(--green)' : 'var(--red)'}
          iconBg={netBalance >= 0 ? 'var(--green-dim)' : 'var(--red-dim)'}
          valueColor={netBalance >= 0 ? 'var(--green)' : 'var(--red)'}
          trend={netBalance >= 0 ? 'Surplus' : 'Deficit'}
        />
        <StatCard
          label="Transactions"
          value={summary?.transactionCount || 0}
          icon="#"
          iconColor="var(--accent)"
          iconBg="var(--accent-dim)"
          trend="This period"
        />
      </div>

      {/* Charts Row */}
      <div className="dashboard-charts">
        {/* Monthly Trend Bar Chart */}
        <div className="card chart-card">
          <div className="flex-between mb-2">
            <h3 className="chart-title">6-Month Trend</h3>
            <div className="chart-legend">
              <span className="legend-dot" style={{ background: 'var(--red)' }} /> Expenses
              <span className="legend-dot" style={{ background: 'var(--green)', marginLeft: '0.75rem' }} /> Income
            </div>
          </div>
          <div style={{ height: 220 }}>
            {monthlyTrend.length > 0 ? (
              <Bar data={buildMonthlyChartData()} options={chartOptions} />
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon">📊</div>
                <p>No data for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Doughnut */}
        <div className="card chart-card chart-card-sm">
          <h3 className="chart-title mb-2">By Category</h3>
          {categoryBreakdown.length > 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut
                data={donutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '65%',
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(22,22,31,0.95)',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderWidth: 1,
                      titleColor: '#f0f0f5',
                      bodyColor: '#8888a0',
                      callbacks: {
                        label: (ctx) =>
                          ` ${ctx.label}: ${formatCurrency(ctx.parsed, user?.currency)}`,
                      },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '1rem' }}>No expense data</div>
          )}

          {/* Category list */}
          <div className="category-list">
            {categoryBreakdown.slice(0, 4).map((cat) => (
              <div key={cat._id} className="category-item">
                <div className="category-item-left">
                  <div
                    className="category-dot"
                    style={{ background: getCategoryColor(cat._id) }}
                  />
                  <span className="category-icon">{getCategoryIcon(cat._id)}</span>
                  <span className="category-name">{cat._id}</span>
                </div>
                <span className="category-amount">
                  {formatCurrency(cat.total, user?.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="flex-between mb-2">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>
            Recent Transactions
          </h3>
          <Link to="/explorer" className="btn btn-ghost btn-sm">
            View all →
          </Link>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <h3>No transactions yet</h3>
            <p>Add your first transaction to get started</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setModalOpen(true)}>
              + Add Transaction
            </button>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.title}</div>
                      {t.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {t.notes.slice(0, 40)}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)',
                        background: getCategoryColor(t.category) + '15',
                        color: getCategoryColor(t.category),
                        fontSize: '0.75rem', fontWeight: 500,
                      }}>
                        {getCategoryIcon(t.category)} {t.category}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {formatDate(t.date)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{
                        fontWeight: 600, fontFamily: 'var(--font-display)',
                        color: t.type === 'income' ? 'var(--green)' : 'var(--red)',
                      }}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, user?.currency)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddTransaction}
        loading={submitting}
      />
    </div>
  );
};

// ─── Helper Components ────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, iconColor, iconBg, trend, valueColor }) => (
  <div className="card stat-card">
    <div className="stat-icon" style={{ color: iconColor, background: iconBg }}>
      {icon}
    </div>
    <div className="stat-label">{label}</div>
    <div className="stat-value" style={{ color: valueColor }}>
      {value}
    </div>
    <div className="stat-trend">{trend}</div>
  </div>
);

// ─── Utilities ────────────────────────────────────────────────────────────────

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

export default Dashboard;
