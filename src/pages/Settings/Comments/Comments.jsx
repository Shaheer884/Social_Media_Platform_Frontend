import React, { useState, useEffect } from 'react';
import settingsService from '../../../services/settingsService';
import Spinner from '../../../components/Loader/Spinner';

const Comments = () => {
  const [commentSettings, setCommentSettings] = useState({
    whoCanComment: 'Everyone',
    allowEmoji: true,
    allowGif: true,
    filterOffensive: false,
    hideSpam: false,
    autoModerate: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchCommentSettings = async () => {
      try {
        const res = await settingsService.getSettings();
        if (res.success) {
          const cloudSettings = res.data.commentSettings || {};
          setCommentSettings((prev) => ({
            ...prev,
            ...cloudSettings
          }));
        }
      } catch (err) {
        console.error('Failed to load comment settings:', err);
        setStatus({ type: 'error', message: 'Failed to load comment settings.' });
      } finally {
        setLoading(false);
      }
    };
    fetchCommentSettings();
  }, []);

  const handleChange = (e) => {
    setCommentSettings({
      ...commentSettings,
      [e.target.name]: e.target.value
    });
  };

  const handleToggle = (key) => {
    setCommentSettings({
      ...commentSettings,
      [key]: !commentSettings[key]
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await settingsService.updateComments(commentSettings);
      if (res.success) {
        setStatus({ type: 'success', message: 'Comments settings saved successfully!' });
      } else {
        setStatus({ type: 'error', message: res.error || 'Failed to save settings.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Error syncing comment settings with database.' });
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

  const moderations = [
    { key: 'allowEmoji', title: 'Allow Emojis', desc: 'Permit users to comment using emojis on my posts.' },
    { key: 'allowGif', title: 'Allow GIFs', desc: 'Permit users to comment using GIF attachments or links.' },
    { key: 'filterOffensive', title: 'Filter Offensive Comments', desc: 'Block comments containing offensive language or designated swear words.' },
    { key: 'hideSpam', title: 'Hide Spam Comments', desc: 'Automatically flag and collapse repetitive or link-heavy messages.' },
    { key: 'autoModerate', title: 'Auto Moderate Comments', desc: 'Require review for comments from accounts with no mutual friends.' }
  ];

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <h2 className="settings-card-title">Comment Settings</h2>
        <p className="settings-card-desc">Control who is permitted to write comments on your posts and customize comment filter levels.</p>
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

      {/* Select Who Can Comment */}
      <div className="settings-form-group" style={{ marginBottom: '24px' }}>
        <label className="settings-label" style={{ fontSize: '0.95rem' }}>Who can comment on your posts?</label>
        <select 
          name="whoCanComment"
          className="settings-select"
          style={{ marginTop: '6px' }}
          value={commentSettings.whoCanComment}
          onChange={handleChange}
          disabled={saving}
        >
          <option value="Everyone">Everyone</option>
          <option value="Followers">Followers Only (Approved)</option>
          <option value="Friends">Friends Only (Mutual Followers)</option>
          <option value="Only Me">Only Me</option>
        </select>
      </div>

      {/* Toggles */}
      <div>
        {moderations.map((item) => (
          <div key={item.key} className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">{item.title}</span>
              <span className="settings-toggle-desc">{item.desc}</span>
            </div>
            <label className="settings-switch">
              <input 
                type="checkbox" 
                name={item.key}
                checked={commentSettings[item.key]}
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

export default Comments;
