import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import { getUploadUrl } from '../../../utils/mediaHelper';
import { useAuth } from '../../../context/AuthContext';

const Navbar = ({ onToggleSidebar, currentTheme, onThemeChange }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [admin, setAdmin] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

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

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest('.admin-profile-container')) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showDropdown]);

  const handleLogout = () => {
    adminService.logout();
    logout();
    navigate('/login');
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
        <div className="admin-navbar-brand">
          <span className="admin-navbar-title">ConnectHub Control Center</span>
          <img src="/favicon.png" alt="ConnectHub Logo" className="admin-navbar-logo" />
        </div>
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

        <div className="admin-profile-container">
          <div className="admin-user-profile" onClick={() => setShowDropdown(!showDropdown)} title="Profile Menu">
            <img src={avatarUrl} alt="Admin Avatar" />
            <div className="admin-user-info">
              <span className="admin-user-name">{fullName}</span>
              <span className="admin-user-role">@{username}</span>
            </div>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={`admin-profile-arrow ${showDropdown ? 'open' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {showDropdown && (
            <div className="admin-profile-dropdown">
              <button 
                className="admin-dropdown-item" 
                onClick={() => { 
                  navigate('/admin/profile'); 
                  setShowDropdown(false); 
                }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>
              <button 
                className="admin-dropdown-item logout" 
                onClick={() => { 
                  handleLogout(); 
                  setShowDropdown(false); 
                }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
