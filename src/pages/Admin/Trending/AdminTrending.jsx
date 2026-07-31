import React, { useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import adminService from '../services/adminService';
import { getUploadUrl } from '../../../utils/mediaHelper';

const AdminTrending = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await adminService.getTrending();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load trending analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <h1 className="admin-page-title">Loading Trending Analytics...</h1>
        <LoadingSkeleton type="table" rows={6} cols={3} />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div style={{ color: 'var(--admin-danger)', padding: '24px', textAlign: 'center' }}>
          <h2>Error loading analytics: {error}</h2>
        </div>
      </AdminLayout>
    );
  }

  const {
    mostFollowed,
    mostLikedPosts,
    mostCommentedPosts,
    mostActivePosters,
    trendingTags,
    postsCreatedToday,
    newUsersToday,
    weeklyGrowth,
    monthlyGrowth
  } = data;

  const defaultAvatar = '/uploads/default-avatar.png';

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Viral & Trending Analytics</h1>
          <p className="admin-page-desc">Track engagement spikes, viral posts, growth stats, and most active accounts</p>
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="admin-cards-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="admin-card" style={{ borderLeft: '4px solid var(--admin-primary)' }}>
          <div className="admin-card-info">
            <span className="admin-card-title">New Users Today</span>
            <span className="admin-card-value">{newUsersToday}</span>
          </div>
        </div>
        <div className="admin-card" style={{ borderLeft: '4px solid var(--admin-info)' }}>
          <div className="admin-card-info">
            <span className="admin-card-title">Posts Created Today</span>
            <span className="admin-card-value">{postsCreatedToday}</span>
          </div>
        </div>
        <div className="admin-card" style={{ borderLeft: '4px solid var(--admin-success)' }}>
          <div className="admin-card-info">
            <span className="admin-card-title">Weekly Growth</span>
            <span className="admin-card-value">{weeklyGrowth}%</span>
          </div>
        </div>
        <div className="admin-card" style={{ borderLeft: '4px solid var(--admin-warning)' }}>
          <div className="admin-card-info">
            <span className="admin-card-title">Monthly Growth</span>
            <span className="admin-card-value">{monthlyGrowth}%</span>
          </div>
        </div>
      </div>

      {/* Main Content Rank List */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Left Hand Lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Top Liked Posts */}
          <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--admin-primary-dark)' }}>Most Liked Posts</h3>
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Content Snippet</th>
                  <th>Likes</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {mostLikedPosts.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={getUploadUrl(p.author?.profilePicture || defaultAvatar)} style={{ width: '24px', height: '24px', borderRadius: '50%' }} alt="" />
                        <span>{p.author?.fullName || 'Deleted User'}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.content || 'Image/Video post'}
                    </td>
                    <td><strong>{p.likesCount}</strong> likes</td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Commented Posts */}
          <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--admin-primary-dark)' }}>Most Commented Posts</h3>
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Content Snippet</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                {mostCommentedPosts.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={getUploadUrl(item.post?.author?.profilePicture || defaultAvatar)} style={{ width: '24px', height: '24px', borderRadius: '50%' }} alt="" />
                        <span>{item.post?.author?.fullName || 'Deleted User'}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.post?.content || 'Image/Video post'}
                    </td>
                    <td><strong>{item.commentCount}</strong> comments</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Hand Lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Top Followed Users */}
          <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--admin-primary-dark)' }}>Most Followed Users</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mostFollowed.map((user) => (
                <div key={user._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={getUploadUrl(user.profilePicture || defaultAvatar)} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>@{user.username}</div>
                    </div>
                  </div>
                  <span className="admin-badge admin-badge-info" style={{ fontSize: '0.75rem' }}>
                    {user.followersCount} followers
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Active Users */}
          <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--admin-primary-dark)' }}>Most Active Posters</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mostActivePosters.map((item) => (
                <div key={item._id?._id || item._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={getUploadUrl(item._id?.profilePicture || defaultAvatar)} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item._id?.fullName || 'Deleted User'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>@{item._id?.username || 'deleted'}</div>
                    </div>
                  </div>
                  <span className="admin-badge admin-badge-success" style={{ fontSize: '0.75rem' }}>
                    {item.postCount} posts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hashtag List */}
          <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--admin-primary-dark)' }}>Hashtags Leaderboard</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {trendingTags.length === 0 ? (
                <div style={{ color: 'var(--admin-text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>No hashtags used yet.</div>
              ) : (
                trendingTags.map((tagObj, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>#{tagObj.tag}</span>
                    <strong>{tagObj.count} mentions</strong>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminTrending;
