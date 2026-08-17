import React from 'react';

const NotificationSearch = ({ search, setSearch }) => {
  return (
    <div className="notification-search-container">
      <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder="Search by username, type, or keyword..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="notification-search-input"
      />
      {search && (
        <button className="search-clear-btn" onClick={() => setSearch('')} title="Clear search">
          &times;
        </button>
      )}
    </div>
  );
};

export default NotificationSearch;
