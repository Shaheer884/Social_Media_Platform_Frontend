import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PostsProvider } from './context/PostsContext';
import { NotificationsProvider, useNotifications } from './context/NotificationsContext';
import Spinner from './components/Loader/Spinner';
import { getUploadUrl } from './utils/mediaHelper';

import './styles/styles.css';

// Lazy load pages
const Home = lazy(() => import('./pages/Home/Home'));
const Login = lazy(() => import('./pages/Login/Login'));
const Register = lazy(() => import('./pages/Register/Register'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const PostDetail = lazy(() => import('./pages/Post/PostDetail'));
const Explore = lazy(() => import('./pages/Explore/Explore'));
const Search = lazy(() => import('./pages/Search/Search'));
const NotificationsPage = lazy(() => import('./pages/Notifications/NotificationsPage'));
const Messages = lazy(() => import('./pages/Messages/Messages'));
const Saved = lazy(() => import('./pages/Saved/Saved'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

// Protected Routes wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Routes wrapper
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner />
      </div>
    );
  }
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

// Toast notification pop-up component
const NotificationToast = () => {
  const { toastNotification, setToastNotification, markRead } = useNotifications();
  const navigate = useNavigate();

  if (!toastNotification) return null;

  const n = toastNotification;
  const avatar = getUploadUrl(n.sender?.profilePicture || '/uploads/default-avatar.png');
  let actionText = '';
  if (n.type === 'like') actionText = 'liked your post';
  else if (n.type === 'comment') actionText = 'commented on your post';
  else if (n.type === 'follow') {
    actionText = n.sender?.relationshipStatus === 'friends'
      ? 'is now your friend!'
      : 'started following you';
  }
  const postText = n.post ? ` "${(n.post.content || '').substring(0, 15)}..."` : '';
  const displayContent = n.type === 'follow' && n.sender?.relationshipStatus === 'friends'
    ? actionText
    : actionText + postText;

  const handleToastClick = async () => {
    setToastNotification(null);
    await markRead(n._id);
    if (n.post) {
      navigate(`/post/${n.post._id || n.post}`);
    } else if (n.sender) {
      navigate(`/profile/${n.sender.username}`);
    }
  };

  return (
    <div className="toast-container">
      <div className="toast" onClick={handleToastClick} style={{ cursor: 'pointer', borderLeft: '4px solid var(--purple)' }}>
        <div className="toast-noti-content" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <img src={avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
          <div style={{ lineHeight: 1.3 }}>
            <span style={{ fontWeight: 700 }}>{n.sender?.fullName || 'Someone'}</span> {displayContent}
          </div>
        </div>
        <button
          className="toast-noti-close"
          onClick={(e) => {
            e.stopPropagation();
            setToastNotification(null);
          }}
          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 4px', fontSize: '1.2rem', fontWeight: 'bold', marginLeft: '8px' }}
        >
          &times;
        </button>
      </div>
    </div>
  );
};

const AppContent = () => {
  return (
    <>
      <NotificationToast />
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spinner />
        </div>
      }>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <PostsProvider>
        <NotificationsProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationsProvider>
      </PostsProvider>
    </AuthProvider>
  );
};

export default App;
