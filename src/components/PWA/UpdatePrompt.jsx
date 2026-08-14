import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UpdatePrompt = () => {
  const [swRegistration, setSwRegistration] = useState(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log('SW Registered (onRegisteredSW):', swUrl);
      if (r) {
        setSwRegistration(r);
      }
    },
    onRegistered(r) {
      console.log('SW Registered (onRegistered):', r);
      if (r) {
        setSwRegistration(r);
      }
    },
    onRegisterError(error) {
      console.error('SW Registration error:', error);
    },
  });

  useEffect(() => {
    if (!swRegistration) return;

    // Proactively check for service worker updates
    const checkUpdate = async () => {
      if (!navigator.onLine) return;
      console.log('Proactively checking for service worker updates...');
      try {
        await swRegistration.update();
        if (swRegistration.waiting) {
          console.log('A new service worker version is waiting!');
          setNeedRefresh(true);
        }
      } catch (err) {
        console.error('Failed to update service worker registration:', err);
      }
    };

    // 1. Initial check when SW registration is ready
    checkUpdate();

    // 2. Poll for updates every 60 seconds
    const intervalId = setInterval(checkUpdate, 60000);

    // 3. Listen to visibility, focus and online events for immediate checking
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkUpdate();
      }
    };

    const handleFocus = () => {
      checkUpdate();
    };

    const handleOnline = () => {
      checkUpdate();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [swRegistration, setNeedRefresh]);

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleClose = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="pwa-update-toast">
      <div className="pwa-update-content">
        <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>🚀 Update Available</h4>
        <span>A new version of ConnectHub is available. Update now to enjoy the latest improvements.</span>
      </div>
      <div className="pwa-update-actions">
        <button className="pwa-update-btn-cancel" onClick={handleClose}>
          Later
        </button>
        <button className="pwa-update-btn-confirm" onClick={handleUpdate}>
          Update Now
        </button>
      </div>
    </div>
  );
};

export default UpdatePrompt;
