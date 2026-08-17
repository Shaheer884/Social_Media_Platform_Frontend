import React from 'react';
import { useNavigate } from 'react-router-dom';
import { timeAgo } from '../../utils/formatters';
import { getUploadUrl } from '../../utils/mediaHelper';

export const getTypeIcon = (type, relationshipStatus) => {
  switch (type) {
    case 'like':
      return { emoji: '❤️', label: 'Like' };
    case 'story-like':
      return { emoji: '👍', label: 'Story Like' };
    case 'comment':
    case 'story-comment':
      return { emoji: '💬', label: 'Comment' };
    case 'story-reply':
      return { emoji: '📖', label: 'Story Reply' };
    case 'follow':
      return relationshipStatus === 'friends'
        ? { emoji: '🤝', label: 'Friend' }
        : { emoji: '👤', label: 'Follow' };
    case 'friend-request':
      return { emoji: '🤝', label: 'Friend Request' };
    case 'friend-accept':
      return { emoji: '🎉', label: 'Friend Request Accepted' };
    case 'birthday':
    case 'birthday-wish':
      return { emoji: '🎂', label: 'Birthday' };
    case 'birthday-gift':
      return { emoji: '🎁', label: 'Birthday Gift' };
    case 'announcement':
      return { emoji: '📢', label: 'Announcement' };
    case 'mention':
    case 'story-mention':
      return { emoji: '🏷️', label: 'Mention' };
    case 'security':
    case 'password-changed':
      return { emoji: '🛡️', label: 'Security Alert' };
    case 'chat':
      return { emoji: '💬', label: 'Chat' };
    default:
      return { emoji: '🔔', label: 'Notification' };
  }
};

export const getNotificationContent = (n) => {
  let actionText = '';
  if (n.type === 'like') actionText = 'liked your post';
  else if (n.type === 'comment') actionText = 'commented on your post';
  else if (n.type === 'story-like') actionText = 'liked your story';
  else if (n.type === 'story-comment') actionText = 'commented on your story';
  else if (n.type === 'story-reply') actionText = 'replied to your story';
  else if (n.type === 'story-mention') actionText = 'mentioned you in a story';
  else if (n.type === 'follow') {
    actionText = n.sender?.relationshipStatus === 'friends'
      ? 'is now your friend!'
      : 'started following you';
  } else if (n.type === 'birthday') {
    const recipientId = n.recipient?._id || n.recipient;
    const isSelf = n.sender?._id?.toString() === recipientId?.toString() || n.sender?.toString() === recipientId?.toString();
    actionText = isSelf
      ? 'Happy Birthday! Have a wonderful day! 🎉'
      : 'celebrates their birthday today. Wish them a Happy Birthday! 🎂';
  } else if (n.type === 'birthday-wish') {
    actionText = 'wished you a Happy Birthday! 🎂';
  } else if (n.type === 'birthday-gift') {
    actionText = 'sent you a virtual birthday gift! 🎁';
  } else if (n.type === 'mention') {
    actionText = n.message || 'mentioned you';
  } else if (n.type === 'announcement') {
    actionText = n.message || 'Platform Announcement';
  } else if (n.type === 'password-changed') {
    actionText = 'Your password was successfully changed. 🛡️';
  } else if (n.type === 'security') {
    actionText = n.message || 'Security alert regarding your account.';
  } else {
    actionText = n.message || 'sent you a notification';
  }

  const postText = n.post ? ` "${(n.post.content || '').substring(0, 20)}..."` : '';
  const displayContent = (n.type === 'follow' || n.type === 'announcement' || n.type === 'security' || n.type === 'password-changed')
    ? actionText
    : actionText + postText;

  return displayContent;
};

const NotificationCard = ({
  notification: n,
  isSelected,
  onSelectToggle,
  onDelete,
  onCardClick,
  showCheckbox = true
}) => {
  const isUnread = !n.read && !n.isRead;
  const avatar = getUploadUrl(n.sender?.profilePicture || '/uploads/default-avatar.png');
  const typeInfo = getTypeIcon(n.type, n.sender?.relationshipStatus);
  const displayContent = getNotificationContent(n);

  const handleCardClick = (e) => {
    if (e.target.closest('.card-checkbox-wrapper') || e.target.closest('.card-delete-btn')) {
      return;
    }
    onCardClick(n);
  };

  return (
    <div
      className={`notification-card-item ${isUnread ? 'unread' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
    >
      {showCheckbox && (
        <div className="card-checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectToggle(n._id)}
            className="card-checkbox"
          />
        </div>
      )}

      <div className="card-avatar-wrapper">
        <img src={avatar} className="card-avatar" alt="Avatar" />
        <span className="card-type-badge" title={typeInfo.label}>
          {typeInfo.emoji}
        </span>
      </div>

      <div className="card-content-wrapper">
        <div className="card-text">
          <span className="card-username">{n.sender?.fullName || 'ConnectHub User'}</span>{' '}
          <span className="card-message">{displayContent}</span>
        </div>
        <div className="card-meta">
          <span className="card-time">{timeAgo(n.createdAt)}</span>
          {isUnread && <span className="card-unread-dot" title="Unread"></span>}
        </div>
      </div>

      <button
        className="card-delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(n._id);
        }}
        title="Delete Notification"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
    </div>
  );
};

export default NotificationCard;
