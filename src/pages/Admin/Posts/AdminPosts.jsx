import React, { useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import SearchBar from '../components/SearchBar';
import Filters from '../components/Filters';
import DataTable from '../components/DataTable';
import ConfirmationModal from '../components/ConfirmationModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import adminService from '../services/adminService';
import { getUploadUrl } from '../../../utils/mediaHelper';

const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterHidden, setFilterHidden] = useState(''); // true, false, ''
  const [selectedPost, setSelectedPost] = useState(null); // Detail Modal

  // Confirmation Modal state
  const [confirmState, setConfirmState] = useState({ isOpen: false, postId: null, action: '', message: '' });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPosts(page, search, filterHidden);
      if (res.success) {
        setPosts(res.posts);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, filterHidden]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchPosts();
    }, 4000);
    return () => clearTimeout(timer);
  }, [search]);

  const triggerAction = (postId, action) => {
    let message = '';
    if (action === 'hide') message = 'Are you sure you want to hide this post? It will be removed from all feeds for normal users.';
    if (action === 'unhide') message = 'Are you sure you want to unhide this post? It will become visible on feeds again.';
    if (action === 'delete') message = 'Are you sure you want to soft delete this post? It will be moved to the Recycle Bin.';

    setConfirmState({ isOpen: true, postId, action, message });
  };

  const handleConfirmAction = async () => {
    const { postId, action } = confirmState;
    setConfirmState({ isOpen: false, postId: null, action: '', message: '' });

    try {
      if (action === 'hide') {
        await adminService.hidePost(postId, true);
      } else if (action === 'unhide') {
        await adminService.hidePost(postId, false);
      } else if (action === 'delete') {
        await adminService.softDeletePost(postId);
      }
      fetchPosts();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const headings = ['Author', 'Post Content', 'Media', 'Likes', 'Comments', 'Status', 'Actions'];

  const renderRow = (post) => {
    const avatar = getUploadUrl(post.author?.profilePicture || '/uploads/default-avatar.png');
    const hasMedia = post.media && post.media.length > 0;
    const mediaThumbnail = hasMedia ? post.media[0].url : (post.imageUrl || '');
    const mediaType = hasMedia ? post.media[0].resourceType : (post.mediaType || 'none');

    return (
      <tr key={post._id}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src={avatar} 
              alt="" 
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{post.author?.fullName || 'Deleted User'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>@{post.author?.username || 'deleted'}</div>
            </div>
          </div>
        </td>
        <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {post.content || <span style={{ fontStyle: 'italic', color: 'var(--admin-text-muted)' }}>No text content</span>}
        </td>
        <td>
          {mediaThumbnail ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="admin-badge admin-badge-info" style={{ textTransform: 'capitalize', fontSize: '0.7rem', padding: '2px 6px' }}>
                {mediaType}
              </span>
              {mediaType === 'image' && (
                <img 
                  src={getUploadUrl(mediaThumbnail)} 
                  alt="" 
                  style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--admin-border)' }} 
                />
              )}
            </div>
          ) : (
            <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>None</span>
          )}
        </td>
        <td>{post.likesCount || 0}</td>
        <td>{post.commentCount || 0}</td>
        <td>
          <span className={`admin-badge ${post.isHidden ? 'admin-badge-warning' : 'admin-badge-success'}`}>
            {post.isHidden ? 'Hidden' : 'Visible'}
          </span>
        </td>
        <td>
          <div className="admin-action-group">
            <button 
              className="admin-btn admin-btn-secondary admin-btn-sm" 
              onClick={() => setSelectedPost(post)}
            >
              View
            </button>
            {post.isHidden ? (
              <button 
                className="admin-btn admin-btn-primary admin-btn-sm" 
                onClick={() => triggerAction(post._id, 'unhide')}
              >
                Unhide
              </button>
            ) : (
              <button 
                className="admin-btn admin-btn-secondary admin-btn-sm" 
                onClick={() => triggerAction(post._id, 'hide')}
              >
                Hide
              </button>
            )}
            <button 
              className="admin-btn admin-btn-danger admin-btn-sm" 
              style={{ backgroundColor: '#dc2626' }}
              onClick={() => triggerAction(post._id, 'delete')}
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Post Management</h1>
          <p className="admin-page-desc">Moderate platform posts, content visibility, and soft deletes</p>
        </div>
      </div>

      <div className="admin-table-controls">
        <SearchBar 
          value={search} 
          onChange={setSearch} 
          placeholder="Search post content..." 
        />
        <Filters 
          value={filterHidden} 
          onChange={(val) => { setFilterHidden(val); setPage(1); }} 
          label="All Visibility"
          options={[
            { label: 'Visible only', value: 'false' },
            { label: 'Hidden only', value: 'true' }
          ]} 
        />
      </div>

      {loading ? (
        <LoadingSkeleton type="table" rows={6} cols={7} />
      ) : error ? (
        <div style={{ color: 'var(--admin-danger)', textAlign: 'center', padding: '24px' }}>{error}</div>
      ) : (
        <DataTable 
          headings={headings} 
          data={posts} 
          renderRow={renderRow} 
          page={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={confirmState.isOpen} 
        title="Moderate Post Content" 
        message={confirmState.message} 
        onConfirm={handleConfirmAction} 
        onCancel={() => setConfirmState({ isOpen: false, postId: null, action: '', message: '' })} 
        confirmText={confirmState.action === 'unhide' ? 'Make Visible' : 'Confirm Action'} 
        type={confirmState.action === 'unhide' ? 'primary' : 'danger'} 
      />

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="admin-modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="admin-modal" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--admin-border)', paddingBottom: '12px' }}>
              <div className="admin-modal-title">Post Moderation Details</div>
              <button 
                onClick={() => setSelectedPost(null)} 
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--admin-text)' }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', padding: '12px 0', alignItems: 'center' }}>
              <img 
                src={getUploadUrl(selectedPost.author?.profilePicture || '/uploads/default-avatar.png')} 
                alt="" 
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} 
              />
              <div>
                <h4 style={{ margin: 0 }}>{selectedPost.author?.fullName || 'Deleted User'}</h4>
                <p style={{ margin: '2px 0 0 0', color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                  @{selectedPost.author?.username || 'deleted'} &bull; {new Date(selectedPost.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '1.05rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {selectedPost.content}
              </div>

              {/* Rendering media if present */}
              {selectedPost.media && selectedPost.media.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {selectedPost.media.map((med, mIdx) => (
                    <div key={mIdx} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                      {med.resourceType === 'video' ? (
                        <video 
                          src={getUploadUrl(med.url)} 
                          controls 
                          style={{ maxWidth: '100%', maxHeight: '200px' }} 
                        />
                      ) : (
                        <img 
                          src={getUploadUrl(med.url)} 
                          alt="Post Media" 
                          style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : selectedPost.imageUrl ? (
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--admin-border)', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                  {selectedPost.mediaType === 'video' ? (
                    <video 
                      src={getUploadUrl(selectedPost.imageUrl)} 
                      controls 
                      style={{ maxWidth: '100%', maxHeight: '200px' }} 
                    />
                  ) : (
                    <img 
                      src={getUploadUrl(selectedPost.imageUrl)} 
                      alt="Post Image" 
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                    />
                  )}
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid var(--admin-border)', paddingTop: '12px', fontSize: '0.875rem' }}>
                <div><strong>{selectedPost.likesCount || 0}</strong> Likes</div>
                <div><strong>{selectedPost.commentCount || 0}</strong> Comments</div>
                <div>Status: <span className={`admin-badge ${selectedPost.isHidden ? 'admin-badge-warning' : 'admin-badge-success'}`}>{selectedPost.isHidden ? 'Hidden' : 'Visible'}</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedPost(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPosts;
