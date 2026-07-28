import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../../components/Loader/Spinner';
import authBg from '../../assets/connecthub_auth_bg.png';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email: trimmedEmail });
      if (res.success) {
        setSuccess('Verification code sent successfully! Redirecting...');
        setTimeout(() => {
          navigate('/verify-reset-code', { state: { email: trimmedEmail } });
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
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
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '12px 0 6px', color: 'var(--text-main)', textAlign: 'center' }}>Forgot Password?</h2>
                <p className="auth-subtitle" style={{ fontSize: '0.875rem', lineHeight: '1.4', margin: '0 auto 12px', maxWidth: '320px', textAlign: 'center' }}>
                  No worries! Enter your email address below and we'll send you a 6-digit code to reset your password.
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
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                  {loading ? <Spinner size="16px" style={{ borderColor: 'transparent', borderTopColor: '#fff' }} /> : <span>Send Verification Code</span>}
                </button>
              </form>

              <div className="auth-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
                <span>Remember password? </span>
                <Link to="/login" className="auth-link" style={{ textDecoration: 'underline' }}>Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
