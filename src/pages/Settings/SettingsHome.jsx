import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import QRScanner from '../../components/ProfileQR/QRScanner';

const SettingsHome = () => {
  const [scannerOpen, setScannerOpen] = useState(false);
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
      title: 'Theme',
      desc: 'Choose between Light, Dark, or System Default visual styles.',
      icon: '🎨'
    },
    {
      path: '/settings/notifications',
      title: 'Notifications',
      desc: 'Manage your notification alerts for likes, comments, stories, and friends.',
      icon: '🔔'
    },
    {
      path: '/settings/privacy',
      title: 'Privacy',
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
      title: 'Comments',
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
    },
    {
      path: '#scan',
      title: 'Scan QR Code',
      desc: 'Open your camera to scan another user\'s ConnectHub profile QR Code.',
      icon: '📷',
      isCustomAction: true,
      onClick: () => setScannerOpen(true)
    }
  ];

  return (
    <div className="settings-card">
      <div className="settings-card-header" style={{ marginBottom: '20px', borderBottom: 'none', paddingBottom: '0' }}>
        <p className="settings-card-desc">Select a setting category below to configure your preferences.</p>
      </div>
      <div className="settings-home-menu">
        {settingsCategories.map((item) => {
          if (item.isCustomAction) {
            return (
              <div 
                key={item.path} 
                className="settings-home-item" 
                onClick={item.onClick}
                style={{ cursor: 'pointer' }}
              >
                <div className="settings-home-item-left">
                  <div className="settings-home-icon-circle">{item.icon}</div>
                  <div className="settings-home-details">
                    <span className="settings-home-title">{item.title}</span>
                    <span className="settings-home-desc">{item.desc}</span>
                  </div>
                </div>
                <span className="settings-home-arrow">➔</span>
              </div>
            );
          }
          return (
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
          );
        })}
      </div>
      <QRScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
    </div>
  );
};

export default SettingsHome;
