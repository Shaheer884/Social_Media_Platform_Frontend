/* global __APP_VERSION__, __BUILD_TIMESTAMP__, __COMMIT_HASH__ */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { usePosts } from '../../context/PostsContext';
import { useDialog } from '../../context/CustomDialogContext';
import userService from '../../services/userService';
import postService from '../../services/postService';
import postCardService from '../../services/postService'; // keep original ref if any
import PostCard from '../../components/PostCard/PostCard';
import Spinner from '../../components/Loader/Spinner';
import Modal from '../../components/Modal/Modal';
import { getUploadUrl } from '../../utils/mediaHelper';
import ImageCropperModal from '../../components/Modal/ImageCropperModal';
import birthdayService from '../../services/birthdayService';
import GiftModal from '../../components/Birthday/GiftModal';
import { getCacheSize, clearAppCache } from '../../utils/cacheManager';


const Profile = () => {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, updateLocalUser, logout } = useAuth();
  const { toggleLike } = usePosts();
  const { showAlert, showConfirm } = useDialog();

  const profileIdOrUsername = username || searchParams.get('id') || currentUser?._id;

  const [profileUser, setProfileUser] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [followListModalOpen, setFollowListModalOpen] = useState(false);
  const [followListType, setFollowListType] = useState('followers'); // 'followers' or 'following'
  const [followListUsers, setFollowListUsers] = useState([]);
  const [loadingFollowList, setLoadingFollowList] = useState(false);


  const [isCachedProfileData, setIsCachedProfileData] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Birthday Wall States
  const [activeTab, setActiveTab] = useState('posts');
  const [wishes, setWishes] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [loadingWishes, setLoadingWishes] = useState(true);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [newWishMessage, setNewWishMessage] = useState('');
  const [postingWish, setPostingWish] = useState(false);
  const [replyInputWishId, setReplyInputWishId] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [postingReply, setPostingReply] = useState(false);
  const [editingWishId, setEditingWishId] = useState(null);
  const [editingWishText, setEditingWishText] = useState('');






  const isOwnProfile = profileUser?._id === currentUser?._id;

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await userService.getProfile(profileIdOrUsername);
      if (res.success) {
        setProfileUser(res.data);
        setIsCachedProfileData(false);
        // Cache this profile user
        localStorage.setItem('connecthub_cached_profile_user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.error(err);

      // Attempt to load from offline cache
      const cachedUserStr = localStorage.getItem('connecthub_cached_profile_user');
      if (cachedUserStr) {
        try {
          const cachedUser = JSON.parse(cachedUserStr);
          // Check if the requested user is the cached user
          const isMatch = cachedUser._id === profileIdOrUsername || 
                          cachedUser.username === profileIdOrUsername || 
                          (!profileIdOrUsername && cachedUser._id === currentUser?._id);
          
          if (isMatch) {
            setProfileUser(cachedUser);
            setIsCachedProfileData(true);
            console.log('Loaded profile from offline cache');
            return;
          }
        } catch (e) {
          // Ignore
        }
      }

      // If offline and request failed, dispatch the offline error to trigger fallback page
      if (!navigator.onLine && err.message !== 'OFFLINE_QUEUED') {
        window.dispatchEvent(new Event('api-offline-error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfilePosts = async () => {
    if (!profileUser?._id) return;
    setLoadingPosts(true);
    try {
      const res = await postService.getUserPosts(profileUser._id);
      if (res.success) {
        setProfilePosts(res.data);
        // Cache posts if they belong to our cached user
        const cachedUserStr = localStorage.getItem('connecthub_cached_profile_user');
        if (cachedUserStr) {
          try {
            const cachedUser = JSON.parse(cachedUserStr);
            if (cachedUser._id === profileUser._id) {
              localStorage.setItem('connecthub_cached_profile_posts', JSON.stringify(res.data));
            }
          } catch (e) {
            // Ignore
          }
        }
      }
    } catch (err) {
      console.error(err);

      // Load posts from cache if offline and viewing the cached user
      if (isCachedProfileData) {
        const cachedPostsStr = localStorage.getItem('connecthub_cached_profile_posts');
        if (cachedPostsStr) {
          try {
            const cachedPosts = JSON.parse(cachedPostsStr);
            setProfilePosts(cachedPosts);
            console.log('Loaded profile posts from offline cache');
          } catch (e) {
            // Ignore
          }
        }
      }
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [profileIdOrUsername]);

  useEffect(() => {
    fetchProfilePosts();
  }, [profileUser?._id]);

  const hasBirthdayAccess = profileUser?.birthday && (
    profileUser.birthdayPrivacy === 'Public' ||
    isOwnProfile ||
    (profileUser.birthdayPrivacy === 'Friends Only' && profileUser.relationshipStatus === 'friends')
  );

  const isBirthdayToday = (() => {
    if (!profileUser?.birthday) return false;
    const today = new Date();
    const bday = new Date(profileUser.birthday);
    return bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate();
  })();

  const getCountdownString = () => {
    if (!profileUser?.birthday) return null;
    const today = new Date();
    const bday = new Date(profileUser.birthday);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate()) {
      return "🎉 Happy Birthday!";
    }

    const bdayThisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    bdayThisYear.setHours(0, 0, 0, 0);
    
    let targetBday = bdayThisYear;
    if (bdayThisYear < startOfToday) {
      targetBday = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
    }
    targetBday.setHours(0, 0, 0, 0);

    const diffTime = targetBday.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays === 0) {
      return `Birthday in: ${diffHours} Hour${diffHours !== 1 ? 's' : ''}`;
    }
    return `Birthday in: ${diffDays} Day${diffDays !== 1 ? 's' : ''} and ${diffHours} Hour${diffHours !== 1 ? 's' : ''}`;
  };

  const fetchWishesAndGifts = async () => {
    if (!profileUser?._id || !hasBirthdayAccess) return;
    setLoadingWishes(true);
    try {
      const res = await birthdayService.getWishesAndGifts(profileUser._id);
      if (res.success) {
        setWishes(res.data.wishes);
        setGifts(res.data.gifts);
      }
    } catch (err) {
      console.error('Error fetching wishes and gifts:', err);
    } finally {
      setLoadingWishes(false);
    }
  };

  useEffect(() => {
    fetchWishesAndGifts();
  }, [profileUser?._id, activeTab]);

  useEffect(() => {
    if (searchParams.get('wish') === 'true' && isBirthdayToday) {
      setActiveTab('birthday');
    }
  }, [searchParams, isBirthdayToday]);

  const handleLikeWish = async (wishId) => {
    try {
      const res = await birthdayService.likeWish(wishId);
      if (res.success) {
        setWishes(prev => prev.map(w => w._id === wishId ? { ...w, likes: res.data.likes } : w));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplyWish = async (wishId) => {
    if (!replyMessage.trim()) return;
    setPostingReply(true);
    try {
      const res = await birthdayService.replyWish(wishId, replyMessage.trim());
      if (res.success) {
        setWishes(prev => prev.map(w => w._id === wishId ? res.data : w));
        setReplyMessage('');
        setReplyInputWishId(null);
      }
    } catch (err) {
      showAlert(err.message || 'Error replying', 'Error');
    } finally {
      setPostingReply(false);
    }
  };

  const handleEditWish = async (wishId, newText) => {
    if (!newText.trim()) return;
    try {
      const res = await birthdayService.editWish(wishId, newText.trim());
      if (res.success) {
        setWishes(prev => prev.map(w => w._id === wishId ? res.data : w));
        setEditingWishId(null);
        showAlert('Your birthday wish has been updated!', 'Success');
      }
    } catch (err) {
      showAlert(err.message || 'Error updating wish', 'Error');
    }
  };

  const handleDeleteWish = async (wishId) => {
    const confirmDelete = await showConfirm('Are you sure you want to delete this birthday wish?', 'Delete Wish');
    if (!confirmDelete) return;

    try {
      const res = await birthdayService.deleteWish(wishId);
      if (res.success) {
        setWishes(prev => prev.filter(w => w._id !== wishId));
      }
    } catch (err) {
      showAlert(err.message || 'Error deleting wish', 'Error');
    }
  };

  const handlePostWish = async (e) => {
    e.preventDefault();
    if (!newWishMessage.trim()) return;
    setPostingWish(true);
    try {
      const res = await birthdayService.postWish(profileUser._id, newWishMessage.trim());
      if (res.success) {
        setWishes(prev => [res.data, ...prev]);
        setNewWishMessage('');
        showAlert('Your birthday wish has been posted!', 'Success');
      }
    } catch (err) {
      showAlert(err.response?.data?.error || err.message || 'Failed to post wish', 'Error');
    } finally {
      setPostingWish(false);
    }
  };

  const handleSendGift = async (giftType, message) => {
    try {
      const res = await birthdayService.postGift(profileUser._id, giftType, message);
      if (res.success) {
        setGifts(prev => [res.data, ...prev]);
        showAlert('Your virtual gift has been sent!', 'Success');
      }
    } catch (err) {
      showAlert(err.response?.data?.error || err.message || 'Failed to send gift', 'Error');
      throw err;
    }
  };

  // Redirect legacy edit profile parameter trigger to Settings page
  useEffect(() => {
    if (searchParams.get('edit') === 'true' && isOwnProfile) {
      navigate('/settings/account', { replace: true });
    }
  }, [searchParams, isOwnProfile, navigate]);

  const handleFollowToggle = async () => {
    if (!profileUser) return;
    setFollowLoading(true);
    const following = profileUser.relationshipStatus === 'following' || profileUser.relationshipStatus === 'friends';
    try {
      if (following) {
        await userService.unfollowUser(profileUser._id);
      } else {
        await userService.followUser(profileUser._id);
      }
      await fetchProfile();
    } catch (err) {
      showAlert('Error updating follow status', 'Error');
    } finally {
      setFollowLoading(false);
    }
  };

  const openFollowModal = async (type) => {
    setFollowListType(type);
    setFollowListModalOpen(true);
    setLoadingFollowList(true);
    try {
      const res = type === 'followers'
        ? await userService.getFollowers(profileUser._id)
        : await userService.getFollowing(profileUser._id);
      if (res.success) {
        setFollowListUsers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFollowList(false);
    }
  };

  const handleModalFollowClick = async (e, userId, currentStatus) => {
    e.stopPropagation();
    const isFollowing = currentStatus === 'following' || currentStatus === 'friends';
    try {
      if (isFollowing) {
        await userService.unfollowUser(userId);
      } else {
        await userService.followUser(userId);
      }
      // Refresh list
      openFollowModal(followListType);
      // Refresh stats
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };



  if (loading) {
    return (
      <Layout>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Spinner />
          <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  if (!profileUser) {
    return (
      <Layout>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
          <h3>Profile not found</h3>
          <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginTop: '16px' }}>Go Home</button>
        </div>
      </Layout>
    );
  }

  const u = profileUser;
  const showPrivateMedia = !u.isPrivate || isOwnProfile || u.relationshipStatus === 'friends';
  const cover = getUploadUrl(showPrivateMedia ? (u.coverPhoto || '/uploads/default-cover.png') : '/uploads/default-cover.png');
  const avatar = getUploadUrl(showPrivateMedia ? (u.profilePicture || '/uploads/default-avatar.png') : '/uploads/default-avatar.png');
  const joinDate = new Date(u.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  let followBtnClass = 'btn btn-primary';
  let followBtnText = 'Follow';
  if (u.relationshipStatus === 'friends') {
    followBtnClass = 'btn btn-secondary friends';
    followBtnText = 'Friends';
  } else if (u.relationshipStatus === 'following') {
    followBtnClass = 'btn btn-secondary following';
    followBtnText = 'Following';
  } else if (u.relationshipStatus === 'follow_back') {
    followBtnClass = 'btn btn-primary follow-back';
    followBtnText = 'Follow Back';
  }

  return (
    <Layout onFollowChange={fetchProfile}>
      {isCachedProfileData && (
        <div className="cached-data-indicator" style={{ marginBottom: '16px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Offline Mode: Showing cached profile details.</span>
        </div>
      )}
      <div className="card profile-header-card">
        <div className="profile-cover-photo-wrapper">
          <img src={cover} className="profile-cover-photo" alt="Cover" />
          <div className="profile-avatar-wrapper">
            <img src={avatar} className="profile-avatar" alt="Avatar" />
          </div>
        </div>

        <div className="profile-actions-wrapper" style={{ display: 'flex', gap: '8px' }}>
          {isOwnProfile ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/profile/${u.username}/memories`)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>📸</span> Memories
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/settings')}>Settings</button>
            </>
          ) : (
            <button className={followBtnClass} onClick={handleFollowToggle} disabled={followLoading}>
              {u.relationshipStatus === 'friends' && (
                <svg className="friends-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              )}
              <span className="btn-text">{followBtnText}</span>
            </button>
          )}
        </div>

        <div className="profile-details-section">
          <h1 className="profile-fullname" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {u.fullName}
            {isBirthdayToday && (
              <span style={{
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                color: '#ec4899',
                fontSize: '0.75rem',
                padding: '4px 8px',
                borderRadius: '9999px',
                border: '1px solid rgba(236, 72, 153, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}>
                🎂 Birthday Today
              </span>
            )}
          </h1>
          <div className="profile-username-tag">@{u.username}</div>
          <p className="profile-bio-text">{u.bio || 'No bio yet.'}</p>

          <div className="profile-meta-info">
            {u.location && (
              <div className="profile-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#ff4b4b' }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{u.location}</span>
              </div>
            )}
            {u.birthday && (
              <>
                <div className="profile-meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#ff2e93' }}>
                    <polyline points="20 12 20 22 4 22 4 12" />
                    <rect x="2" y="7" width="20" height="5" />
                    <line x1="12" y1="22" x2="12" y2="7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                  <span>Born {new Date(u.birthday).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {hasBirthdayAccess && (
                  <div className="profile-meta-item" style={{ fontWeight: 600, color: 'var(--purple)' }}>
                    <span style={{ fontSize: '1rem' }}>⏳</span>
                    <span>{getCountdownString()}</span>
                  </div>
                )}
              </>
            )}
            <div className="profile-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#1d9bf0' }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Joined {joinDate}</span>
            </div>
          </div>

          <div className="profile-stats-row">
            <div className="profile-stat-box" id="profile-posts-stat">
              <div className="profile-stat-value">{u.postCount}</div>
              <div className="profile-stat-label">Posts</div>
            </div>
            <div className="profile-stat-box" id="profile-following-stat" onClick={() => openFollowModal('following')}>
              <div className="profile-stat-value" style={{ color: 'var(--purple)' }}>{u.followingCount}</div>
              <div className="profile-stat-label">Following</div>
            </div>
            <div className="profile-stat-box" id="profile-followers-stat" onClick={() => openFollowModal('followers')}>
              <div className="profile-stat-value" style={{ color: 'var(--pink)' }}>{u.followersCount}</div>
              <div className="profile-stat-label">Followers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      {hasBirthdayAccess && isBirthdayToday ? (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', gap: '20px' }}>
          <button
            onClick={() => setActiveTab('posts')}
            style={{
              padding: '12px 8px',
              fontSize: '1rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'posts' ? '3px solid var(--purple)' : '3px solid transparent',
              color: activeTab === 'posts' ? 'var(--purple)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Posts ({profilePosts.length})
          </button>
          <button
            onClick={() => setActiveTab('birthday')}
            style={{
              padding: '12px 8px',
              fontSize: '1rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'birthday' ? '3px solid var(--purple)' : '3px solid transparent',
              color: activeTab === 'birthday' ? 'var(--purple)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Birthday Wall 🎂
          </button>
        </div>
      ) : (
        <div className="feed-header">
          <h2 className="feed-title" id="posts-title">Posts</h2>
        </div>
      )}

      {activeTab === 'posts' ? (
        <div id="user-posts-container">
          {u.isPrivate && !isOwnProfile ? (
            <div style={{
              padding: '60px 40px',
              textAlign: 'center',
              backgroundColor: 'var(--card-bg)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '3rem' }}>🔒</div>
              <h3 style={{ color: 'var(--text-main)', margin: 0 }}>This Account is Private</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, maxWidth: '280px' }}>
                Follow this user to see their posts and stories.
              </p>
            </div>
          ) : loadingPosts ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spinner />
            </div>
          ) : profilePosts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              No posts from this user yet.
            </div>
          ) : (
            profilePosts.map((post) => (
              <PostCard
                key={post._id}
                post={{ ...post, author: u }} // Ensure author object matches profile lookup details
              />
            ))
          )}
        </div>
      ) : (
        /* Birthday Wall View */
        <div id="user-birthday-wall-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
          {/* Virtual Gifts Display */}
          {gifts.length > 0 && (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                🎁 Received Gifts ({gifts.length})
              </h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {gifts.map(g => (
                  <div
                    key={g._id}
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    title={`Sent by ${g.sender?.fullName} - "${g.message || 'Happy Birthday!'}"`}
                  >
                    <span style={{ fontSize: '1.4rem' }}>
                      {g.giftType === 'Cake' ? '🎂' :
                       g.giftType === 'Gift Box' ? '🎁' :
                       g.giftType === 'Flowers' ? '🌹' :
                       g.giftType === 'Balloons' ? '🎈' :
                       g.giftType === 'Chocolate' ? '🍫' : '☕'}
                    </span>
                    <div style={{ lineHeight: 1.2 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>{g.giftType}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>From {g.sender?.fullName.split(' ')[0]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Panel: Wish Message and Send Gift */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <h4 style={{ margin: 0, color: 'var(--text-main)' }}>Write a Birthday Wish</h4>
              {!isOwnProfile && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setGiftModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  <span>🎁</span> Send Virtual Gift
                </button>
              )}
            </div>

            <form onSubmit={handlePostWish}>
              <textarea
                className="form-input form-textarea"
                placeholder={isOwnProfile ? "Write a birthday note to yourself..." : `Wish ${u.fullName} a Happy Birthday! Add emojis...`}
                value={newWishMessage}
                onChange={(e) => setNewWishMessage(e.target.value)}
                rows="3"
                required
                maxLength="300"
                style={{ marginBottom: '12px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['🎉', '🎂', '🎁', '🎈', '❤️', '🌹'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewWishMessage(prev => prev + emoji)}
                      style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '2px' }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }} disabled={postingWish || !newWishMessage.trim()}>
                  {postingWish ? 'Posting...' : 'Post Wish 🎂'}
                </button>
              </div>
            </form>
          </div>

          {/* Birthday Wall Wishes List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {loadingWishes ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spinner />
              </div>
            ) : wishes.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                No wishes on the wall yet. Be the first to wish them!
              </div>
            ) : (
              wishes.map((wish) => {
                const isWishSender = wish.sender?._id === currentUser?._id;
                const hasLiked = wish.likes.includes(currentUser?._id);

                return (
                  <div key={wish._id} className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <img
                        src={getUploadUrl(wish.sender?.profilePicture || '/uploads/default-avatar.png')}
                        alt={wish.sender?.fullName}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{wish.sender?.fullName}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>@{wish.sender?.username}</span>
                          </div>
                          {isWishSender && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button
                                onClick={() => { setEditingWishId(wish._id); setEditingWishText(wish.message); }}
                                style={{ background: 'none', border: 'none', color: 'var(--purple)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteWish(wish._id)}
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        {editingWishId === wish._id ? (
                          <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                            <textarea
                              className="form-input form-textarea"
                              value={editingWishText}
                              onChange={(e) => setEditingWishText(e.target.value)}
                              rows="2"
                              maxLength="300"
                              style={{ width: '100%', marginBottom: '6px' }}
                            />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setEditingWishId(null)}
                                className="btn btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleEditWish(wish._id, editingWishText)}
                                className="btn btn-primary"
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                disabled={!editingWishText.trim()}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ margin: '8px 0', fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                            {wish.message}
                          </p>
                        )}

                        {/* Actions row: Like and Reply toggler */}
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '12px' }}>
                          <button
                            onClick={() => handleLikeWish(wish._id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: hasLiked ? 'var(--pink)' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={hasLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            {wish.likes.length} {wish.likes.length === 1 ? 'Like' : 'Likes'}
                          </button>

                          <button
                            onClick={() => setReplyInputWishId(replyInputWishId === wish._id ? null : wish._id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            {wish.replies.length} {wish.replies.length === 1 ? 'Reply' : 'Replies'}
                          </button>
                        </div>

                        {/* Replies List */}
                        {wish.replies.length > 0 && (
                          <div style={{ marginTop: '12px', borderLeft: '2px solid var(--border-color)', paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {wish.replies.map(rep => (
                              <div key={rep._id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <img
                                  src={getUploadUrl(rep.sender?.profilePicture || '/uploads/default-avatar.png')}
                                  alt=""
                                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', marginTop: '2px' }}
                                />
                                <div style={{ flex: 1, background: 'var(--input-bg)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{rep.sender?.fullName}</span>
                                  <p style={{ margin: '2px 0 0 0', color: 'var(--text-main)', lineHeight: '1.3' }}>{rep.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Input Form */}
                        {replyInputWishId === wish._id && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
                            <input
                              type="text"
                              placeholder="Write a reply..."
                              className="form-input"
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', height: 'auto' }}
                            />
                            <button
                              onClick={() => handleReplyWish(wish._id)}
                              className="btn btn-primary"
                              disabled={postingReply || !replyMessage.trim()}
                              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            >
                              Reply
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Followers/Following Modal */}
      <Modal isOpen={followListModalOpen} onClose={() => setFollowListModalOpen(false)} title={followListType === 'followers' ? 'Followers' : 'Following'}>
        <div className="modal-body" id="follow-modal-list-body">
          {loadingFollowList ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <Spinner />
            </div>
          ) : followListUsers.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No users found
            </div>
          ) : (
            followListUsers.map((user) => {
              const showButton = user._id !== currentUser?._id;
              let isFollowing = user.relationshipStatus === 'following' || user.relationshipStatus === 'friends';
              let followBtnSmClass = 'follow-btn-sm modal-follow-btn';
              let followBtnSmText = 'Follow';

              if (user.relationshipStatus === 'friends') {
                followBtnSmClass = 'follow-btn-sm friends modal-follow-btn';
                followBtnSmText = 'Friends';
              } else if (user.relationshipStatus === 'following') {
                followBtnSmClass = 'follow-btn-sm following modal-follow-btn';
                followBtnSmText = 'Following';
              } else if (user.relationshipStatus === 'follow_back') {
                followBtnSmClass = 'follow-btn-sm follow-back modal-follow-btn';
                followBtnSmText = 'Follow Back';
              }

              return (
                <div key={user._id} className="suggested-user-item" style={{ marginBottom: '12px' }}>
                  <div className="suggested-user-info" onClick={() => { setFollowListModalOpen(false); navigate(`/profile/${user.username}`); }}>
                    <img src={getUploadUrl(user.profilePicture || '/uploads/default-avatar.png')} className="suggested-user-avatar" alt="Avatar" />
                    <div>
                      <div className="suggested-user-name">{user.fullName}</div>
                      <div className="suggested-user-username">@{user.username}</div>
                    </div>
                  </div>
                  {showButton && (
                    <button
                      className={followBtnSmClass}
                      onClick={(e) => handleModalFollowClick(e, user._id, user.relationshipStatus)}
                    >
                      <span className="btn-text">{followBtnSmText}</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>



      {giftModalOpen && (
        <GiftModal
          isOpen={giftModalOpen}
          onClose={() => setGiftModalOpen(false)}
          recipientName={u.fullName}
          onSendGift={handleSendGift}
        />
      )}
    </Layout>
  );
};

export default Profile;
