import React, { useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import DataTable from '../components/DataTable';
import Filters from '../components/Filters';
import LoadingSkeleton from '../components/LoadingSkeleton';
import adminService from '../services/adminService';
import { getUploadUrl } from '../../../utils/mediaHelper';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState(''); // Pending, Under Review, Resolved, Rejected, ''
  const [reasonFilter, setReasonFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null); // Report Inspection Modal

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminService.getReports(page, statusFilter, reasonFilter);
      if (res.success) {
        setReports(res.reports);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, statusFilter, reasonFilter]);

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      await adminService.updateReportStatus(reportId, newStatus);
      fetchReports();
      setSelectedReport(null);
    } catch (err) {
      alert(err.message || 'Failed to update report status');
    }
  };

  const handleSuspendUser = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return;
    try {
      await adminService.suspendUser(userId, true);
      alert('User suspended successfully.');
      fetchReports();
      setSelectedReport(null);
    } catch (err) {
      alert(err.message || 'Failed to suspend user');
    }
  };

  const handleDeleteContent = async (targetType, targetId) => {
    if (!window.confirm(`Are you sure you want to delete this reported ${targetType}?`)) return;
    try {
      if (targetType === 'Post') {
        await adminService.softDeletePost(targetId);
      } else if (targetType === 'Comment') {
        await adminService.softDeleteComment(targetId);
      }
      alert('Content deleted (moved to Recycle Bin).');
      fetchReports();
      setSelectedReport(null);
    } catch (err) {
      alert(err.message || 'Failed to delete content');
    }
  };

  const headings = ['Reporter', 'Target Type', 'Reason', 'Report Date', 'Status', 'Actions'];

  const getStatusBadgeClass = (status) => {
    if (status === 'Pending') return 'admin-badge-warning';
    if (status === 'Under Review') return 'admin-badge-info';
    if (status === 'Resolved') return 'admin-badge-success';
    return 'admin-badge-danger'; // Rejected
  };

  const renderRow = (report) => {
    const reporterName = report.reporter?.fullName || 'Deleted User';
    const reporterUser = report.reporter?.username ? `@${report.reporter.username}` : 'deleted';

    return (
      <tr key={report._id}>
        <td>
          <div style={{ fontWeight: 600 }}>{reporterName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{reporterUser}</div>
        </td>
        <td>
          <span className="admin-badge admin-badge-neutral" style={{ textTransform: 'capitalize' }}>
            {report.targetType}
          </span>
        </td>
        <td>
          <span style={{ fontWeight: 500 }}>{report.reason}</span>
        </td>
        <td style={{ fontSize: '0.85rem' }}>
          {new Date(report.createdAt).toLocaleDateString()}
        </td>
        <td>
          <span className={`admin-badge ${getStatusBadgeClass(report.status)}`}>
            {report.status}
          </span>
        </td>
        <td>
          <button 
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={() => setSelectedReport(report)}
          >
            Review Ticket
          </button>
        </td>
      </tr>
    );
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Moderation Tickets</h1>
          <p className="admin-page-desc">Review spam, harassment, violence, and other user reports</p>
        </div>
      </div>

      <div className="admin-table-controls">
        <Filters 
          value={statusFilter} 
          onChange={(val) => { setStatusFilter(val); setPage(1); }} 
          label="All Statuses"
          options={[
            { label: 'Pending', value: 'Pending' },
            { label: 'Under Review', value: 'Under Review' },
            { label: 'Resolved', value: 'Resolved' },
            { label: 'Rejected', value: 'Rejected' }
          ]} 
        />
        <Filters 
          value={reasonFilter} 
          onChange={(val) => { setReasonFilter(val); setPage(1); }} 
          label="All Reasons"
          options={[
            { label: 'Spam', value: 'Spam' },
            { label: 'Fake Account', value: 'Fake Account' },
            { label: 'Harassment', value: 'Harassment' },
            { label: 'Hate Speech', value: 'Hate Speech' },
            { label: 'Violence', value: 'Violence' },
            { label: 'Adult Content', value: 'Adult Content' },
            { label: 'Other', value: 'Other' }
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
          data={reports} 
          renderRow={renderRow} 
          page={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      )}

      {/* Report Ticket Inspection Modal */}
      {selectedReport && (
        <div className="admin-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="admin-modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--admin-border)', paddingBottom: '12px' }}>
              <div className="admin-modal-title">Moderate Report Ticket</div>
              <button 
                onClick={() => setSelectedReport(null)} 
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--admin-text)' }}
              >
                &times;
              </button>
            </div>

            <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
              {/* Ticket Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '12px' }}>
                <div>
                  <strong>Reporter:</strong> {selectedReport.reporter?.fullName || 'Deleted User'} (@{selectedReport.reporter?.username || 'deleted'})
                </div>
                <div>
                  <strong>Reason:</strong> {selectedReport.reason}
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>Report Details:</strong>
                  <p style={{ margin: '4px 0 0 0', padding: '8px', backgroundColor: 'var(--admin-bg)', borderRadius: '6px', fontStyle: 'italic' }}>
                    {selectedReport.details || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Reported Content Inspection */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--admin-primary-dark)' }}>Reported Content Object ({selectedReport.targetType})</h4>
                
                {selectedReport.targetDetails ? (
                  <div style={{ padding: '12px', backgroundColor: 'var(--admin-bg)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                    
                    {/* User Report */}
                    {selectedReport.targetType === 'User' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={getUploadUrl(selectedReport.targetDetails.profilePicture || '/uploads/default-avatar.png')} 
                          style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                          alt="" 
                        />
                        <div>
                          <strong>{selectedReport.targetDetails.fullName}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>@{selectedReport.targetDetails.username} &bull; {selectedReport.targetDetails.email}</div>
                          <div style={{ marginTop: '4px' }}>
                            <span className={`admin-badge ${selectedReport.targetDetails.isSuspended ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                              {selectedReport.targetDetails.isSuspended ? 'Suspended' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Post Report */}
                    {selectedReport.targetType === 'Post' && (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                          Author: {selectedReport.targetDetails.author?.fullName || 'Deleted'} (@{selectedReport.targetDetails.author?.username || 'deleted'})
                        </div>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{selectedReport.targetDetails.content}</p>
                        
                        {/* Thumbnail */}
                        {selectedReport.targetDetails.imageUrl && (
                          <div style={{ marginTop: '8px' }}>
                            <img 
                              src={getUploadUrl(selectedReport.targetDetails.imageUrl)} 
                              style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '4px' }} 
                              alt="" 
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Comment Report */}
                    {selectedReport.targetType === 'Comment' && (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                          Author: {selectedReport.targetDetails.author?.fullName || 'Deleted'} (@{selectedReport.targetDetails.author?.username || 'deleted'})
                        </div>
                        <p style={{ margin: 0, fontStyle: 'italic' }}>"{selectedReport.targetDetails.content}"</p>
                      </div>
                    )}

                  </div>
                ) : (
                  <div style={{ fontStyle: 'italic', color: 'var(--admin-text-muted)', padding: '8px' }}>
                    Reported content has already been deleted or does not exist.
                  </div>
                )}
              </div>
            </div>

            {/* Moderation Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--admin-border)', paddingTop: '16px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Moderate Action Console</div>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  onClick={() => handleUpdateStatus(selectedReport._id, 'Under Review')}
                >
                  Under Review
                </button>
                <button 
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  onClick={() => handleUpdateStatus(selectedReport._id, 'Resolved')}
                >
                  Mark Resolved
                </button>
                <button 
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  onClick={() => handleUpdateStatus(selectedReport._id, 'Rejected')}
                >
                  Reject Report
                </button>

                {selectedReport.targetDetails && selectedReport.targetType === 'User' && !selectedReport.targetDetails.isSuspended && (
                  <button 
                    className="admin-btn admin-btn-danger admin-btn-sm"
                    onClick={() => handleSuspendUser(selectedReport.targetId)}
                  >
                    Suspend Reported User
                  </button>
                )}

                {selectedReport.targetDetails && selectedReport.targetType !== 'User' && (
                  <button 
                    className="admin-btn admin-btn-danger admin-btn-sm"
                    onClick={() => handleDeleteContent(selectedReport.targetType, selectedReport.targetId)}
                  >
                    Delete Content
                  </button>
                )}

                {selectedReport.targetDetails && selectedReport.targetType !== 'User' && selectedReport.targetDetails.author && (
                  <button 
                    className="admin-btn admin-btn-danger admin-btn-sm"
                    onClick={() => handleSuspendUser(selectedReport.targetDetails.author._id || selectedReport.targetDetails.author)}
                  >
                    Suspend Author
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedReport(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReports;
