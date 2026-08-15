import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import postService from '../../../services/postService';
import Spinner from '../../../components/Loader/Spinner';

const ManagePosts = () => {
  const { currentUser } = useAuth();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, hidden, archived
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest
  
  // Action Modals State
  const [activeDropdown, setActiveDropdown] = useState(null); // postId
  const [postToDelete, setPostToDelete] = useState(null); // post object
  const [postToEdit, setPostToEdit] = useState(null); // post object
  const [editContent, setEditContent] = useState('');

  const fetchUserPosts = async () => {
    try {
      const res = await postService.getUserPosts(currentUser._id);
      if (res.success) {
        setPosts(res.data || []);
      } else {
        setError('Failed to fetch posts');
      }
    } catch (err) {
      console.error(err);
      setError('Error loading posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?._id) {
      fetchUserPosts();
    }
  }, [currentUser]);

  // Handle Post Deletion
  const handleDeletePost = async () => {
    if (!postToDelete) return;
    setActionLoading(true);
    try {
      const res = await postService.deletePost(postToDelete._id);
      if (res.success) {
        setPosts(posts.filter(p => p._id !== postToDelete._id));
        setPostToDelete(null);
      } else {
        alert(res.error || 'Failed to delete post');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting post');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Post Editing Content
  const handleEditPost = async (e) => {
    e.preventDefault();
    if (!postToEdit || !editContent.trim()) return;
    setActionLoading(true);
    try {
      const res = await postService.updatePost(postToEdit._id, { content: editContent });
      if (res.success) {
        setPosts(posts.map(p => p._id === postToEdit._id ? { ...p, content: editContent } : p));
        setPostToEdit(null);
        setEditContent('');
      } else {
        alert(res.error || 'Failed to update post');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating post');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle state helper
  const handleToggleState = async (post, field) => {
    setActionLoading(true);
    setActiveDropdown(null);
    try {
      const isTrue = !post[field];
      const payload = { [field]: isTrue };
      
      const res = await postService.updatePost(post._id, payload);
      if (res.success) {
        setPosts(posts.map(p => p._id === post._id ? { ...p, [field]: isTrue } : p));
      } else {
        alert(res.error || `Failed to update post ${field}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error updating post state');
    } finally {
      setActionLoading(false);
    }
  };

  // Processing, filtering, and sorting posts
  const processedPosts = posts
    .filter((post) => {
      // Search filter
      const matchesSearch = post.content?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filters
      if (filter === 'active') {
        return matchesSearch && !post.isHidden && !post.isArchived;
      }
      if (filter === 'hidden') {
        return matchesSearch && post.isHidden && !post.isArchived;
      }
      if (filter === 'archived') {
        return matchesSearch && post.isArchived;
      }
      return matchesSearch; // 'all'
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="32px" />
      </div>
    );
  }

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <h2 className="settings-card-title">Manage Posts</h2>
        <p className="settings-card-desc">Review your published contents. Hide items from feeds, archive memories, or delete posts permanently.</p>
      </div>

      {error && <div style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: '16px' }}>{error}</div>}

      {/* Control Panel */}
      <div className="manage-posts-controls">
        <input
          type="text"
          className="settings-input"
          placeholder="🔍 Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <select 
          className="settings-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Posts</option>
          <option value="active">Active Feed Only</option>
          <option value="hidden">Hidden Only</option>
          <option value="archived">Archived Only</option>
        </select>

        <select 
          className="settings-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Grid of posts */}
      {processedPosts.length === 0 ? (
        <div className="settings-empty-state">
          <div className="settings-empty-icon">📝</div>
          <h3 className="settings-empty-title">No posts found</h3>
          <p className="settings-empty-desc">Try matching another keyword or filter criteria.</p>
        </div>
      ) : (
        <div className="manage-posts-grid">
          {processedPosts.map((post) => (
            <div key={post._id} className="manage-post-card">
              {/* Status Badges */}
              {post.isArchived && <span className="manage-post-badge archived">Archived</span>}
              {!post.isArchived && post.isHidden && <span className="manage-post-badge hidden">Hidden</span>}

              {/* Preview Image/Video or Fallback text only display */}
              {post.media && post.media.length > 0 ? (
                <div 
                  className="manage-post-preview"
                  style={{ backgroundImage: `url(${post.media[0].url})` }}
                />
              ) : post.imageUrl ? (
                <div 
                  className="manage-post-preview"
                  style={{ backgroundImage: `url(${post.imageUrl})` }}
                />
              ) : (
                <div className="manage-post-preview">
                  <div className="manage-post-text-only">{post.content}</div>
                </div>
              )}

              <div className="manage-post-body">
                <p className="manage-post-content">{post.content || 'Untitled Post'}</p>
                <span className="manage-post-date">
                  📅 {new Date(post.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
              </div>

              <div className="manage-post-footer">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ❤️ {post.likesCount || post.likes?.length || 0} Likes
                </span>

                <div className="manage-post-actions-menu">
                  <button 
                    className="manage-post-dots-btn"
                    onClick={() => setActiveDropdown(activeDropdown === post._id ? null : post._id)}
                  >
                    •••
                  </button>

                  {activeDropdown === post._id && (
                    <div className="manage-post-dropdown">
                      <button 
                        className="manage-post-dropdown-item"
                        onClick={() => {
                          setPostToEdit(post);
                          setEditContent(post.content);
                          setActiveDropdown(null);
                        }}
                      >
                        ✍️ Edit Content
                      </button>
                      <button 
                        className="manage-post-dropdown-item"
                        onClick={() => handleToggleState(post, 'isHidden')}
                      >
                        {post.isHidden ? '👁️ Show on Feed' : '🙈 Hide from Feed'}
                      </button>
                      <button 
                        className="manage-post-dropdown-item"
                        onClick={() => handleToggleState(post, 'isArchived')}
                      >
                        {post.isArchived ? '📥 Restore Post' : '📁 Archive Post'}
                      </button>
                      <button 
                        className="manage-post-dropdown-item delete"
                        onClick={() => {
                          setPostToDelete(post);
                          setActiveDropdown(null);
                        }}
                      >
                        🗑️ Delete Post
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Content Modal */}
      {postToEdit && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="settings-card" style={{ width: '450px', margin: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-main)' }}>Edit Post</h3>
            <form onSubmit={handleEditPost}>
              <textarea
                className="settings-textarea"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                required
                maxLength={280}
                style={{ marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="settings-btn settings-btn-secondary" 
                  onClick={() => setPostToEdit(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="settings-btn settings-btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="settings-card" style={{ width: '400px', margin: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>Delete Post?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Are you sure you want to permanently delete this post? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button 
                type="button" 
                className="settings-btn settings-btn-secondary"
                onClick={() => setPostToDelete(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="settings-btn settings-btn-danger"
                onClick={handleDeletePost}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePosts;
