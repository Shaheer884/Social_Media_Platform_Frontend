import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import SettingsSidebar from './SettingsSidebar';

const SettingsLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSettingHome = location.pathname === '/settings' || location.pathname === '/settings/';

  // Helper to determine active setting page title for mobile view
  const getSubTitle = () => {
    const path = location.pathname.replace(/\/$/, '');
    if (path.endsWith('/account')) return 'Account Details';
    if (path.endsWith('/posts')) return 'Manage Posts';
    if (path.endsWith('/theme')) return 'Theme Settings';
    if (path.endsWith('/notifications')) return 'Notification Preferences';
    if (path.endsWith('/privacy')) return 'Privacy & Requests';
    if (path.endsWith('/blocked')) return 'Blocked Accounts';
    if (path.endsWith('/comments')) return 'Comments Settings';
    if (path.endsWith('/about')) return 'About ConnectHub';
    if (path.endsWith('/logout')) return 'Logout';
    return 'Settings';
  };

  return (
    <Layout>
      <div className={`settings-layout ${isSettingHome ? 'sidebar-active' : ''}`}>
        {/* Render settings sidebar (automatically hidden on mobile unless on settings home index) */}
        <SettingsSidebar />

        <div className="settings-content-wrapper">
          {/* Mobile Back-Button Header for Setting Sub-Pages */}
          {!isSettingHome && (
            <div className="settings-header-mobile">
              <button 
                className="settings-back-btn" 
                onClick={() => navigate('/settings')}
                title="Back to Settings"
              >
                ←
              </button>
              <span className="settings-header-title">{getSubTitle()}</span>
            </div>
          )}
          
          <Outlet />
        </div>
      </div>
    </Layout>
  );
};

export default SettingsLayout;
