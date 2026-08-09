import React, { useState, useEffect } from 'react';

const PWAInstallPrompt = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const showModal = () => {
      setIsOpen(true);
    };

    window.addEventListener('pwa-show-install-modal', showModal);
    
    // Automatically trigger custom install prompt popup if available
    // but only once per session to not annoy users
    const hasPromptedThisSession = sessionStorage.getItem('pwa_prompted_install');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (window.deferredPrompt && !hasPromptedThisSession && !isStandalone) {
      // Small timeout to let page render
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('pwa_prompted_install', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }

    const handlePromptChanged = (e) => {
      if (e.detail?.available && !hasPromptedThisSession && !isStandalone) {
        setIsOpen(true);
        sessionStorage.setItem('pwa_prompted_install', 'true');
      }
    };

    window.addEventListener('pwa-prompt-changed', handlePromptChanged);

    return () => {
      window.removeEventListener('pwa-show-install-modal', showModal);
      window.removeEventListener('pwa-prompt-changed', handlePromptChanged);
    };
  }, []);

  const handleInstall = async () => {
    const promptEvent = window.deferredPrompt;
    if (!promptEvent) {
      setIsOpen(false);
      return;
    }

    // Hide our custom prompt
    setIsOpen(false);
    
    // Show the browser install prompt
    promptEvent.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, clear it
    window.deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-prompt-changed', { detail: { available: false } }));
  };

  const handleLater = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="pwa-install-overlay" onClick={handleLater}>
      <div className="pwa-install-modal" onClick={(e) => e.stopPropagation()}>
        <img src="/favicon.png" className="pwa-install-icon" alt="ConnectHub Logo" />
        <h3 className="pwa-install-title">Install ConnectHub</h3>
        <p className="pwa-install-desc">
          Install this app on your device for a faster, offline-capable experience, and direct home screen access.
        </p>
        <div className="pwa-install-actions">
          <button className="pwa-install-btn-cancel" onClick={handleLater}>
            Later
          </button>
          <button className="pwa-install-btn-confirm" onClick={handleInstall}>
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
