import React, { useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import adminService from '../services/adminService';
import Spinner from '../../../components/Loader/Spinner';
import './AdminTheme.css';

const themesList = [
  {
    id: 'default',
    name: 'Default Blue',
    primary: '#3b82f6',
    secondary: '#0f172a',
    bg: '#f8fafc',
    cardBg: '#ffffff',
    text: '#1e293b',
    border: '#cbd5e1',
    isDark: false
  },
  {
    id: 'darkmidnight',
    name: 'Dark Midnight',
    primary: '#3b82f6',
    secondary: '#0f172a',
    bg: '#020617',
    cardBg: '#0f172a',
    text: '#f8fafc',
    border: '#1e293b',
    isDark: true
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    primary: '#10b981',
    secondary: '#064f3d',
    bg: '#f2fbf7',
    cardBg: '#ffffff',
    text: '#0f2d24',
    border: '#d2f4e8',
    isDark: false
  },
  {
    id: 'royalpurple',
    name: 'Royal Purple',
    primary: '#8b5cf6',
    secondary: '#1e1b4b',
    bg: '#faf5ff',
    cardBg: '#ffffff',
    text: '#2e1065',
    border: '#f3e8ff',
    isDark: false
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    primary: '#f97316',
    secondary: '#1e1b4b',
    bg: '#fffbf7',
    cardBg: '#ffffff',
    text: '#431407',
    border: '#ffedd5',
    isDark: false
  },
  {
    id: 'crimson',
    name: 'Crimson Red',
    primary: '#ef4444',
    secondary: '#450a0a',
    bg: '#fef2f2',
    cardBg: '#ffffff',
    text: '#7f1d1d',
    border: '#fee2e2',
    isDark: false
  },
  {
    id: 'skyblue',
    name: 'Sky Blue',
    primary: '#0ea5e9',
    secondary: '#0c4a6e',
    bg: '#f0f9ff',
    cardBg: '#ffffff',
    text: '#0c4a6e',
    border: '#bae6fd',
    isDark: false
  },
  {
    id: 'cyberpunk',
    name: 'Cyber Neon',
    primary: '#ec4899',
    secondary: '#0f051d',
    bg: '#030008',
    cardBg: '#0c0514',
    text: '#39ffd0',
    border: '#220739',
    isDark: true
  },
  {
    id: 'forestdark',
    name: 'Forest Dark',
    primary: '#059669',
    secondary: '#022c22',
    bg: '#021a14',
    cardBg: '#052e24',
    text: '#ecfdf5',
    border: '#064e3b',
    isDark: true
  },
  {
    id: 'moderngray',
    name: 'Modern Gray',
    primary: '#4b5563',
    secondary: '#1f2937',
    bg: '#f9fafb',
    cardBg: '#ffffff',
    text: '#111827',
    border: '#e5e7eb',
    isDark: false
  },
  {
    id: 'coffeebrown',
    name: 'Coffee Brown',
    primary: '#b45309',
    secondary: '#451a03',
    bg: '#fffbeb',
    cardBg: '#ffffff',
    text: '#451a03',
    border: '#fde68a',
    isDark: false
  },
  {
    id: 'premiumgold',
    name: 'Premium Gold',
    primary: '#cca43b',
    secondary: '#1a160d',
    bg: '#fbfaf5',
    cardBg: '#ffffff',
    text: '#1a160d',
    border: '#f1ede2',
    isDark: false
  }
];

const AdminTheme = () => {
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [activeTheme, setActiveTheme] = useState('default');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchThemeSettings = async () => {
      try {
        const res = await adminService.getSettings();
        if (res.success && res.data && res.data.adminTheme) {
          setSelectedTheme(res.data.adminTheme);
          setActiveTheme(res.data.adminTheme);
        } else {
          // Fallback to local storage if API doesn't specify theme
          const localTheme = localStorage.getItem('admin-theme') || 'default';
          setSelectedTheme(localTheme);
          setActiveTheme(localTheme);
        }
      } catch (err) {
        console.error('Failed to load theme settings from backend:', err);
        const localTheme = localStorage.getItem('admin-theme') || 'default';
        setSelectedTheme(localTheme);
        setActiveTheme(localTheme);
      } finally {
        setLoading(false);
      }
    };
    fetchThemeSettings();
  }, []);

  const handleSaveTheme = async () => {
    setSaving(true);
    try {
      const res = await adminService.updateSettings({ adminTheme: selectedTheme });
      if (res.success) {
        setActiveTheme(selectedTheme);
        localStorage.setItem('admin-theme', selectedTheme);
        
        // Dispatch custom event to notify AdminLayout immediately
        window.dispatchEvent(
          new CustomEvent('admin-theme-changed', { detail: { theme: selectedTheme } })
        );

        setToastMessage('Theme Updated Successfully');
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update admin theme settings:', err);
      // Even if network update fails, apply locally for PWA/Offline support
      localStorage.setItem('admin-theme', selectedTheme);
      window.dispatchEvent(
        new CustomEvent('admin-theme-changed', { detail: { theme: selectedTheme } })
      );
      setToastMessage('Theme Applied Locally');
      setTimeout(() => setToastMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-theme-page">
        {toastMessage && (
          <div className="admin-theme-toast">
            <span>✓</span> {toastMessage}
          </div>
        )}

        <div className="admin-theme-header">
          <h2 className="admin-theme-title">🎨 Theme Settings</h2>
          <p className="admin-theme-desc">
            Choose your preferred Admin Dashboard theme. The selected theme will be applied across the entire Admin Dashboard.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Spinner size="40px" />
          </div>
        ) : (
          <div className="admin-theme-grid">
            {themesList.map((theme) => {
              const isSelected = selectedTheme === theme.id;
              const isActive = activeTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  className={`admin-theme-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedTheme(theme.id)}
                >
                  <div className="admin-theme-card-header">
                    <span className="admin-theme-card-name">{theme.name}</span>
                    {isActive && (
                      <span className="admin-theme-card-indicator">
                        <span>✓</span> Active
                      </span>
                    )}
                  </div>

                  {/* Miniature Visual Preview */}
                  <div className="theme-preview-box" style={{ backgroundColor: theme.bg }}>
                    {/* Mock Sidebar */}
                    <div className="theme-preview-sidebar" style={{ backgroundColor: theme.secondary }}>
                      <div className="theme-preview-sidebar-line" style={{ backgroundColor: theme.primary }} />
                      <div className="theme-preview-sidebar-line" style={{ backgroundColor: '#ffffff' }} />
                      <div className="theme-preview-sidebar-line" style={{ backgroundColor: '#ffffff' }} />
                    </div>

                    {/* Mock Content Side */}
                    <div className="theme-preview-main">
                      {/* Mock Header */}
                      <div className="theme-preview-navbar" style={{ backgroundColor: theme.cardBg, borderBottom: `1px solid ${theme.border}` }}>
                        <div className="theme-preview-navbar-dot" style={{ backgroundColor: theme.text }} />
                      </div>

                      {/* Mock Content Pane */}
                      <div className="theme-preview-content">
                        <div className="theme-preview-card" style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
                          <div className="theme-preview-card-line" style={{ backgroundColor: theme.text, opacity: 0.7 }} />
                          <div className="theme-preview-card-btn" style={{ backgroundColor: theme.primary }} />
                        </div>
                        <div className="theme-preview-card" style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
                          <div className="theme-preview-card-line" style={{ backgroundColor: theme.text, opacity: 0.7 }} />
                          <div className="theme-preview-card-btn" style={{ backgroundColor: theme.primary }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Palette Indicators */}
                  <div className="theme-colors-palette">
                    <div className="theme-color-dot" style={{ backgroundColor: theme.primary }} title="Primary Color" />
                    <div className="theme-color-dot" style={{ backgroundColor: theme.secondary }} title="Secondary Color" />
                    <div className="theme-color-dot" style={{ backgroundColor: theme.bg }} title="Background" />
                  </div>

                  <button className="theme-select-cta" type="button">
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Sticky bottom Action Bar */}
        <div className="admin-theme-footer-bar">
          <button
            type="button"
            className="admin-theme-save-btn"
            onClick={handleSaveTheme}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <Spinner size="14px" style={{ borderColor: 'transparent', borderTopColor: '#fff' }} />
                Saving...
              </>
            ) : (
              <>
                <span>💾</span> Save Theme
              </>
            )}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTheme;
