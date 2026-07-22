import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import Spinner from '../../components/Loader/Spinner';
import { getUploadUrl } from '../../utils/mediaHelper';
import { useDialog } from '../../context/CustomDialogContext';

const Friends = () => {
  const { currentUser } = useAuth();
  const { showAlert } = useDialog();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'suggestions' | 'all'
  const [followers, setFollowers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all necessary data
  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Fetch followers (contains requests and mutual friends)
      const followersRes = await userService.getFollowers(currentUser._id);
      if (followersRes.success) {
        setFollowers(followersRes.data);
      }

      // Fetch suggestions
      const suggestionsRes = await userService.getSuggestions();
      if (suggestionsRes.success) {
        setSuggestions(suggestionsRes.data);
      }
    } catch (err) {
      console.error(err);
      showAlert('Failed to load friends data.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Actions
  const handleConfirmRequest = async (userId) => {
    try {
      const res = await userService.followUser(userId);
      if (res.success) {
        showAlert('Friend request accepted!', 'Success');
        // Refresh data
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Error accepting friend request.', 'Error');
    }
  };

  const handleDeleteRequest = async (userId) => {
    try {
      const res = await userService.removeFollower(userId);
      if (res.success) {
        showAlert('Friend request deleted.', 'Success');
        // Refresh data
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Error deleting friend request.', 'Error');
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      const res = await userService.followUser(userId);
      if (res.success) {
        showAlert(res.relationshipStatus === 'friends' ? 'You are now friends!' : 'Followed successfully!', 'Success');
        // Refresh data
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Error adding friend.', 'Error');
    }
  };

  const handleUnfriend = async (userId) => {
    try {
      const res = await userService.unfollowUser(userId);
      if (res.success) {
        showAlert('Unfriended successfully.', 'Success');
        // Refresh data
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Error unfriending.', 'Error');
    }
  };

  // Filter lists
  const pendingRequests = followers.filter(
    (u) => u.relationshipStatus === 'follow' || !u.relationshipStatus || u.relationshipStatus === 'none'
  );

  const mutualFriends = followers.filter((u) => u.relationshipStatus === 'friends');

  return (
    <Layout>
      <div className="feed-header">
        <h2 className="feed-title">Friends Manager</h2>
      </div>

      {/* Responsive tab selector */}
      <div className="card" style={{ padding: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('requests')}
            className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '10px 4px', fontSize: '0.85rem' }}
          >
            Friend Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`btn ${activeTab === 'suggestions' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '10px 4px', fontSize: '0.85rem' }}
          >
            Suggestions
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '10px 4px', fontSize: '0.85rem' }}
          >
            All Friends {mutualFriends.length > 0 && `(${mutualFriends.length})`}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner size="40px" />
        </div>
      ) : (
        <div id="friends-list-container">
          {/* TAB 1: PENDING FRIEND REQUESTS */}
          {activeTab === 'requests' && (
            <>
              {pendingRequests.length === 0 ? (
                <div className="card empty-state-container">
                  <div className="empty-state-icon">📥</div>
                  <h3 className="empty-state-title">No pending requests</h3>
                  <p className="empty-state-desc">When people follow you, their request to connect as friends will show up here.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                  {pendingRequests.map((user) => (
                    <div key={user._id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                      <img
                        src={getUploadUrl(user.profilePicture || '/uploads/default-avatar.png')}
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => navigate(`/profile/${user.username}`)}
                        alt={user.fullName}
                      />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', cursor: 'pointer' }} onClick={() => navigate(`/profile/${user.username}`)}>
                          {user.fullName}
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{user.username}</span>
                        {user.bio && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: '8px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '32px' }}>
                            {user.bio}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', width: '100%', gap: '8px', marginTop: 'auto' }}>
                        <button className="btn btn-primary" style={{ flex: 1, padding: '8px 4px', fontSize: '0.85rem' }} onClick={() => handleConfirmRequest(user._id)}>
                          Confirm
                        </button>
                        <button className="btn btn-secondary" style={{ flex: 1, padding: '8px 4px', fontSize: '0.85rem' }} onClick={() => handleDeleteRequest(user._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 2: SUGGESTIONS */}
          {activeTab === 'suggestions' && (
            <>
              {suggestions.length === 0 ? (
                <div className="card empty-state-container">
                  <div className="empty-state-icon">💡</div>
                  <h3 className="empty-state-title">No suggestions</h3>
                  <p className="empty-state-desc">We couldn't find any recommendations right now. Try searching for users instead!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                  {suggestions.map((user) => (
                    <div key={user._id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                      <img
                        src={getUploadUrl(user.profilePicture || '/uploads/default-avatar.png')}
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => navigate(`/profile/${user.username}`)}
                        alt={user.fullName}
                      />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', cursor: 'pointer' }} onClick={() => navigate(`/profile/${user.username}`)}>
                          {user.fullName}
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{user.username}</span>
                        {user.bio && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: '8px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '32px' }}>
                            {user.bio}
                          </p>
                        )}
                      </div>
                      <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto', padding: '8px 4px', fontSize: '0.85rem' }} onClick={() => handleAddFriend(user._id)}>
                        Add Friend
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 3: ALL FRIENDS */}
          {activeTab === 'all' && (
            <>
              {mutualFriends.length === 0 ? (
                <div className="card empty-state-container">
                  <div className="empty-state-icon">👥</div>
                  <h3 className="empty-state-title">No friends yet</h3>
                  <p className="empty-state-desc">You are not mutual friends with anyone yet. Explore suggestions or search to connect!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                  {mutualFriends.map((user) => (
                    <div key={user._id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                      <img
                        src={getUploadUrl(user.profilePicture || '/uploads/default-avatar.png')}
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => navigate(`/profile/${user.username}`)}
                        alt={user.fullName}
                      />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', cursor: 'pointer' }} onClick={() => navigate(`/profile/${user.username}`)}>
                          {user.fullName}
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{user.username}</span>
                        {user.bio && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: '8px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '32px' }}>
                            {user.bio}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', width: '100%', gap: '8px', marginTop: 'auto' }}>
                        <button className="btn btn-secondary" style={{ flex: 1, padding: '8px 4px', fontSize: '0.85rem' }} onClick={() => navigate(`/profile/${user.username}`)}>
                          Profile
                        </button>
                        <button className="btn btn-secondary" style={{ flex: 1, padding: '8px 4px', fontSize: '0.85rem', color: 'var(--danger)' }} onClick={() => handleUnfriend(user._id)}>
                          Unfriend
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Friends;
