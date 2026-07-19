import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', padding: '24px' }}>
      <h1 style={{ fontSize: '4rem', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '8px' }}>404</h1>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--text-main)' }}>Page Not Found</h3>
      <p style={{ color: 'var(--text-muted)', maxWidth: '360px', marginBottom: '24px' }}>The page you are looking for does not exist or has been moved.</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>
        Go Home
      </button>
    </div>
  );
};

export default NotFound;
