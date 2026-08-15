import React from 'react';
import { Link } from 'react-router-dom';

const SettingsHome = () => {
  const settingsCategories = [
    {
      path: '/settings/account',
      title: 'Account Details',
      desc: 'Update your avatar, username, email, location, biography, and personal links.',
      icon: '👤'
    },
    {
      path: '/settings/posts',
      title: 'Manage Posts',
      desc: 'Search, filter, sort, edit, archive, hide, or delete your posts.',
      icon: '📝'
    },
    {
      path: '/settings/theme',
      title: 'Theme Settings',
      desc: 'Choose between Light, Dark, or System Default visual styles.',
      icon: '🎨'
    },
    {
      path: '/settings/notifications',
      title: 'Notification Preferences',
      desc: 'Manage your notification alerts for likes, comments, stories, and friends.',
      icon: '🔔'
    },
    {
      path: '/settings/privacy',
      title: 'Privacy & Follow Requests',
      desc: 'Toggle Private Account status and manage pending follower requests.',
      icon: '🔒'
    },
    {
      path: '/settings/blocked',
      title: 'Blocked Accounts',
      desc: 'View and manage users you have blocked on your feed.',
      icon: '🚫'
    },
    {
      path: '/settings/comments',
      title: 'Comments Settings',
      desc: 'Configure who can comment on your posts and moderate contents.',
      icon: '💬'
    },
    {
      path: '/settings/about',
      title: 'About ConnectHub',
      desc: 'Learn about ConnectHub version info, stack details, and terms.',
      icon: 'ℹ️'
    },
    {
      path: '/settings/logout',
      title: 'Logout',
      desc: 'Safely terminate your active user session and clear cache data.',
      icon: '🚪'
    }
  ];

  return (
    <div className="settings-content-wrapper">
      <div className="settings-card">
        <div className="settings-card-header" style={{ marginBottom: '20px', borderBottom: 'none', paddingBottom: '0' }}>
          <h2 className="settings-card-title">Settings</h2>
          <p className="settings-card-desc">Select a setting category below to configure your preferences.</p>
        </div>
        <div className="settings-home-menu">
          {settingsCategories.map((item) => (
            <Link key={item.path} to={item.path} className="settings-home-item">
              <div className="settings-home-item-left">
                <div className="settings-home-icon-circle">{item.icon}</div>
                <div className="settings-home-details">
                  <span className="settings-home-title">{item.title}</span>
                  <span className="settings-home-desc">{item.desc}</span>
                </div>
              </div>
              <span className="settings-home-arrow">➔</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsHome;
