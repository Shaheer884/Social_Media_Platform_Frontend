import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationsContext';
import { timeAgo } from '../../utils/formatters';
import { getUploadUrl } from '../../utils/mediaHelper';
import { getTypeIcon, getNotificationContent } from './NotificationCard';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { latestNotifications, markAllRead, markRead } = useNotifications();

  const handleItemClick = async (e, n) => {
    e.stopPropagation();
    onClose();
    await markRead(n._id);
    navigate(`/notifications/${n._id}`);
  };

  const handleSeeAllClick = (e) => {
    e.stopPropagation();
    onClose();
    navigate('/notifications');
  };

  if (!isOpen) return null;

  return (
    <div className="notifications-dropdown active" id="noti-dropdown" onClick={(e) => e.stopPropagation()}>
      <div className="notification-header">
        <span>Notifications</span>
        {latestNotifications.length > 0 && (
          <button className="mark-read-btn" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>
      <div id="notifications-list-container" className="dropdown-list-scroll">
        {latestNotifications.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No new notifications
          </div>
        ) : (
          latestNotifications.map((n) => {
            const isUnread = !n.read && !n.isRead;
            const avatar = getUploadUrl(n.sender?.profilePicture || '/uploads/default-avatar.png');
            const typeInfo = getTypeIcon(n.type, n.sender?.relationshipStatus);
            const content = getNotificationContent(n);

            return (
              <div
                key={n._id}
                className={`dropdown-notification-item ${isUnread ? 'unread' : ''}`}
                onClick={(e) => handleItemClick(e, n)}
              >
                <div className="dropdown-avatar-wrapper">
                  <img src={avatar} className="dropdown-avatar" alt="Avatar" />
                  <span className="dropdown-type-badge" title={typeInfo.label}>
                    {typeInfo.emoji}
                  </span>
                </div>
                <div className="dropdown-desc">
                  <div className="dropdown-text">
                    <span className="dropdown-user">{n.sender?.fullName || 'Someone'}</span>{' '}
                    <span className="dropdown-message-preview">{content}</span>
                  </div>
                  <div className="dropdown-meta">
                    <span className="dropdown-time">{timeAgo(n.createdAt)}</span>
                    {isUnread && <span className="dropdown-unread-dot"></span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="dropdown-see-all-wrapper">
        <button className="dropdown-see-all-btn" onClick={handleSeeAllClick}>
          See All Notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
