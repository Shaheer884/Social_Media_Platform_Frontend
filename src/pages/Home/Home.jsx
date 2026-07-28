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
  const [chosenFiles, setChosenFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [publishLoading, setPublishLoading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    const validPreviews = [];

    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isVideo && !isImage) {
        showAlert('Please select valid image or video files', 'Invalid File Type');
        return;
      }

      if (isImage && file.size > 5 * 1024 * 1024) {
        showAlert(`Image ${file.name} is too large. Maximum size is 5MB.`, 'File Too Large');
        return;
      }

      if (isVideo && file.size > 100 * 1024 * 1024) {
        showAlert(`Video ${file.name} is too large. Maximum size is 100MB.`, 'File Too Large');
        return;
      }

      validFiles.push(file);
      validPreviews.push({
        url: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
        name: file.name
      });
    }

    if (validFiles.length === 1 && validFiles[0].type.startsWith('image/')) {
      const file = validFiles[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCropperSrc(ev.target.result);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    } else {
      setChosenFiles((prev) => [...prev, ...validFiles]);
      setImagePreviews((prev) => [...prev, ...validPreviews]);
    }
  };

  const handleCropComplete = (croppedFile, previewUrl) => {
    setChosenFiles((prev) => [...prev, croppedFile]);
    setImagePreviews((prev) => [...prev, { url: previewUrl, type: 'image', name: croppedFile.name }]);
    setCropperOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const removeSelectedFile = (index) => {
    const preview = imagePreviews[index];
    if (preview && preview.url.startsWith('blob:')) {
      URL.revokeObjectURL(preview.url);
    }
    setChosenFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const clearSelectedMedia = () => {
    imagePreviews.forEach((p) => {
      if (p.url.startsWith('blob:')) {
        URL.revokeObjectURL(p.url);
      }
    });
    setChosenFiles([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    if (!postText.trim() && chosenFiles.length === 0) return;

    setPublishLoading(true);
    try {
      let res;
      if (chosenFiles.length > 0) {
        const formData = new FormData();
        formData.append('content', postText.trim());
        chosenFiles.forEach((file) => {
          formData.append('postImages', file);
        });
        res = await publishPost(formData);
      } else {
        res = await publishPost({
          content: postText.trim()
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

  const canPublish = (postText.trim().length > 0 || chosenFiles.length > 0) && postText.length <= 280;

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

             {imagePreviews.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px', marginBottom: '12px' }}>
                {imagePreviews.map((p, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(idx)}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', cursor: 'pointer', zIndex: 2 }}
                    >
                      &times;
                    </button>
                    {p.type === 'video' ? (
                      <video
                        src={p.url}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <img
                        src={p.url}
                        alt="upload preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                ))}
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
                  multiple
                  onChange={handleFileChange}
                />

                {/* Camera Trigger */}
                <button className="icon-label-btn" type="button" onClick={() => cameraInputRef.current.click()} title="Open Camera">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Camera</span>
                </button>
                <input
                  type="file"
                  ref={cameraInputRef}
                  className="hidden-file-input"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                />
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
