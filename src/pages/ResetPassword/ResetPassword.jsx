import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../../components/Loader/Spinner';
import authBg from '../../assets/connecthub_auth_bg.png';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', {
        email,
        password,
        confirmPassword
      });

      if (res.success) {
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Password reset failed. Please request a new code.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-theme">
      <div className="auth-page">
        <div className="auth-split-wrapper">
          <div className="auth-visual-side">
            <div className="auth-visual-overlay"></div>
            <img src={authBg} className="auth-visual-image" alt="ConnectHub Visual" />
            <div className="auth-visual-text">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <img src="/favicon.png" alt="ConnectHub Logo" style={{ width: '80px', height: '80px', borderRadius: '20px', boxShadow: 'var(--shadow-lg)', objectFit: 'cover' }} />
                <h1 className="auth-visual-logo" style={{ marginBottom: 0 }}>ConnectHub</h1>
              </div>
              <p className="auth-visual-subtitle">Connect with friends, share stories, and build communities.</p>
            </div>
          </div>
          <div className="auth-form-side">
            <div className="card auth-card">
              <div className="auth-header">
                <div className="auth-logo-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                  <img src="/favicon.png" alt="ConnectHub Logo" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
                  <h1 className="auth-logo" style={{ marginBottom: 0 }}>ConnectHub</h1>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '12px 0 6px', color: 'var(--text-main)', textAlign: 'center' }}>Reset Password</h2>
                <p className="auth-subtitle" style={{ fontSize: '0.875rem', lineHeight: '1.4', margin: '0 auto 12px', maxWidth: '320px', textAlign: 'center' }}>
                  Please enter your new secure password below to complete the reset process.
                </p>
              </div>

              {error && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '6px' }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '6px' }}>
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="password" className="form-label">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className="form-input"
                      placeholder="Enter new password (min. 8 chars)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="2" y1="2" x2="22" y2="22" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className="form-input"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                  {loading ? <Spinner size="16px" style={{ borderColor: 'transparent', borderTopColor: '#fff' }} /> : <span>Reset Password</span>}
                </button>
              </form>

              <div className="auth-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  onClick={() => navigate('/login')}
                  className="auth-link"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
