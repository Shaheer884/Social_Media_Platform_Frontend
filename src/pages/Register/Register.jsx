import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Loader/Spinner';
import authBg from '../../assets/connecthub_auth_bg.png';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const refreshCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setCaptchaInput('');
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      const redirectUrl = from === '/register' || from === '/login' ? '/' : from;
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedFullName = fullName.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFullName || !trimmedUsername || !trimmedEmail || !password) {
      setError('Please fill out all fields');
      return;
    }

    if (captchaInput !== captchaText) {
      setError('Incorrect Captcha code. Please try again.');
      refreshCaptcha();
      return;
    }

    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[\W_]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return;
    }

    setLoading(true);

    try {
      await register({
        fullName: trimmedFullName,
        username: trimmedUsername,
        email: trimmedEmail,
        password
      });
      const from = location.state?.from?.pathname || '/';
      const redirectUrl = from === '/register' || from === '/login' ? '/' : from;
      navigate(redirectUrl, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Username or email might be taken.');
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
                <p className="auth-subtitle">Create an account to connect with friends!</p>
              </div>

              {error && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    type="text"
                    id="username"
                    className="form-input"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className="form-input"
                      placeholder="Enter your password"
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
                  <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#888' }}>
                    Password must contain at least 6 characters, including 1 uppercase, 1 lowercase, 1 number, and 1 special character.
                  </small>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="captchaInput" className="form-label">Captcha Verification</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{
                      flex: 1,
                      background: 'var(--input-bg)',
                      border: '1px dashed var(--border-color)',
                      borderRadius: '8px',
                      padding: '10px',
                      textAlign: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                      letterSpacing: '6px',
                      color: 'var(--text-main)',
                      textDecoration: 'line-through',
                      fontStyle: 'italic',
                      userSelect: 'none',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                      transform: 'skewX(-10deg)',
                      display: 'inline-block',
                      width: '100%'
                    }}>
                      {captchaText}
                    </div>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="btn"
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                      title="Refresh Captcha"
                    >
                      ↻
                    </button>
                  </div>
                  <input
                    type="text"
                    id="captchaInput"
                    className="form-input"
                    placeholder="Enter the 6-character Captcha code"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                  {loading ? <Spinner size="16px" style={{ borderColor: 'transparent', borderTopColor: '#fff' }} /> : <span>Sign Up</span>}
                </button>
              </form>

              <div className="auth-footer">
                <span>Already have an account? </span>
                <Link to="/login" className="auth-link">Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
