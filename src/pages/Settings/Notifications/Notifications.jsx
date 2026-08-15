import React, { useState, useEffect } from 'react';
import settingsService from '../../../services/settingsService';
import Spinner from '../../../components/Loader/Spinner';

const Notifications = () => {
  const [preferences, setPreferences] = useState({
    likes: true,
    comments: true,
    replies: true,
    friendRequests: true,
    followers: true,
    mentions: true,
    birthdayReminders: true,
    adminAnnouncements: true,
    storyNotifications: true,
    postNotifications: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const res = await settingsService.getSettings();
        if (res.success) {
          const cloudPrefs = res.data.notificationPreferences || {};
          setPreferences((prev) => ({
            ...prev,
            ...cloudPrefs
          }));
        }
      } catch (err) {
        console.error('Failed to load notification settings:', err);
        setStatus({ type: 'error', message: 'Failed to load notification settings.' });
      } finally {
        setLoading(false);
      }
    };
    fetchNotificationSettings();
  }, []);

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await settingsService.updateNotifications(preferences);
      if (res.success) {
        setStatus({ type: 'success', message: 'Notification preferences saved successfully!' });
      } else {
        setStatus({ type: 'error', message: res.error || 'Failed to save preferences.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Error syncing settings with server.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="32px" />
      </div>
    );
  }

  const notificationToggles = [
    { key: 'likes', title: 'Likes', desc: 'Notify me when someone likes my posts.' },
    { key: 'comments', title: 'Comments', desc: 'Notify me when someone comments on my posts.' },
    { key: 'replies', title: 'Comment Replies', desc: 'Notify me when someone replies to my comments.' },
    { key: 'friendRequests', title: 'Friend Requests', desc: 'Notify me when someone sends me a follow request.' },
    { key: 'followers', title: 'New Followers', desc: 'Notify me when someone starts following me.' },
    { key: 'mentions', title: 'Mentions', desc: 'Notify me when someone tags me in a post, comment, or story.' },
    { key: 'birthdayReminders', title: 'Birthday Reminders', desc: 'Notify me about birthdays of friends.' },
    { key: 'adminAnnouncements', title: 'Announcements', desc: 'Notify me about platform updates and admin announcements.' },
    { key: 'storyNotifications', title: 'Story Notifications', desc: 'Notify me when friends post new stories.' },
    { key: 'postNotifications', title: 'Post Notifications', desc: 'Notify me when followed users publish new posts.' }
  ];

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <h2 className="settings-card-title">Notification Preferences</h2>
        <p className="settings-card-desc">Select which alerts you want to receive. These options only block notification delivery, not core actions.</p>
      </div>

      {status.message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '0.9rem',
          fontWeight: 600,
          backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: status.type === 'success' ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${status.type === 'success' ? 'var(--success)' : 'var(--danger)'}`
        }}>
          {status.message}
        </div>
      )}

      <div>
        {notificationToggles.map((item) => (
          <div key={item.key} className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">{item.title}</span>
              <span className="settings-toggle-desc">{item.desc}</span>
            </div>
            <label className="settings-switch">
              <input 
                type="checkbox" 
                checked={preferences[item.key]}
                onChange={() => handleToggle(item.key)}
                disabled={saving}
              />
              <span className="settings-switch-slider"></span>
            </label>
          </div>
        ))}
      </div>

      <div className="settings-actions">
        <button 
          type="button" 
          className="settings-btn settings-btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Notifications;
