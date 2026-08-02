import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import Spinner from '../../components/Loader/Spinner';
import PostCard from '../../components/PostCard/PostCard';
import { getUploadUrl } from '../../utils/mediaHelper';

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const query = searchParams.get('q') || '';
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'posts', 'locations'

  const performSearch = async () => {
    if (!query) {
      setUsers([]);
      setPosts([]);
      setLocations([]);
      return;
    }
    setLoading(true);
    try {
      const res = await userService.searchUsers(query);
      if (res.success) {
        if (res.data && typeof res.data === 'object' && 'users' in res.data) {
          setUsers(res.data.users || []);
          setPosts(res.data.posts || []);
          setLocations(res.data.locations || []);
        } else {
          setUsers(res.data || []);
          setPosts([]);
          setLocations([]);
        }
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

      {/* Tabs Switcher */}
      <div className="card" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', borderRadius: '12px 12px 0 0', padding: '0 8px', marginBottom: '0' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            flex: 1,
            padding: '14px 0',
            background: 'none',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'users' ? 'var(--admin-primary, #8b5cf6)' : 'var(--text-muted, #64748b)',
            borderBottom: activeTab === 'users' ? '2.5px solid var(--admin-primary, #8b5cf6)' : '2.5px solid transparent',
            outline: 'none',
            transition: 'all 0.15s ease'
          }}
        >
          People ({loading ? '...' : users.length})
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          style={{
            flex: 1,
            padding: '14px 0',
            background: 'none',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'posts' ? 'var(--admin-primary, #8b5cf6)' : 'var(--text-muted, #64748b)',
            borderBottom: activeTab === 'posts' ? '2.5px solid var(--admin-primary, #8b5cf6)' : '2.5px solid transparent',
            outline: 'none',
            transition: 'all 0.15s ease'
          }}
        >
          Posts ({loading ? '...' : posts.length})
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          style={{
            flex: 1,
            padding: '14px 0',
            background: 'none',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'locations' ? 'var(--admin-primary, #8b5cf6)' : 'var(--text-muted, #64748b)',
            borderBottom: activeTab === 'locations' ? '2.5px solid var(--admin-primary, #8b5cf6)' : '2.5px solid transparent',
            outline: 'none',
            transition: 'all 0.15s ease'
          }}
        >
          Locations ({loading ? '...' : locations.length})
        </button>
      </div>

      <div style={{ marginTop: '16px' }}>
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Spinner />
          </div>
        ) : (
          <>
            {/* Active Tab: Users */}
            {activeTab === 'users' && (
              <div className="card" style={{ padding: '16px' }}>
                {users.length === 0 ? (
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
                      } else if (user.relationshipStatus === 'follow_back') {
                        btnClass = 'follow-btn-sm follow-back modal-follow-btn';
                        btnText = 'Follow Back';
                      }

                      return (
                        <div key={user._id} className="suggested-user-item" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                          <div className="suggested-user-info" onClick={() => navigate(`/profile/${user.username}`)}>
                            <img
                              src={getUploadUrl(user.profilePicture || '/uploads/default-avatar.png')}
                              className="suggested-user-avatar"
                              alt={user.fullName}
                            />
                            <div style={{ textAlign: 'left' }}>
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
            )}

            {/* Active Tab: Posts */}
            {activeTab === 'posts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {posts.length === 0 ? (
                  <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No posts match "{query}"
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))
                )}
              </div>
            )}

            {/* Active Tab: Locations */}
            {activeTab === 'locations' && (
              <div className="card" style={{ padding: '16px' }}>
                {locations.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No locations match "{query}"
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {locations.map((loc) => (
                      <div
                        key={loc.placeId}
                        onClick={() => navigate(`/location/${loc.placeId}`, { state: { location: loc } })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-main, #f8fafc)',
                          transition: 'all 0.15s ease',
                          textAlign: 'left'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--accent-light, #ede9fe)';
                          e.currentTarget.style.borderColor = 'var(--admin-primary, #8b5cf6)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-main, #f8fafc)';
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                      >
                        <span style={{ fontSize: '1.4rem' }}>📍</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main, #0f172a)' }}>{loc.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>{loc.address}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Search;
