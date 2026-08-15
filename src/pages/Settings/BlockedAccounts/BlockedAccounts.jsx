import React, { useState, useEffect } from 'react';
import settingsService from '../../../services/settingsService';
import Spinner from '../../../components/Loader/Spinner';

const BlockedAccounts = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal
  const [userToUnblock, setUserToUnblock] = useState(null); // user object

  const fetchBlockedList = async (pageNumber = 1, searchVal = '') => {
    try {
      const res = await settingsService.getBlockedUsers(pageNumber, searchVal);
      if (res.success) {
        setBlockedUsers(res.data || []);
        setPage(res.pagination.page);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load blocked accounts:', err);
      setStatus({ type: 'error', message: 'Failed to load blocked accounts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedList(1, searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset page to 1 on search
  };

  const handleUnblock = async () => {
    if (!userToUnblock) return;
    setActionLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await settingsService.unblockUser(userToUnblock._id);
      if (res.success) {
        setStatus({ type: 'success', message: `Successfully unblocked @${userToUnblock.username}` });
        setBlockedUsers(blockedUsers.filter(u => u._id !== userToUnblock._id));
        setUserToUnblock(null);
      } else {
        setStatus({ type: 'error', message: res.error || 'Failed to unblock user.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Error unblocking user.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && page === 1 && searchQuery === '') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="32px" />
      </div>
    );
  }

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <h2 className="settings-card-title">Blocked Accounts</h2>
        <p className="settings-card-desc">Manage accounts you have blocked. Blocked users cannot view your profile, posts, stories, comment, like, follow, or search you.</p>
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

      {/* Search blocked list */}
      <div className="blocked-search-container">
        <input 
          type="text" 
          className="settings-input"
          placeholder="🔍 Search blocked users..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Blocked accounts list */}
      {blockedUsers.length === 0 ? (
        <div className="settings-empty-state">
          <div className="settings-empty-icon">🚫</div>
          <h3 className="settings-empty-title">No blocked accounts</h3>
          <p className="settings-empty-desc">Accounts you block will appear here.</p>
        </div>
      ) : (
        <div className="blocked-list">
          {blockedUsers.map((item) => (
            <div key={item._id} className="blocked-user-card">
              <div className="blocked-user-info">
                <img 
                  src={item.profilePicture || '/uploads/default-avatar.png'} 
                  alt={item.fullName}
                  className="blocked-user-avatar"
                />
                <div className="blocked-user-meta">
                  <span className="blocked-user-name">{item.fullName}</span>
                  <span className="blocked-user-username">@{item.username}</span>
                  {item.blockedAt && (
                    <span className="blocked-user-date">
                      Blocked on: {new Date(item.blockedAt).toLocaleDateString(undefined, { dateStyle: 'short' })}
                    </span>
                  )}
                </div>
              </div>

              <button 
                className="settings-btn settings-btn-secondary"
                style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                onClick={() => setUserToUnblock(item)}
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button 
            className="settings-btn settings-btn-secondary" 
            style={{ padding: '6px 14px' }}
            disabled={page === 1}
            onClick={() => fetchBlockedList(page - 1, searchQuery)}
          >
            Prev
          </button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', padding: '0 8px', color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button 
            className="settings-btn settings-btn-secondary" 
            style={{ padding: '6px 14px' }}
            disabled={page === totalPages}
            onClick={() => fetchBlockedList(page + 1, searchQuery)}
          >
            Next
          </button>
        </div>
      )}

      {/* Unblock Confirmation Modal */}
      {userToUnblock && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="settings-card" style={{ width: '400px', margin: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔓</div>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>Unblock User?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Are you sure you want to unblock <strong>{userToUnblock.fullName}</strong> (@{userToUnblock.username})? They will be able to search for you and view your public feed again.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button 
                type="button" 
                className="settings-btn settings-btn-secondary"
                onClick={() => setUserToUnblock(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="settings-btn settings-btn-primary"
                onClick={handleUnblock}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockedAccounts;
