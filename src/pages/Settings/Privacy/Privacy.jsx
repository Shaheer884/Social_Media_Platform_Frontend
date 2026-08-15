import React, { useState, useEffect } from 'react';
import settingsService from '../../../services/settingsService';
import Spinner from '../../../components/Loader/Spinner';

const Privacy = () => {
  const [isPrivate, setIsPrivate] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null); // track which request is loading
  const [status, setStatus] = useState({ type: '', message: '' });

  const fetchPrivacyAndRequests = async () => {
    try {
      const settingsRes = await settingsService.getSettings();
      if (settingsRes.success) {
        setIsPrivate(settingsRes.data.isPrivate || false);
      }

      const requestsRes = await settingsService.getFollowRequests();
      if (requestsRes.success) {
        setRequests(requestsRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load privacy details:', err);
      setStatus({ type: 'error', message: 'Failed to load privacy details.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrivacyAndRequests();
  }, []);

  const handlePrivacyToggle = async () => {
    setSaving(true);
    setStatus({ type: '', message: '' });
    const targetValue = !isPrivate;

    try {
      const res = await settingsService.updatePrivacy(targetValue);
      if (res.success) {
        setIsPrivate(targetValue);
        setStatus({
          type: 'success',
          message: `Account privacy successfully updated. Your account is now ${targetValue ? 'Private' : 'Public'}.`
        });
      } else {
        setStatus({ type: 'error', message: res.error || 'Failed to update privacy setting.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Error updating account privacy on database.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRequestAction = async (requesterId, action) => {
    setActionId(requesterId);
    try {
      let res;
      if (action === 'accept') {
        res = await settingsService.acceptFollowRequest(requesterId);
      } else {
        res = await settingsService.rejectFollowRequest(requesterId);
      }

      if (res.success) {
        setRequests(requests.filter(req => req._id !== requesterId));
        setStatus({
          type: 'success',
          message: `Successfully ${action === 'accept' ? 'accepted' : 'ignored'} follow request.`
        });
      } else {
        setStatus({ type: 'error', message: res.error || 'Failed to complete action' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to manage follow request.' });
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="32px" />
      </div>
    );
  }

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <h2 className="settings-card-title">Privacy Settings</h2>
        <p className="settings-card-desc">Control your account visibility and manage incoming follow requests.</p>
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

      {/* Private Account Switcher */}
      <div className="settings-toggle-row" style={{ paddingBottom: '24px' }}>
        <div className="settings-toggle-info">
          <span className="settings-toggle-title">Private Account</span>
          <span className="settings-toggle-desc">
            When enabled, only people you approve can see your profile details, posts, and active stories. Turning this off restores public visibility immediately.
          </span>
        </div>
        <label className="settings-switch">
          <input 
            type="checkbox" 
            checked={isPrivate}
            onChange={handlePrivacyToggle}
            disabled={saving}
          />
          <span className="settings-switch-slider"></span>
        </label>
      </div>

      {/* Follow Requests List */}
      <div className="settings-requests-section">
        <h3 className="settings-toggle-title" style={{ fontSize: '1rem', marginBottom: '4px' }}>
          Pending Follow Requests ({requests.length})
        </h3>
        <p className="settings-toggle-desc" style={{ marginBottom: '16px' }}>
          Approve or ignore requests from users who want to follow your private profile.
        </p>

        {requests.length === 0 ? (
          <div className="settings-empty-state" style={{ padding: '30px 20px' }}>
            <div className="settings-empty-icon" style={{ fontSize: '2rem' }}>📬</div>
            <h4 className="settings-empty-title" style={{ fontSize: '0.95rem' }}>No pending requests</h4>
            <p className="settings-empty-desc" style={{ fontSize: '0.8rem' }}>When people request to follow you, they will appear here.</p>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map((reqUser) => (
              <div key={reqUser._id} className="request-card">
                <div className="request-user-info">
                  <img 
                    src={reqUser.profilePicture || '/uploads/default-avatar.png'} 
                    alt={reqUser.fullName}
                    className="request-avatar" 
                  />
                  <div className="request-meta">
                    <span className="request-name">{reqUser.fullName}</span>
                    <span className="request-username">@{reqUser.username}</span>
                  </div>
                </div>

                <div className="request-actions">
                  <button
                    className="request-btn request-btn-accept"
                    disabled={actionId === reqUser._id}
                    onClick={() => handleRequestAction(reqUser._id, 'accept')}
                  >
                    {actionId === reqUser._id ? '...' : 'Accept'}
                  </button>
                  <button
                    className="request-btn request-btn-reject"
                    disabled={actionId === reqUser._id}
                    onClick={() => handleRequestAction(reqUser._id, 'reject')}
                  >
                    {actionId === reqUser._id ? '...' : 'Ignore'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Privacy;
