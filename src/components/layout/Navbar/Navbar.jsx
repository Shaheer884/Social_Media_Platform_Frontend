import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationsContext';
import { timeAgo } from '../../../utils/formatters';
import { getUploadUrl } from '../../../utils/mediaHelper';

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [notiOpen, setNotiOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle HTML document body themes
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (e) => {
    e.stopPropagation();
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim();
      if (q) {
        navigate(`/search?q=${encodeURIComponent(q)}`);
      }
    }
  };

  const handleNotiClick = async (e, n) => {
    e.stopPropagation();
    setNotiOpen(false);
    await markRead(n._id);
    if (n.post) {
      navigate(`/post/${n.post._id || n.post}`);
    } else if (n.sender) {
      navigate(`/profile/${n.sender.username}`);
    }
  };

  const handleLogout = (e) => {
    e.stopPropagation();
    logout();
    navigate('/login');
  };

  // Close dropdowns on document level clicks
  useEffect(() => {
    const handleDocumentClick = () => {
      setNotiOpen(false);
      setProfileOpen(false);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const defaultAvatar = '/uploads/default-avatar.png';

  return (
    <header id="main-header" class="main-header">
      <nav className="navbar">
        <div className="logo-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/favicon.png" className="logo-icon" alt="Logo" />
          <span className="logo-text">ConnectHub</span>
        </div>

        <div className="search-bar" onClick={(e) => e.stopPropagation()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search ConnectHub..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>

        <div className="nav-actions">
          <button className="nav-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>

          <div className="notification-dropdown-container" onClick={(e) => e.stopPropagation()}>
            <button className="nav-btn" onClick={() => { setNotiOpen(!notiOpen); setProfileOpen(false); }} title="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {unreadCount > 0 && <span className="notification-badge" id="noti-badge">{unreadCount}</span>}
            </button>
            <div className={`notifications-dropdown ${notiOpen ? 'active' : ''}`} id="noti-dropdown">
              <div className="notification-header">
                <span>Notifications</span>
                <button className="mark-read-btn" onClick={markAllRead}>Mark all read</button>
              </div>
              <div id="notifications-list-container">
                {notifications.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => {
                    let actionText = '';
                    if (n.type === 'like') actionText = 'liked your post';
                    else if (n.type === 'comment') actionText = 'commented on your post';
                    else if (n.type === 'follow') {
                      actionText = n.sender?.relationshipStatus === 'friends'
                        ? 'is now your friend!'
                        : 'started following you';
                    }

                    const postText = n.post ? ` "${(n.post.content || '').substring(0, 15)}..."` : '';
                    const senderAvatar = getUploadUrl(n.sender?.profilePicture || defaultAvatar);

                    return (
                      <div
                        key={n._id}
                        className={`notification-item ${n.read || n.isRead ? '' : 'unread'}`}
                        onClick={(e) => handleNotiClick(e, n)}
                      >
                        <img src={senderAvatar} className="notification-avatar" alt="Avatar" />
                        <div className="notification-desc">
                          <div>
                            <span className="notification-user">{n.sender?.fullName || 'Someone'}</span>{' '}
                            {actionText}
                            {n.type !== 'follow' && postText}
                          </div>
                          <div className="notification-time">{timeAgo(n.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="profile-dropdown-container" onClick={(e) => e.stopPropagation()}>
            <button className="profile-avatar-btn" onClick={() => { setProfileOpen(!profileOpen); setNotiOpen(false); }}>
              <img src={getUploadUrl(currentUser.profilePicture || defaultAvatar)} className="nav-avatar" alt="Avatar" />
            </button>
            <div className={`dropdown-menu ${profileOpen ? 'active' : ''}`} id="nav-dropdown-menu">
              <div className="dropdown-item" onClick={() => navigate(`/profile/${currentUser.username}`)} style={{ fontWeight: 600 }}>
                <img src={getUploadUrl(currentUser.profilePicture || defaultAvatar)} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                <span>{currentUser.fullName}</span>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item" onClick={() => navigate(`/profile/${currentUser.username}?edit=true`)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Edit Profile</span>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
