import React, { useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import adminService from '../services/adminService';

const AdminNotifications = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('Platform Updates');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Please fill in both the title and the message.');
      return;
    }

    if (!window.confirm(`Are you sure you want to broadcast this "${type}" announcement to ALL users?`)) {
      return;
    }

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const res = await adminService.broadcastAnnouncement(title.trim(), message.trim(), type);
      if (res.success) {
        setSuccess(res.message || 'Announcement broadcasted successfully!');
        setTitle('');
        setMessage('');
        setType('Platform Updates');
      }
    } catch (err) {
      setError(err.message || 'Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  const types = ['Platform Updates', 'Maintenance Notice', 'Security Alerts', 'Feature Release'];

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Broadcast Center</h1>
          <p className="admin-page-desc">Send platform announcements and alerts to all registered users</p>
        </div>
      </div>

      <div style={{ maxWidth: '600px', backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
        {success && (
          <div style={{ padding: '12px', backgroundColor: '#d1fae5', borderLeft: '4px solid var(--admin-success)', color: '#065f46', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px', backgroundColor: '#fee2e2', borderLeft: '4px solid var(--admin-danger)', color: '#991b1b', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="admin-form-group">
            <label className="admin-form-label">Announcement Type</label>
            <select 
              className="admin-filter-select" 
              style={{ width: '100%', padding: '12px' }}
              value={type} 
              onChange={(e) => setType(e.target.value)}
            >
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Subject Title</label>
            <input
              type="text"
              className="admin-form-input"
              placeholder="e.g. Schedule Maintenance, Version 2.0 release..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Broadcast Message Content</label>
            <textarea
              className="admin-form-textarea"
              placeholder="Describe the update, alert, or features detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button 
              type="submit" 
              className="admin-btn admin-btn-primary" 
              disabled={loading}
              style={{ minWidth: '150px', justifyContent: 'center' }}
            >
              {loading ? 'Broadcasting...' : 'Send Broadcast'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
