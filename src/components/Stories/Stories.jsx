import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/CustomDialogContext';
import storyService from '../../services/storyService';
import userService from '../../services/userService';
import { getUploadUrl } from '../../utils/mediaHelper';
import { timeAgo } from '../../utils/formatters';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const navigate = useNavigate();

  const storyInputRef = useRef(null);
  const editStoryInputRef = useRef(null);
  const storyCommentInputRef = useRef(null);
  const storyReplyInputRef = useRef(null);

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

  // Privacy Selection States
  const [privacy, setPrivacy] = useState('public');
  const [privacySearchQuery, setPrivacySearchQuery] = useState('');
  const [privacySelectedUsers, setPrivacySelectedUsers] = useState([]);
  const [friendsList, setFriendsList] = useState([]);

  // Viewer Modal States
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [storyDuration, setStoryDuration] = useState(5000);
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);

  // Insights Modal States
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsTab, setInsightsTab] = useState('views');
  const [insightsData, setInsightsData] = useState({ views: [], likes: [], replies: [] });
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Private Replies States
  const [storyReplyText, setStoryReplyText] = useState('');
  const [replyInputFocused, setReplyInputFocused] = useState(false);
  const [publicCommentsOpen, setPublicCommentsOpen] = useState(false);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [replyModeActive, setReplyModeActive] = useState(false);
  const progressRef = useRef(0);

  // Heart Tap States
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const lastTapRef = useRef(0);

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

  // Playback state refs for Insights Modal
  const pausedProgressRefVal = useRef(0);
  const pausedVideoTimeRef = useRef(0);
  const remainingImageTimeRef = useRef(0);
  const touchStartRef = useRef(null);

  const handleOpenInsights = () => {
    if (!activeStory) return;
    setIsStoryPaused(true);
    pausedProgressRefVal.current = progressRef.current;
    if (activeStory.mediaType === 'video' && viewerVideoRef.current) {
      pausedVideoTimeRef.current = viewerVideoRef.current.currentTime;
    } else {
      remainingImageTimeRef.current = storyDuration - (storyDuration * progressRef.current / 100);
    }
    setInsightsOpen(true);
  };

  const handleCloseInsights = () => {
    setInsightsOpen(false);
    progressRef.current = pausedProgressRefVal.current;
    setProgress(pausedProgressRefVal.current);
    if (activeStory && activeStory.mediaType === 'video' && viewerVideoRef.current) {
      viewerVideoRef.current.currentTime = pausedVideoTimeRef.current;
    }
    setIsStoryPaused(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartRef.current === null) return;
    if (e.changedTouches && e.changedTouches[0]) {
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchEndY - touchStartRef.current;
      const modalBody = e.currentTarget.querySelector('.modal-body');
      const isAtTop = modalBody ? modalBody.scrollTop <= 0 : true;
      if (diffY > 120 && isAtTop) {
        handleCloseInsights();
      }
    }
    touchStartRef.current = null;
  };

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

  // Reset story progress and set duration on story change
  useEffect(() => {
    setProgress(0);
    progressRef.current = 0;
    setIsStoryPaused(false);
    setReplyModeActive(false);

    if (!activeStory) {
      setStoryDuration(5000);
      return;
    }

    if (activeStory.imageUrl) {
      if (activeStory.mediaType === 'video') {
        setStoryDuration(5000); // Temporary fallback, handles by video metadata loaded later
      } else {
        // Image story -> 15 Seconds
        setStoryDuration(15000);
      }
    } else {
      // Text story -> 30 Seconds
      setStoryDuration(30000);
    }
  }, [selectedStoryIndex, selectedGroupIndex, activeStory, viewerOpen]);

  // Sync play/pause for video stories in viewer
  useEffect(() => {
    const video = viewerVideoRef.current;
    if (!video) return;

    const shouldPlay = viewerOpen && !editModeOpen && !commentInputFocused && !isStoryPaused && !insightsOpen;
    if (shouldPlay) {
      video.play().catch((err) => console.log('Story video autoplay blocked:', err));
    } else {
      video.pause();
    }
  }, [viewerOpen, editModeOpen, commentInputFocused, isStoryPaused, insightsOpen, selectedStoryIndex, selectedGroupIndex]);

  // Autoplay Logic with Pause/Resume capability
  useEffect(() => {
    if (!viewerOpen || editModeOpen || commentInputFocused || isStoryPaused || insightsOpen) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    const duration = storyDuration;
    const step = 50; // Update progress every 50ms
    const totalSteps = duration / step;

    // Calculate initial step from current progressRef.current
    let currentStep = Math.round((progressRef.current / 100) * totalSteps);

    progressTimerRef.current = setInterval(() => {
      currentStep++;
      const val = Math.min(100, (currentStep / totalSteps) * 100);
      progressRef.current = val;
      setProgress(val);

      if (val >= 100) {
        clearInterval(progressTimerRef.current);
        handleNextStory();
      }
    }, step);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [viewerOpen, selectedGroupIndex, selectedStoryIndex, editModeOpen, commentInputFocused, isStoryPaused, insightsOpen, storyDuration]);

  // Auto-open story from URL param
  useEffect(() => {
    if (storyGroups.length === 0) return;
    const params = new URLSearchParams(location.search);
    const storyId = params.get('storyId');
    if (storyId) {
      let foundGroupIdx = -1;
      let foundStoryIdx = -1;
      for (let gIdx = 0; gIdx < storyGroups.length; gIdx++) {
        const stories = storyGroups[gIdx].stories;
        const sIdx = stories.findIndex(s => s._id === storyId);
        if (sIdx !== -1) {
          foundGroupIdx = gIdx;
          foundStoryIdx = sIdx;
          break;
        }
      }

      if (foundGroupIdx !== -1 && foundStoryIdx !== -1) {
        setSelectedGroupIndex(foundGroupIdx);
        setSelectedStoryIndex(foundStoryIdx);
        setViewerOpen(true);
        // Clear query param so it doesn't reopen
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [location.search, storyGroups]);

  // Escape key handler for active replies, insights modal, or story viewer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (insightsOpen) {
          handleCloseInsights();
        } else if (replyModeActive) {
          handleCancelReply();
        } else if (viewerOpen) {
          setViewerOpen(false);
        }
      }
    };
    if (viewerOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewerOpen, replyModeActive, insightsOpen]);

  // Automatically focus reply input when reply mode is activated
  useEffect(() => {
    if (replyModeActive && storyReplyInputRef.current) {
      storyReplyInputRef.current.focus();
    }
  }, [replyModeActive]);

  // Load friends/followers for custom privacy selections
  useEffect(() => {
    if (createModalOpen && currentUser) {
      const fetchFriends = async () => {
        try {
          const res = await userService.getFollowers(currentUser._id);
          if (res.success) {
            setFriendsList(res.data);
          }
        } catch (err) {
          console.error('Error fetching friends for privacy list:', err);
        }
      };
      fetchFriends();
    }
  }, [createModalOpen, currentUser]);

  // Record story view when someone opens a story
  useEffect(() => {
    if (viewerOpen && activeStory && activeStory.user._id !== currentUser?._id) {
      const recordView = async () => {
        try {
          await storyService.viewStory(activeStory._id);

          // Optimistic local update
          const alreadyViewed = activeStory.views && activeStory.views.some(v => (v.user?._id || v.user) === currentUser?._id);
          if (!alreadyViewed) {
            const updatedGroups = storyGroups.map((group, gIdx) => {
              if (gIdx !== selectedGroupIndex) return group;
              const updatedStories = group.stories.map((story, sIdx) => {
                if (sIdx !== selectedStoryIndex) return story;
                const currentViews = story.views || [];
                return {
                  ...story,
                  views: [...currentViews, { user: currentUser, viewedAt: new Date() }]
                };
              });
              return { ...group, stories: updatedStories };
            });
            setStoryGroups(updatedGroups);
          }
        } catch (err) {
          console.error('Failed to record story view:', err);
        }
      };
      recordView();
    }
  }, [viewerOpen, selectedStoryIndex, selectedGroupIndex]);

  // Load insights data
  useEffect(() => {
    if (insightsOpen && activeStory) {
      const fetchInsights = async () => {
        setLoadingInsights(true);
        try {
          const viewsRes = await storyService.getStoryViews(activeStory._id);
          const likesRes = await storyService.getStoryLikes(activeStory._id);
          const repliesRes = await storyService.getStoryReplies(activeStory._id);
          if (viewsRes.success && likesRes.success && repliesRes.success) {
            setInsightsData({
              views: viewsRes.views,
              likes: likesRes.likes,
              replies: repliesRes.data
            });
          }
        } catch (err) {
          console.error('Failed to load story insights:', err);
        } finally {
          setLoadingInsights(false);
        }
      };
      fetchInsights();
    }
  }, [insightsOpen, activeStory]);

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
      progressRef.current = 0;
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

      if (isImage && file.size > 15 * 1024 * 1024) {
        showAlert('Image file size is too large. Maximum size is 15MB.', 'File Too Large');
        return;
      }

      if (isVideo && file.size > 200 * 1024 * 1024) {
        showAlert('Video file size is too large. Maximum size is 200MB.', 'File Too Large');
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
    setPrivacy('public');
    setPrivacySearchQuery('');
    setPrivacySelectedUsers([]);
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
        formData.append('privacy', privacy);
        if (privacy === 'custom') {
          formData.append('allowedUsers', JSON.stringify(privacySelectedUsers));
        } else if (privacy === 'hide') {
          formData.append('hiddenUsers', JSON.stringify(privacySelectedUsers));
        }
        res = await storyService.createStory(formData);
      } else {
        const payload = {
          text: storyText.trim(),
          backgroundColor: chosenGradient,
          privacy
        };
        if (privacy === 'custom') {
          payload.allowedUsers = privacySelectedUsers;
        } else if (privacy === 'hide') {
          payload.hiddenUsers = privacySelectedUsers;
        }
        res = await storyService.createStory(payload);
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

  const handleStartReply = () => {
    setReplyModeActive(true);
    setIsStoryPaused(true);
  };

  const handleCancelReply = () => {
    setStoryReplyText('');
    setReplyModeActive(false);
    setIsStoryPaused(false);
  };

  const handleReplySubmit = async (e) => {
    if (e) e.preventDefault();
    const val = storyReplyText.trim();
    if (!val || !activeStory) return;

    try {
      setStoryReplyText('');
      setReplyModeActive(false);
      setIsStoryPaused(false);
      const res = await storyService.replyStory(activeStory._id, val);
      if (res.success) {
        showAlert('Private reply sent successfully!', 'Success');
      }
    } catch (err) {
      showAlert('Could not send reply', 'Error');
    }
  };

  const handleShareStory = () => {
    if (!activeStory) return;
    const url = `${window.location.origin}/?storyId=${activeStory._id}`;
    navigator.clipboard.writeText(url)
      .then(() => showAlert('Story link copied to clipboard!', 'Success'))
      .catch(() => showAlert('Failed to copy link', 'Error'));
  };

  const handleDoubleTap = (e) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      if (!isLiked) {
        handleLikeStory();
      }
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    } else {
      lastTapRef.current = now;
    }
  };

  useEffect(() => {
    setStoryCommentText('');
    setCommentInputFocused(false);
    setStoryReplyText('');
    setReplyInputFocused(false);
    setOwnerMenuOpen(false);
    setPublicCommentsOpen(false);
  }, [selectedStoryIndex, selectedGroupIndex, viewerOpen]);

  const renderStoryTextWithMentions = (text) => {
    if (!text) return '';
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const parts = text.split(mentionRegex);
    const matches = [...text.matchAll(mentionRegex)];

    if (matches.length === 0) return text;

    let matchIdx = 0;
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const username = matches[matchIdx++];
        const unameStr = username ? username[1] : '';
        return (
          <span
            key={index}
            className="story-mention-link"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${unameStr}`);
              setViewerOpen(false);
            }}
            style={{ color: '#60a5fa', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
          >
            @{unameStr}
          </span>
        );
      }
      return part;
    });
  };

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

            {/* Privacy Selector */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label" htmlFor="story-privacy">Story Privacy</label>
              <select
                id="story-privacy"
                className="form-input"
                value={privacy}
                onChange={(e) => { setPrivacy(e.target.value); setPrivacySelectedUsers([]); }}
              >
                <option value="public">Public (Everyone)</option>
                <option value="friends">Friends Only (Mutual Follows)</option>
                <option value="followers">Followers Only</option>
                <option value="me">Only Me</option>
                <option value="custom">Custom (Share With...)</option>
                <option value="hide">Hide Story From...</option>
              </select>
            </div>

            {(privacy === 'custom' || privacy === 'hide') && (
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">
                  {privacy === 'custom' ? 'Select friends to share with:' : 'Select friends to hide from:'}
                </label>
                <input
                  type="text"
                  placeholder="Search friends..."
                  className="form-input"
                  value={privacySearchQuery}
                  onChange={(e) => setPrivacySearchQuery(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />
                <div className="friends-list-selection">
                  {friendsList
                    .filter(f => f.fullName.toLowerCase().includes(privacySearchQuery.toLowerCase()) || f.username.toLowerCase().includes(privacySearchQuery.toLowerCase()))
                    .map(friend => {
                      const isChecked = privacySelectedUsers.includes(friend._id);
                      return (
                        <div
                          key={friend._id}
                          className="friend-select-item"
                          onClick={() => {
                            if (isChecked) {
                              setPrivacySelectedUsers(prev => prev.filter(id => id !== friend._id));
                            } else {
                              setPrivacySelectedUsers(prev => [...prev, friend._id]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="friend-select-checkbox"
                          />
                          <img
                            src={getUploadUrl(friend.profilePicture || '/uploads/default-avatar.png')}
                            className="friend-select-avatar"
                            alt=""
                          />
                          <span className="friend-select-name">{friend.fullName} (@{friend.username})</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
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

      {/* Story Viewer Overlay (Immersive Glassmorphism) */}
      {viewerOpen && activeStory && (
        <div className="story-viewer-overlay" onClick={() => setViewerOpen(false)}>
          {/* Navigation arrow buttons outside card for desktop */}
          <button className="story-viewer-nav-arrow prev" onClick={(e) => { e.stopPropagation(); handlePrevStory(); }}>
            &#8249;
          </button>
          <button className="story-viewer-nav-arrow next" onClick={(e) => { e.stopPropagation(); handleNextStory(); }}>
            &#8250;
          </button>

          <div className="story-viewer-container" onClick={(e) => e.stopPropagation()}>
            <div className="story-viewer-card">

              {/* TOP HEADER */}
              <div className="story-viewer-header">
                {/* Progress Indicators */}
                <div className="story-viewer-progress-container">
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
                      <div key={s._id} className="story-viewer-progress-bar">
                        <div className={`story-viewer-progress-fill ${fillClass}`} style={fillStyle} />
                      </div>
                    );
                  })}
                </div>

                {/* Profile Picture, Username, Story Time, Actions, Close Button */}
                <div className="story-viewer-profile-row">
                  <div className="story-viewer-user-details" onClick={() => { navigate(`/profile/${activeStory.user.username}`); setViewerOpen(false); }}>
                    <img
                      src={getUploadUrl(activeStory.user.profilePicture || '/uploads/default-avatar.png')}
                      className="story-viewer-avatar"
                      alt=""
                    />
                    <div>
                      <div className="story-viewer-username">{activeStory.user.fullName}</div>
                      <div className="story-viewer-time">
                        {timeAgo(activeStory.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="story-viewer-actions-right">
                    {/* Owner Dropdown Menu */}
                    {isOwnActiveStory && (
                      <>
                        <button
                          className="story-viewer-menu-btn"
                          title="Story Options"
                          onClick={(e) => { e.stopPropagation(); setOwnerMenuOpen(prev => !prev); }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </button>

                        {ownerMenuOpen && (
                          <div className="story-viewer-dropdown">
                            <button
                              className="story-viewer-dropdown-item"
                              onClick={(e) => { e.stopPropagation(); openEditMode(activeStory); setOwnerMenuOpen(false); }}
                            >
                              ✏ Edit Story
                            </button>
                            <button
                              className="story-viewer-dropdown-item"
                              onClick={(e) => { e.stopPropagation(); handleOpenInsights(); setOwnerMenuOpen(false); }}
                            >
                              📊 Story Insights
                            </button>
                            <button
                              className="story-viewer-dropdown-item delete"
                              onClick={(e) => { e.stopPropagation(); handleDeleteStory(activeStory._id); setOwnerMenuOpen(false); }}
                            >
                              🗑 Delete Story
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {!isOwnActiveStory && (
                      <button
                        className="story-viewer-menu-btn"
                        title="Hide User Stories"
                        onClick={(e) => { e.stopPropagation(); handleHideUserStories(e, activeStory.user); }}
                        style={{ color: '#ef4444' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      </button>
                    )}

                    <button className="story-viewer-close-btn" onClick={() => setViewerOpen(false)} title="Close">
                      &times;
                    </button>
                  </div>
                </div>
              </div>

              {/* STORY CONTENT (Centered, clean) */}
              <div className={`story-viewer-body ${isStoryPaused || insightsOpen ? 'story-paused-dim' : ''}`} onClick={(e) => {
                if (replyModeActive) {
                  handleCancelReply();
                } else {
                  handleDoubleTap(e);
                }
              }}>
                {showHeartAnimation && <div className="story-double-tap-heart">❤️</div>}

                {activeStory.imageUrl ? (
                  <>
                    {activeStory.mediaType === 'video' ? (
                      <video
                        ref={viewerVideoRef}
                        src={getUploadUrl(activeStory.imageUrl)}
                        className="story-viewer-media"
                        playsInline
                        onLoadedMetadata={handleVideoLoadedMetadata}
                      />
                    ) : (
                      <img src={getUploadUrl(activeStory.imageUrl)} className="story-viewer-media" alt="" />
                    )}
                    {activeStory.text && (
                      <div className="story-viewer-caption">
                        {renderStoryTextWithMentions(activeStory.text)}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="story-viewer-text-only" style={{ background: activeStory.backgroundColor }}>
                    {renderStoryTextWithMentions(activeStory.text)}
                  </div>
                )}

                {/* Floating Public Comments Side Drawer overlay (responsive) */}
                <div className={`story-comments-drawer ${publicCommentsOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                  <div className="story-comments-drawer-header">
                    <span className="story-comments-drawer-title">Public Comments ({activeStory.comments ? activeStory.comments.length : 0})</span>
                    <button className="story-comments-drawer-close" onClick={() => setPublicCommentsOpen(false)}>&times;</button>
                  </div>
                  <div className="story-comments-drawer-list" ref={commentsListRef}>
                    {activeStory.comments && activeStory.comments.map((c, index) => (
                      <div key={c._id || index} className="story-comments-drawer-bubble">
                        <span className="story-comments-drawer-user">{c.user?.fullName || 'User'}:</span>
                        {renderStoryTextWithMentions(c.text)}
                      </div>
                    ))}
                    {(!activeStory.comments || activeStory.comments.length === 0) && (
                      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '20px' }}>No comments yet. Be the first to comment!</div>
                    )}
                  </div>
                  <div className="story-comments-drawer-input-row">
                    <input
                      ref={storyCommentInputRef}
                      type="text"
                      placeholder="Comment publicly..."
                      value={storyCommentText}
                      onChange={(e) => setStoryCommentText(e.target.value)}
                      onKeyDown={handleCommentSubmit}
                      onFocus={() => setCommentInputFocused(true)}
                      onBlur={() => setCommentInputFocused(false)}
                      className="story-comments-drawer-input"
                    />
                    <MentionSuggestions text={storyCommentText} setText={setStoryCommentText} targetInputRef={storyCommentInputRef} />
                  </div>
                </div>
              </div>

              {/* BOTTOM ACTION BAR */}
              <div className={`story-viewer-bottom-actions ${replyModeActive ? 'reply-active' : ''}`}>
                {/* Private Reply Input (For others' stories) */}
                {!isOwnActiveStory ? (
                  <div className="story-viewer-input-wrapper">
                    <input
                      ref={storyReplyInputRef}
                      type="text"
                      placeholder="Reply Story..."
                      value={storyReplyText}
                      onChange={(e) => setStoryReplyText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleReplySubmit(); }}
                      onFocus={handleStartReply}
                      className="story-viewer-reply-input"
                    />
                    {replyModeActive && (
                      <button
                        className="story-viewer-reply-cancel-btn"
                        onClick={(e) => { e.stopPropagation(); handleCancelReply(); }}
                        style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '18px', padding: '6px 14px', fontSize: '0.8rem', marginRight: '6px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button className="story-viewer-reply-submit" onClick={handleReplySubmit}>Send</button>
                  </div>
                ) : (
                  <div style={{ flex: 1 }} /> // Empty spacer for layout alignment
                )}

                {/* Bottom buttons (Like, Comments, Share) - Hidden when typing a reply */}
                {!replyModeActive && (
                  <>
                    {/* Like Button */}
                    <button
                      className={`story-viewer-icon-btn ${isLiked ? 'liked' : ''}`}
                      onClick={handleLikeStory}
                      title={isLiked ? 'Unlike' : 'Like'}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>

                    {/* Public Comments Toggle Button */}
                    <button
                      className={`story-viewer-icon-btn ${publicCommentsOpen ? 'active' : ''}`}
                      onClick={() => setPublicCommentsOpen(prev => !prev)}
                      title="Public Comments"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>

                    {/* Share Button */}
                    <button
                      className="story-viewer-icon-btn"
                      onClick={handleShareStory}
                      title="Copy Share Link"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* STORY STATS (BELOW THE MAIN CARD) */}
            <div className="story-viewer-stats-below" onClick={() => { if (isOwnActiveStory) handleOpenInsights(); }}>
              <span>👁 {activeStory.views ? activeStory.views.length : 0} Views</span>
              <span>❤️ {likeCount} Likes</span>
              {isOwnActiveStory && <span style={{ color: '#a78bfa', marginLeft: '6px' }}>• View Insights</span>}
            </div>
          </div>
        </div>
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

      {/* Story Insights Modal */}
      {insightsOpen && activeStory && (
        <Modal isOpen={insightsOpen} onClose={handleCloseInsights} title="Story Insights">
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {loadingInsights ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                  <Spinner size="24px" />
                </div>
              ) : (
                <div>
                  {/* Stats Summary cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center', backgroundColor: 'var(--input-bg)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{insightsData.views.length}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Views</div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center', backgroundColor: 'var(--input-bg)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{insightsData.likes.length}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Likes</div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center', backgroundColor: 'var(--input-bg)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{insightsData.replies ? insightsData.replies.length : 0}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Replies</div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="story-creator-option-tabs" style={{ marginBottom: '12px' }}>
                    <div className={`story-creator-tab ${insightsTab === 'views' ? 'active' : ''}`} onClick={() => setInsightsTab('views')}>
                      Recent Viewers ({insightsData.views.length})
                    </div>
                    <div className={`story-creator-tab ${insightsTab === 'top' ? 'active' : ''}`} onClick={() => setInsightsTab('top')}>
                      Top Viewers ({(() => {
                        const counts = {};
                        insightsData.views.forEach(v => {
                          if (!v.user) return;
                          const uid = v.user._id || v.user;
                          counts[uid] = true;
                        });
                        return Object.keys(counts).length;
                      })()})
                    </div>
                    <div className={`story-creator-tab ${insightsTab === 'likes' ? 'active' : ''}`} onClick={() => setInsightsTab('likes')}>
                      Recent Likes ({insightsData.likes.length})
                    </div>
                    <div className={`story-creator-tab ${insightsTab === 'replies' ? 'active' : ''}`} onClick={() => setInsightsTab('replies')}>
                      Recent Replies ({insightsData.replies ? insightsData.replies.length : 0})
                    </div>
                  </div>

                  {/* Tab content */}
                  {insightsTab === 'views' && (
                    <div>
                      {insightsData.views.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '12px' }}>No views yet</p>
                      ) : (
                        [...insightsData.views].reverse().map((v, i) => (
                          <div key={v._id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img src={getUploadUrl(v.user?.profilePicture || '/uploads/default-avatar.png')} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{v.user?.fullName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{v.user?.username}</div>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {timeAgo(v.viewedAt)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {insightsTab === 'top' && (
                    <div>
                      {(() => {
                        const counts = {};
                        insightsData.views.forEach(v => {
                          if (!v.user) return;
                          const uid = v.user._id || v.user;
                          if (!counts[uid]) {
                            counts[uid] = { user: v.user, count: 0 };
                          }
                          counts[uid].count++;
                        });
                        const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
                        if (sorted.length === 0) {
                          return <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '12px' }}>No views yet</p>;
                        }
                        return sorted.map((tv, i) => (
                          <div key={tv.user?._id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img src={getUploadUrl(tv.user?.profilePicture || '/uploads/default-avatar.png')} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{tv.user?.fullName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{tv.user?.username}</div>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                              {tv.count} {tv.count === 1 ? 'view' : 'views'}
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                  )}

                  {insightsTab === 'likes' && (
                    <div>
                      {insightsData.likes.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '12px' }}>No likes yet</p>
                      ) : (
                        [...insightsData.likes].reverse().map((u, i) => (
                          <div key={u._id || i} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color)', gap: '10px' }}>
                            <img src={getUploadUrl(u.profilePicture || '/uploads/default-avatar.png')} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{u.fullName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {insightsTab === 'replies' && (
                    <div>
                      {!insightsData.replies || insightsData.replies.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '12px' }}>No replies yet</p>
                      ) : (
                        [...insightsData.replies].reverse().map((r, i) => (
                          <div key={r._id || i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img src={getUploadUrl(r.sender?.profilePicture || '/uploads/default-avatar.png')} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{r.sender?.fullName}</span>
                              </div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{timeAgo(r.createdAt)}</span>
                            </div>
                            <div style={{ paddingLeft: '32px', fontSize: '0.85rem', color: 'var(--text-main)' }}>{r.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={handleCloseInsights}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Stories;
