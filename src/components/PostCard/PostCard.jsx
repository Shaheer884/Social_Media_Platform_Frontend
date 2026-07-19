import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePosts } from '../../context/PostsContext';
import { timeAgo } from '../../utils/formatters';
import commentService from '../../services/commentService';
import CommentCard from '../CommentCard/CommentCard';
import Spinner from '../Loader/Spinner';
import { getUploadUrl } from '../../utils/mediaHelper';

const PostCard = ({ post, isDetailPage = false, onLikesCountClick }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { removePost, toggleLike, updatePostCommentCount } = usePosts();

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(isDetailPage); // Auto-open on detail page
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const isOwnPost = post.author?._id === currentUser?._id;
  const postAvatar = getUploadUrl(post.author?.profilePicture || '/uploads/default-avatar.png');

  // Toggle comments list
  const handleCommentBtnClick = () => {
    if (isDetailPage) return; // Always open on detail page
    setCommentsOpen((prev) => !prev);
  };

  // Fetch comments
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await commentService.getComments(post._id);
      if (res.success) {
        setComments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (commentsOpen) {
      fetchComments();
    }
  }, [commentsOpen, post._id]);

  const handleLikeClick = (e) => {
    // If clicking directly on the counter text, trigger list modal (if provided)
    if (e.target.classList.contains('like-count') && onLikesCountClick) {
      e.stopPropagation();
      onLikesCountClick();
      return;
    }
    toggleLike(post._id, post.isLiked);
  };

  const handlePostDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await removePost(post._id);
        if (isDetailPage) {
          navigate('/');
        }
      } catch (err) {
        alert(err.message || 'Error deleting post');
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    if (e.key === 'Enter') {
      const val = commentText.trim();
      if (!val) return;

      try {
        setCommentText('');
        const res = await commentService.createComment(post._id, val);
        if (res.success) {
          setComments((prev) => [...prev, res.data]);
          updatePostCommentCount(post._id, 1);
        }
      } catch (err) {
        alert('Could not post comment');
      }
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (window.confirm('Delete comment?')) {
      try {
        await commentService.deleteComment(commentId);
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        updatePostCommentCount(post._id, -1);
      } catch (err) {
        alert('Could not delete comment');
      }
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const closeDropdown = () => setOptionsOpen(false);
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, []);

  return (
    <div className="card post-card" id={`post-${post._id}`}>
      <div className="post-header">
        <div
          className="post-author-details"
          onClick={() => navigate(`/profile/${post.author?.username}`)}
        >
          <img src={postAvatar} className="post-author-avatar" alt="Avatar" />
          <div>
            <div className="post-author-name">{post.author?.fullName}</div>
            <div className="post-author-username">@{post.author?.username}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="post-time">{timeAgo(post.createdAt)}</span>
          {isOwnPost && (
            <div className="post-options-container" onClick={(e) => e.stopPropagation()}>
              <button
                className="nav-btn post-options-toggle"
                style={{ padding: '4px' }}
                onClick={() => setOptionsOpen(!optionsOpen)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              <div className={`post-options-dropdown ${optionsOpen ? 'active' : ''}`}>
                <div className="dropdown-item delete-post-btn" onClick={handlePostDelete} style={{ color: 'var(--danger)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                  <span>Delete</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="post-body" onClick={() => !isDetailPage && navigate(`/post/${post._id}`)} style={{ cursor: !isDetailPage ? 'pointer' : 'default' }}>
        <div className="post-text" style={isDetailPage ? { fontSize: '1.1rem', lineHeight: '1.6' } : {}}>
          {post.content}
        </div>
        {post.imageUrl && (
          <div className="post-image-wrapper" style={isDetailPage ? { marginTop: '16px' } : {}}>
            <img src={getUploadUrl(post.imageUrl)} alt="Post media" loading="lazy" />
          </div>
        )}
      </div>

      <div className="post-footer-actions">
        <button className={`post-action-btn like-btn ${post.isLiked ? 'liked' : ''}`} onClick={handleLikeClick}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          <span className="like-count" id={isDetailPage ? 'detail-like-count' : undefined}>
            {post.likesCount}
          </span>
        </button>

        <button className="post-action-btn comment-btn" onClick={handleCommentBtnClick} style={isDetailPage ? { cursor: 'default' } : {}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span id={isDetailPage ? 'detail-comment-count' : undefined}>{post.commentCount}</span>
        </button>
      </div>

      <div className={`comment-thread-section ${commentsOpen ? 'active' : ''}`} style={isDetailPage ? { marginTop: '16px' } : {}}>
        <div className="comments-list" id={`comments-list-${post._id}`} style={isDetailPage ? { maxHeight: 'none' } : {}}>
          {loadingComments ? (
            <div style={{ padding: '8px', textAlign: 'center' }}>
              <Spinner size="14px" />
            </div>
          ) : comments.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
              <CommentCard
                key={comment._id}
                comment={comment}
                currentUserId={currentUser?._id}
                onCommentDelete={handleCommentDelete}
              />
            ))
          )}
        </div>

        <div className="comment-composer" style={isDetailPage ? { marginTop: '20px' } : {}}>
          <img
            src={getUploadUrl(currentUser?.profilePicture || '/uploads/default-avatar.png')}
            style={{ width: isDetailPage ? '32px' : '28px', height: isDetailPage ? '32px' : '28px', borderRadius: '50%', objectFit: 'cover' }}
            alt="My avatar"
          />
          <div className="comment-composer-input-wrapper">
            <input
              type="text"
              placeholder="Write a comment..."
              className="comment-composer-input"
              value={commentText}
              maxLength={200}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleCommentSubmit}
              style={isDetailPage ? { padding: '10px 16px' } : {}}
            />
            <span className="comment-char-counter">{commentText.length}/200</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
