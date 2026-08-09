import React, { useState, useEffect } from 'react';

const PWAInstallButton = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Check if standalone mode is already active
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    const checkPrompt = () => {
      if (window.deferredPrompt && !isStandalone) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    // Initial check
    checkPrompt();

    // Listen for custom event when deferred prompt is captured
    const handlePromptChanged = (e) => {
      if (e.detail?.available && !isStandalone) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    // Listen for app installed event to hide button
    const handleAppInstalled = () => {
      setShowButton(false);
      window.deferredPrompt = null;
    };

    window.addEventListener('pwa-prompt-changed', handlePromptChanged);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-changed', handlePromptChanged);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Dispatch event to show the beautiful install prompt modal
    window.dispatchEvent(new CustomEvent('pwa-show-install-modal'));
  };

  if (!showButton) return null;

  return (
    <button className="pwa-nav-install-btn" onClick={handleInstallClick} title="Install ConnectHub App">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span>Install App</span>
    </button>
  );
};

export default PWAInstallButton;
