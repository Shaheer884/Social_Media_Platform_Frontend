import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import notificationService from '../../services/notificationService';
import { useNotifications } from '../../context/NotificationsContext';
import { useDialog } from '../../context/CustomDialogContext';

import NotificationSearch from '../../components/Notifications/NotificationSearch';
import NotificationFilters from '../../components/Notifications/NotificationFilters';
import NotificationList from '../../components/Notifications/NotificationList';
import NotificationEmptyState from '../../components/Notifications/NotificationEmptyState';
import NotificationLoader from '../../components/Notifications/NotificationLoader';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { fetchNotifications: syncNavbarNotifications } = useNotifications();
  const { showConfirm } = useDialog();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Search Debouncer
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search query
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Load notifications from API
  const loadNotificationsList = async (pageNum, reset = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await notificationService.getNotifications({
        page: pageNum,
        limit: 10,
        filter: activeFilter,
        search: debouncedSearch
      });

      if (res.success) {
        if (reset || pageNum === 1) {
          setNotifications(res.data);
        } else {
          setNotifications((prev) => [...prev, ...res.data]);
        }
        setTotalPages(res.totalPages);
        setTotalCount(res.totalNotifications);
      }
    } catch (error) {
      console.error('Failed to load notifications history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Trigger reloading when filters or debounced search changes
  useEffect(() => {
    loadNotificationsList(1, true);
    setSelectedIds([]);
  }, [activeFilter, debouncedSearch]);

  const handleLoadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadNotificationsList(nextPage);
    }
  };

  const handleCardClick = async (n) => {
    // Navigate to details page
    navigate(`/notifications/${n._id}`);
  };

  const handleDeleteOne = async (id) => {
    const confirm = await showConfirm(
      'Are you sure you want to delete this notification?',
      'Delete Notification'
    );
    if (confirm) {
      try {
        const res = await notificationService.deleteNotification(id);
        if (res.success) {
          setNotifications((prev) => prev.filter((n) => n._id !== id));
          setSelectedIds((prev) => prev.filter((x) => x !== id));
          setTotalCount((c) => Math.max(0, c - 1));
          syncNavbarNotifications(); // Keep bell icon and badge counts synced
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedIds.length === 0) return;
    const confirm = await showConfirm(
      `Are you sure you want to delete the ${selectedIds.length} selected notifications?`,
      'Delete Selected Notifications'
    );
    if (confirm) {
      try {
        const res = await notificationService.deleteMultipleNotifications(selectedIds);
        if (res.success) {
          setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n._id)));
          setTotalCount((c) => Math.max(0, c - selectedIds.length));
          setSelectedIds([]);
          syncNavbarNotifications();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleDeleteAll = async () => {
    const confirm = await showConfirm(
      'Are you sure you want to delete ALL notifications? This action cannot be undone.',
      'Delete All Notifications'
    );
    if (confirm) {
      try {
        const res = await notificationService.deleteAllNotifications();
        if (res.success) {
          setNotifications([]);
          setSelectedIds([]);
          setTotalCount(0);
          syncNavbarNotifications();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <Layout>
      <div className="notifications-page-container">
        {/* Top Header */}
        <div className="center-header">
          <button 
            className="center-back-btn" 
            onClick={() => navigate('/')} 
            title="Back to Home"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div className="center-header-title-box">
            <h2 className="center-title">Notifications</h2>
            <span className="center-counter">({totalCount})</span>
          </div>
          {notifications.length > 0 && (
            <button className="center-clear-all-btn" onClick={handleDeleteAll} title="Delete All Notifications">
              Delete All
            </button>
          )}
        </div>

        {/* Search */}
        <NotificationSearch search={search} setSearch={setSearch} />

        {/* Filters */}
        <NotificationFilters activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

        {/* Notification List Area */}
        <div className="center-content-card">
          {loading ? (
            <NotificationLoader />
          ) : notifications.length === 0 ? (
            <NotificationEmptyState />
          ) : (
            <>
              <NotificationList
                notifications={notifications}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                onDeleteOne={handleDeleteOne}
                onDeleteMultiple={handleDeleteMultiple}
                onCardClick={handleCardClick}
              />

              {page < totalPages && (
                <div className="load-more-container">
                  <button 
                    className="btn btn-secondary load-more-btn" 
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading older...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsPage;
