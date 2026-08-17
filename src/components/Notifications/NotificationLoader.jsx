import React from 'react';

const NotificationLoader = () => {
  return (
    <div className="notification-skeleton-list">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="notification-skeleton-card">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-info">
            <div className="skeleton-line title"></div>
            <div className="skeleton-line text"></div>
            <div className="skeleton-line time"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationLoader;
