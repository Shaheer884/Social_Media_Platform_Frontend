import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';

const SettingsLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSettingHome = location.pathname === '/settings' || location.pathname === '/settings/';

  // Helper to determine active setting page title
  const getSubTitle = () => {
    const path = location.pathname.replace(/\/$/, '');
    if (path.endsWith('/account')) return 'Account Details';
    if (path.endsWith('/posts')) return 'Manage Posts';
    if (path.endsWith('/theme')) return 'Theme';
    if (path.endsWith('/notifications')) return 'Notifications';
    if (path.endsWith('/privacy')) return 'Privacy';
    if (path.endsWith('/blocked')) return 'Blocked Accounts';
    if (path.endsWith('/comments')) return 'Comments';
    if (path.endsWith('/about')) return 'About ConnectHub';
    if (path.endsWith('/logout')) return 'Logout';
    return 'Settings';
  };

  return (
    <Layout>
      <div className="settings-layout">
        <div className="settings-content-wrapper">
          {/* Back-Button Header for Setting Sub-Pages - visible on ALL devices */}
          {!isSettingHome && (
            <div className="settings-header">
              <button 
                className="settings-back-btn" 
                onClick={() => navigate('/settings')}
                title="Back to Settings"
              >
                ← Back
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
