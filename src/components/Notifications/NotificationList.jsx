import React from 'react';
import NotificationCard from './NotificationCard';

const NotificationList = ({
  notifications,
  selectedIds,
  setSelectedIds,
  onDeleteOne,
  onDeleteMultiple,
  onCardClick
}) => {
  const allIds = notifications.map((n) => n._id);
  const isAllSelected = notifications.length > 0 && selectedIds.length === notifications.length;

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  const handleSelectToggle = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  return (
    <div className="notification-list-container">
      {notifications.length > 0 && (
        <div className="list-bulk-actions">
          <label className="bulk-select-all-label">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAllToggle}
              className="card-checkbox"
            />
            <span>Select All</span>
          </label>

          {selectedIds.length > 0 && (
            <button
              className="btn btn-secondary bulk-delete-btn"
              onClick={onDeleteMultiple}
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '6px 12px', fontSize: '0.85rem' }}
            >
              Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>
      )}

      <div className="notification-cards-wrapper">
        {notifications.map((n) => (
          <NotificationCard
            key={n._id}
            notification={n}
            isSelected={selectedIds.includes(n._id)}
            onSelectToggle={handleSelectToggle}
            onDelete={onDeleteOne}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationList;
