import React, { useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import SearchBar from '../components/SearchBar';
import Filters from '../components/Filters';
import DataTable from '../components/DataTable';
import ConfirmationModal from '../components/ConfirmationModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import adminService from '../services/adminService';
import { getUploadUrl } from '../../../utils/mediaHelper';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(''); // active, suspended, ''
  const [selectedUser, setSelectedUser] = useState(null); // Profile Detail Modal
  
  // Confirmation Modal states
  const [confirmState, setConfirmState] = useState({ isOpen: false, userId: null, action: '', message: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers(page, search, filter);
      if (res.success) {
        setUsers(res.users);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, filter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 4000);
    return () => clearTimeout(timer);
  }, [search]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const triggerAction = (userId, action, username) => {
    let message = '';
    if (action === 'suspend') message = `Are you sure you want to suspend user @${username}? They will be blocked from logging into the platform.`;
    if (action === 'activate') message = `Are you sure you want to activate user @${username}? They will regain full access to their account.`;
    if (action === 'delete') message = `Are you sure you want to soft delete @${username}? Their posts and profile will be hidden, and they will be moved to the Recycle Bin.`;

    setConfirmState({ isOpen: true, userId, action, message });
  };

  const handleConfirmAction = async () => {
    const { userId, action } = confirmState;
    setConfirmState({ isOpen: false, userId: null, action: '', message: '' });

    try {
      if (action === 'suspend') {
        await adminService.suspendUser(userId, true);
      } else if (action === 'activate') {
        await adminService.suspendUser(userId, false);
      } else if (action === 'delete') {
        await adminService.softDeleteUser(userId);
      }
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const headings = ['User', 'Email', 'Role', 'Status', 'Last Login', 'Actions'];

  const renderRow = (user) => {
    const defaultAvatar = '/uploads/default-avatar.png';
    const status = user.isSuspended ? 'Suspended' : 'Active';
    const lastLoginFormatted = user.lastLogin 
      ? new Date(user.lastLogin).toLocaleString('default', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Never';

    return (
      <tr key={user._id}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setSelectedUser(user)}>
            <img 
              src={getUploadUrl(user.profilePicture || defaultAvatar)} 
              alt="Avatar" 
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
            />
            <div>
              <div style={{ fontWeight: 600 }}>{user.fullName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>@{user.username}</div>
            </div>
          </div>
        </td>
        <td>{user.email}</td>
        <td>
          <span className={`admin-badge ${user.role === 'admin' ? 'admin-badge-info' : 'admin-badge-neutral'}`}>
            {user.role}
          </span>
        </td>
        <td>
          <span className={`admin-badge ${user.isSuspended ? 'admin-badge-danger' : 'admin-badge-success'}`}>
            {status}
          </span>
        </td>
        <td style={{ fontSize: '0.85rem' }}>{lastLoginFormatted}</td>
        <td>
          <div className="admin-action-group">
            <button 
              className="admin-btn admin-btn-secondary admin-btn-sm" 
              onClick={() => setSelectedUser(user)}
            >
              View
            </button>
            {user.role !== 'admin' && (
              <>
                {user.isSuspended ? (
                  <button 
                    className="admin-btn admin-btn-primary admin-btn-sm" 
                    onClick={() => triggerAction(user._id, 'activate', user.username)}
                  >
                    Activate
                  </button>
                ) : (
                  <button 
                    className="admin-btn admin-btn-danger admin-btn-sm" 
                    onClick={() => triggerAction(user._id, 'suspend', user.username)}
                  >
                    Suspend
                  </button>
                )}
                <button 
                  className="admin-btn admin-btn-danger admin-btn-sm" 
                  style={{ backgroundColor: '#dc2626' }}
                  onClick={() => triggerAction(user._id, 'delete', user.username)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-desc">Moderate account statuses, suspension, and deletion</p>
        </div>
      </div>

      <div className="admin-table-controls">
        <SearchBar 
          value={search} 
          onChange={setSearch} 
          placeholder="Search by name, username, or email..." 
        />
        <Filters 
          value={filter} 
          onChange={(val) => { setFilter(val); setPage(1); }} 
          label="All Statuses"
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Suspended', value: 'suspended' }
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
          data={users} 
          renderRow={renderRow} 
          page={page} 
          totalPages={totalPages} 
          onPageChange={handlePageChange} 
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={confirmState.isOpen} 
        title="Confirm Moderation Action" 
        message={confirmState.message} 
        onConfirm={handleConfirmAction} 
        onCancel={() => setConfirmState({ isOpen: false, userId: null, action: '', message: '' })} 
        confirmText={confirmState.action === 'activate' ? 'Activate User' : 'Confirm Action'} 
        type={confirmState.action === 'activate' ? 'primary' : 'danger'} 
      />

      {/* Complete Profile Detail Modal */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--admin-border)', paddingBottom: '12px' }}>
              <div className="admin-modal-title">User Profile Details</div>
              <button 
                onClick={() => setSelectedUser(null)} 
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--admin-text)' }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', padding: '12px 0', alignItems: 'center' }}>
              <img 
                src={getUploadUrl(selectedUser.profilePicture || '/uploads/default-avatar.png')} 
                alt="Avatar" 
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--admin-primary)' }} 
              />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedUser.fullName}</h3>
                <p style={{ margin: '4px 0 0 0', color: 'var(--admin-text-muted)' }}>@{selectedUser.username}</p>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <span className={`admin-badge ${selectedUser.isSuspended ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                    {selectedUser.isSuspended ? 'Suspended' : 'Active'}
                  </span>
                  <span className={`admin-badge ${selectedUser.role === 'admin' ? 'admin-badge-info' : 'admin-badge-neutral'}`}>
                    {selectedUser.role}
                  </span>
                  {selectedUser.isVerified && (
                    <span className="admin-badge admin-badge-success" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.9rem', borderTop: '1px solid var(--admin-border)', paddingTop: '16px' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--admin-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Email Address</strong>
                <span>{selectedUser.email}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--admin-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Location</strong>
                <span>{selectedUser.location || 'Not Specified'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--admin-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Registration Date</strong>
                <span>{new Date(selectedUser.createdAt).toLocaleDateString('default', { dateStyle: 'long' })}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--admin-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Last Login</strong>
                <span>{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong style={{ display: 'block', color: 'var(--admin-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Biography</strong>
                <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', lineHeight: 1.4 }}>{selectedUser.bio || 'No biography written.'}</p>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '16px', borderTop: '1px solid var(--admin-border)', paddingTop: '16px' }}>
                <div><strong>{selectedUser.followers?.length || 0}</strong> Followers</div>
                <div><strong>{selectedUser.following?.length || 0}</strong> Following</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedUser(null)}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
