/* global __APP_VERSION__, __BUILD_TIMESTAMP__, __COMMIT_HASH__ */
import React, { useState, useEffect } from 'react';
import { getCacheSize, clearAppCache } from '../../../utils/cacheManager';

const About = () => {
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    getCacheSize()
      .then(setCacheSize)
      .catch(() => setCacheSize(0));
  }, []);

  const handleClearCache = async () => {
    if (window.confirm("Are you sure you want to clear the app cache? This will reload the app.")) {
      await clearAppCache();
      window.location.reload();
    }
  };

  const techStack = [
    { title: 'Frontend', desc: 'React 19, Vite, React Router, Context API', icon: '⚛️' },
    { title: 'Backend', desc: 'Node.js, Express.js, JWT Auth, Multer', icon: '🟢' },
    { title: 'Database', desc: 'MongoDB Atlas, Mongoose ODM', icon: '🍃' },
    { title: 'Cloud Integration', desc: 'Cloudinary Image & Video Management API', icon: '☁️' }
  ];

  // Safely get build constants with fallbacks if they are undefined in dev
  const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.4.0-stable';
  const buildTimeStr = typeof __BUILD_TIMESTAMP__ !== 'undefined' 
    ? new Date(__BUILD_TIMESTAMP__).toLocaleString() 
    : new Date().toLocaleString();
  const commitHash = typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev-build';

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <h2 className="settings-card-title">About ConnectHub</h2>
        <p className="settings-card-desc">Detailed application version, release parameters, and developer technical integrations.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0', textAlign: 'center' }}>
        {/* App Logo Emblem */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '16px',
          background: 'var(--primary-gradient)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          fontWeight: 800,
          boxShadow: '0 8px 16px rgba(139, 92, 246, 0.3)',
          marginBottom: '14px',
          fontFamily: 'Outfit, sans-serif'
        }}>
          C
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px 0' }}>ConnectHub</h3>
        <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>The Professional Social Media Experience</span>
      </div>

      {/* Version parameters */}
      <div style={{
        backgroundColor: 'var(--input-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        fontSize: '0.9rem',
        color: 'var(--text-main)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong style={{ color: 'var(--text-muted)' }}>Version</strong>
          <span>{appVersion}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong style={{ color: 'var(--text-muted)' }}>Build Timestamp</strong>
          <span>{buildTimeStr}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong style={{ color: 'var(--text-muted)' }}>Commit Hash</strong>
          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', backgroundColor: 'var(--border-color)', padding: '2px 6px', borderRadius: '4px' }}>{commitHash}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong style={{ color: 'var(--text-muted)' }}>PWA Status</strong>
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>Active (Service Worker precached)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong style={{ color: 'var(--text-muted)' }}>Developer</strong>
          <span>ConnectHub OpenSource Contributors</span>
        </div>
      </div>

      {/* Stack Details */}
      <h4 className="settings-toggle-title" style={{ fontSize: '0.95rem', marginBottom: '4px' }}>Technology Stack</h4>
      <div className="about-tech-grid" style={{ marginBottom: '24px' }}>
        {techStack.map((tech, i) => (
          <div key={i} className="about-tech-card">
            <span className="about-tech-icon">{tech.icon}</span>
            <div className="about-tech-info">
              <span className="about-tech-title">{tech.title}</span>
              <span className="about-tech-desc">{tech.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* PWA Cache Manager Section */}
      <h4 className="settings-toggle-title" style={{ fontSize: '0.95rem', marginBottom: '4px' }}>App Storage & Cache</h4>
      <div style={{
        backgroundColor: 'var(--input-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Offline Cached Files:</span>
          <strong style={{ color: 'var(--text-main)' }}>{cacheSize} MB</strong>
        </div>
        <button 
          type="button" 
          className="settings-btn settings-btn-secondary"
          onClick={handleClearCache}
          style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.85rem' }}
        >
          🧹 Clear App Cache & Refresh
        </button>
      </div>

      {/* Document links */}
      <div className="about-links" style={{ marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <a href="/privacy-policy" className="about-link-item" target="_blank" rel="noreferrer">
          📄 Privacy Policy
        </a>
        <a href="/terms-of-service" className="about-link-item" target="_blank" rel="noreferrer">
          ⚖️ Terms & Conditions
        </a>
        <a href="/licenses" className="about-link-item" target="_blank" rel="noreferrer">
          📜 Open Source Software Licenses
        </a>
      </div>
    </div>
  );
};

export default About;
