import React, { useState, useEffect } from 'react';

// Offline Image Component Wrapper
export const OfflineImage = ({ src, alt, className, style, isAvatar, ...props }) => {
  const [hasError, setHasError] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleError = () => {
    setHasError(true);
  };

  // If it's an avatar and failed, try using the default avatar
  if (hasError && isAvatar) {
    return (
      <img
        src="/uploads/default-avatar.png"
        alt={alt || "Avatar"}
        className={className}
        style={style}
        onError={(e) => {
          // If default avatar fails as well, render the text placeholder
          e.target.style.display = 'none';
        }}
        {...props}
      />
    );
  }

  // If failed and not avatar, render custom offline image placeholder
  if (hasError || (isOffline && !src)) {
    return (
      <div 
        className={`offline-media-placeholder ${className || ''}`} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: style?.height || '150px',
          aspectRatio: '16/9',
          ...style 
        }}
      >
        <svg className="offline-media-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Image unavailable while offline</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      style={style} 
      onError={handleError}
      {...props} 
    />
  );
};

// Offline Video Component Wrapper
export const OfflineVideo = ({ src, className, style, poster, ...props }) => {
  const [hasError, setHasError] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleError = () => {
    setHasError(true);
  };

  if (hasError || isOffline) {
    return (
      <div 
        className={`offline-media-placeholder ${className || ''}`} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: style?.height || '200px',
          aspectRatio: '16/9',
          ...style 
        }}
      >
        <svg className="offline-media-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Video unavailable while offline</span>
      </div>
    );
  }

  return (
    <video 
      src={src} 
      className={className} 
      style={style} 
      poster={poster}
      onError={handleError}
      {...props} 
    />
  );
};
