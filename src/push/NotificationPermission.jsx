import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { isPushSupported, subscribeUser } from './subscriptionManager';

const NotificationPermission = () => {
  const { isAuthenticated, loading } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Only proceed if user is logged in, page is loaded, and push is supported by browser
    if (loading || !isAuthenticated || !isPushSupported()) {
      return;
    }

    // Check if permission is default and if user has already seen this prompt
    const hasSeenPrompt = localStorage.getItem('connecthub_push_prompt_seen');
    const currentPermission = Notification.permission;

    if (currentPermission === 'default' && !hasSeenPrompt) {
      // Small delay before showing prompt for a smoother UX
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loading]);

  const handleAllow = async () => {
    setIsSubmitting(true);
    try {
      // 1. Request native browser notification permission
      const permission = await Notification.requestPermission();
      
      // Mark as seen so they are never prompted again
      localStorage.setItem('connecthub_push_prompt_seen', 'true');
      
      if (permission === 'granted') {
        // 2. Generate subscription and register to server
        await subscribeUser();
      }
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
    } finally {
      setIsSubmitting(false);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    // Save prompt seen state in localStorage so they aren't repeatedly asked
    localStorage.setItem('connecthub_push_prompt_seen', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-notification-overlay">
      <div className="pwa-notification-modal">
        <div className="pwa-notification-icon-container">
          <div className="pwa-notification-ring-icon">🔔</div>
          <div className="pwa-notification-ping-dot"></div>
        </div>
        
        <h3 className="pwa-notification-title">Enable Notifications?</h3>
        
        <p className="pwa-notification-desc">
          Stay updated instantly with likes, comments, messages, friend requests, stories, and platform announcements.
        </p>

        <div className="pwa-notification-actions">
          <button 
            className="pwa-notification-btn-cancel" 
            onClick={handleDismiss}
            disabled={isSubmitting}
          >
            Not Now
          </button>
          <button 
            className="pwa-notification-btn-confirm" 
            onClick={handleAllow}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enabling...' : 'Allow'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermission;
