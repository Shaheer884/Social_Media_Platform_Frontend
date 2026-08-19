import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import adminService from '../services/adminService';
import '../styles/admin.css';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminTheme, setAdminTheme] = useState(() => {
    return localStorage.getItem('admin-theme') || 'default';
  });

  useEffect(() => {
    const handleAdminThemeChange = (e) => {
      if (e.detail && e.detail.theme) {
        setAdminTheme(e.detail.theme);
      }
    };
    window.addEventListener('admin-theme-changed', handleAdminThemeChange);
    return () => {
      window.removeEventListener('admin-theme-changed', handleAdminThemeChange);
    };
  }, []);

  useEffect(() => {
    const fetchAdminTheme = async () => {
      try {
        const res = await adminService.getSettings();
        if (res.success && res.data && res.data.adminTheme) {
          const fetchedTheme = res.data.adminTheme;
          setAdminTheme(fetchedTheme);
          localStorage.setItem('admin-theme', fetchedTheme);
        }
      } catch (err) {
        console.error('Failed to fetch admin theme from backend settings:', err);
      }
    };
    fetchAdminTheme();
  }, []);

  const handleThemeChange = (newTheme) => {
    setAdminTheme(newTheme);
    localStorage.setItem('admin-theme', newTheme);
    window.dispatchEvent(new CustomEvent('admin-theme-changed', { detail: { theme: newTheme } }));
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
