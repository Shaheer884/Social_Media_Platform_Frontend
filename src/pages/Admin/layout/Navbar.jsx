import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import { getUploadUrl } from '../../../utils/mediaHelper';

const Navbar = ({ onToggleSidebar, currentTheme, onThemeChange }) => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);

  const updateAdminDetails = () => {
    const savedAdmin = sessionStorage.getItem('adminUser');
    if (savedAdmin) {
      setAdmin(JSON.parse(savedAdmin));
    }
  };

  useEffect(() => {
    updateAdminDetails();
    window.addEventListener('adminProfileUpdated', updateAdminDetails);
    return () => {
      window.removeEventListener('adminProfileUpdated', updateAdminDetails);
    };
  }, []);

  const handleLogout = () => {
    adminService.logout();
    navigate('/admin/login');
  };

  const defaultAvatar = '/uploads/default-avatar.png';
  const fullName = admin?.fullName || 'Administrator';
  const username = admin?.username || 'admin';
  const avatarUrl = getUploadUrl(admin?.profilePicture || defaultAvatar);

  return (
    <header className="admin-navbar">
      <div className="admin-nav-left">
        <button className="admin-menu-toggle" onClick={onToggleSidebar}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>ConnectHub Control Center</div>
      </div>

      <div className="admin-nav-right">
        {/* Admin Theme Selector Dropdown */}
        <div className="admin-theme-selector">
          <select 
            value={currentTheme} 
            onChange={(e) => onThemeChange(e.target.value)}
            className="admin-theme-select-dropdown"
            title="Select Admin Theme"
          >
            <option value="default">💜 Default Violet</option>
            <option value="emerald">💚 Emerald Mint</option>
            <option value="ocean">💙 Ocean Breeze</option>
            <option value="crimson">❤️ Crimson Midnight</option>
            <option value="cyberpunk">💖 Cyberpunk Neon</option>
            <option value="nordic">❄️ Nordic Ice</option>
            <option value="sunset">🧡 Sunset Orange</option>
          </select>
        </div>

        <div className="admin-user-profile">
          <img src={avatarUrl} alt="Admin Avatar" />
          <div className="admin-user-info">
            <span className="admin-user-name">{fullName}</span>
            <span className="admin-user-role">@{username}</span>
          </div>
        </div>

        <button className="admin-logout-btn" onClick={handleLogout}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
