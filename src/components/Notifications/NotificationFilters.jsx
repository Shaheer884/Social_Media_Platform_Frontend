import React from 'react';

const NotificationFilters = ({ activeFilter, setActiveFilter }) => {
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
    { key: 'likes', label: 'Likes' },
    { key: 'comments', label: 'Comments' },
    { key: 'follows', label: 'Follows' },
    { key: 'friend-requests', label: 'Friend Requests' },
    { key: 'stories', label: 'Stories' },
    { key: 'admin', label: 'Admin' },
    { key: 'birthdays', label: 'Birthdays' }
  ];

  return (
    <div className="notification-filters-container">
      {filters.map((f) => (
        <button
          key={f.key}
          className={`filter-pill ${activeFilter === f.key ? 'active' : ''}`}
          onClick={() => setActiveFilter(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
};

export default NotificationFilters;
