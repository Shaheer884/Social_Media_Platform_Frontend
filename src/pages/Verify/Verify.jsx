import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Loader/Spinner';
import authBg from '../../assets/connecthub_auth_bg.png';

const Verify = () => {
  const navigate = useNavigate();
  const { verify, resendVerification, logout, currentUser } = useAuth();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(60);

  const timerRef = useRef(null);

  // Start cooldown timer on mount
  useEffect(() => {
    startCooldown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCode(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const res = await verify(code);
      if (res.success) {
        setSuccess('Verification successful! Redirecting...');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setError('');
    setSuccess('');
    setResending(true);

    try {
      const res = await resendVerification();
      if (res.success) {
        setSuccess('Verification code resent successfully!');
        startCooldown();
      }
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
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
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '12px 0 6px', color: 'var(--text-main)', textAlign: 'center' }}>Verify Your Email</h2>
                <p className="auth-subtitle" style={{ fontSize: '0.875rem', lineHeight: '1.4', margin: '0 auto 12px', maxWidth: '320px', textAlign: 'center' }}>
                  We've sent a 6-digit verification code to <br />
                  <strong style={{ color: 'var(--purple)', wordBreak: 'break-all' }}>{currentUser?.email || 'your email'}</strong>. <br />
                  Please enter it below to activate your account.
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
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label htmlFor="code" className="form-label" style={{ textAlign: 'center', display: 'block' }}>6-Digit Verification Code</label>
                  <input
                    type="text"
                    id="code"
                    maxLength="6"
                    className="form-input"
                    placeholder="000000"
                    value={code}
                    onChange={handleChange}
                    style={{
                      textAlign: 'center',
                      fontSize: '2rem',
                      letterSpacing: '0.25em',
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                      paddingLeft: '0.25em',
                      width: '100%',
                      marginTop: '8px'
                    }}
                    required
                    autoFocus
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading || code.length !== 6}>
                  {loading ? <Spinner size="16px" style={{ borderColor: 'transparent', borderTopColor: '#fff' }} /> : <span>Verify Account</span>}
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '20px', fontSize: '0.9rem' }}>
                <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                  Didn't receive the code?{' '}
                  <button
                    onClick={handleResend}
                    disabled={cooldown > 0 || resending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: cooldown > 0 ? 'var(--text-muted)' : 'var(--purple)',
                      fontWeight: '600',
                      cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                      padding: 0,
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      textDecoration: cooldown > 0 ? 'none' : 'underline'
                    }}
                  >
                    {resending ? 'Resending...' : cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
                  </button>
                </div>

                <div className="auth-footer" style={{ marginTop: 0 }}>
                  <a href="#" onClick={handleLogoutClick} className="auth-link" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>
                    Back to Login / Logout
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;
