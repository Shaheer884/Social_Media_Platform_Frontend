import React, { useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import SearchBar from '../components/SearchBar';
import Filters from '../components/Filters';
import DataTable from '../components/DataTable';
import ConfirmationModal from '../components/ConfirmationModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import adminService from '../services/adminService';
import { getUploadUrl } from '../../../utils/mediaHelper';

const AdminComments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterHidden, setFilterHidden] = useState(''); // true, false, ''
  const [selectedComment, setSelectedComment] = useState(null); // Detail Modal

  // Confirmation Modal state
  const [confirmState, setConfirmState] = useState({ isOpen: false, commentId: null, action: '', message: '' });

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await adminService.getComments(page, search, filterHidden);
      if (res.success) {
        setComments(res.comments);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [page, filterHidden]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchComments();
    }, 4000);
    return () => clearTimeout(timer);
  }, [search]);

  const triggerAction = (commentId, action) => {
    let message = '';
    if (action === 'hide') message = 'Are you sure you want to hide this comment? It will be hidden from the post detail view for users.';
    if (action === 'unhide') message = 'Are you sure you want to unhide this comment? It will be restored to visible status.';
    if (action === 'delete') message = 'Are you sure you want to soft delete this comment? It will be moved to the Recycle Bin.';

    setConfirmState({ isOpen: true, commentId, action, message });
  };

  const handleConfirmAction = async () => {
    const { commentId, action } = confirmState;
    setConfirmState({ isOpen: false, commentId: null, action: '', message: '' });

    try {
      if (action === 'hide') {
        await adminService.hideComment(commentId, true);
      } else if (action === 'unhide') {
        await adminService.hideComment(commentId, false);
      } else if (action === 'delete') {
        await adminService.softDeleteComment(commentId);
      }
      fetchComments();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const headings = ['Comment Author', 'Comment Content', 'Post Context', 'Created At', 'Status', 'Actions'];

  const renderRow = (comment) => {
    const avatar = getUploadUrl(comment.author?.profilePicture || '/uploads/default-avatar.png');
    const postAuthor = comment.post?.author?.username;
    const postContent = comment.post?.content || (comment.post?.media?.length > 0 || comment.post?.imageUrl ? '(Media Post)' : '');
    const postContext = comment.post 
      ? `By @${postAuthor || 'deleted'}: ${postContent || 'No text'}` 
      : 'Deleted Post';

    return (
      <tr key={comment._id}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src={avatar} 
              alt="" 
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{comment.author?.fullName || 'Deleted User'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>@{comment.author?.username || 'deleted'}</div>
            </div>
          </div>
        </td>
        <td>
          <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={comment.content}>
            {comment.content}
          </div>
        </td>
        <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={postContext}>
          <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
            {postContext}
          </span>
        </td>
        <td style={{ fontSize: '0.85rem' }}>
          {new Date(comment.createdAt).toLocaleDateString()}
        </td>
        <td>
          <span className={`admin-badge ${comment.isHidden ? 'admin-badge-warning' : 'admin-badge-success'}`}>
            {comment.isHidden ? 'Hidden' : 'Visible'}
          </span>
        </td>
        <td>
          <div className="admin-action-group">
            <button 
              className="admin-btn admin-btn-secondary admin-btn-sm" 
              onClick={() => setSelectedComment(comment)}
            >
              View
            </button>
            {comment.isHidden ? (
              <button 
                className="admin-btn admin-btn-primary admin-btn-sm" 
                onClick={() => triggerAction(comment._id, 'unhide')}
              >
                Unhide
              </button>
            ) : (
              <button 
                className="admin-btn admin-btn-secondary admin-btn-sm" 
                onClick={() => triggerAction(comment._id, 'hide')}
              >
                Hide
              </button>
            )}
            <button 
              className="admin-btn admin-btn-danger admin-btn-sm" 
              style={{ backgroundColor: '#dc2626' }}
              onClick={() => triggerAction(comment._id, 'delete')}
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
          <h1 className="admin-page-title">Comment Management</h1>
          <p className="admin-page-desc">Moderate system comments and soft deletes</p>
        </div>
      </div>

      <div className="admin-table-controls">
        <SearchBar 
          value={search} 
          onChange={setSearch} 
          placeholder="Search comments text..." 
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
        <LoadingSkeleton type="table" rows={6} cols={6} />
      ) : error ? (
        <div style={{ color: 'var(--admin-danger)', textAlign: 'center', padding: '24px' }}>{error}</div>
      ) : (
        <DataTable 
          headings={headings} 
          data={comments} 
          renderRow={renderRow} 
          page={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={confirmState.isOpen} 
        title="Moderate Comment" 
        message={confirmState.message} 
        onConfirm={handleConfirmAction} 
        onCancel={() => setConfirmState({ isOpen: false, commentId: null, action: '', message: '' })} 
        confirmText={confirmState.action === 'unhide' ? 'Restore Visibility' : 'Confirm Action'} 
        type={confirmState.action === 'unhide' ? 'primary' : 'danger'} 
      />

      {/* Comment Detail Modal */}
      {selectedComment && (
        <div className="admin-modal-overlay" onClick={() => setSelectedComment(null)}>
          <div className="admin-modal" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--admin-border)', paddingBottom: '12px' }}>
              <div className="admin-modal-title">Comment Moderation & Context</div>
              <button 
                onClick={() => setSelectedComment(null)} 
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--admin-text)' }}
              >
                &times;
              </button>
            </div>
            
            {/* Comment Section */}
            <div style={{ padding: '8px 0' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                <img 
                  src={getUploadUrl(selectedComment.author?.profilePicture || '/uploads/default-avatar.png')} 
                  alt="" 
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
                />
                <div>
                  <h5 style={{ margin: 0, fontSize: '0.95rem' }}>Comment Author: {selectedComment.author?.fullName || 'Deleted User'}</h5>
                  <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>
                    @{selectedComment.author?.username || 'deleted'} &bull; {new Date(selectedComment.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--admin-bg)', border: '1px solid var(--admin-border)', fontSize: '1rem', fontStyle: 'italic' }}>
                "{selectedComment.content}"
              </div>
            </div>

            {/* Post Context Section */}
            <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '16px', marginTop: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--admin-text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Original Post Context
              </div>
              
              {selectedComment.post ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <img 
                      src={getUploadUrl(selectedComment.post.author?.profilePicture || '/uploads/default-avatar.png')} 
                      alt="" 
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                    <div>
                      <h5 style={{ margin: 0, fontSize: '0.95rem' }}>Post Author: {selectedComment.post.author?.fullName || 'Deleted User'}</h5>
                      <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>
                        @{selectedComment.post.author?.username || 'deleted'}
                      </p>
                    </div>
                  </div>

                  {selectedComment.post.content && (
                    <div style={{ fontSize: '0.95rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', padding: '4px 0' }}>
                      {selectedComment.post.content}
                    </div>
                  )}

                  {/* Rendering media of the post if present */}
                  {selectedComment.post.media && selectedComment.post.media.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '4px' }}>
                      {selectedComment.post.media.map((med, mIdx) => (
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
                  ) : selectedComment.post.imageUrl ? (
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--admin-border)', textAlign: 'center', display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                      {selectedComment.post.mediaType === 'video' ? (
                        <video 
                          src={getUploadUrl(selectedComment.post.imageUrl)} 
                          controls 
                          style={{ maxWidth: '100%', maxHeight: '200px' }} 
                        />
                      ) : (
                        <img 
                          src={getUploadUrl(selectedComment.post.imageUrl)} 
                          alt="Post Image" 
                          style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                        />
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={{ fontStyle: 'italic', color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>
                  The post this comment belonged to has been deleted or is unavailable.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--admin-border)', paddingTop: '12px' }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedComment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminComments;
