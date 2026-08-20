import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationsContext';
import { timeAgo } from '../../../utils/formatters';
import { getUploadUrl } from '../../../utils/mediaHelper';
import PWAInstallButton from '../../PWA/PWAInstallButton';
import settingsService from '../../../services/settingsService';

import NotificationDropdown from '../../Notifications/NotificationDropdown';

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });
  const [isSystemDark, setIsSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [notiOpen, setNotiOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync theme preference from database on mount if authenticated
  useEffect(() => {
    const fetchTheme = async () => {
      if (!currentUser) return;
      try {
        const res = await settingsService.getSettings();
        if (res.success && res.data.theme) {
          const cloudTheme = res.data.theme;
          setTheme(cloudTheme);
          localStorage.setItem('theme', cloudTheme);
          window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: cloudTheme } }));
        }
      } catch (err) {
        console.error('Failed to fetch theme from cloud on navbar mount:', err);
      }
    };
    fetchTheme();
  }, [currentUser]);

  // Handle HTML document body themes class application
  useEffect(() => {
    const applyTheme = (themeName) => {
      const body = document.body;
      if (themeName === 'dark') {
        body.classList.add('dark-theme');
      } else if (themeName === 'light') {
        body.classList.remove('dark-theme');
      } else if (themeName === 'system') {
        if (isSystemDark) {
          body.classList.add('dark-theme');
        } else {
          body.classList.remove('dark-theme');
        }
      }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme, isSystemDark]);

  // Listen to system preference changes, custom theme-changed events, and storage events
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      setIsSystemDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleSystemChange);

    const handleThemeChange = (e) => {
      if (e.detail && e.detail.theme) {
        setTheme(e.detail.theme);
      }
    };
    window.addEventListener('theme-changed', handleThemeChange);

    const handleStorageChange = (e) => {
      if (e.key === 'theme' && e.newValue) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      window.removeEventListener('theme-changed', handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleTheme = async (e) => {
    e.stopPropagation();

    // Determine the next theme based on what's currently active (dark or light)
    const isCurrentlyDark = 
      theme === 'dark' || 
      (theme === 'system' && isSystemDark);

    const nextTheme = isCurrentlyDark ? 'light' : 'dark';

    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);

    // Dispatch event to notify other tabs/components in real-time
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: nextTheme } }));

    // Persist to database if authenticated
    if (currentUser) {
      try {
        await settingsService.updateTheme(nextTheme);
      } catch (err) {
        console.error('Failed to sync theme to database:', err);
      }
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim();
      if (q) {
        navigate(`/search?q=${encodeURIComponent(q)}`);
      }
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
    <header id="main-header" className="main-header">
      <div className="navbar-gradient-line"></div>
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
          <PWAInstallButton />
          <button className="nav-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' || (theme === 'system' && isSystemDark) ? (
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

          {currentUser ? (
            <>
              <div className="notification-dropdown-container" onClick={(e) => e.stopPropagation()}>
                <button className="nav-btn" onClick={() => { setNotiOpen(!notiOpen); setProfileOpen(false); }} title="Notifications">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                  {unreadCount > 0 && <span className="notification-badge" id="noti-badge">{unreadCount}</span>}
                </button>
                <NotificationDropdown isOpen={notiOpen} onClose={() => setNotiOpen(false)} />
              </div>

              <div className="profile-dropdown-container" onClick={(e) => e.stopPropagation()}>
                <button className="profile-avatar-btn" onClick={() => { setProfileOpen(!profileOpen); setNotiOpen(false); }}>
                  <img src={getUploadUrl(currentUser.profilePicture || defaultAvatar)} className="nav-avatar" alt="Avatar" />
                </button>
                <div className={`dropdown-menu ${profileOpen ? 'active' : ''}`} id="nav-dropdown-menu">
                  <div className="dropdown-item" onClick={() => navigate(`/profile/${currentUser.username}`)} style={{ fontWeight: 600 }}>
                    <img src={getUploadUrl(currentUser.profilePicture || defaultAvatar)} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', marginRight: '8px' }} alt="" />
                    <span>My Profile</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  {currentUser?.role === 'admin' && (
                    <>
                      <div className="dropdown-item" onClick={() => navigate('/admin/dashboard')} style={{ color: 'var(--purple)', fontWeight: 600 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                        </svg>
                        <span>Admin Panel</span>
                      </div>
                      <div className="dropdown-divider"></div>
                    </>
                  )}
                  <div className="dropdown-item" onClick={() => navigate('/settings')}>
                    <span style={{ marginRight: '8px' }}>⚙️</span>
                    <span>Settings</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item" onClick={() => navigate('/settings/logout')} style={{ color: 'var(--danger)' }}>
                    <span style={{ marginRight: '8px' }}>🚪</span>
                    <span>Logout</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="navbar-guest-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => navigate('/login', { state: { from: { pathname: window.location.pathname } } })}
                style={{ padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Login
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/register', { state: { from: { pathname: window.location.pathname } } })}
                style={{ padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
