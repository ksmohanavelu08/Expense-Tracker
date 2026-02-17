import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { TransactionProvider } from './context/TransactionContext';

// Auth guard
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout
import Sidebar from './components/common/Sidebar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Explorer from './pages/Explorer';
import Profile from './pages/Profile';

// Global styles
import './assets/styles.css';

/**
 * Layout wrapper for authenticated pages — renders Sidebar + main content
 */
const AuthenticatedLayout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    {children}
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <TransactionProvider>
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-active)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-body)',
                boxShadow: 'var(--shadow-md)',
              },
              success: {
                iconTheme: { primary: 'var(--green)', secondary: 'var(--bg-card)' },
              },
              error: {
                iconTheme: { primary: 'var(--red)', secondary: 'var(--bg-card)' },
              },
            }}
          />

          <Routes>
            {/* ─── Public Routes ─────────────────────────────────────────────── */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ─── Protected Routes ──────────────────────────────────────────── */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <Dashboard />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/explorer"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <Explorer />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <Profile />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              }
            />

            {/* ─── Redirects ────────────────────────────────────────────────── */}
            {/* Root → Dashboard (or login if not authenticated) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* Catch-all → Dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </TransactionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
