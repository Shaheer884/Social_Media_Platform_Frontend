import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import ImageCropperModal from './ImageCropperModal';
import Spinner from '../Loader/Spinner';
import { useAuth } from '../../context/AuthContext';
import { usePosts } from '../../context/PostsContext';
import { useDialog } from '../../context/CustomDialogContext';
import { getUploadUrl } from '../../utils/mediaHelper';
import MentionSuggestions from '../MentionSuggestions/MentionSuggestions';
import userService from '../../services/userService';

const FEELINGS = [
  { name: 'happy', emoji: '🙂' },
  { name: 'blessed', emoji: '😇' },
  { name: 'loved', emoji: '🥰' },
  { name: 'sad', emoji: '😢' },
  { name: 'lovely', emoji: '🥰' },
  { name: 'thankful', emoji: '😃' },
  { name: 'excited', emoji: '🤩' },
  { name: 'in love', emoji: '🥰' },
  { name: 'crazy', emoji: '🤪' },
  { name: 'grateful', emoji: '😊' },
  { name: 'blissful', emoji: '😊' },
  { name: 'fantastic', emoji: '😁' },
  { name: 'ill', emoji: '🤒' },
  { name: 'festive', emoji: '🥳' },
  { name: 'proud', emoji: '🤠' },
  { name: 'tired', emoji: '😴' },
  { name: 'angry', emoji: '😡' },
  { name: 'relaxed', emoji: '😌' }
];

const ACTIVITIES = [
  { name: 'celebrating', emoji: '🎉', placeholder: 'What are you celebrating?' },
  { name: 'watching', emoji: '📺', placeholder: 'What are you watching?' },
  { name: 'eating', emoji: '🍔', placeholder: 'What are you eating?' },
  { name: 'drinking', emoji: '🍹', placeholder: 'What are you drinking?' },
  { name: 'listening to', emoji: '🎧', placeholder: 'What are you listening to?' },
  { name: 'reading', emoji: '📚', placeholder: 'What are you reading?' },
  { name: 'traveling to', emoji: '✈️', placeholder: 'Where are you traveling?' },
  { name: 'playing', emoji: '🎮', placeholder: 'What are you playing?' }
];



