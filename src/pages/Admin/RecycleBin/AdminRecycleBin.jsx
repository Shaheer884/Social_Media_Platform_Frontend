import React, { useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import DataTable from '../components/DataTable';
import ConfirmationModal from '../components/ConfirmationModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import adminService from '../services/adminService';
import { getUploadUrl } from '../../../utils/mediaHelper';

const AdminRecycleBin = () => {
  const [activeTab, setActiveTab] = useState('users'); // users, posts, comments
  const [data, setData] = useState({ users: [], posts: [], comments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Confirmation state
  const [confirmState, setConfirmState] = useState({ isOpen: false, itemId: null, action: '', message: '' });

  const fetchDeletedItems = async () => {
    setLoading(true);
    try {
      const res = await adminService.getRecycleBin();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load recycle bin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedItems();
  }, []);

  const triggerAction = (itemId, action, itemDesc) => {
    let message = '';
    if (action === 'restore') {
      message = `Are you sure you want to restore "${itemDesc}"? It will become visible on the platform again.`;
    } else if (action === 'purge') {
      message = `WARNING: Are you sure you want to PERMANENTLY ERASE "${itemDesc}"? This action is irreversible.`;
    }

    setConfirmState({ isOpen: true, itemId, action, message });
  };

  const handleConfirmAction = async () => {
    const { itemId, action } = confirmState;
    setConfirmState({ isOpen: false, itemId: null, action: '', message: '' });

    try {
      if (activeTab === 'users') {
        if (action === 'restore') {
          await adminService.restoreUser(itemId);
        } else {
          await adminService.permanentDeleteUser(itemId);
        }
      } else if (activeTab === 'posts') {
        if (action === 'restore') {
          await adminService.restorePost(itemId);
        } else {
          await adminService.permanentDeletePost(itemId);
        }
      } else if (activeTab === 'comments') {
        if (action === 'restore') {
          await adminService.restoreComment(itemId);
        } else {
          await adminService.permanentDeleteComment(itemId);
        }
      }
      fetchDeletedItems();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  // Tabs style config
  const tabBtnStyle = (tab) => ({
    padding: '12px 24px',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    border: 'none',
    background: activeTab === tab ? 'var(--admin-primary)' : 'var(--admin-card-bg)',
    color: activeTab === tab ? '#ffffff' : 'var(--admin-text)',
    borderBottom: activeTab === tab ? '3px solid var(--admin-primary-dark)' : '1px solid var(--admin-border)',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    transition: 'all 0.2s ease',
    marginRight: '4px'
  });

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Recycle Bin</h1>
          <p className="admin-page-desc">Restore soft-deleted entities or permanently delete them from database</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--admin-border)', marginBottom: '16px' }}>
        <button style={tabBtnStyle('users')} onClick={() => setActiveTab('users')}>Deleted Users ({data.users.length})</button>
        <button style={tabBtnStyle('posts')} onClick={() => setActiveTab('posts')}>Deleted Posts ({data.posts.length})</button>
        <button style={tabBtnStyle('comments')} onClick={() => setActiveTab('comments')}>Deleted Comments ({data.comments.length})</button>
      </div>

      {loading ? (
        <LoadingSkeleton type="table" rows={5} cols={5} />
      ) : error ? (
        <div style={{ color: 'var(--admin-danger)', textAlign: 'center', padding: '24px' }}>{error}</div>
      ) : (
        <>
          {activeTab === 'users' && (
            <DataTable
              headings={['Username', 'Full Name', 'Email', 'Deleted At', 'Actions']}
              data={data.users}
              renderRow={(user) => (
                <tr key={user._id}>
                  <td>@{user.username}</td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{new Date(user.deletedAt).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-action-group">
                      <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => triggerAction(user._id, 'restore', `@${user.username}`)}>Restore</button>
                      <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => triggerAction(user._id, 'purge', `@${user.username}`)}>Erase Permanently</button>
                    </div>
                  </td>
                </tr>
              )}
              page={1}
              totalPages={1}
              onPageChange={() => {}}
            />
          )}

          {activeTab === 'posts' && (
            <DataTable
              headings={['Author', 'Post Content', 'Deleted At', 'Actions']}
              data={data.posts}
              renderRow={(post) => {
                const authorName = post.author?.fullName || 'Deleted User';
                const snippet = post.content ? `${post.content.substring(0, 50)}...` : 'Image/Video post';
                return (
                  <tr key={post._id}>
                    <td>{authorName}</td>
                    <td>{snippet}</td>
                    <td>{new Date(post.deletedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="admin-action-group">
                        <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => triggerAction(post._id, 'restore', snippet)}>Restore</button>
                        <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => triggerAction(post._id, 'purge', snippet)}>Erase Permanently</button>
                      </div>
                    </td>
                  </tr>
                );
              }}
              page={1}
              totalPages={1}
              onPageChange={() => {}}
            />
          )}

          {activeTab === 'comments' && (
            <DataTable
              headings={['Author', 'Comment Content', 'Post Context', 'Deleted At', 'Actions']}
              data={data.comments}
              renderRow={(comment) => {
                const authorName = comment.author?.fullName || 'Deleted User';
                const postSnippet = comment.post ? `${comment.post.content.substring(0, 30)}...` : 'Deleted Post';
                return (
                  <tr key={comment._id}>
                    <td>{authorName}</td>
                    <td>{comment.content}</td>
                    <td>{postSnippet}</td>
                    <td>{new Date(comment.deletedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="admin-action-group">
                        <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => triggerAction(comment._id, 'restore', comment.content)}>Restore</button>
                        <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => triggerAction(comment._id, 'purge', comment.content)}>Erase Permanently</button>
                      </div>
                    </td>
                  </tr>
                );
              }}
              page={1}
              totalPages={1}
              onPageChange={() => {}}
            />
          )}
        </>
      )}

      {/* Action Prompt */}
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.action === 'restore' ? 'Restore Entity' : 'PERMANENTLY PURGE DATA'}
        message={confirmState.message}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmState({ isOpen: false, itemId: null, action: '', message: '' })}
        confirmText={confirmState.action === 'restore' ? 'Restore Data' : 'Erase from Database'}
        type={confirmState.action === 'restore' ? 'primary' : 'danger'}
      />
    </AdminLayout>
  );
};

export default AdminRecycleBin;
