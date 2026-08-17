import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import notificationService from '../../services/notificationService';
import { useNotifications } from '../../context/NotificationsContext';
import { useDialog } from '../../context/CustomDialogContext';
import NotificationDetails from '../../components/Notifications/NotificationDetails';
import ContentUnavailableModal from '../../components/Notifications/ContentUnavailableModal';
import Spinner from '../../components/Loader/Spinner';

const NotificationDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchNotifications: syncNavbarNotifications } = useNotifications();
  const { showConfirm } = useDialog();

  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unavailableStatus, setUnavailableStatus] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      // 1. Try to restore state from sessionStorage to prevent flickers when navigating back
      const cachedState = sessionStorage.getItem(`noti_state_${id}`);
      if (cachedState) {
        try {
          const parsed = JSON.parse(cachedState);
          setNotification(parsed);
          setLoading(false);
          
          // Restore scroll position
          const cachedScroll = sessionStorage.getItem(`noti_scroll_${id}`);
          if (cachedScroll) {
            setTimeout(() => {
              window.scrollTo(0, parseInt(cachedScroll));
              // Clean up to prevent side-effects on subsequent clean loads
              sessionStorage.removeItem(`noti_state_${id}`);
              sessionStorage.removeItem(`noti_scroll_${id}`);
            }, 80);
          }
          return;
        } catch (e) {
          console.error('Failed to parse cached details state:', e);
        }
      }

      setLoading(true);
      try {
        const res = await notificationService.getNotificationDetails(id);
        if (res.success) {
          setNotification(res.data);
          syncNavbarNotifications(); // Instantly update unread badges
        }
      } catch (error) {
        console.error('Failed to fetch notification details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handleDelete = async (notiId) => {
    const confirm = await showConfirm(
      'Are you sure you want to delete this notification?',
      'Delete Notification'
    );
    if (confirm) {
      try {
        const res = await notificationService.deleteNotification(notiId);
        if (res.success) {
          syncNavbarNotifications();
          navigate('/notifications'); // Redirect back to list
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleNavigate = (type, url) => {
    const validation = notification?.resourceValidation || { status: 'VALID', exists: true };
    if (!validation.exists) {
      // If resource is deleted/expired/unavailable, render the modal
      setUnavailableStatus(validation.status);
    } else if (url && url !== '/post/' && url !== '/profile/') {
      // Save current page state and scroll position before navigating away
      sessionStorage.setItem(`noti_state_${id}`, JSON.stringify(notification));
      sessionStorage.setItem(`noti_scroll_${id}`, window.scrollY.toString());
      
      // Navigate to target resource, passing the notification ID in location history state
      navigate(url, { state: { fromNotificationId: id } });
    } else {
      // Fallback: If URL resolves to empty/invalid, treat it as unavailable/deleted
      setUnavailableStatus(
        type === 'story' ? 'STORY_DELETED' : 
        type === 'profile' ? 'USER_NOT_AVAILABLE' : 
        type === 'comment' ? 'COMMENT_REMOVED' :
        'RESOURCE_DELETED'
      );
    }
  };

  return (
    <Layout>
      <div className="notification-details-page">
        {/* Header */}
        <div className="center-header">
          <button 
            className="center-back-btn" 
            onClick={() => navigate('/notifications')} 
            title="Back to Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div className="center-header-title-box">
            <h2 className="center-title">Notification Details</h2>
          </div>
        </div>

        {/* Content */}
        <div className="center-content-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Spinner />
              <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading notification details...</p>
            </div>
          ) : !notification ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
              <h3>Notification not found</h3>
              <button 
                className="btn btn-secondary" 
                onClick={() => navigate('/notifications')} 
                style={{ marginTop: '16px' }}
              >
                Back to Notifications
              </button>
            </div>
          ) : (
            <NotificationDetails 
              notification={notification} 
              onDelete={handleDelete} 
              onNavigate={handleNavigate}
            />
          )}
        </div>
      </div>

      {/* Unavailable resource modal */}
      {unavailableStatus && (
        <ContentUnavailableModal
          status={unavailableStatus}
          onClose={() => setUnavailableStatus(null)}
        />
      )}
    </Layout>
  );
};

export default NotificationDetailsPage;
