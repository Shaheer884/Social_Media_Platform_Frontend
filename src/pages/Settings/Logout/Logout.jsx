import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const handleConfirmLogout = () => {
    setProcessing(true);
    // Execute global auth logout (wipes token, sessionStorage, localStorage user details)
    logout();
    
    // Redirect to login replacing current route in browser history
    navigate('/login', { replace: true });
  };

  return (
    <div className="settings-card" style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🚪</div>
        <h2 className="settings-card-title" style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Confirm Logout</h2>
        <p className="settings-card-desc" style={{ fontSize: '0.92rem', marginBottom: '28px', lineHeight: '1.5' }}>
          Are you sure you want to logout of ConnectHub? You will need to enter your email and password to access your account again.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            type="button" 
            className="settings-btn settings-btn-danger"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            disabled={processing}
            onClick={handleConfirmLogout}
          >
            {processing ? 'Logging out...' : 'Confirm Logout'}
          </button>
          
          <button 
            type="button" 
            className="settings-btn settings-btn-secondary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            disabled={processing}
            onClick={() => navigate('/settings')}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Logout;
