import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CustomDialogProvider } from './context/CustomDialogContext';
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
const Friends = lazy(() => import('./pages/Friends/Friends'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));
const BirthdayMemoriesPage = lazy(() => import('./pages/BirthdayMemories/BirthdayMemoriesPage'));
const Verify = lazy(() => import('./pages/Verify/Verify'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword/ForgotPassword'));
const VerifyResetCode = lazy(() => import('./pages/VerifyResetCode/VerifyResetCode'));
const ResetPassword = lazy(() => import('./pages/ResetPassword/ResetPassword'));

// Admin Pages
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/Admin/Users/AdminUsers'));
const AdminPosts = lazy(() => import('./pages/Admin/Posts/AdminPosts'));
const AdminComments = lazy(() => import('./pages/Admin/Comments/AdminComments'));
const AdminReports = lazy(() => import('./pages/Admin/Reports/AdminReports'));
const AdminNotifications = lazy(() => import('./pages/Admin/Notifications/AdminNotifications'));
const AdminActivityLogs = lazy(() => import('./pages/Admin/ActivityLogs/AdminActivityLogs'));
const AdminRecycleBin = lazy(() => import('./pages/Admin/RecycleBin/AdminRecycleBin'));
const AdminPlatformSettings = lazy(() => import('./pages/Admin/PlatformSettings/AdminPlatformSettings'));
const AdminTrending = lazy(() => import('./pages/Admin/Trending/AdminTrending'));

// Admin Route wrapper
const AdminRoute = ({ children }) => {
  const adminToken = sessionStorage.getItem('adminToken');
  const adminUserStr = sessionStorage.getItem('adminUser');
  const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;

  if (!adminToken || !adminUser || adminUser.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

// Protected Routes wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, currentUser } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser && currentUser.isVerified === false) {
    return <Navigate to="/verify" replace />;
  }
  return children;
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

// Verification Route wrapper
const VerificationRoute = ({ children }) => {
  const { isAuthenticated, loading, currentUser } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser && currentUser.isVerified !== false) {
    return <Navigate to="/" replace />;
  }
  return children;
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
  else if (n.type === 'story-like') actionText = 'liked your story';
  else if (n.type === 'story-comment') actionText = 'commented on your story';
  else if (n.type === 'follow') {
    actionText = n.sender?.relationshipStatus === 'friends'
      ? 'is now your friend!'
      : 'started following you';
  } else if (n.type === 'birthday') {
    const recipientId = n.recipient?._id || n.recipient;
    const isSelf = n.sender?._id?.toString() === recipientId?.toString() || n.sender?.toString() === recipientId?.toString();
    actionText = isSelf
      ? '- Happy Birthday! Have a wonderful day! 🎉'
      : 'celebrates their birthday today. Wish them a Happy Birthday! 🎂';
  } else if (n.type === 'birthday-wish') {
    actionText = 'wished you a Happy Birthday! 🎂';
  } else if (n.type === 'birthday-gift') {
    actionText = 'sent you a virtual birthday gift! 🎁';
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
    } else if (n.story) {
      navigate(`/`);
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
          <Route path="/verify" element={<VerificationRoute><Verify /></VerificationRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/verify-reset-code" element={<PublicRoute><VerifyResetCode /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:username/memories" element={<ProtectedRoute><BirthdayMemoriesPage /></ProtectedRoute>} />
          <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/posts" element={<AdminRoute><AdminPosts /></AdminRoute>} />
          <Route path="/admin/comments" element={<AdminRoute><AdminComments /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
          <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
          <Route path="/admin/activity-logs" element={<AdminRoute><AdminActivityLogs /></AdminRoute>} />
          <Route path="/admin/recycle-bin" element={<AdminRoute><AdminRecycleBin /></AdminRoute>} />
          <Route path="/admin/platform-settings" element={<AdminRoute><AdminPlatformSettings /></AdminRoute>} />
          <Route path="/admin/trending" element={<AdminRoute><AdminTrending /></AdminRoute>} />

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
      <CustomDialogProvider>
        <PostsProvider>
          <NotificationsProvider>
            <Router>
              <AppContent />
            </Router>
          </NotificationsProvider>
        </PostsProvider>
      </CustomDialogProvider>
    </AuthProvider>
  );
};

export default App;
