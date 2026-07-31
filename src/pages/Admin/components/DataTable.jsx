import React from 'react';

const DataTable = ({ headings, data, renderRow, page, totalPages, onPageChange }) => {
  return (
    <div className="admin-table-container">
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-data-table">
          <thead>
            <tr>
              {headings.map((heading, index) => (
                <th key={index}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={headings.length} style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '32px' }}>
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <span className="admin-page-info">
            Page {page} of {totalPages}
          </span>
          <div className="admin-page-nav">
            <button
              className="admin-btn admin-btn-secondary admin-btn-sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </button>
            <button
              className="admin-btn admin-btn-secondary admin-btn-sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
