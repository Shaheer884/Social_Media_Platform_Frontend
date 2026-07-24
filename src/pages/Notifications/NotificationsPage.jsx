import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useNotifications } from '../../context/NotificationsContext';
import { timeAgo } from '../../utils/formatters';
import { getUploadUrl } from '../../utils/mediaHelper';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, markRead, markAllRead } = useNotifications();

  const handleNotificationClick = async (n) => {
    await markRead(n._id);
    if (n.post) {
      navigate(`/post/${n.post._id || n.post}`);
    } else if (n.story) {
      navigate(`/`);
    } else if (n.sender) {
      navigate(`/profile/${n.sender.username}`);
    }
  };

  return (
    <Layout>
      <div className="feed-header">
        <h2 className="feed-title">Notifications Feed</h2>
        {notifications.length > 0 && (
          <button className="mark-read-btn" onClick={markAllRead} style={{ fontSize: '0.9rem' }}>
            Mark all read
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => {
            let actionText = '';
            if (n.type === 'like') actionText = 'liked your post';
            else if (n.type === 'comment') actionText = 'commented on your post';
            else if (n.type === 'story-like') actionText = 'liked your story';
            else if (n.type === 'story-comment') actionText = 'commented on your story';
            else if (n.type === 'follow') {
              actionText = n.sender?.relationshipStatus === 'friends'
                ? 'is now your friend!'
                : 'started following you';
            }

            const postText = n.post ? ` "${(n.post.content || '').substring(0, 20)}..."` : '';
            const avatar = getUploadUrl(n.sender?.profilePicture || '/uploads/default-avatar.png');

            return (
              <div
                key={n._id}
                className={`notification-item ${n.read || n.isRead ? '' : 'unread'}`}
                onClick={() => handleNotificationClick(n)}
                style={{ borderBottom: '1px solid var(--border-color)', padding: '16px' }}
              >
                <img src={avatar} className="notification-avatar" alt="Avatar" style={{ width: '40px', height: '40px' }} />
                <div className="notification-desc">
                  <div style={{ fontSize: '0.95rem' }}>
                    <span className="notification-user">{n.sender?.fullName || 'Someone'}</span>{' '}
                    {actionText}
                    {n.type !== 'follow' && postText}
                  </div>
                  <div className="notification-time">{timeAgo(n.createdAt)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
};

export default NotificationsPage;
