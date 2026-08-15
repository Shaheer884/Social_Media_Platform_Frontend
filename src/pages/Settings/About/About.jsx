import React from 'react';

const About = () => {
  const techStack = [
    { title: 'Frontend', desc: 'React 19, Vite, React Router, Context API', icon: '⚛️' },
    { title: 'Backend', desc: 'Node.js, Express.js, JWT Auth, Multer', icon: '🟢' },
    { title: 'Database', desc: 'MongoDB Atlas, Mongoose ODM', icon: '🍃' },
    { title: 'Cloud Integration', desc: 'Cloudinary Image & Video Management API', icon: '☁️' }
  ];

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
          <span>2.4.0-stable</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong style={{ color: 'var(--text-muted)' }}>Build Number</strong>
          <span>CH-98711</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong style={{ color: 'var(--text-muted)' }}>Release Date</strong>
          <span>August 15, 2026</span>
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
      <div className="about-tech-grid">
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
