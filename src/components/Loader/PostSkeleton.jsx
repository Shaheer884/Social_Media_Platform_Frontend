import React from 'react';

const PostSkeleton = () => {
  return (
    <div className="card" style={{ padding: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div className="skeleton skeleton-avatar"></div>
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-text" style={{ width: '25%' }}></div>
        </div>
      </div>
      <div className="skeleton skeleton-text" style={{ width: '100%', marginBottom: '10px' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '90%', marginBottom: '10px' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: '10px' }}></div>
      <div className="skeleton" style={{ height: '200px', width: '100%', borderRadius: '12px', marginTop: '12px' }}></div>
    </div>
  );
};

export default PostSkeleton;
