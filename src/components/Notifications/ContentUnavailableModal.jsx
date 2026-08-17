import React from 'react';
import { useNavigate } from 'react-router-dom';

const ContentUnavailableModal = ({ status, onClose }) => {
  const navigate = useNavigate();

  if (!status) return null;

  let title = '';
  let message = '';
  let icon = '';

  switch (status) {
    case 'RESOURCE_DELETED':
    case 'POST_DELETED':
      title = 'Post Not Available';
      message = 'This post has been deleted or is no longer available.';
      icon = '🗑️';
      break;
    case 'STORY_EXPIRED':
      title = 'Story Expired';
      message = 'This story has expired and is no longer available.';
      icon = '⏳';
      break;
    case 'STORY_DELETED':
      title = 'Story Deleted';
      message = 'This story has been deleted and is no longer available.';
      icon = '🗑️';
      break;
    case 'COMMENT_REMOVED':
      title = 'Comment Removed';
      message = 'This comment has been removed.';
      icon = '💬';
      break;
    case 'USER_NOT_AVAILABLE':
      title = 'Profile Unavailable';
      message = 'This user profile is no longer available.';
      icon = '👤';
      break;
    default:
      title = 'Content Unavailable';
      message = 'This content is no longer available.';
      icon = '🚫';
  }

  const handleBackToNotification = () => {
    onClose();
    navigate('/notifications');
  };

  return (
    <div className="custom-dialog-overlay" onClick={onClose}>
      <div className="custom-dialog-card" onClick={(e) => e.stopPropagation()}>
        <div className="custom-dialog-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '2.5rem', marginBottom: '4px' }}>{icon}</span>
          <h3 className="custom-dialog-title" style={{ textAlign: 'center' }}>{title}</h3>
        </div>
        <div className="custom-dialog-body" style={{ textAlign: 'center', margin: '12px 0' }}>
          <p className="custom-dialog-message">{message}</p>
        </div>
        <div className="custom-dialog-footer" style={{ justifyContent: 'center', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handleBackToNotification}>
            Back to Notification
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentUnavailableModal;
