import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { usePosts } from '../../context/PostsContext';
import { useDialog } from '../../context/CustomDialogContext';
import PostCard from '../../components/PostCard/PostCard';
import PostSkeleton from '../../components/Loader/PostSkeleton';
import { getUploadUrl } from '../../utils/mediaHelper';
import Spinner from '../../components/Loader/Spinner';
import Modal from '../../components/Modal/Modal';
import ImageCropperModal from '../../components/Modal/ImageCropperModal';
import userService from '../../services/userService';
import Stories from '../../components/Stories/Stories';

const Home = () => {
  const { currentUser } = useAuth();
  const { posts, loading, page, totalPages, fetchFeed, publishPost } = usePosts();
  const { showAlert } = useDialog();
  const navigate = useNavigate();

  const [postText, setPostText] = useState('');
  const [chosenFile, setChosenFile] = useState(null);
  const [chosenUrl, setChosenUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [publishLoading, setPublishLoading] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const fileInputRef = useRef(null);

  // Initial feed fetching
  useEffect(() => {
    fetchFeed(1, false);
  }, [fetchFeed]);

  // Fetch suggestions when the feed is empty
  useEffect(() => {
    if (posts.length === 0 && !loading) {
      const loadSuggestions = async () => {
        setSuggestionsLoading(true);
        try {
          const res = await userService.getSuggestions();
          if (res.success) {
            setSuggestions(res.data);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setSuggestionsLoading(false);
        }
      };
      loadSuggestions();
    }
  }, [posts.length, loading]);

  const handleFollowClick = async (e, userId) => {
    e.stopPropagation();
    try {
      setSuggestions((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, relationshipStatus: 'following' } : u))
      );
      await userService.followUser(userId);
      await fetchFeed(1, false);
      
      setTimeout(async () => {
        try {
          const res = await userService.getSuggestions();
          if (res.success) {
            setSuggestions(res.data);
          }
        } catch (err) {
          console.error(err);
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      try {
        const res = await userService.getSuggestions();
        if (res.success) {
          setSuggestions(res.data);
        }
      } catch (e2) {
        console.error(e2);
      }
    }
  };

  const handleTextChange = (e) => {
    setPostText(e.target.value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setChosenFile(file);
        setChosenUrl('');
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setCropperSrc(ev.target.result);
          setCropperOpen(true);
        };
        reader.readAsDataURL(file);
      } else {
        showAlert('Please select a valid image or video file', 'Invalid File');
      }
    }
  };

  const handleCropComplete = (croppedFile, previewUrl) => {
    setChosenFile(croppedFile);
    setChosenUrl('');
    setImagePreview(previewUrl);
    setCropperOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlModalOpen = () => {
    setUrlInput(chosenUrl);
    setUrlModalOpen(true);
  };

  const handleUrlModalSave = () => {
    let url = urlInput.trim();
    if (url) {
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      setChosenUrl(url);
      setChosenFile(null); // Reset file
      setImagePreview(url);
    }
    setUrlModalOpen(false);
  };

  const clearSelectedMedia = () => {
    setChosenFile(null);
    setChosenUrl('');
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    if (!postText.trim() && !chosenFile && !chosenUrl) return;

    setPublishLoading(true);
    try {
      let res;
      if (chosenFile) {
        const formData = new FormData();
        formData.append('content', postText.trim());
        formData.append('postImage', chosenFile);
        res = await publishPost(formData);
      } else {
        res = await publishPost({
          content: postText.trim(),
          imageUrlUrl: chosenUrl
        });
      }

      if (res.success) {
        setPostText('');
        clearSelectedMedia();
      }
    } catch (err) {
      showAlert(err.message || 'Error publishing post', 'Error');
    } finally {
      setPublishLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchFeed(page + 1, true);
    }
  };

  const canPublish = (postText.trim().length > 0 || chosenFile !== null || chosenUrl !== '') && postText.length <= 280;

  return (
    <Layout>
      <Stories />
      {/* Create Post Creator Card */}
      <div className="card">
        <div className="creator-container">
          <img src={getUploadUrl(currentUser?.profilePicture || '/uploads/default-avatar.png')} className="creator-avatar" alt="My Avatar" />
          <div className="creator-content">
            <textarea
              className="creator-textarea"
              placeholder="What's happening, ConnectHub?"
              value={postText}
              onChange={handleTextChange}
              maxLength={280}
            />

             {imagePreview && (
              <div className="image-preview-wrapper" style={{ display: 'block' }}>
                <button className="remove-preview-btn" onClick={clearSelectedMedia} type="button">&times;</button>
                {chosenFile && chosenFile.type.startsWith('video/') ? (
                  <video
                    src={imagePreview}
                    controls
                    style={{ width: '100%', maxHeight: '300px', borderRadius: '8px', objectFit: 'contain' }}
                  />
                ) : (
                  <img src={imagePreview} alt="Post Upload Preview" />
                )}
              </div>
            )}

            <div className="creator-actions">
              <div className="creator-buttons">
                {/* File Upload Trigger */}
                <button className="icon-label-btn" type="button" onClick={() => fileInputRef.current.click()} title="Add Photo/Video">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Photo/Video</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden-file-input"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />

                {/* Link Photo Trigger */}
                <button className="icon-label-btn" type="button" onClick={handleUrlModalOpen} title="Add Image URL">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span>Link Photo</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className={`character-counter ${postText.length > 260 ? 'warning' : ''}`}>
                  {postText.length}/280
                </span>
                <button className="btn btn-primary" onClick={handlePublish} disabled={!canPublish || publishLoading}>
                  {publishLoading ? <Spinner size="16px" style={{ borderColor: 'transparent', borderTopColor: '#fff' }} /> : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="feed-header">
        <h2 className="feed-title">Home Feed</h2>
      </div>

      <div id="posts-feed-container">
        {loading && posts.length === 0 ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          <div className="card empty-state-container">
            <div className="empty-state-icon">👋</div>
            <h3 className="empty-state-title">Welcome to ConnectHub!</h3>
            <p className="empty-state-desc" style={{ marginBottom: '16px' }}>
              Your feed is looking empty. Follow recommended creators below or write your first post to get started!
            </p>
            
            <div className="empty-state-suggestions">
              <h4 className="empty-state-suggestions-title">People you may know</h4>
              {suggestionsLoading ? (
                <div className="empty-state-suggestions-loading">
                  <Spinner size="20px" />
                </div>
              ) : suggestions.length === 0 ? (
                <p className="empty-state-suggestions-empty">No suggestions available at the moment.</p>
              ) : (
                <div className="empty-state-suggestions-list">
                  {suggestions.slice(0, 5).map((u) => (
                    <div key={u._id} className="suggested-user-item">
                      <div className="suggested-user-info" onClick={() => navigate(`/profile/${u.username}`)}>
                        <img
                          src={getUploadUrl(u.profilePicture || '/uploads/default-avatar.png')}
                          className="suggested-user-avatar"
                          alt={u.fullName}
                        />
                        <div style={{ lineHeight: '1.2', textAlign: 'left' }}>
                          <div className="suggested-user-name">{u.fullName}</div>
                          <div className="suggested-user-username">@{u.username}</div>
                        </div>
                      </div>
                      {u.relationshipStatus === 'following' || u.relationshipStatus === 'friends' ? (
                        <button className="follow-btn-sm following" disabled>
                          Following
                        </button>
                      ) : (
                        <button className="follow-btn-sm" onClick={(e) => handleFollowClick(e, u._id)}>
                          Follow
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post._id} post={post} />)
        )}
      </div>

      {page < totalPages && (
        <div style={{ textAlign: 'center', margin: '24px 0' }} id="load-more-container">
          <button className="btn btn-secondary" onClick={handleLoadMore} disabled={loading}>
            {loading ? <Spinner size="16px" /> : 'Load More'}
          </button>
        </div>
      )}

      {/* Link Image URL Modal */}
      <Modal isOpen={urlModalOpen} onClose={() => setUrlModalOpen(false)} title="Add Image URL">
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" htmlFor="dialog-image-url">Image web link</label>
            <input
              type="url"
              id="dialog-image-url"
              className="form-input"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setUrlModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUrlModalSave}>Add Image</button>
        </div>
      </Modal>

      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropperSrc}
        aspectRatio={1.6}
        onCrop={handleCropComplete}
        onClose={handleCropCancel}
        title="Crop Post Image"
      />
    </Layout>
  );
};

export default Home;
