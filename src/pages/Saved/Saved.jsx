import React from 'react';
import Layout from '../../components/layout/Layout';

const Saved = () => {
  return (
    <Layout>
      <div className="feed-header">
        <h2 className="feed-title">Saved Posts</h2>
      </div>
      <div className="card empty-state-container">
        <div className="empty-state-icon">🔖</div>
        <h3 className="empty-state-title">Bookmarks Coming Soon!</h3>
        <p className="empty-state-desc">You'll soon be able to bookmark and save posts to read later. Keep exploring!</p>
      </div>
    </Layout>
  );
};

export default Saved;
