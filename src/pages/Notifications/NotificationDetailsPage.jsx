import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import notificationService from '../../services/notificationService';
import { useNotifications } from '../../context/NotificationsContext';
import { useDialog } from '../../context/CustomDialogContext';
import NotificationDetails from '../../components/Notifications/NotificationDetails';
import Spinner from '../../components/Loader/Spinner';

const NotificationDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchNotifications: syncNavbarNotifications } = useNotifications();
  const { showConfirm } = useDialog();

  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
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
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NotificationDetailsPage;
