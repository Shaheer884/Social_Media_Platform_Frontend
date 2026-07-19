import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotification, setToastNotification] = useState(null);

  const lastIdsRef = useRef([]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        const data = res.data;
        const currentUnread = data.filter((n) => !n.read && !n.isRead);
        setUnreadCount(currentUnread.length);

        // Check for new notifications to trigger toast pop-up
        const currentIds = data.map((n) => n._id);
        const lastIds = lastIdsRef.current;

        if (lastIds.length > 0) {
          // Find any unread notification that wasn't in the previous poll
          const newUnreads = currentUnread.filter((n) => !lastIds.includes(n._id));
          if (newUnreads.length > 0) {
            // Trigger temporary toast notification for the newest one
            setToastNotification(newUnreads[0]);
            // Dismiss toast after 4 seconds
            setTimeout(() => setToastNotification(null), 4000);
          }
        }

        lastIdsRef.current = currentIds;
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [isAuthenticated]);

  const markAllRead = async () => {
    try {
      const res = await notificationService.markAllRead();
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = async (id) => {
    try {
      const res = await notificationService.markReadOne(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Setup periodic polling
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      lastIdsRef.current = [];
    }
  }, [isAuthenticated, fetchNotifications]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        toastNotification,
        setToastNotification,
        fetchNotifications,
        markAllRead,
        markRead
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
export default NotificationsContext;
