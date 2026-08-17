import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar/Navbar';
import Sidebar from './Sidebar/Sidebar';
import RightSidebar from './RightSidebar/RightSidebar';

const Layout = ({ children, onFollowChange }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const fromNotificationId = location.state?.fromNotificationId;
  const isNotificationPage = location.pathname.startsWith('/notifications');

  const handleBackToNotification = () => {
    if (fromNotificationId) {
      navigate(`/notifications/${fromNotificationId}`, { state: location.state });
    } else {
      navigate('/notifications');
    }
  };

  return (
    <>
      <Navbar />
      <div className="app-container">
        <Sidebar />
        <main className="feed-column">
          {fromNotificationId && !isNotificationPage && (
            <div className="back-to-notification-banner">
              <button className="back-to-notification-btn" onClick={handleBackToNotification}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to Notification
              </button>
            </div>
          )}
          {children}
        </main>
        <RightSidebar onFollowChange={onFollowChange} />
      </div>
    </>
  );
};

export default Layout;
