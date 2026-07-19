import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../../services/userService';
import { useAuth } from '../../../context/AuthContext';
import { usePosts } from '../../../context/PostsContext';
import { getUploadUrl } from '../../../utils/mediaHelper';

const RightSidebar = ({ onFollowChange }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { fetchFeed } = usePosts();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSuggestions = async () => {
    try {
      const res = await userService.getSuggestions();
      if (res.success) {
        setSuggestions(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadSuggestions();
    }
  }, [currentUser]);

  const handleFollowClick = async (e, userId) => {
    e.stopPropagation();
    try {
      // Optimistically set following
      setSuggestions((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, relationshipStatus: 'following' } : u))
      );

      await userService.followUser(userId);

      // Trigger feed refresh
      fetchFeed(1, false);
      if (onFollowChange) onFollowChange();

      // Refresh suggestions after 1.5 seconds
      setTimeout(loadSuggestions, 1500);
    } catch (err) {
      console.error(err);
      loadSuggestions(); // rollback
    }
  };

  if (!currentUser) return null;

  return (
    <aside className="sidebar-right">
      <div className="card" style={{ padding: '16px' }}>
        <h3 className="section-card-title">Who to follow</h3>
        <div className="suggested-users-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
            </div>
          ) : suggestions.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              No suggestions available
            </div>
          ) : (
            suggestions.map((u) => (
              <div key={u._id} className="suggested-user-item">
                <div className="suggested-user-info" onClick={() => navigate(`/profile/${u.username}`)}>
                  <img
                    src={getUploadUrl(u.profilePicture || '/uploads/default-avatar.png')}
                    className="suggested-user-avatar"
                    alt={u.fullName}
                  />
                  <div style={{ lineHeight: '1.2' }}>
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
            ))
          )}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
