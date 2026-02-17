import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    currency: user?.currency || 'USD',
  });
  const [loading, setLoading] = useState(false);

  const currencies = [
    { code: 'USD', label: 'US Dollar ($)' },
    { code: 'EUR', label: 'Euro (€)' },
    { code: 'GBP', label: 'British Pound (£)' },
    { code: 'INR', label: 'Indian Rupee (₹)' },
    { code: 'CAD', label: 'Canadian Dollar (CA$)' },
    { code: 'AUD', label: 'Australian Dollar (A$)' },
    { code: 'JPY', label: 'Japanese Yen (¥)' },
  ];

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setLoading(true);
    try {
      const response = await api.put('/auth/profile', formData);
      updateUser(response.data.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your account preferences</p>
      </div>

      <div className="profile-grid">
        {/* Profile Card */}
        <div className="card profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">{getInitials(user?.name)}</div>
            <div>
              <h2 className="profile-name">{user?.name}</h2>
              <p className="profile-email">{user?.email}</p>
              <p className="profile-joined">
                Member since {new Date(user?.createdAt).toLocaleDateString('en-US', {
                  month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card">
          <h3 className="section-title">Account Information</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                value={user?.email}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Email address cannot be changed
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Currency</label>
              <div style={{ position: 'relative' }}>
                <select
                  className="form-select"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <span style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none',
                  color: 'var(--text-muted)', fontSize: '0.75rem',
                }}>▾</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ alignSelf: 'flex-start' }}
            >
              {loading ? <><span className="spinner" /> Saving...</> : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="card danger-card">
          <h3 className="section-title" style={{ color: 'var(--red)' }}>Danger Zone</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.75rem 0 1rem' }}>
            Once you log out, you'll need to sign in again to access your account.
          </p>
          <button
            className="btn btn-danger"
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
