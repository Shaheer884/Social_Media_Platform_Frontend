import React from 'react';
import { useNavigate } from 'react-router-dom';
import { timeAgo } from '../../utils/formatters';
import { getUploadUrl } from '../../utils/mediaHelper';

const CommentCard = ({ comment, onCommentDelete, currentUserId }) => {
  const navigate = useNavigate();
  const avatar = getUploadUrl(comment.author?.profilePicture || '/uploads/default-avatar.png');
  const isOwnComment = comment.author?._id === currentUserId;

  return (
    <div className="comment-item" id={`comment-${comment._id}`}>
      <img src={avatar} className="comment-author-avatar" alt="Avatar" />
      <div className="comment-content-wrapper">
        <div>
          <span
            className="comment-author-name"
            onClick={() => navigate(`/profile/${comment.author?.username}`)}
          >
            {comment.author?.fullName}
          </span>
          <span className="comment-text">{comment.content}</span>
        </div>
        <div className="comment-meta">
          <span>{timeAgo(comment.createdAt)}</span>
        </div>
      </div>
      {isOwnComment && (
        <button
          className="delete-comment-btn"
          onClick={() => onCommentDelete(comment._id)}
          style={{ fontSize: '1.25rem' }}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default CommentCard;
