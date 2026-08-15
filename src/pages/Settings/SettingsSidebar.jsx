import React from 'react';
import { NavLink } from 'react-router-dom';

const SettingsSidebar = () => {
  const menuItems = [
    { path: '/settings/account', label: 'Account Details', icon: '👤' },
    { path: '/settings/posts', label: 'Manage Posts', icon: '📝' },
    { path: '/settings/theme', label: 'Theme', icon: '🎨' },
    { path: '/settings/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/settings/privacy', label: 'Privacy & Requests', icon: '🔒' },
    { path: '/settings/blocked', label: 'Blocked Accounts', icon: '🚫' },
    { path: '/settings/comments', label: 'Comments Settings', icon: '💬' },
    { path: '/settings/about', label: 'About ConnectHub', icon: 'ℹ️' },
    { path: '/settings/logout', label: 'Logout', icon: '🚪' }
  ];

  return (
    <aside className="settings-sidebar">
      <div className="settings-sidebar-title">Settings</div>
      <nav className="settings-nav-list">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `settings-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="settings-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default SettingsSidebar;
