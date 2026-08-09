import React, { useEffect } from 'react';

const Offline = ({ onRetry }) => {
  // Automatically reconnect when internet returns
  useEffect(() => {
    const handleOnline = () => {
      if (onRetry) {
        onRetry();
      } else {
        window.location.reload();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [onRetry]);

  const handleRetryClick = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="pwa-offline-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
        <img src="/favicon.png" className="pwa-offline-logo" alt="ConnectHub Logo" style={{ marginBottom: 0 }} />
        <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Outfit' }}>ConnectHub</span>
      </div>

      {/* Disconnected WiFi SVG Illustration */}
      <svg 
        className="pwa-offline-illustration" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 0 19 12.5" />
        <path d="M5 12.5a10.94 10.94 0 0 0 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2.5" />
      </svg>

      <h2 className="pwa-offline-title">You're offline</h2>
      <p className="pwa-offline-message">
        ConnectHub could not connect to the network. Please check your internet connection and try again.
      </p>

      <button className="pwa-offline-retry-btn" onClick={handleRetryClick}>
        Retry Connection
      </button>
    </div>
  );
};

export default Offline;
