import React, { useState, useEffect } from 'react';
import settingsService from '../../../services/settingsService';
import Spinner from '../../../components/Loader/Spinner';

const Theme = () => {
  const [selectedTheme, setSelectedTheme] = useState('system');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchThemePreference = async () => {
      try {
        const res = await settingsService.getSettings();
        if (res.success) {
          const themeName = res.data.theme || 'system';
          setSelectedTheme(themeName);
          // Update local storage to keep in sync
          localStorage.setItem('theme', themeName);
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: themeName } }));
        }
      } catch (err) {
        console.error('Failed to load theme setting:', err);
        // Fallback to local storage
        setSelectedTheme(localStorage.getItem('theme') || 'system');
      } finally {
        setLoading(false);
      }
    };
    fetchThemePreference();
  }, []);

  // Listen to external theme changes (like from Navbar toggle button or other tabs)
  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail && e.detail.theme) {
        setSelectedTheme(e.detail.theme);
      }
    };
    window.addEventListener('theme-changed', handleThemeChange);

    const handleStorageChange = (e) => {
      if (e.key === 'theme' && e.newValue) {
        setSelectedTheme(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('theme-changed', handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const applyTheme = (themeName) => {
    const body = document.body;
    if (themeName === 'dark') {
      body.classList.add('dark-theme');
    } else if (themeName === 'light') {
      body.classList.remove('dark-theme');
    } else if (themeName === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        body.classList.add('dark-theme');
      } else {
        body.classList.remove('dark-theme');
      }
    }
  };

  const handleThemeChange = async (themeName) => {
    setSaving(true);
    setStatus({ type: '', message: '' });
    setSelectedTheme(themeName);
    
    // 1. Instantly apply theme to DOM for wow factor
    applyTheme(themeName);
    
    // 2. Persist in LocalStorage
    localStorage.setItem('theme', themeName);

    // 3. Dispatch custom event to notify other components (like Navbar.jsx)
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: themeName } }));

    try {
      // 4. Save to database
      const res = await settingsService.updateTheme(themeName);
      if (res.success) {
        setStatus({ type: 'success', message: `Theme preference set to ${themeName} successfully.` });
      } else {
        setStatus({ type: 'error', message: res.error || 'Failed to save theme setting.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to sync theme preference with cloud database.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="32px" />
      </div>
    );
  }

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <h2 className="settings-card-title">Theme Settings</h2>
        <p className="settings-card-desc">Personalize your visual experience. Choose a specific visual mode or sync automatically with your device settings.</p>
      </div>

      {status.message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '0.9rem',
          fontWeight: 600,
          backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: status.type === 'success' ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${status.type === 'success' ? 'var(--success)' : 'var(--danger)'}`
        }}>
          {status.message}
        </div>
      )}

      <div className="theme-grid">
        <div 
          className={`theme-option-card ${selectedTheme === 'light' ? 'selected' : ''}`}
          onClick={() => !saving && handleThemeChange('light')}
        >
          <div className="theme-icon">☀️</div>
          <span className="theme-label">Light Mode</span>
        </div>

        <div 
          className={`theme-option-card ${selectedTheme === 'dark' ? 'selected' : ''}`}
          onClick={() => !saving && handleThemeChange('dark')}
        >
          <div className="theme-icon">🌙</div>
          <span className="theme-label">Dark Mode</span>
        </div>

        <div 
          className={`theme-option-card ${selectedTheme === 'system' ? 'selected' : ''}`}
          onClick={() => !saving && handleThemeChange('system')}
        >
          <div className="theme-icon">💻</div>
          <span className="theme-label">System Default</span>
        </div>
      </div>
    </div>
  );
};

export default Theme;
