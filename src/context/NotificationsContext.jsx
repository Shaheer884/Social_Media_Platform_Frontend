import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [latestNotifications, setLatestNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotification, setToastNotification] = useState(null);

  const lastIdsRef = useRef([]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationService.getLatestNotifications();
      if (res.success) {
        const data = res.data;
        const currentUnreadCount = res.unreadCount;
        setUnreadCount(currentUnreadCount);

        // Check for new notifications to trigger toast pop-up
        const currentIds = data.map((n) => n._id);
        const lastIds = lastIdsRef.current;

        if (lastIds.length > 0) {
          // Find any unread notification that wasn't in the previous poll
          const newUnreads = data.filter((n) => (!n.read && !n.isRead) && !lastIds.includes(n._id));
          if (newUnreads.length > 0) {
            // Trigger temporary toast notification for the newest one
            setToastNotification(newUnreads[0]);
            // Dismiss toast after 4 seconds
            setTimeout(() => setToastNotification(null), 4000);
          }
        }

        lastIdsRef.current = currentIds;
        setNotifications(data);
        setLatestNotifications(data);
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
        setLatestNotifications((prev) =>
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
        setLatestNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await notificationService.deleteNotification(id);
      if (res.success) {
        setNotifications((prev) => {
          const item = prev.find(n => n._id === id);
          if (item && (!item.read && !item.isRead)) {
            setUnreadCount(u => Math.max(0, u - 1));
          }
          return prev.filter((n) => n._id !== id);
        });
        setLatestNotifications((prev) => prev.filter((n) => n._id !== id));
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMultipleNotifications = async (ids) => {
    try {
      const res = await notificationService.deleteMultipleNotifications(ids);
      if (res.success) {
        setNotifications((prev) => {
          const removedItems = prev.filter(n => ids.includes(n._id));
          const unreadRemoved = removedItems.filter(n => !n.read && !n.isRead).length;
          if (unreadRemoved > 0) {
            setUnreadCount(u => Math.max(0, u - unreadRemoved));
          }
          return prev.filter((n) => !ids.includes(n._id));
        });
        setLatestNotifications((prev) => prev.filter((n) => !ids.includes(n._id)));
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const res = await notificationService.deleteAllNotifications();
      if (res.success) {
        setNotifications([]);
        setLatestNotifications([]);
        setUnreadCount(0);
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
      setLatestNotifications([]);
      setUnreadCount(0);
      lastIdsRef.current = [];
    }
  }, [isAuthenticated, fetchNotifications]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        latestNotifications,
        unreadCount,
        toastNotification,
        setToastNotification,
        fetchNotifications,
        markAllRead,
        markRead,
        deleteNotification,
        deleteMultipleNotifications,
        deleteAllNotifications
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
export default NotificationsContext;
