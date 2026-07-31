import React from 'react';

const LoadingSkeleton = ({ type = 'table', rows = 5, cols = 4 }) => {
  if (type === 'card') {
    return (
      <div className="admin-cards-grid">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div className="admin-card" key={idx} style={{ height: '100px' }}>
            <div className="skeleton-row" style={{ width: '60%' }}>
              <div className="skeleton-cell" style={{ height: '12px' }}></div>
              <div className="skeleton-cell" style={{ height: '24px', width: '50%' }}></div>
            </div>
            <div className="skeleton-cell animate-pulse" style={{ width: '48px', height: '48px', borderRadius: '12px' }}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="admin-table-container" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} style={{ display: 'flex', gap: '16px' }}>
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div 
                key={cIdx} 
                className="skeleton-cell" 
                style={{ flex: 1, height: '24px' }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
