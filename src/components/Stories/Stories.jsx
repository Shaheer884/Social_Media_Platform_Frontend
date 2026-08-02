import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/CustomDialogContext';
import storyService from '../../services/storyService';
import { getUploadUrl } from '../../utils/mediaHelper';
import Modal from '../Modal/Modal';
import Spinner from '../Loader/Spinner';
import MentionSuggestions from '../MentionSuggestions/MentionSuggestions';

const GRADIENTS = [
  'linear-gradient(135deg, #8b5cf6, #ec4899)', // Purple -> Pink (Default)
  'linear-gradient(135deg, #3b82f6, #8b5cf6)', // Blue -> Purple
  'linear-gradient(135deg, #10b981, #3b82f6)', // Green -> Blue
  'linear-gradient(135deg, #f59e0b, #ec4899)', // Orange -> Pink
  'linear-gradient(135deg, #ef4444, #f59e0b)', // Red -> Orange
  'linear-gradient(135deg, #1e293b, #0f172a)'  // Slate -> Dark
];

const Stories = () => {
  const { currentUser } = useAuth();
  const { showAlert, showConfirm } = useDialog();

  const storyInputRef = useRef(null);
  const editStoryInputRef = useRef(null);
  const storyCommentInputRef = useRef(null);

  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Creation Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [storyCreatorTab, setStoryCreatorTab] = useState('image'); // 'image' or 'text'
  const [storyText, setStoryText] = useState('');
  const [chosenGradient, setChosenGradient] = useState(GRADIENTS[0]);
  const [chosenFile, setChosenFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Viewer Modal States
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [storyDuration, setStoryDuration] = useState(5000);

  // Edit Story States
  const [editModeOpen, setEditModeOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [editGradient, setEditGradient] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Commenting States
  const [commentInputFocused, setCommentInputFocused] = useState(false);
  const [storyCommentText, setStoryCommentText] = useState('');

  const fileInputRef = useRef(null);
  const progressTimerRef = useRef(null);
  const storiesRef = useRef(null);
  const viewerVideoRef = useRef(null);
  const commentsListRef = useRef(null);
  const lastActiveStoryIdRef = useRef(null);

  const activeGroup = storyGroups[selectedGroupIndex];
  const activeStory = activeGroup ? activeGroup.stories[selectedStoryIndex] : null;
  const isOwnActiveStory = activeStory && activeStory.user._id === currentUser?._id;
  const isLiked = activeStory && activeStory.likes && activeStory.likes.includes(currentUser?._id);
  const likeCount = activeStory && activeStory.likes ? activeStory.likes.length : 0;

  // Auto-scroll comments in story viewer (TikTok style)
  useEffect(() => {
    const container = commentsListRef.current;
    if (!container || !viewerOpen || !activeStory) return;

    const isNewStory = lastActiveStoryIdRef.current !== activeStory._id;
    lastActiveStoryIdRef.current = activeStory._id;

    if (isNewStory) {
      // Reset scroll to top
      container.scrollTop = 0;

      // Duration capped just below active duration
      const duration = Math.max(3000, storyDuration - 800);
      let animationFrameId;
      let delayTimeout;

      delayTimeout = setTimeout(() => {
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const maxScroll = scrollHeight - clientHeight;

        if (maxScroll <= 0) return;

        const startTime = performance.now();

        const animateScroll = (now) => {
          const elapsed = now - startTime;
          const progressPercent = Math.min(elapsed / duration, 1);

          container.scrollTop = progressPercent * maxScroll;

          if (progressPercent < 1) {
            animationFrameId = requestAnimationFrame(animateScroll);
          }
        };

        animationFrameId = requestAnimationFrame(animateScroll);
      }, 500);

      return () => {
        clearTimeout(delayTimeout);
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    } else {
      // User commented: scroll directly to the bottom
      container.scrollTop = container.scrollHeight;
    }
  }, [selectedStoryIndex, selectedGroupIndex, viewerOpen, activeStory, storyDuration]);

  const loadStories = async () => {
    try {
      const res = await storyService.getStories();
      if (res.success) {
        const hiddenUsers = JSON.parse(localStorage.getItem('hidden_stories_users') || '[]');
        const filtered = res.data.filter((group) => !hiddenUsers.includes(group.user._id.toString()));
        setStoryGroups(filtered);
      }
    } catch (err) {
      console.error('Failed to load stories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    const el = storiesRef.current;
    if (el) {
      const handleWheel = (e) => {
        if (e.deltaY === 0) return;
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      };
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        el.removeEventListener('wheel', handleWheel);
      };
    }
  }, [loading]);

  // Reset story duration on story change
  useEffect(() => {
    setStoryDuration(5000);
  }, [selectedStoryIndex, selectedGroupIndex]);

  // Sync play/pause for video stories in viewer
  useEffect(() => {
    const video = viewerVideoRef.current;
    if (!video) return;

    const shouldPlay = viewerOpen && !editModeOpen && !commentInputFocused;
    if (shouldPlay) {
      video.play().catch((err) => console.log('Story video autoplay blocked:', err));
    } else {
      video.pause();
    }
  }, [viewerOpen, editModeOpen, commentInputFocused, selectedStoryIndex, selectedGroupIndex]);

  // Autoplay Logic
  useEffect(() => {
    if (!viewerOpen || editModeOpen || commentInputFocused) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    setProgress(0);
    const duration = storyDuration;
    const step = 50; // Update progress every 50ms
    const totalSteps = duration / step;
    let currentStep = 0;

    progressTimerRef.current = setInterval(() => {
      currentStep++;
      const val = (currentStep / totalSteps) * 100;
      setProgress(val);

      if (currentStep >= totalSteps) {
        clearInterval(progressTimerRef.current);
        handleNextStory();
      }
    }, step);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [viewerOpen, selectedGroupIndex, selectedStoryIndex, editModeOpen, commentInputFocused, storyDuration]);

  const handleVideoLoadedMetadata = (e) => {
    const durationSec = e.target.duration;
    if (durationSec && !isNaN(durationSec)) {
      setStoryDuration(durationSec * 1000);
    }
  };

  const handleNextStory = () => {
    const currentGroup = storyGroups[selectedGroupIndex];
    if (!currentGroup) return;

    if (selectedStoryIndex < currentGroup.stories.length - 1) {
      // Go to next story of same user
      setSelectedStoryIndex((prev) => prev + 1);
    } else if (selectedGroupIndex < storyGroups.length - 1) {
      // Go to first story of next user
      setSelectedGroupIndex((prev) => prev + 1);
      setSelectedStoryIndex(0);
    } else {
      // All stories completed, close viewer
      setViewerOpen(false);
    }
  };

  const handlePrevStory = () => {
    if (selectedStoryIndex > 0) {
      // Go to previous story of same user
      setSelectedStoryIndex((prev) => prev - 1);
    } else if (selectedGroupIndex > 0) {
      // Go to last story of previous user
      const prevGroup = storyGroups[selectedGroupIndex - 1];
      setSelectedGroupIndex((prev) => prev - 1);
      setSelectedStoryIndex(prevGroup.stories.length - 1);
    } else {
      // Already at the very first story, restart it
      setProgress(0);
      setSelectedStoryIndex(0);
    }
  };

  const openViewer = (groupIndex) => {
    setSelectedGroupIndex(groupIndex);
    setSelectedStoryIndex(0);
    setViewerOpen(true);
  };

  // Create Story logic
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isVideo && !isImage) {
        showAlert('Please select a valid image or video file', 'Invalid File');
        return;
      }

      if (isImage && file.size > 5 * 1024 * 1024) {
        showAlert('Image file size is too large. Maximum size is 5MB.', 'File Too Large');
        return;
      }

      if (isVideo && file.size > 100 * 1024 * 1024) {
        showAlert('Video file size is too large. Maximum size is 100MB.', 'File Too Large');
        return;
      }

      if (isVideo) {
        const videoElement = document.createElement('video');
        const objectUrl = URL.createObjectURL(file);
        videoElement.src = objectUrl;
        videoElement.onloadedmetadata = () => {
          if (videoElement.duration > 60) {
            showAlert('Video duration cannot exceed 60 seconds', 'Invalid Video Length');
            URL.revokeObjectURL(objectUrl);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
          // Clean up previous blob if any
          if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
          }
          setChosenFile(file);
          setImagePreview(objectUrl);
        };
      } else if (file.type.startsWith('image/')) {
        // Clean up previous blob if any
        if (imagePreview && imagePreview.startsWith('blob:')) {
          URL.revokeObjectURL(imagePreview);
        }
        setChosenFile(file);
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        showAlert('Please select a valid image or video file', 'Invalid File');
      }
    }
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setChosenFile(null);
    setImagePreview('');
    setStoryText('');
    setChosenGradient(GRADIENTS[0]);
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handlePublishStory = async (e) => {
    e.preventDefault();
    if (storyCreatorTab === 'image' && !chosenFile) {
      showAlert('Please choose an image or video for your story', 'Error');
      return;
    }
    if (storyCreatorTab === 'text' && !storyText.trim()) {
      showAlert('Please enter text for your story', 'Error');
      return;
    }

    setIsPublishing(true);
    try {
      let res;
      if (storyCreatorTab === 'image') {
        const formData = new FormData();
        formData.append('text', storyText.trim());
        formData.append('storyImage', chosenFile);
        res = await storyService.createStory(formData);
      } else {
        res = await storyService.createStory({
          text: storyText.trim(),
          backgroundColor: chosenGradient
        });
      }

      if (res.success) {
        await loadStories();
        setCreateModalOpen(false);
        // Reset fields
        setStoryText('');
        if (imagePreview && imagePreview.startsWith('blob:')) {
          URL.revokeObjectURL(imagePreview);
        }
        setChosenFile(null);
        setImagePreview('');
        setChosenGradient(GRADIENTS[0]);
      }
    } catch (err) {
      showAlert(err.message || 'Failed to create story', 'Error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Hide user stories
  const handleHideUserStories = async (e, userToHide) => {
    e.stopPropagation();
    if (!userToHide) return;

    const confirmHide = await showConfirm(
      `Are you sure you want to hide all stories from ${userToHide.fullName}? You will no longer see their stories in your feed.`,
      'Hide Stories'
    );
    if (!confirmHide) return;

    try {
      const hiddenUsers = JSON.parse(localStorage.getItem('hidden_stories_users') || '[]');
      if (!hiddenUsers.includes(userToHide._id.toString())) {
        hiddenUsers.push(userToHide._id.toString());
        localStorage.setItem('hidden_stories_users', JSON.stringify(hiddenUsers));
      }

      // Filter locally
      setStoryGroups((prev) => prev.filter((group) => group.user._id.toString() !== userToHide._id.toString()));
      
      // Close the viewer
      setViewerOpen(false);
      showAlert(`Stories from ${userToHide.fullName} have been hidden.`, 'Success');
    } catch (err) {
      console.error(err);
      showAlert('Could not hide stories', 'Error');
    }
  };

  const handleResetHiddenStories = async (e) => {
    e.stopPropagation();
    const confirmReset = await showConfirm(
      'Are you sure you want to unhide all stories that you previously muted?',
      'Unhide Stories'
    );
    if (!confirmReset) return;

    localStorage.removeItem('hidden_stories_users');
    loadStories();
    showAlert('All hidden stories have been restored.', 'Success');
  };

  // Delete Story
  const handleDeleteStory = async (storyId) => {
    const confirmDelete = await showConfirm(
      'Are you sure you want to permanently delete this story?',
      'Delete Story'
    );
    if (!confirmDelete) return;

    try {
      const res = await storyService.deleteStory(storyId);
      if (res.success) {
        const currentGroup = storyGroups[selectedGroupIndex];
        const newGroupStories = currentGroup.stories.filter((s) => s._id !== storyId);

        if (newGroupStories.length === 0) {
          // No stories left in this group, remove the group entirely
          const newGroups = storyGroups.filter((_, idx) => idx !== selectedGroupIndex);
          setStoryGroups(newGroups);

          // Close viewer or shift index
          if (newGroups.length === 0) {
            setViewerOpen(false);
          } else {
            // Shift to next group or go to index 0
            const nextIdx = selectedGroupIndex >= newGroups.length ? newGroups.length - 1 : selectedGroupIndex;
            setSelectedGroupIndex(nextIdx);
            setSelectedStoryIndex(0);
          }
        } else {
          // Update the stories array in this group
          const newGroups = storyGroups.map((g, idx) =>
            idx === selectedGroupIndex ? { ...g, stories: newGroupStories } : g
          );
          setStoryGroups(newGroups);

          // Shift selected story index if it is now out of bounds
          const nextStoryIdx = selectedStoryIndex >= newGroupStories.length ? newGroupStories.length - 1 : selectedStoryIndex;
          setSelectedStoryIndex(nextStoryIdx);
        }
      }
    } catch (err) {
      showAlert(err.message || 'Failed to delete story', 'Error');
    }
  };

  // Edit Story
  const openEditMode = (story) => {
    setEditText(story.text || '');
    setEditGradient(story.backgroundColor || GRADIENTS[0]);
    setEditModeOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const activeGroup = storyGroups[selectedGroupIndex];
    const activeStory = activeGroup.stories[selectedStoryIndex];

    setIsEditing(true);
    try {
      const res = await storyService.updateStory(activeStory._id, {
        text: editText.trim(),
        backgroundColor: editGradient
      });

      if (res.success) {
        // Update in state
        const updatedGroups = storyGroups.map((g, gIdx) => {
          if (gIdx !== selectedGroupIndex) return g;
          const updatedStories = g.stories.map((s, sIdx) =>
            sIdx === selectedStoryIndex ? res.data : s
          );
          return { ...g, stories: updatedStories };
        });
        setStoryGroups(updatedGroups);
        setEditModeOpen(false);
      }
    } catch (err) {
      showAlert(err.message || 'Failed to update story', 'Error');
    } finally {
      setIsEditing(false);
    }
  };

  const handleLikeStory = async () => {
    if (!activeStory) return;
    
    const originalGroups = [...storyGroups];
    const isCurrentlyLiked = activeStory.likes && activeStory.likes.includes(currentUser?._id);
    
    // Optimistic Update
    const updatedGroups = storyGroups.map((group, gIdx) => {
      if (gIdx !== selectedGroupIndex) return group;
      const updatedStories = group.stories.map((story, sIdx) => {
        if (sIdx !== selectedStoryIndex) return story;
        
        let newLikes = story.likes || [];
        if (isCurrentlyLiked) {
          newLikes = newLikes.filter((id) => id !== currentUser?._id);
        } else {
          newLikes = [...newLikes, currentUser?._id];
        }
        return { ...story, likes: newLikes };
      });
      return { ...group, stories: updatedStories };
    });
    
    setStoryGroups(updatedGroups);
    
    try {
      if (isCurrentlyLiked) {
        await storyService.unlikeStory(activeStory._id);
      } else {
        await storyService.likeStory(activeStory._id);
      }
    } catch (err) {
      console.error('Failed to update story like:', err);
      // Rollback on error
      setStoryGroups(originalGroups);
    }
  };

  const handleCommentSubmit = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = storyCommentText.trim();
      if (!val || !activeStory) return;

      try {
        setStoryCommentText('');
        const res = await storyService.commentStory(activeStory._id, val);
        if (res.success) {
          const updatedGroups = storyGroups.map((group, gIdx) => {
            if (gIdx !== selectedGroupIndex) return group;
            const updatedStories = group.stories.map((story, sIdx) => {
              if (sIdx !== selectedStoryIndex) return story;
              const currentComments = story.comments || [];
              return { ...story, comments: [...currentComments, res.comment] };
            });
            return { ...group, stories: updatedStories };
          });
          setStoryGroups(updatedGroups);
        }
      } catch (err) {
        showAlert('Could not post comment', 'Error');
      }
    }
  };

  useEffect(() => {
    setStoryCommentText('');
    setCommentInputFocused(false);
  }, [selectedStoryIndex, selectedGroupIndex, viewerOpen]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
        <Spinner size="24px" />
      </div>
    );
  }

  // Look for current user's active group
  const currentUserGroup = storyGroups.find((g) => g.user._id.toString() === currentUser?._id);

  return (
    <div>
      <div className="stories-container" ref={storiesRef}>
        {/* Card 1: Create Story */}
        <div className="story-card create-story-card" onClick={() => setCreateModalOpen(true)}>
          <div className="create-story-top">
            <img
              src={getUploadUrl(currentUser?.profilePicture || '/uploads/default-avatar.png')}
              className="create-story-avatar"
              alt="My Profile"
            />
          </div>
          <div className="create-story-bottom">
            <div className="create-story-btn-wrapper">+</div>
            <div className="create-story-text">Create story</div>
          </div>
        </div>

        {/* Other Story cards */}
        {storyGroups.map((group, idx) => {
          // If own story is first, we already render the creation card, but we want to show the active preview bubble
          const lastStory = group.stories[group.stories.length - 1];

          return (
            <div key={group.user._id} className="story-card" onClick={() => openViewer(idx)}>
              <div className="story-card-overlay"></div>
              <div className="story-card-avatar-wrapper">
                <img
                  src={getUploadUrl(group.user.profilePicture || '/uploads/default-avatar.png')}
                  className="story-card-avatar"
                  alt={group.user.fullName}
                />
              </div>

              {lastStory.mediaType === 'video' ? (
                <video
                  src={getUploadUrl(lastStory.imageUrl)}
                  className="story-card-bg"
                  muted
                  playsInline
                  style={{ objectFit: 'cover' }}
                />
              ) : lastStory.imageUrl ? (
                <img
                  src={getUploadUrl(lastStory.imageUrl)}
                  className="story-card-bg"
                  alt="Story preview"
                />
              ) : (
                <div className="story-card-gradient-bg" style={{ background: lastStory.backgroundColor }}>
                  {lastStory.text}
                </div>
              )}

              <div className="story-card-name">
                {group.user._id === currentUser?._id ? 'Your story' : group.user.fullName}
              </div>
            </div>
          );
        })}

        {/* Reset hidden stories button if any exist */}
        {(() => {
          const hiddenUsersCount = JSON.parse(localStorage.getItem('hidden_stories_users') || '[]').length;
          if (hiddenUsersCount > 0) {
            return (
              <button
                onClick={handleResetHiddenStories}
                className="story-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--card-bg)',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  gap: '8px',
                  padding: '10px'
                }}
                title="Unhide all muted users' stories"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>Unhide All ({hiddenUsersCount})</span>
              </button>
            );
          }
          return null;
        })()}
      </div>

      {/* Creation Modal */}
      <Modal isOpen={createModalOpen} onClose={closeCreateModal} title="Create Story">
        <div className="story-creator-option-tabs">
          <div
            className={`story-creator-tab ${storyCreatorTab === 'image' ? 'active' : ''}`}
            onClick={() => setStoryCreatorTab('image')}
          >
            Photo/Video Story
          </div>
          <div
            className={`story-creator-tab ${storyCreatorTab === 'text' ? 'active' : ''}`}
            onClick={() => setStoryCreatorTab('text')}
          >
            Text Story
          </div>
        </div>

        <form onSubmit={handlePublishStory}>
          <div className="modal-body">
            {storyCreatorTab === 'image' ? (
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                {imagePreview ? (
                  <div style={{ position: 'relative', width: '150px', height: '225px', borderRadius: '12px', overflow: 'hidden', margin: '0 auto 12px', border: '1px solid var(--border-color)' }}>
                    {chosenFile && chosenFile.type.startsWith('video/') ? (
                      <video src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                    ) : (
                      <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Selected preview" />
                    )}
                    <button
                      type="button"
                      onClick={() => { if (imagePreview && imagePreview.startsWith('blob:')) { URL.revokeObjectURL(imagePreview); } setChosenFile(null); setImagePreview(''); }}
                      style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={triggerFileSelect}
                    style={{ width: '100%', height: '180px', border: '2px dashed var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '8px' }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Choose an image or video</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden-file-input"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Background Color</label>
                <div className="gradient-selector-row">
                  {GRADIENTS.map((gradient) => (
                    <div
                      key={gradient}
                      className={`gradient-selector-circle ${chosenGradient === gradient ? 'selected' : ''}`}
                      style={{ background: gradient }}
                      onClick={() => setChosenGradient(gradient)}
                    />
                  ))}
                </div>

                <div
                  style={{
                    marginTop: '16px',
                    width: '100%',
                    height: '180px',
                    borderRadius: '12px',
                    background: chosenGradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    lineHeight: '1.4',
                    wordBreak: 'break-word',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {storyText || 'Type your story text...'}
                </div>
              </div>
            )}

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label" htmlFor="story-text">
                {storyCreatorTab === 'image' ? 'Caption text (optional)' : 'Story text'}
              </label>
              <input
                ref={storyInputRef}
                type="text"
                id="story-text"
                className="form-input"
                placeholder={storyCreatorTab === 'image' ? 'Add a caption...' : 'Enter your story text'}
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                maxLength={100}
                required={storyCreatorTab === 'text'}
              />
              <MentionSuggestions text={storyText} setText={setStoryText} targetInputRef={storyInputRef} />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '4px', textAlign: 'right' }}>
                {storyText.length}/100
              </small>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPublishing}>
              {isPublishing ? <Spinner size="16px" style={{ borderColor: 'transparent', borderTopColor: '#fff' }} /> : 'Publish Story'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Story Viewer Modal */}
      {viewerOpen && activeStory && (
        <Modal
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          title={`${activeStory.user.fullName}'s Story`}
          showFooter={false}
        >
          <div className="story-view-wrapper">
            <div className="story-view-header">
              {/* Progress Indicators */}
              <div className="story-view-progress-indicators">
                {activeGroup.stories.map((s, idx) => {
                  let fillClass = '';
                  let fillStyle = {};
                  if (idx < selectedStoryIndex) {
                    fillClass = 'completed';
                  } else if (idx === selectedStoryIndex) {
                    fillClass = 'active';
                    fillStyle = { width: `${progress}%` };
                  }

                  return (
                    <div key={s._id} className="story-view-progress-bar">
                      <div className={`story-view-progress-bar-fill ${fillClass}`} style={fillStyle} />
                    </div>
                  );
                })}
              </div>

              {/* User details */}
              <div className="story-view-user-info">
                <img
                  src={getUploadUrl(activeStory.user.profilePicture || '/uploads/default-avatar.png')}
                  className="story-view-avatar"
                  alt="User Avatar"
                />
                <div>
                  <div className="story-view-username">{activeStory.user.fullName}</div>
                  <div className="story-view-time">
                    {new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Edit & Delete for story owner */}
                {isOwnActiveStory && (
                  <div className="story-view-owner-actions">
                    <button
                      className="story-view-action-icon-btn"
                      title="Edit Caption/Background"
                      onClick={() => openEditMode(activeStory)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="story-view-action-icon-btn"
                      title="Delete Story"
                      onClick={() => handleDeleteStory(activeStory._id)}
                      style={{ color: '#ef4444' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                )}
                {!isOwnActiveStory && (
                  <div className="story-view-owner-actions">
                    <button
                      className="story-view-action-icon-btn"
                      title="Hide Stories from this user"
                      onClick={(e) => handleHideUserStories(e, activeStory.user)}
                      style={{ color: '#ef4444' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation buttons */}
            <button className="story-view-nav-btn prev" onClick={handlePrevStory}>
              &#8249;
            </button>
            <button className="story-view-nav-btn next" onClick={handleNextStory}>
              &#8250;
            </button>

            <div className="story-view-body">
              {activeStory.imageUrl ? (
                <>
                  {activeStory.mediaType === 'video' ? (
                    <video
                      ref={viewerVideoRef}
                      src={getUploadUrl(activeStory.imageUrl)}
                      className="story-view-bg-image"
                      style={{ objectFit: 'contain', backgroundColor: '#000' }}
                      playsInline
                      onLoadedMetadata={handleVideoLoadedMetadata}
                    />
                  ) : (
                    <img src={getUploadUrl(activeStory.imageUrl)} className="story-view-bg-image" alt="Story view" />
                  )}
                  {activeStory.text && (
                    <div className="story-view-text-overlay">{activeStory.text}</div>
                  )}
                </>
              ) : (
                <div className="story-view-text-story" style={{ background: activeStory.backgroundColor }}>
                  {activeStory.text}
                </div>
              )}

              {/* Comment Overlay (opposite to Like Button) */}
              <div className="story-view-comment-container" style={{ position: 'relative' }}>
                <div className="story-comments-list" key={activeStory._id} ref={commentsListRef}>
                  {activeStory.comments && activeStory.comments.map((c, index) => (
                    <div
                      key={c._id || c.createdAt || index}
                      className="story-comment-bubble animate-comment-bubble"
                      style={{ animationDelay: `${Math.min(index, 4) * 0.1}s` }}
                    >
                      <span className="story-comment-user">{c.user?.fullName || 'User'}:</span>
                      {c.text}
                    </div>
                  ))}
                </div>
                <input
                  ref={storyCommentInputRef}
                  type="text"
                  placeholder="Reply to story..."
                  value={storyCommentText}
                  onChange={(e) => setStoryCommentText(e.target.value)}
                  onKeyDown={handleCommentSubmit}
                  onFocus={() => setCommentInputFocused(true)}
                  onBlur={() => setCommentInputFocused(false)}
                  className="story-comment-input"
                  onClick={(e) => e.stopPropagation()}
                />
                <MentionSuggestions text={storyCommentText} setText={setStoryCommentText} targetInputRef={storyCommentInputRef} />
              </div>

              {/* Heart/Like Button Overlay */}
              <div className="story-view-like-container">
                <button
                  className={`story-like-btn ${isLiked ? 'liked' : ''}`}
                  onClick={handleLikeStory}
                  type="button"
                  title={isLiked ? 'Unlike' : 'Like'}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill={isLiked ? '#ef4444' : 'none'}
                    stroke={isLiked ? '#ef4444' : '#ffffff'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
                {likeCount > 0 && <span className="story-like-count">{likeCount}</span>}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Story Inline Modal */}
      {editModeOpen && activeStory && (
        <Modal isOpen={editModeOpen} onClose={() => setEditModeOpen(false)} title="Edit Story Info">
          <form onSubmit={handleEditSubmit}>
            <div className="modal-body">
              {/* Background selector for Text stories (or optional) */}
              {!activeStory.imageUrl && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">Background Color</label>
                  <div className="gradient-selector-row">
                    {GRADIENTS.map((gradient) => (
                      <div
                        key={gradient}
                        className={`gradient-selector-circle ${editGradient === gradient ? 'selected' : ''}`}
                        style={{ background: gradient }}
                        onClick={() => setEditGradient(gradient)}
                      />
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: '16px',
                      width: '100%',
                      height: '180px',
                      borderRadius: '12px',
                      background: editGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      textAlign: 'center',
                      lineHeight: '1.4',
                      wordBreak: 'break-word',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {editText || 'Type your story text...'}
                  </div>
                </div>
              )}

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" htmlFor="edit-story-text">
                  Story text / Caption
                </label>
                <input
                  ref={editStoryInputRef}
                  type="text"
                  id="edit-story-text"
                  className="form-input"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  maxLength={100}
                  required={!activeStory.imageUrl}
                />
                <MentionSuggestions text={editText} setText={setEditText} targetInputRef={editStoryInputRef} />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '4px', textAlign: 'right' }}>
                  {editText.length}/100
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditModeOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isEditing}>
                {isEditing ? <Spinner size="16px" style={{ borderColor: 'transparent', borderTopColor: '#fff' }} /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Stories;