const BG_PRESETS = [
  { name: 'none', background: 'transparent', color: 'var(--text-main)' },
  { name: 'purple-red', background: 'linear-gradient(135deg, #7117ea 0%, #ea6060 100%)', color: '#ffffff' },
  { name: 'sunrise', background: 'linear-gradient(135deg, #ff9900 0%, #ff5e62 100%)', color: '#ffffff' },
  { name: 'neon', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: '#ffffff' },
  { name: 'ocean', background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', color: '#ffffff' },
  { name: 'sunset', background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)', color: '#ffffff' },
  { name: 'midnight', background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)', color: '#ffffff' }
];

const CreatePostModal = ({ isOpen, onClose, initialScreen = 'main' }) => {
  const { currentUser } = useAuth();
  const { publishPost } = usePosts();
  const { showAlert } = useDialog();

  const [currentScreen, setCurrentScreen] = useState('main'); // 'main' | 'feeling' | 'location'
  const [feelingTab, setFeelingTab] = useState('feelings'); // 'feelings' | 'activities'
  const [feelingSearch, setFeelingSearch] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState(null);
  
  // Custom dropdown states
  const [audience, setAudience] = useState('Public'); // 'Public' | 'Friends' | 'Only me'
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [aiLabel, setAiLabel] = useState(false);
  const [aiLabelOpen, setAiLabelOpen] = useState(false);

  // Post editor states
  const [postText, setPostText] = useState('');
  const [location, setLocation] = useState(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationHistory, setLocationHistory] = useState([]);
  
  // Tag friends states
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');

  // Background states
  const [selectedBg, setSelectedBg] = useState(BG_PRESETS[0]);
  const [showBgSelector, setShowBgSelector] = useState(false);
  
  // File upload states
  const [chosenFiles, setChosenFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [publishLoading, setPublishLoading] = useState(false);

  // Cropper states
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState('');
  const [cropperFileType, setCropperFileType] = useState('image/jpeg');
  const [cropperFileName, setCropperFileName] = useState('image.jpg');
  const [croppingIndex, setCroppingIndex] = useState(null);
  const [tempOriginalFile, setTempOriginalFile] = useState(null);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Auto-set screen if triggered from outside buttons
  useEffect(() => {
    if (isOpen) {
      setCurrentScreen(initialScreen);
    } else {
      // Reset state on close
      setCurrentScreen('main');
      setPostText('');
      setSelectedFeeling(null);
      setLocation(null);
      setChosenFiles([]);
      setImagePreviews([]);
      setAudienceOpen(false);
      setAiLabelOpen(false);
      setFriendSearch('');
      setSelectedBg(BG_PRESETS[0]);
      setShowBgSelector(false);
    }
  }, [isOpen, initialScreen]);

  // Reset background if media is added
  useEffect(() => {
    if (chosenFiles.length > 0) {
      setSelectedBg(BG_PRESETS[0]);
      setShowBgSelector(false);
    }
  }, [chosenFiles]);

  // Fetch friends list for tagging
  useEffect(() => {
    if (!isOpen || !currentUser) return;
    const fetchFriends = async () => {
      setFriendsLoading(true);
      try {
        const res = await userService.getFollowers(currentUser._id);
        if (res.success) {
          const mutual = res.data.filter(u => u.relationshipStatus === 'friends');
          setFriends(mutual);
        }
      } catch (err) {
        console.error('Error fetching friends for tagging:', err);
      } finally {
        setFriendsLoading(false);
      }
    };
    fetchFriends();
  }, [isOpen, currentUser]);

  // Load location history for this specific user from localStorage
  useEffect(() => {
    if (isOpen && currentUser) {
      const storageKey = `location_history_${currentUser._id}`;
      try {
        const history = JSON.parse(localStorage.getItem(storageKey)) || [];
        setLocationHistory(history);
      } catch (err) {
        console.error('Error loading location history:', err);
      }
    }
  }, [isOpen, currentUser]);

  const saveLocationToHistory = (loc) => {
    if (!currentUser || !loc) return;
    const storageKey = `location_history_${currentUser._id}`;
    try {
      const existingHistory = JSON.parse(localStorage.getItem(storageKey)) || [];
      const filteredHistory = existingHistory.filter(item => 
        (item.placeId !== loc.placeId) && 
        (item.name !== loc.name || item.address !== loc.address)
      );
      const newHistory = [loc, ...filteredHistory].slice(0, 10);
      localStorage.setItem(storageKey, JSON.stringify(newHistory));
      setLocationHistory(newHistory);
    } catch (err) {
      console.error('Error saving location to history:', err);
    }
  };

  // Debounce Location Autocomplete search
  useEffect(() => {
    if (currentScreen !== 'location' || !locationSearch || locationSearch.trim().length < 3) {
      setLocationSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLocationLoading(true);
      setLocationError('');
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&addressdetails=1&limit=5`,
          {
            headers: {
              'User-Agent': 'ConnectHub-Social-App'
            }
          }
        );
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setLocationSuggestions(data);
      } catch (err) {
        console.error('Error fetching autocomplete locations:', err);
        setLocationError('Error fetching locations');
      } finally {
        setLocationLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [locationSearch, currentScreen]);

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

      if (isImage && file.size > 15 * 1024 * 1024) {
        showAlert(`Image ${file.name} is too large. Maximum size is 15MB.`, 'File Too Large');
        return;
      }

      if (isVideo && file.size > 200 * 1024 * 1024) {
        showAlert(`Video ${file.name} is too large. Maximum size is 200MB.`, 'File Too Large');
        return;
      }

      validFiles.push(file);
      validPreviews.push({
        url: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
        name: file.name,
        originalFile: isVideo ? null : file
      });
    }

    if (validFiles.length === 1 && validFiles[0].type.startsWith('image/')) {
      const file = validFiles[0];
      setTempOriginalFile(file);
      setCropperFileType(file.type);
      setCropperFileName(file.name);
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

  const handleCameraCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert('Please capture a valid image', 'Invalid File Type');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showAlert('Captured image is too large. Maximum size is 15MB.', 'File Too Large');
      return;
    }

    setTempOriginalFile(file);
    setCropperFileType(file.type);
    setCropperFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropperSrc(ev.target.result);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);

    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleStartCrop = (idx) => {
    const preview = imagePreviews[idx];
    if (!preview || preview.type !== 'image') return;

    const fileToCrop = preview.originalFile || chosenFiles[idx];
    if (!fileToCrop) return;

    setCropperFileType(fileToCrop.type);
    setCropperFileName(fileToCrop.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropperSrc(ev.target.result);
      setCroppingIndex(idx);
      setCropperOpen(true);
    };
    reader.readAsDataURL(fileToCrop);
  };

  const handleCropComplete = (croppedFile, previewUrl) => {
    if (croppingIndex !== null) {
      setChosenFiles((prev) => {
        const next = [...prev];
        next[croppingIndex] = croppedFile;
        return next;
      });
      setImagePreviews((prev) => {
        const next = [...prev];
        if (next[croppingIndex]?.url?.startsWith('blob:')) {
          URL.revokeObjectURL(next[croppingIndex].url);
        }
        next[croppingIndex] = {
          ...next[croppingIndex],
          url: previewUrl,
          name: croppedFile.name
        };
        return next;
      });
      setCroppingIndex(null);
    } else {
      setChosenFiles((prev) => [...prev, croppedFile]);
      setImagePreviews((prev) => [
        ...prev,
        {
          url: previewUrl,
          type: 'image',
          name: croppedFile.name,
          originalFile: tempOriginalFile
        }
      ]);
      setTempOriginalFile(null);
    }
    setCropperOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    setCroppingIndex(null);
    setTempOriginalFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'ConnectHub-Social-App'
              }
            }
          );
          if (!res.ok) throw new Error('Reverse geocoding failed');
          const data = await res.json();
          
          const addr = data.address || {};
          const name = addr.road || addr.suburb || addr.neighbourhood || 'Current Location';
          const city = addr.city || addr.town || addr.village || addr.suburb || '';
          const state = addr.state || '';
          const country = addr.country || '';
          const placeId = data.place_id ? data.place_id.toString() : `place_${Date.now()}`;

          const locData = {
            name,
            address: data.display_name,
            city,
            state,
            country,
            latitude,
            longitude,
            placeId
          };
          setLocation(locData);
          saveLocationToHistory(locData);
          setCurrentScreen('main');
          setLocationSearch('');
        } catch (err) {
          console.error(err);
          setLocationError('Failed to fetch details for your coordinates');
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocationError(err.code === 1 ? 'Location access denied' : 'Error retrieving location');
        setLocationLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSelectHistoryLocation = (historyLoc) => {
    setLocation(historyLoc);
    saveLocationToHistory(historyLoc);
    setCurrentScreen('main');
    setLocationSearch('');
  };

  const handleSelectOSMPlace = (place) => {
    const addr = place.address || {};
    const name = place.display_name.split(',')[0] || addr.suburb || addr.neighbourhood || 'Selected Location';
    const city = addr.city || addr.town || addr.village || addr.suburb || '';
    const state = addr.state || '';
    const country = addr.country || '';
    const latitude = parseFloat(place.lat);
    const longitude = parseFloat(place.lon);
    const placeId = place.place_id ? place.place_id.toString() : `place_${Date.now()}`;

    const locData = {
      name,
      address: place.display_name,
      city,
      state,
      country,
      latitude,
      longitude,
      placeId
    };
    setLocation(locData);
    saveLocationToHistory(locData);
    setCurrentScreen('main');
    setLocationSearch('');
  };

  const handleTagFriend = (friend) => {
    const tagString = `@${friend.username}`;
    if (!postText.includes(tagString)) {
      setPostText((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${tagString} ` : `${tagString} `;
      });
    }
    setCurrentScreen('main');
  };

  const handlePublishClick = async () => {
    if (!postText.trim() && chosenFiles.length === 0) return;

    setPublishLoading(true);
    try {
      let res;
      const feelingValue = selectedFeeling ? `${selectedFeeling.emoji} ${selectedFeeling.name}` : '';
      
      if (chosenFiles.length > 0) {
        const formData = new FormData();
        formData.append('content', postText.trim());
        chosenFiles.forEach((file) => {
          formData.append('postImages', file);
        });
        if (location) {
          formData.append('location', JSON.stringify(location));
        }
        if (feelingValue) {
          formData.append('feeling', feelingValue);
        }
        res = await publishPost(formData);
      } else {
        res = await publishPost({
          content: postText.trim(),
          location: location ? JSON.stringify(location) : undefined,
          feeling: feelingValue || undefined,
          bgColor: selectedBg.background !== 'transparent' ? selectedBg.background : undefined
        });
      }

      if (res.success) {
        setPostText('');
        clearSelectedMedia();
        setLocation(null);
        setSelectedFeeling(null);
        onClose();
      }
    } catch (err) {
      showAlert(err.message || 'Error publishing post', 'Error');
    } finally {
      setPublishLoading(false);
    }
  };

  // Filter feelings or activities
  const getFilteredFeelings = () => {
    const items = feelingTab === 'feelings' ? FEELINGS : ACTIVITIES;
    if (!feelingSearch) return items;
    return items.filter(f => f.name.toLowerCase().includes(feelingSearch.toLowerCase()));
  };

  const canPublish = (postText.trim().length > 0 || chosenFiles.length > 0) && postText.length <= 280;

  // Toggle Dropdowns helper
  const toggleAudience = (e) => {
    e.stopPropagation();
    setAudienceOpen(!audienceOpen);
    setAiLabelOpen(false);
  };

  const toggleAiLabel = (e) => {
    e.stopPropagation();
    setAiLabelOpen(!aiLabelOpen);
    setAudienceOpen(false);
  };

  useEffect(() => {
    const closeDropdowns = () => {
      setAudienceOpen(false);
      setAiLabelOpen(false);
    };
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Create post">
        {currentScreen === 'main' && (
          <div className="create-post-modal-content">
            {/* Header User Row */}
            <div className="create-post-header-row">
              <img
                src={getUploadUrl(currentUser?.profilePicture || '/uploads/default-avatar.png')}
                className="create-post-avatar"
                alt="Avatar"
              />
              <div className="create-post-user-meta">
                <div className="create-post-user-name-row">
                  <span style={{ fontWeight: 700 }}>{currentUser?.fullName}</span>
                  {selectedFeeling && (
                    <span className="create-post-meta-accent">
                      {' '}is {selectedFeeling.type === 'activity' ? 'acting' : 'feeling'} {selectedFeeling.emoji} <strong>{selectedFeeling.name}</strong>
                    </span>
                  )}
                  {location && (
                    <span className="create-post-meta-accent">
                      {' '}at 📍 <strong>{location.name}</strong>
                    </span>
                  )}
                </div>
                
                {/* pills dropdown */}
                <div className="create-post-user-pills">
                  <div style={{ position: 'relative' }}>
                    <button className="create-post-dropdown-pill" onClick={toggleAudience}>
                      👥 {audience} ▾
                    </button>
                    {audienceOpen && (
                      <div className="post-options-dropdown active" style={{ top: '24px', left: 0, minWidth: '120px' }}>
                        <div className="dropdown-item" onClick={() => setAudience('Public')}>Public</div>
                        <div className="dropdown-item" onClick={() => setAudience('Friends')}>Friends</div>
                        <div className="dropdown-item" onClick={() => setAudience('Only me')}>Only me</div>
                      </div>
                    )}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <button className="create-post-dropdown-pill" onClick={toggleAiLabel}>
                      🤖 AI label: {aiLabel ? 'On' : 'Off'} ▾
                    </button>
                    {aiLabelOpen && (
                      <div className="post-options-dropdown active" style={{ top: '24px', left: 0, minWidth: '120px' }}>
                        <div className="dropdown-item" onClick={() => setAiLabel(true)}>AI label on</div>
                        <div className="dropdown-item" onClick={() => setAiLabel(false)}>AI label off</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Input Text Area Container */}
            <div className="create-post-textarea-container" style={{ position: 'relative' }}>
              <textarea
                ref={textareaRef}
                className="create-post-textarea"
                placeholder={`What's on your mind, ${currentUser?.fullName?.split(' ')[0] || 'Shaheer'}?`}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                maxLength={280}
                style={selectedBg.background !== 'transparent' ? {
                  background: selectedBg.background,
                  color: selectedBg.color,
                  textAlign: 'center',
                  fontSize: '1.4rem',
                  fontWeight: '700',
                  minHeight: '220px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  padding: '50px 20px',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  border: 'none',
                  outline: 'none',
                  resize: 'none'
                } : {}}
              />
              <MentionSuggestions text={postText} setText={setPostText} targetInputRef={textareaRef} />

              <div className="create-post-textarea-footer" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {chosenFiles.length === 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button 
                      type="button" 
                      className={`create-post-aa-btn ${showBgSelector ? 'active' : ''}`}
                      onClick={() => setShowBgSelector(!showBgSelector)}
                      style={{
                        background: 'linear-gradient(135deg, #7117ea 0%, #ea6060 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        width: '32px',
                        height: '32px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem'
                      }}
                    >
                      Aa
                    </button>

                    {showBgSelector && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', animation: 'fadeIn 0.2s ease-in-out' }}>
                        {BG_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setSelectedBg(preset)}
                            style={{
                              background: preset.background === 'transparent' ? 'var(--input-bg)' : preset.background,
                              border: selectedBg.name === preset.name ? '2px solid var(--text-main)' : '1px solid var(--border-color)',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer',
                              boxShadow: selectedBg.name === preset.name ? '0 0 4px rgba(0,0,0,0.2)' : 'none',
                              transform: selectedBg.name === preset.name ? 'scale(1.1)' : 'none',
                              transition: 'all 0.1s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={preset.name}
                          >
                            {preset.background === 'transparent' && (
                              <div style={{ width: '10px', height: '10px', border: '1px solid var(--text-muted)', borderRadius: '50%' }}></div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button 
                  type="button" 
                  className="create-post-emoji-btn"
                  onClick={() => {
                    // Quick inject smiley face if feeling is not chosen
                    setSelectedFeeling({ emoji: '🙂', name: 'happy', type: 'feeling' });
                  }}
                  style={{ marginLeft: 'auto' }}
                >
                  🙂
                </button>
              </div>
            </div>

            {/* Media Upload Previews */}
            {imagePreviews.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px', marginBottom: '4px' }}>
                {imagePreviews.map((p, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(idx)}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', cursor: 'pointer', zIndex: 3 }}
                    >
                      &times;
                    </button>
                    {p.type === 'video' ? (
                      <video
                        src={p.url}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        onClick={() => handleStartCrop(idx)}
                        className="preview-image-container"
                        title="Click to crop image"
                      >
                        <img src={p.url} alt="upload preview" />
                        <div className="crop-overlay">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
                            <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add to Post Panel */}
            <div className="add-to-post-panel">
              <span className="add-to-post-title">Add to your post</span>
              <div className="add-to-post-actions">
                {/* Photo/Video upload trigger */}
                <button
                  type="button"
                  className="add-to-post-btn-item"
                  onClick={() => fileInputRef.current.click()}
                  data-tooltip="Photo/video"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#45bd62">
                    <path d="M22 16V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14a2 2 0 0 0 2 2h14v-2H4V6H2z"/>
                  </svg>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                />

                {/* Camera capture trigger */}
                <button
                  type="button"
                  className="add-to-post-btn-item"
                  onClick={() => cameraInputRef.current.click()}
                  data-tooltip="Camera"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#9c27b0">
                    <path d="M12 12c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0-8.5c-4.14 0-7.5 3.36-7.5 7.5s3.36 7.5 7.5 7.5 7.5-3.36 7.5-7.5-3.36-7.5-7.5-7.5zM20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
                  </svg>
                </button>
                <input
                  type="file"
                  ref={cameraInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                />

                {/* Tag friends trigger */}
                <button
                  type="button"
                  className="add-to-post-btn-item"
                  data-tooltip="Tag people"
                  onClick={() => setCurrentScreen('tag')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877f2">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </button>

                {/* Feeling/Activity trigger */}
                <button
                  type="button"
                  className="add-to-post-btn-item"
                  data-tooltip="Feeling/activity"
                  onClick={() => setCurrentScreen('feeling')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#f7b928">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="9" cy="9.5" r="1.5" fill="#fff" />
                    <circle cx="15" cy="9.5" r="1.5" fill="#fff" />
                  </svg>
                </button>

                {/* Location trigger */}
                <button
                  type="button"
                  className="add-to-post-btn-item"
                  data-tooltip="Check in"
                  onClick={() => setCurrentScreen('location')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#f5533d">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </button>

                {/* More options */}
                <button
                  type="button"
                  className="add-to-post-btn-item"
                  data-tooltip="More"
                  onClick={() => showAlert('More options are coming soon!', 'Create Post')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Submit Post Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <span className={`character-counter ${postText.length > 260 ? 'warning' : ''}`}>
                {postText.length}/280
              </span>
              <button
                className="create-post-submit-btn"
                onClick={handlePublishClick}
                disabled={!canPublish || publishLoading}
                style={{ flex: 1, marginLeft: '16px' }}
              >
                {publishLoading ? <Spinner size="18px" /> : 'Post'}
              </button>
            </div>
          </div>
        )}

        {currentScreen === 'feeling' && (
          <div className="sub-screen-container">
            {/* Header */}
            <div className="sub-screen-header">
              <button className="sub-screen-back-btn" onClick={() => setCurrentScreen('main')}>
                ←
              </button>
              <h3 className="sub-screen-title">How are you feeling?</h3>
            </div>

            {/* Tabs */}
            <div className="sub-screen-tabs">
              <button
                className={`sub-screen-tab ${feelingTab === 'feelings' ? 'active' : ''}`}
                onClick={() => setFeelingTab('feelings')}
              >
                Feelings
              </button>
              <button
                className={`sub-screen-tab ${feelingTab === 'activities' ? 'active' : ''}`}
                onClick={() => setFeelingTab('activities')}
              >
                Activities
              </button>
            </div>

            {/* Search Input */}
            <div className="sub-screen-search-box">
              <span className="sub-screen-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search"
                className="sub-screen-search-input"
                value={feelingSearch}
                onChange={(e) => setFeelingSearch(e.target.value)}
              />
            </div>

            {/* Grid list of feelings */}
            <div className="feelings-list-grid">
              {getFilteredFeelings().map((item) => (
                <div
                  key={item.name}
                  className="feeling-item"
                  onClick={() => {
                    setSelectedFeeling({
                      name: item.name,
                      emoji: item.emoji,
                      type: feelingTab === 'feelings' ? 'feeling' : 'activity'
                    });
                    setCurrentScreen('main');
                    setFeelingSearch('');
                  }}
                >
                  <span className="feeling-emoji">{item.emoji}</span>
                  <span className="feeling-name">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentScreen === 'location' && (
          <div className="sub-screen-container">
            {/* Header */}
            <div className="sub-screen-header">
              <button className="sub-screen-back-btn" onClick={() => setCurrentScreen('main')}>
                ←
              </button>
              <h3 className="sub-screen-title">Search for location</h3>
            </div>

            {/* Search Input */}
            <div className="sub-screen-search-box">
              <span className="sub-screen-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Where are you?"
                className="sub-screen-search-input"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
              />
            </div>

            {/* Geolocation Trigger */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGeolocate}
              disabled={locationLoading}
              style={{ borderRadius: '12px', justifyContent: 'center', width: '100%', padding: '10px' }}
            >
              📡 {locationLoading && !locationSearch ? 'Detecting Location...' : 'Use Current Location'}
            </button>

            {locationError && <div className="location-error-msg" style={{ textAlign: 'center', color: 'var(--danger)' }}>{locationError}</div>}

            {/* Suggested / Results List */}
            <div className="location-list">
              {locationLoading && locationSearch && (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Spinner size="20px" />
                </div>
              )}

              {/* Show searched result suggestions */}
              {!locationLoading && locationSearch && locationSuggestions.map((place) => (
                <div
                  key={place.place_id}
                  className="location-item"
                  onClick={() => handleSelectOSMPlace(place)}
                >
                  <div className="location-icon-wrapper">📍</div>
                  <div className="location-details">
                    <div className="location-name-text">
                      {place.display_name.split(',')[0]}
                    </div>
                    <div className="location-addr-text">
                      {place.display_name.split(',').slice(1).join(',').trim()}
                    </div>
                  </div>
                </div>
              ))}

              {/* Show user's specific location history if search box is empty */}
              {!locationSearch && locationHistory.length > 0 && (
                <div style={{ padding: '8px 12px 4px 12px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                  Recent Locations
                </div>
              )}
              {!locationSearch && locationHistory.map((historyLoc, idx) => (
                <div
                  key={historyLoc.placeId || idx}
                  className="location-item"
                  onClick={() => handleSelectHistoryLocation(historyLoc)}
                >
                  <div className="location-icon-wrapper">📍</div>
                  <div className="location-details">
                    <div className="location-name-text">{historyLoc.name}</div>
                    <div className="location-addr-text">{historyLoc.address}</div>
                  </div>
                </div>
              ))}
              {!locationSearch && locationHistory.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 15px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No recent locations found. Search above or use your current location to add one.
                </div>
              )}
            </div>
          </div>
        )}

        {currentScreen === 'tag' && (
          <div className="sub-screen-container">
            {/* Header */}
            <div className="sub-screen-header">
              <button className="sub-screen-back-btn" onClick={() => setCurrentScreen('main')}>
                ←
              </button>
              <h3 className="sub-screen-title">Tag friends</h3>
            </div>

            {/* Search Input */}
            <div className="sub-screen-search-box">
              <span className="sub-screen-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search friends"
                className="sub-screen-search-input"
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
              />
            </div>

            {/* Friends list */}
            <div className="location-list">
              {friendsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                  <Spinner size="24px" />
                </div>
              ) : (
                <>
                  {friends.filter(friend => 
                    friend.username.toLowerCase().includes(friendSearch.toLowerCase()) ||
                    friend.fullName.toLowerCase().includes(friendSearch.toLowerCase())
                  ).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      No friends found.
                    </div>
                  ) : (
                    friends.filter(friend => 
                      friend.username.toLowerCase().includes(friendSearch.toLowerCase()) ||
                      friend.fullName.toLowerCase().includes(friendSearch.toLowerCase())
                    ).map((friend) => (
                      <div
                        key={friend._id}
                        className="location-item"
                        onClick={() => handleTagFriend(friend)}
                      >
                        <img
                          src={getUploadUrl(friend.profilePicture || '/uploads/default-avatar.png')}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', marginRight: '12px' }}
                          alt={friend.fullName}
                        />
                        <div className="location-details">
                          <div className="location-name-text">{friend.fullName}</div>
                          <div className="location-addr-text">@{friend.username}</div>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Cropper integration inside the modal structure */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropperSrc}
        aspectRatio={1.6}
        onCrop={handleCropComplete}
        onClose={handleCropCancel}
        title="Crop Post Image"
        fileType={cropperFileType}
        fileName={cropperFileName}
      />
    </>
  );
};

export default CreatePostModal;
