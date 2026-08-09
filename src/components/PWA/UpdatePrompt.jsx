import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW Registration error:', error);
    },
  });

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
        <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>Update Available</h4>
        <span>Version 1.1 is available. Update now for the latest features and fixes.</span>
      </div>
      <div className="pwa-update-actions">
        <button className="pwa-update-btn-cancel" onClick={handleClose}>
          Later
        </button>
        <button className="pwa-update-btn-confirm" onClick={handleUpdate}>
          Update
        </button>
      </div>
    </div>
  );
};

export default UpdatePrompt;
