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
    const postContext = comment.post ? comment.post.content : 'Deleted Post';

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
        <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
    </AdminLayout>
  );
};

export default AdminComments;
