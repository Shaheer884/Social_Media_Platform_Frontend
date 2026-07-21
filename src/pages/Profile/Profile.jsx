import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { usePosts } from '../../context/PostsContext';
import { useDialog } from '../../context/CustomDialogContext';
import userService from '../../services/userService';
import postService from '../../services/postService';
import PostCard from '../../components/PostCard/PostCard';
import Spinner from '../../components/Loader/Spinner';
import Modal from '../../components/Modal/Modal';
import { getUploadUrl } from '../../utils/mediaHelper';
import ImageCropperModal from '../../components/Modal/ImageCropperModal';

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

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [chosenAvatarFile, setChosenAvatarFile] = useState(null);
  const [chosenCoverFile, setChosenCoverFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState('');
  const [cropperAspect, setCropperAspect] = useState(1);
  const [cropperTarget, setCropperTarget] = useState('avatar');
  const [followLoading, setFollowLoading] = useState(false);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const isOwnProfile = profileUser?._id === currentUser?._id;

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await userService.getProfile(profileIdOrUsername);
      if (res.success) {
        setProfileUser(res.data);
        // Pre-fill edit fields
        setEditFullName(res.data.fullName);
        setEditLocation(res.data.location || '');
        setEditBio(res.data.bio || '');
        setAvatarPreview(getUploadUrl(res.data.profilePicture || '/uploads/default-avatar.png'));
        setCoverPreview(getUploadUrl(res.data.coverPhoto || '/uploads/default-cover.png'));
      }
    } catch (err) {
      console.error(err);
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
      }
    } catch (err) {
      console.error(err);
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

  // Open edit modal if edit query param is present
  useEffect(() => {
    if (searchParams.get('edit') === 'true' && isOwnProfile) {
      setEditModalOpen(true);
    }
  }, [searchParams, isOwnProfile]);

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

  // Live previews for edit file inputs and cropping
  const openCropperForFile = (file, target, aspect) => {
    if (!file.type.startsWith('image/')) {
      showAlert('Please select a valid image file', 'Invalid File');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropperSrc(reader.result);
      setCropperTarget(target);
      setCropperAspect(aspect);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      openCropperForFile(file, 'avatar', 1);
    }
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      openCropperForFile(file, 'cover', 3.3); // Aspect ratio of ~3.3:1 matches cover aspect ratio in CSS
    }
  };

  const handleCropComplete = (croppedFile, previewUrl) => {
    if (cropperTarget === 'avatar') {
      setChosenAvatarFile(croppedFile);
      setAvatarPreview(previewUrl);
    } else if (cropperTarget === 'cover') {
      setChosenCoverFile(croppedFile);
      setCoverPreview(previewUrl);
    }
    setCropperOpen(false);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  // URL inputs live previews
  const handleAvatarUrlChange = (e) => {
    let url = e.target.value;
    setEditAvatarUrl(url);
    if (url.trim()) {
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url.trim();
      }
      setAvatarPreview(url);
      setChosenAvatarFile(null);
    }
  };

  const handleCoverUrlChange = (e) => {
    let url = e.target.value;
    setEditCoverUrl(url);
    if (url.trim()) {
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url.trim();
      }
      setCoverPreview(url);
      setChosenCoverFile(null);
    }
  };

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);

    try {
      let res;
      if (chosenAvatarFile || chosenCoverFile) {
        const formData = new FormData();
        formData.append('fullName', editFullName.trim());
        formData.append('location', editLocation.trim());
        formData.append('bio', editBio.trim());
        if (chosenAvatarFile) formData.append('profilePicture', chosenAvatarFile);
        if (chosenCoverFile) formData.append('coverPhoto', chosenCoverFile);
        if (editAvatarUrl && !chosenAvatarFile) formData.append('profilePictureUrl', editAvatarUrl);
        if (editCoverUrl && !chosenCoverFile) formData.append('coverPhotoUrl', editCoverUrl);

        res = await userService.updateProfile(currentUser._id, formData);
      } else {
        res = await userService.updateProfile(currentUser._id, {
          fullName: editFullName.trim(),
          location: editLocation.trim(),
          bio: editBio.trim(),
          profilePictureUrl: editAvatarUrl.trim(),
          coverPhotoUrl: editCoverUrl.trim()
        });
      }

      if (res.success) {
        // Sync context
        updateLocalUser(res.data);
        // Refresh local details
        await fetchProfile();
        setEditModalOpen(false);
        // Clean URL params if they have edit=true
        if (searchParams.get('edit') === 'true') {
          navigate(location.pathname, { replace: true });
        }
      }
    } catch (err) {
      showAlert(err.message || 'Error updating profile', 'Error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = await showConfirm(
      "Are you sure you want to completely delete your account? This action is permanent and will completely remove your posts, comments, likes, notifications, and all profile data.",
      "Delete Account"
    );
    if (!confirmDelete) return;

    try {
      setEditSaving(true);
      const res = await userService.deleteAccount(currentUser._id);
      if (res.success) {
        await showAlert("Your account has been successfully deleted.", "Account Deleted");
        setEditModalOpen(false);
        logout();
        navigate('/login');
      }
    } catch (err) {
      showAlert(err.message || "Error deleting account", "Error");
    } finally {
      setEditSaving(false);
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
  const cover = getUploadUrl(u.coverPhoto || '/uploads/default-cover.png');
  const avatar = getUploadUrl(u.profilePicture || '/uploads/default-avatar.png');
  const joinDate = new Date(u.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // Friendship buttons logic
  let followBtnClass = 'btn btn-primary';
  let followBtnText = 'Follow';
  if (u.relationshipStatus === 'friends') {
    followBtnClass = 'btn btn-secondary friends';
    followBtnText = 'Friends';
  } else if (u.relationshipStatus === 'following') {
    followBtnClass = 'btn btn-secondary following';
    followBtnText = 'Following';
  }

  return (
    <Layout onFollowChange={fetchProfile}>
      <div className="card profile-header-card">
        <div className="profile-cover-photo-wrapper">
          <img src={cover} className="profile-cover-photo" alt="Cover" />
          <div className="profile-avatar-wrapper">
            <img src={avatar} className="profile-avatar" alt="Avatar" />
          </div>
        </div>

        <div className="profile-actions-wrapper">
          {isOwnProfile ? (
            <button className="btn btn-secondary" onClick={() => setEditModalOpen(true)}>Edit Profile</button>
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
          <h1 className="profile-fullname">{u.fullName}</h1>
          <div className="profile-username-tag">@{u.username}</div>
          <p className="profile-bio-text">{u.bio || 'No bio yet.'}</p>

          <div className="profile-meta-info">
            {u.location && (
              <div className="profile-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{u.location}</span>
              </div>
            )}
            <div className="profile-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      <div className="feed-header">
        <h2 className="feed-title" id="posts-title">Posts</h2>
      </div>

      <div id="user-posts-container">
        {loadingPosts ? (
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

      {/* Edit Profile Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Profile">
        <form onSubmit={handleEditProfileSubmit}>
          <div className="modal-body">
            {/* Live Cover and Avatar Preview Panel */}
            <div className="profile-edit-cover-preview-wrapper" id="edit-cover-wrapper">
              <img src={coverPreview} id="edit-cover-img" className="profile-edit-cover-preview" alt="Cover Preview" />
              <button className="edit-overlay-btn" type="button" onClick={() => coverInputRef.current.click()} title="Change Cover Image">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
              </button>
              <input type="file" ref={coverInputRef} className="hidden-file-input" accept="image/*" onChange={handleCoverFileChange} />

              <div className="profile-edit-avatar-preview-wrapper" id="edit-avatar-wrapper">
                <img src={avatarPreview} id="edit-avatar-img" className="profile-edit-avatar-preview" alt="Avatar Preview" />
                <button className="edit-overlay-btn" type="button" onClick={() => avatarInputRef.current.click()} title="Change Avatar Image">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                </button>
                <input type="file" ref={avatarInputRef} className="hidden-file-input" accept="image/*" onChange={handleAvatarFileChange} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label" htmlFor="edit-fullName">Full Name</label>
              <input type="text" id="edit-fullName" className="form-input" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-location">Location</label>
              <input type="text" id="edit-location" className="form-input" placeholder="e.g. San Francisco, CA" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-bio">Bio</label>
              <textarea id="edit-bio" className="form-input form-textarea" placeholder="Tell us about yourself..." maxLength="160" value={editBio} onChange={(e) => setEditBio(e.target.value)}></textarea>
            </div>

            <div className="delete-account-section" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--danger)', marginBottom: '8px' }}>Danger Zone</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Once you delete your account, there is no going back. All your posts, comments, likes, and settings will be permanently removed.
              </p>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={editSaving}>
              {editSaving ? <Spinner size="16px" style={{ borderColor: 'transparent', borderTopColor: '#fff' }} /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropperSrc}
        aspectRatio={cropperAspect}
        onCrop={handleCropComplete}
        onClose={handleCropCancel}
        title={cropperTarget === 'avatar' ? "Crop Profile Picture" : "Crop Cover Photo"}
      />
    </Layout>
  );
};

export default Profile;
