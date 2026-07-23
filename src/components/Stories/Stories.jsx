import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/CustomDialogContext';
import storyService from '../../services/storyService';
import { getUploadUrl } from '../../utils/mediaHelper';
import Modal from '../Modal/Modal';
import Spinner from '../Loader/Spinner';

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

  // Edit Story States
  const [editModeOpen, setEditModeOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [editGradient, setEditGradient] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const fileInputRef = useRef(null);
  const progressTimerRef = useRef(null);
  const storiesRef = useRef(null);

  const loadStories = async () => {
    try {
      const res = await storyService.getStories();
      if (res.success) {
        setStoryGroups(res.data);
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

  // Autoplay Logic
  useEffect(() => {
    if (!viewerOpen || editModeOpen) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    setProgress(0);
    const duration = 5000; // 5 seconds per story
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
  }, [viewerOpen, selectedGroupIndex, selectedStoryIndex, editModeOpen]);

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
      if (!file.type.startsWith('image/')) {
        showAlert('Please select a valid image file', 'Invalid File');
        return;
      }
      setChosenFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handlePublishStory = async (e) => {
    e.preventDefault();
    if (storyCreatorTab === 'image' && !chosenFile) {
      showAlert('Please choose an image for your story', 'Error');
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

  const activeGroup = storyGroups[selectedGroupIndex];
  const activeStory = activeGroup ? activeGroup.stories[selectedStoryIndex] : null;
  const isOwnActiveStory = activeStory && activeStory.user._id === currentUser?._id;

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
          const hasImage = !!lastStory.imageUrl;

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

              {hasImage ? (
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
      </div>

      {/* Creation Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Story">
        <div className="story-creator-option-tabs">
          <div
            className={`story-creator-tab ${storyCreatorTab === 'image' ? 'active' : ''}`}
            onClick={() => setStoryCreatorTab('image')}
          >
            Image Story
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
                    <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Selected preview" />
                    <button
                      type="button"
                      onClick={() => { setChosenFile(null); setImagePreview(''); }}
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
                    <span>Choose an image</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden-file-input"
                  accept="image/*"
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

            <div className="form-group">
              <label className="form-label" htmlFor="story-text">
                {storyCreatorTab === 'image' ? 'Caption text (optional)' : 'Story text'}
              </label>
              <input
                type="text"
                id="story-text"
                className="form-input"
                placeholder={storyCreatorTab === 'image' ? 'Add a caption...' : 'Enter your story text'}
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                maxLength={100}
                required={storyCreatorTab === 'text'}
              />
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
                  <img src={getUploadUrl(activeStory.imageUrl)} className="story-view-bg-image" alt="Story view" />
                  {activeStory.text && (
                    <div className="story-view-text-overlay">{activeStory.text}</div>
                  )}
                </>
              ) : (
                <div className="story-view-text-story" style={{ background: activeStory.backgroundColor }}>
                  {activeStory.text}
                </div>
              )}
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

              <div className="form-group">
                <label className="form-label" htmlFor="edit-story-text">
                  Story text / Caption
                </label>
                <input
                  type="text"
                  id="edit-story-text"
                  className="form-input"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  maxLength={100}
                  required={!activeStory.imageUrl}
                />
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
