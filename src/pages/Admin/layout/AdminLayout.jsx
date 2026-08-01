import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import '../styles/admin.css';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminTheme, setAdminTheme] = useState(() => {
    return localStorage.getItem('admin-theme') || 'default';
  });

  const handleThemeChange = (newTheme) => {
    setAdminTheme(newTheme);
    localStorage.setItem('admin-theme', newTheme);
  };

  return (
    <div className={`admin-container theme-${adminTheme}`}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main">
        <Navbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          currentTheme={adminTheme}
          onThemeChange={handleThemeChange}
        />
        <main className="admin-content">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AdminLayout;
