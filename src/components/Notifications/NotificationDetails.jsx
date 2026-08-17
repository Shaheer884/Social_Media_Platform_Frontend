import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getUploadUrl } from '../../utils/mediaHelper';
import { getTypeIcon } from './NotificationCard';

const formatDateTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const NotificationDetails = ({ notification: n, onDelete, onNavigate }) => {
  const avatar = getUploadUrl(n.sender?.profilePicture || '/uploads/default-avatar.png');
  const typeInfo = getTypeIcon(n.type, n.sender?.relationshipStatus);

  const handleOpenPost = () => {
    if (n.post) onNavigate('post', `/post/${n.post._id || n.post}`);
  };

  const handleVisitProfile = () => {
    if (n.sender) onNavigate('profile', `/profile/${n.sender.username}`);
  };

  const handleViewStory = () => {
    if (n.story) {
      onNavigate('story', `/?storyId=${n.story._id || n.story}`);
    } else {
      onNavigate('story', '/');
    }
  };

  // Render type-specific details block
  const renderDetailBlock = () => {
    switch (n.type) {
      case 'like':
      case 'story-like':
        return (
          <div className="details-type-block like-block">
            <div className="block-preview-box">
              <span className="block-preview-title">Post Preview</span>
              <p className="block-preview-content">
                {n.post?.content || 'No text content available'}
              </p>
              {n.post?.imageUrl && (
                <img
                  src={getUploadUrl(n.post.imageUrl)}
                  className="block-preview-image"
                  alt="Post media"
                />
              )}
            </div>
            <div className="details-actions">
              <button className="btn btn-primary" onClick={handleOpenPost}>
                Open Post
              </button>
            </div>
          </div>
        );

      case 'comment':
      case 'story-comment':
      case 'story-reply':
        return (
          <div className="details-type-block comment-block">
            <div className="commenter-box">
              <span className="comment-label">Activity Comment</span>
              <div className="comment-body-card">
                <span className="comment-quote">“</span>
                <p className="comment-text">{n.message || 'No comment content provided.'}</p>
              </div>
            </div>
            {n.post && (
              <div className="block-preview-box mt-3">
                <span className="block-preview-title">Post Preview</span>
                <p className="block-preview-content">
                  {n.post?.content || 'No text content available'}
                </p>
              </div>
            )}
            <div className="details-actions">
              <button className="btn btn-primary" onClick={handleOpenPost}>
                View Post
              </button>
            </div>
          </div>
        );

      case 'follow':
      case 'friend-request':
      case 'friend-accept':
        return (
          <div className="details-type-block follow-block">
            <div className="user-profile-preview-card">
              <img src={avatar} className="profile-card-avatar" alt="" />
              <div className="profile-card-info">
                <h4 className="profile-card-name">{n.sender?.fullName}</h4>
                <p className="profile-card-username">@{n.sender?.username}</p>
                <div className="profile-card-badges">
                  {n.sender?.relationshipStatus === 'friends' && (
                    <span className="relationship-badge friends">🤝 Friends</span>
                  )}
                  {n.sender?.relationshipStatus === 'following' && (
                    <span className="relationship-badge following">Following</span>
                  )}
                  {n.sender?.relationshipStatus === 'follow_back' && (
                    <span className="relationship-badge follow-back">Follows Back</span>
                  )}
                </div>
              </div>
            </div>
            <div className="details-actions">
              <button className="btn btn-primary" onClick={handleVisitProfile}>
                Visit Profile
              </button>
            </div>
          </div>
        );

      case 'story-mention':
        return (
          <div className="details-type-block story-block">
            <div className="block-preview-box">
              <span className="block-preview-title">Story Preview</span>
              <p className="block-preview-content">
                {n.story?.text || 'Text story preview'}
              </p>
              {n.story?.imageUrl && (
                <img
                  src={getUploadUrl(n.story.imageUrl)}
                  className="block-preview-image"
                  alt="Story media"
                />
              )}
            </div>
            <div className="details-actions">
              <button className="btn btn-primary" onClick={handleViewStory}>
                View Story
              </button>
            </div>
          </div>
        );

      case 'birthday':
      case 'birthday-wish':
      case 'birthday-gift':
        return (
          <div className="details-type-block birthday-block">
            <div className="birthday-wishes-card">
              <div className="birthday-wish-icon">🎈</div>
              <p className="birthday-wish-text">
                {n.message || 'Happy Birthday! Wishing you a great day filled with joy! 🎉'}
              </p>
            </div>
            <div className="details-actions">
              <button className="btn btn-primary" onClick={handleVisitProfile}>
                Visit Profile
              </button>
            </div>
          </div>
        );

      case 'announcement':
        return (
          <div className="details-type-block announcement-block">
            <div className="announcement-card-body">
              <h3 className="announcement-title">System Update</h3>
              <p className="announcement-message">{n.message}</p>
            </div>
            <div className="details-actions">
              <button className="btn btn-secondary" onClick={() => onNavigate('home', '/')}>
                Back to Home
              </button>
            </div>
          </div>
        );

      case 'security':
      case 'password-changed':
        return (
          <div className="details-type-block security-block">
            <div className="security-alert-box">
              <div className="security-status-icon">🔒</div>
              <p className="security-message">{n.message || 'Password successfully changed.'}</p>
              <div className="security-recommendations">
                <h5>Security Recommendation:</h5>
                <ul>
                  <li>Ensure your password is strong and unique.</li>
                  <li>Do not share verification codes or passwords.</li>
                  <li>Enable multi-factor auth if available.</li>
                </ul>
              </div>
            </div>
            <div className="details-actions">
              <button className="btn btn-primary" onClick={() => onNavigate('settings', '/settings/account')}>
                Manage Account Settings
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="details-type-block default-block">
            <p className="default-message">{n.message}</p>
            {n.post && (
              <div className="details-actions">
                <button className="btn btn-primary" onClick={handleOpenPost}>
                  View Associated Post
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="notification-details-card">
      <div className="details-header">
        <div className="details-sender-info">
          <img src={avatar} className="details-sender-avatar" alt="Sender avatar" />
          <div className="details-sender-meta">
            <h3 className="details-sender-name">{n.sender?.fullName || 'System Notification'}</h3>
            <span className="details-date-time">{formatDateTime(n.createdAt)}</span>
          </div>
        </div>
        <div className="details-badge-indicator" title={typeInfo.label}>
          <span className="details-emoji">{typeInfo.emoji}</span>
          <span className="details-label">{typeInfo.label}</span>
        </div>
      </div>

      <div className="details-body">
        {renderDetailBlock()}
      </div>

      <div className="details-footer">
        <button
          className="btn btn-secondary delete-details-btn"
          onClick={() => onDelete(n._id)}
          style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
        >
          Delete Notification
        </button>
      </div>
    </div>
  );
};

export default NotificationDetails;
