import React from 'react';
import Layout from '../../components/layout/Layout';

const Messages = () => {
  return (
    <Layout>
      <div className="feed-header">
        <h2 className="feed-title">Direct Messages</h2>
      </div>
      <div className="card empty-state-container">
        <div className="empty-state-icon">💬</div>
        <h3 className="empty-state-title">Direct Messaging Coming Soon!</h3>
        <p className="empty-state-desc">We are working on bringing real-time chat and direct messages to ConnectHub. Stay tuned!</p>
      </div>
    </Layout>
  );
};

export default Messages;
