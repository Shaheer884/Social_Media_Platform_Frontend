import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePosts } from '../../context/PostsContext';
import { useDialog } from '../../context/CustomDialogContext';
import { timeAgo } from '../../utils/formatters';
import commentService from '../../services/commentService';
import CommentCard from '../CommentCard/CommentCard';
import Spinner from '../Loader/Spinner';
import { getUploadUrl } from '../../utils/mediaHelper';
import EditPostModal from '../Modal/EditPostModal';
import MentionSuggestions from '../MentionSuggestions/MentionSuggestions';

const PostCard = ({ post, isDetailPage = false, onLikesCountClick }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { removePost, toggleLike, toggleSave, updatePostCommentCount, updatePostInFeed } = usePosts();
  const { showAlert, showConfirm } = useDialog();

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(isDetailPage); // Auto-open on detail page
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef(null);

  const videoRef = useRef(null);

  const isOwnPost = post.author?._id === currentUser?._id;
  const postAvatar = getUploadUrl(post.author?.profilePicture || '/uploads/default-avatar.png');

  // Manage video playback: play only one video at a time, and pause when scrolled out of view
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      const allVideos = document.querySelectorAll('video');
      allVideos.forEach((v) => {
        if (v !== video) {
          v.pause();
        }
      });
    };

    video.addEventListener('play', handlePlay);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          video.pause();
        }
      },
      { threshold: 0 }
    );

    observer.observe(video);

    return () => {
      video.removeEventListener('play', handlePlay);
      observer.unobserve(video);
    };
  }, []);

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

  const handleSaveClick = (e) => {
    e.stopPropagation();
    toggleSave(post._id, post.isSaved);
  };

  const handlePostDelete = async (e) => {
    e.stopPropagation();
    const confirmed = await showConfirm('Are you sure you want to delete this post?', 'Delete Post');
    if (confirmed) {
      try {
        await removePost(post._id);
        if (isDetailPage) {
          navigate('/');
        }
      } catch (err) {
        showAlert(err.message || 'Error deleting post', 'Error');
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
        showAlert('Could not post comment', 'Error');
      }
    }
  };

  const handleCommentDelete = async (commentId) => {
    const confirmed = await showConfirm('Delete comment?', 'Delete Comment');
    if (confirmed) {
      try {
        await commentService.deleteComment(commentId);
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        updatePostCommentCount(post._id, -1);
      } catch (err) {
        showAlert('Could not delete comment', 'Error');
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
    <>
      <div className="card post-card" id={`post-${post._id}`}>
      <div className="post-header">
        <div
          className="post-author-details"
          onClick={() => navigate(`/profile/${post.author?.username}`)}
        >
          <img src={postAvatar} className="post-author-avatar" alt="Avatar" />
          <div>
            <div className="post-author-name" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <span>{post.author?.fullName}</span>
              {post.feeling && (
                <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  is feeling {post.feeling}
                </span>
              )}
            </div>
            <div className="post-author-username">@{post.author?.username}</div>
            {post.location && (
              <div 
                className="post-location-tag" 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/location/${post.location.placeId}`, { state: { location: post.location } });
                }}
                style={{ fontSize: '0.75rem', color: 'var(--admin-primary, #8b5cf6)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px', cursor: 'pointer' }}
              >
                📍 {post.location.name}{post.location.city ? `, ${post.location.city}` : ''}
              </div>
            )}
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
                <div className="dropdown-item edit-post-btn" onClick={(e) => { e.stopPropagation(); setEditModalOpen(true); }} style={{ borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
                  </svg>
                  <span>Edit</span>
                </div>
                <div className="dropdown-item delete-post-btn" onClick={handlePostDelete} style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', cursor: 'pointer' }}>
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
        {post.media && post.media.length > 0 ? (
          post.media.length === 1 && post.media[0].resourceType === 'video' ? (
            <div className="post-image-wrapper" style={isDetailPage ? { marginTop: '16px' } : {}} onClick={(e) => {
              e.stopPropagation();
              setActiveMediaIndex(0);
              setLightboxOpen(true);
            }}>
              <video
                ref={videoRef}
                src={getUploadUrl(post.media[0].url)}
                controls
                onClick={(e) => e.stopPropagation()}
                style={{ width: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#000' }}
              />
            </div>
          ) : (
            <div className={`post-media-grid items-${Math.min(post.media.length, 4)}`} onClick={(e) => e.stopPropagation()}>
              {post.media.slice(0, 4).map((item, idx) => {
                const isLast = idx === 3 && post.media.length > 4;
                const optimizedUrl = item.url.replace('/upload/', '/upload/q_auto,f_auto/');
                return (
                  <div 
                    key={item.publicId || idx} 
                    className="media-grid-item" 
                    onClick={() => {
                      setActiveMediaIndex(idx);
                      setLightboxOpen(true);
                    }}
                  >
                    {item.resourceType === 'video' ? (
                      <video
                        src={item.url}
                        className="grid-media-element"
                        style={{ pointerEvents: 'none' }}
                      />
                    ) : (
                      <img 
                        src={optimizedUrl} 
                        alt={`Post media ${idx}`} 
                        className="grid-media-element" 
                        loading="lazy" 
                      />
                    )}
                    {isLast && (
                      <div className="media-grid-overlay">
                        <span>+{post.media.length - 4}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (post.mediaUrl || post.imageUrl) && (
          <div className="post-image-wrapper" style={isDetailPage ? { marginTop: '16px' } : {}} onClick={(e) => {
            e.stopPropagation();
            setActiveMediaIndex(0);
            setLightboxOpen(true);
          }}>
            {post.mediaType === 'video' ? (
              <video
                ref={videoRef}
                src={getUploadUrl(post.mediaUrl || post.imageUrl)}
                controls
                onClick={(e) => e.stopPropagation()}
                style={{ width: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#000' }}
              />
            ) : (
              <img src={getUploadUrl(post.mediaUrl || post.imageUrl)} alt="Post media" loading="lazy" />
            )}
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

        <button
          className={`post-action-btn save-btn ${post.isSaved ? 'saved' : ''}`}
          onClick={handleSaveClick}
          style={{ marginLeft: 'auto', padding: '4px' }}
          title={post.isSaved ? 'Unsave Post' : 'Save Post'}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
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
          <div className="comment-composer-input-wrapper" style={{ position: 'relative' }}>
            <input
              ref={commentInputRef}
              type="text"
              placeholder="Write a comment..."
              className="comment-composer-input"
              value={commentText}
              maxLength={200}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleCommentSubmit}
              style={isDetailPage ? { padding: '10px 16px' } : {}}
            />
            <MentionSuggestions text={commentText} setText={setCommentText} targetInputRef={commentInputRef} />
            <span className="comment-char-counter">{commentText.length}/200</span>
          </div>
        </div>
      </div>
    </div>

    <EditPostModal
      isOpen={editModalOpen}
      onClose={() => setEditModalOpen(false)}
      post={post}
      onUpdateSuccess={(updatedPost) => {
        updatePostInFeed(updatedPost);
      }}
    />

    {/* Fullscreen Lightbox Preview */}
    {lightboxOpen && (
      <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
        <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>&times;</button>
        
        {(() => {
          const mediaItems = post.media && post.media.length > 0 
            ? post.media 
            : (post.mediaUrl || post.imageUrl)
              ? [{ url: post.mediaUrl || post.imageUrl, resourceType: post.mediaType }]
              : [];
          
          if (mediaItems.length === 0) return null;
          
          return (
            <>
              {mediaItems.length > 1 && (
                <>
                  <button 
                    className="lightbox-prev" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMediaIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
                    }}
                  >
                    &#10094;
                  </button>
                  <button 
                    className="lightbox-next" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMediaIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
                    }}
                  >
                    &#10095;
                  </button>
                </>
              )}

              <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                {(() => {
                  const activeItem = mediaItems[activeMediaIndex];
                  if (!activeItem) return null;

                  if (activeItem.resourceType === 'video') {
                    return (
                      <video 
                        src={activeItem.url} 
                        controls 
                        autoPlay 
                        className="lightbox-media"
                        style={{ maxHeight: '90vh', maxWidth: '90vw' }}
                      />
                    );
                  } else {
                    return (
                      <img 
                        src={activeItem.url} 
                        alt="Lightbox preview" 
                        className="lightbox-media"
                        style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }}
                      />
                    );
                  }
                })()}
              </div>
            </>
          );
        })()}
      </div>
    )}
  </>
  );
};

export default PostCard;
