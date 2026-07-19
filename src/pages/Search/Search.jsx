import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import Spinner from '../../components/Loader/Spinner';
import { getUploadUrl } from '../../utils/mediaHelper';

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const query = searchParams.get('q') || '';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async () => {
    if (!query) {
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const res = await userService.searchUsers(query);
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch();
  }, [query]);

  const handleFollowClick = async (e, userId, currentStatus) => {
    e.stopPropagation();
    const isFollowing = currentStatus === 'following' || currentStatus === 'friends';
    try {
      if (isFollowing) {
        await userService.unfollowUser(userId);
      } else {
        await userService.followUser(userId);
      }
      performSearch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout>
      <div className="feed-header">
        <h2 className="feed-title">Search Results for "{query}"</h2>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spinner />
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No users match "{query}"
          </div>
        ) : (
          <div className="suggested-users-list">
            {users.map((user) => {
              const isSelf = user._id === currentUser?._id;
              let btnClass = 'follow-btn-sm modal-follow-btn';
              let btnText = 'Follow';

              if (user.relationshipStatus === 'friends') {
                btnClass = 'follow-btn-sm friends modal-follow-btn';
                btnText = 'Friends';
              } else if (user.relationshipStatus === 'following') {
                btnClass = 'follow-btn-sm following modal-follow-btn';
                btnText = 'Following';
              }

              return (
                <div key={user._id} className="suggested-user-item" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div className="suggested-user-info" onClick={() => navigate(`/profile/${user.username}`)}>
                    <img
                      src={getUploadUrl(user.profilePicture || '/uploads/default-avatar.png')}
                      className="suggested-user-avatar"
                      alt={user.fullName}
                    />
                    <div>
                      <div className="suggested-user-name">{user.fullName}</div>
                      <div className="suggested-user-username">@{user.username}</div>
                      {user.bio && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{user.bio}</div>}
                    </div>
                  </div>
                  {!isSelf && (
                    <button
                      className={btnClass}
                      onClick={(e) => handleFollowClick(e, user._id, user.relationshipStatus)}
                    >
                      <span className="btn-text">{btnText}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Search;
