import React from 'react';
import Navbar from './Navbar/Navbar';
import Sidebar from './Sidebar/Sidebar';
import RightSidebar from './RightSidebar/RightSidebar';

const Layout = ({ children, onFollowChange }) => {
  return (
    <>
      <Navbar />
      <div className="app-container">
        <Sidebar />
        <main className="feed-column">
          {children}
        </main>
        <RightSidebar onFollowChange={onFollowChange} />
      </div>
    </>
  );
};

export default Layout;
