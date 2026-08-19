import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CustomDialogProvider } from './context/CustomDialogContext';
import { PostsProvider } from './context/PostsContext';
import { NotificationsProvider, useNotifications } from './context/NotificationsContext';
import Spinner from './components/Loader/Spinner';
import { getUploadUrl } from './utils/mediaHelper';

import './styles/styles.css';
import './styles/pwa.css';

// PWA Components
import OfflineStatusBanner from './components/PWA/OfflineStatusBanner';
import UpdatePrompt from './components/PWA/UpdatePrompt';
import PWAInstallPrompt from './components/PWA/PWAInstallPrompt';
import NotificationPermission from './push/NotificationPermission';
import Offline from './pages/Offline/Offline';


// Helper for lazy loading with automatic retry on failure (e.g. chunk loading errors after new deployment)
const lazyWithRetry = (componentImport) => {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error('Error loading lazy component:', error);
      const hasRetried = sessionStorage.getItem('chunk-load-retried');
      if (!hasRetried) {
        sessionStorage.setItem('chunk-load-retried', 'true');
        window.location.reload();
        return new Promise(() => {}); // Do not resolve or reject, wait for reload
      }
      throw error;
    }
  });
};

// Lazy load pages
const Home = lazyWithRetry(() => import('./pages/Home/Home'));
const Login = lazyWithRetry(() => import('./pages/Login/Login'));
const Register = lazyWithRetry(() => import('./pages/Register/Register'));
const Profile = lazyWithRetry(() => import('./pages/Profile/Profile'));
const PostDetail = lazyWithRetry(() => import('./pages/Post/PostDetail'));
const Explore = lazyWithRetry(() => import('./pages/Explore/Explore'));
const Search = lazyWithRetry(() => import('./pages/Search/Search'));
const NotificationsPage = lazyWithRetry(() => import('./pages/Notifications/NotificationsPage'));
const NotificationDetailsPage = lazyWithRetry(() => import('./pages/Notifications/NotificationDetailsPage'));
const Messages = lazyWithRetry(() => import('./pages/Messages/Messages'));
const Saved = lazyWithRetry(() => import('./pages/Saved/Saved'));
const Friends = lazyWithRetry(() => import('./pages/Friends/Friends'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound/NotFound'));
const LocationPage = lazyWithRetry(() => import('./pages/Location/LocationPage'));
const BirthdayMemoriesPage = lazyWithRetry(() => import('./pages/BirthdayMemories/BirthdayMemoriesPage'));
const Verify = lazyWithRetry(() => import('./pages/Verify/Verify'));
const ForgotPassword = lazyWithRetry(() => import('./pages/ForgotPassword/ForgotPassword'));
const VerifyResetCode = lazyWithRetry(() => import('./pages/VerifyResetCode/VerifyResetCode'));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword/ResetPassword'));

// Settings Pages
const SettingsLayout = lazyWithRetry(() => import('./pages/Settings/SettingsLayout'));
const SettingsHome = lazyWithRetry(() => import('./pages/Settings/SettingsHome'));
const AccountDetails = lazyWithRetry(() => import('./pages/Settings/AccountDetails/AccountDetails'));
const ManagePosts = lazyWithRetry(() => import('./pages/Settings/ManagePosts/ManagePosts'));
const Theme = lazyWithRetry(() => import('./pages/Settings/Theme/Theme'));
const Notifications = lazyWithRetry(() => import('./pages/Settings/NotificationSettings/NotificationSettings'));
const Privacy = lazyWithRetry(() => import('./pages/Settings/Privacy/Privacy'));
const BlockedAccounts = lazyWithRetry(() => import('./pages/Settings/BlockedAccounts/BlockedAccounts'));
const Comments = lazyWithRetry(() => import('./pages/Settings/Comments/Comments'));
const About = lazyWithRetry(() => import('./pages/Settings/About/About'));
const Logout = lazyWithRetry(() => import('./pages/Settings/Logout/Logout'));

// Admin Pages
const AdminLogin = lazyWithRetry(() => import('./pages/Admin/AdminLogin'));
const AdminDashboard = lazyWithRetry(() => import('./pages/Admin/Dashboard/AdminDashboard'));
const AdminUsers = lazyWithRetry(() => import('./pages/Admin/Users/AdminUsers'));
const AdminPosts = lazyWithRetry(() => import('./pages/Admin/Posts/AdminPosts'));
const AdminComments = lazyWithRetry(() => import('./pages/Admin/Comments/AdminComments'));
const AdminReports = lazyWithRetry(() => import('./pages/Admin/Reports/AdminReports'));
const AdminNotifications = lazyWithRetry(() => import('./pages/Admin/Notifications/AdminNotifications'));
const AdminActivityLogs = lazyWithRetry(() => import('./pages/Admin/ActivityLogs/AdminActivityLogs'));
const AdminRecycleBin = lazyWithRetry(() => import('./pages/Admin/RecycleBin/AdminRecycleBin'));
const AdminPlatformSettings = lazyWithRetry(() => import('./pages/Admin/PlatformSettings/AdminPlatformSettings'));
const AdminTrending = lazyWithRetry(() => import('./pages/Admin/Trending/AdminTrending'));
const AdminProfile = lazyWithRetry(() => import('./pages/Admin/Profile/AdminProfile'));
const AdminTheme = lazyWithRetry(() => import('./pages/Admin/Theme/AdminTheme'));


// Admin Route wrapper
const AdminRoute = ({ children }) => {
  const adminToken = sessionStorage.getItem('adminToken');
  const adminUserStr = sessionStorage.getItem('adminUser');
  const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;

  if (!adminToken || !adminUser || adminUser.role !== 'admin') {
    return <Navigate to="/login" replace />;
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
  if (currentUser && currentUser.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (currentUser && currentUser.isVerified === false) {
    return <Navigate to="/verify" replace />;
  }
  return children;
};

// Public Routes wrapper
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, currentUser } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner />
      </div>
    );
  }
  return !isAuthenticated ? children : (
    currentUser?.role === 'admin'
      ? <Navigate to="/admin/dashboard" replace />
      : <Navigate to="/" replace />
  );
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
    return currentUser.role === 'admin'
      ? <Navigate to="/admin/dashboard" replace />
      : <Navigate to="/" replace />;
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
  const [isOfflineError, setIsOfflineError] = useState(false);

  // Sync theme configurations on startup
  useEffect(() => {
    const activeTheme = localStorage.getItem('theme') || 'system';
    const applyTheme = (themeName) => {
      const body = document.body;
      if (themeName === 'dark') {
        body.classList.add('dark-theme');
      } else if (themeName === 'light') {
        body.classList.remove('dark-theme');
      } else if (themeName === 'system') {
        const matchesDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (matchesDark) {
          body.classList.add('dark-theme');
        } else {
          body.classList.remove('dark-theme');
        }
      }
    };
    applyTheme(activeTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      const currentVal = localStorage.getItem('theme') || 'system';
      if (currentVal === 'system') {
        if (e.matches) {
          document.body.classList.add('dark-theme');
        } else {
          document.body.classList.remove('dark-theme');
        }
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);

    const handleThemeChange = (e) => {
      if (e.detail && e.detail.theme) {
        applyTheme(e.detail.theme);
      }
    };
    window.addEventListener('theme-changed', handleThemeChange);

    const handleStorageChange = (e) => {
      if (e.key === 'theme') {
        applyTheme(e.newValue || 'system');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      window.removeEventListener('theme-changed', handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    // Clear chunk-load-retried flag on successful load
    sessionStorage.removeItem('chunk-load-retried');

    // 1. Listen for api-offline-error event
    const handleOfflineError = () => {
      setIsOfflineError(true);
    };
    
    // 2. Listen for online event to clear error
    const handleOnline = () => {
      setIsOfflineError(false);
    };

    // 3. Listen for beforeinstallprompt event to capture install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa-prompt-changed', { detail: { available: true } }));
    };

    window.addEventListener('api-offline-error', handleOfflineError);
    window.addEventListener('online', handleOnline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Initial check (if already offline on start)
    if (!navigator.onLine) {
      // Check if we already failed a request or if we start completely offline with no cache
      // We do not immediately trigger full offline page, only when a request fails
    }

    return () => {
      window.removeEventListener('api-offline-error', handleOfflineError);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isOfflineError) {
    return <Offline onRetry={() => { setIsOfflineError(false); window.location.reload(); }} />;
  }

  return (
    <>
      <OfflineStatusBanner />
      <UpdatePrompt />
      <PWAInstallPrompt />
      <NotificationPermission />
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
          <Route path="/notifications/:id" element={<ProtectedRoute><NotificationDetailsPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
          <Route path="/location/:placeId" element={<ProtectedRoute><LocationPage /></ProtectedRoute>} />

          {/* Profile Settings System Routes */}
          <Route path="/settings" element={<ProtectedRoute><SettingsLayout /></ProtectedRoute>}>
            <Route index element={<SettingsHome />} />
            <Route path="account" element={<AccountDetails />} />
            <Route path="posts" element={<ManagePosts />} />
            <Route path="theme" element={<Theme />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="blocked" element={<BlockedAccounts />} />
            <Route path="comments" element={<Comments />} />
            <Route path="about" element={<About />} />
            <Route path="logout" element={<Logout />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
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
          <Route path="/admin/profile" element={<AdminRoute><AdminProfile /></AdminRoute>} />
          <Route path="/admin/theme" element={<AdminRoute><AdminTheme /></AdminRoute>} />


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
