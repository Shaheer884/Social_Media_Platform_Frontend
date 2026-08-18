import React, { useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import DataTable from '../components/DataTable';
import LoadingSkeleton from '../components/LoadingSkeleton';
import adminService from '../services/adminService';

const AdminActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getActivityLogs(page);
      if (res.success) {
        setLogs(res.logs);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      setError(err.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const headings = ['User / Admin Name', 'Action Taken', 'Target Subject', 'Date & Time', 'IP Address'];

  const getActionBadgeClass = (action) => {
    if (action.includes('Login')) return 'admin-badge-info';
    if (action.includes('Delete') || action.includes('Suspend')) return 'admin-badge-danger';
    if (action.includes('Restore') || action.includes('Activate')) return 'admin-badge-success';
    return 'admin-badge-warning'; // Changed settings/broadcast
  };

  const renderRow = (log) => {
    return (
      <tr key={log._id}>
        <td>
          <div style={{ fontWeight: 600 }}>{log.adminName}</div>
        </td>
        <td>
          <span className={`admin-badge ${getActionBadgeClass(log.action)}`}>
            {log.action}
          </span>
        </td>
        <td>
          <span style={{ fontSize: '0.875rem' }}>{log.target}</span>
        </td>
        <td style={{ fontSize: '0.85rem' }}>
          {new Date(log.createdAt).toLocaleString()}
        </td>
        <td style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>
          {log.ipAddress || '127.0.0.1'}
        </td>
      </tr>
    );
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Activity Audit Logs</h1>
          <p className="admin-page-desc">Comprehensive history of all administrative actions and user logins</p>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="table" rows={10} cols={5} />
      ) : error ? (
        <div style={{ color: 'var(--admin-danger)', textAlign: 'center', padding: '24px' }}>{error}</div>
      ) : (
        <DataTable 
          headings={headings} 
          data={logs} 
          renderRow={renderRow} 
          page={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      )}
    </AdminLayout>
  );
};

export default AdminActivityLogs;
