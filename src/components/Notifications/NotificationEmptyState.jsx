import React from 'react';

const NotificationEmptyState = () => {
  return (
    <div className="notification-empty-state">
      <div className="empty-state-illustration">
        <svg viewBox="0 0 24 24" width="120" height="120" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          <circle cx="18" cy="6" r="3" fill="var(--danger)" stroke="none" />
          <line x1="18" y1="5" x2="18" y2="7" stroke="var(--white)" strokeWidth="1.5" />
          <circle cx="18" cy="6" r="0.5" fill="var(--white)" stroke="none" />
        </svg>
      </div>
      <h3 className="empty-state-title">No notifications yet</h3>
      <p className="empty-state-message">We'll let you know when something important happens.</p>
    </div>
  );
};

export default NotificationEmptyState;
