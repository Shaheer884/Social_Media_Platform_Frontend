import React, { useState, useEffect } from 'react';
import { retryQueuedRequests } from '../../utils/backgroundSync';

const OfflineStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [visible, setVisible] = useState(!navigator.onLine); // Show immediately if offline on mount
  const [bannerText, setBannerText] = useState(
    !navigator.onLine ? "🔴 You're Offline. Some features may not be available." : ""
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setBannerText("🟢 Back Online");
      setVisible(true);
      
      // Attempt to flush offline background sync queue
      retryQueuedRequests();

      // Auto-hide the "Back Online" banner after 3 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setBannerText("🔴 You're Offline. Some features may not be available.");
      setVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`pwa-offline-banner ${isOnline ? 'online' : 'offline'} ${visible ? 'active' : ''}`}>
      <span>{bannerText}</span>
    </div>
  );
};

export default OfflineStatusBanner;
