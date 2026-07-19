import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Loader/Spinner';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedIdent = emailOrUsername.trim();
    if (!trimmedIdent || !password) {
      setError('Please fill out all fields');
      return;
    }

    setLoading(true);

    try {
      await login({ emailOrUsername: trimmedIdent, password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-theme">
      <div className="auth-page">
        <div className="auth-split-wrapper">
          <div className="auth-visual-side">
            <div className="auth-visual-overlay"></div>
            <img src="/src/assets/connecthub_auth_bg.png" className="auth-visual-image" alt="ConnectHub Visual" />
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
                <p className="auth-subtitle">Welcome back! Connect with your friends.</p>
              </div>

              {error && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="emailOrUsername" className="form-label">Email or Username</label>
                  <input
                    type="text"
                    id="emailOrUsername"
                    className="form-input"
                    placeholder="Enter email or username"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    id="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                  {loading ? <Spinner size="16px" style={{ borderColor: 'transparent', borderTopColor: '#fff' }} /> : <span>Login</span>}
                </button>
              </form>

              <div className="auth-footer">
                <span>Don't have an account? </span>
                <Link to="/register" className="auth-link">Sign Up</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
