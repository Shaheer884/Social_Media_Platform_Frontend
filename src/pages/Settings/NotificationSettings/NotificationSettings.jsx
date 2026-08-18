import React, { useState, useEffect } from 'react';
import notificationPreferenceService from '../../../services/notificationPreferenceService';
import NotificationToggle from './NotificationToggle';
import Spinner from '../../../components/Loader/Spinner';
import './NotificationSettings.css';

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState({
    likes: true,
    comments: true,
    commentReplies: true,
    storyLikes: true,
    storyReplies: true,
    storyMentions: true,
    postMentions: true,
    tags: true,
    followers: true,
    friendRequests: true,
    friendRequestAccepted: true,
    messages: true,
    birthdayReminders: true,
    birthdayWishes: true,
    loginStreakReminder: true,
    friendStreakReminder: true,
    adminAnnouncements: true,
    platformUpdates: true,
    pushNotifications: true,
    emailNotifications: false
  });

  const [loading, setLoading] = useState(true);
  const [updatingKeys, setUpdatingKeys] = useState({});
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        const res = await notificationPreferenceService.getPreferences();
        if (res.success && active) {
          setPreferences((prev) => ({
            ...prev,
            ...res.data
          }));
        }
      } catch (err) {
        console.error('Failed to load notification settings:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSettings();
    return () => {
      active = false;
    };
  }, []);

  const handleToggle = async (key) => {
    const nextVal = !preferences[key];
    
    // Set loading indicator for this key
    setUpdatingKeys((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await notificationPreferenceService.updatePreferences({ [key]: nextVal });
      if (res.success) {
        setPreferences((prev) => ({
          ...prev,
          [key]: nextVal
        }));
        
        // Show success toast
        setToastMessage('Notification Preferences Updated Successfully');
        
        // Clear toast after 2.5 seconds
        setTimeout(() => {
          setToastMessage((current) => 
            current === 'Notification Preferences Updated Successfully' ? '' : current
          );
        }, 2500);
      }
    } catch (err) {
      console.error(`Failed to update setting for ${key}:`, err);
    } finally {
      setUpdatingKeys((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <Spinner size="36px" />
      </div>
    );
  }

  return (
    <div className="notification-settings-container">
      {/* Toast Alert popup for instant feedback */}
      {toastMessage && (
        <div className="settings-feedback-toast">
          <span>✓</span> {toastMessage}
        </div>
      )}

      {/* Social Notifications Section */}
      <div className="settings-group-card">
        <h3 className="settings-group-title">💬 Social Notifications</h3>
        <p className="settings-group-desc">Control notifications sent when others interact with your profile, posts, or stories.</p>
        
        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">❤️ Likes</span>
            <span className="settings-preference-desc">Notify me when someone likes my posts.</span>
          </div>
          <NotificationToggle
            id="likes"
            checked={preferences.likes}
            onChange={() => handleToggle('likes')}
            disabled={updatingKeys['likes']}
          />
        </div>

        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">💬 Comments</span>
            <span className="settings-preference-desc">Notify me when someone comments on my posts.</span>
          </div>
          <NotificationToggle
            id="comments"
            checked={preferences.comments}
            onChange={() => handleToggle('comments')}
            disabled={updatingKeys['comments']}
          />
        </div>

        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">↩ Comment Replies</span>
            <span className="settings-preference-desc">Notify me when someone replies to my comments.</span>
          </div>
          <NotificationToggle
            id="commentReplies"
            checked={preferences.commentReplies}
            onChange={() => handleToggle('commentReplies')}
            disabled={updatingKeys['commentReplies']}
          />
        </div>

        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">📖 Story Likes</span>
            <span className="settings-preference-desc">Notify me when someone likes my stories.</span>
          </div>
          <NotificationToggle
            id="storyLikes"
            checked={preferences.storyLikes}
            onChange={() => handleToggle('storyLikes')}
            disabled={updatingKeys['storyLikes']}
          />
        </div>

        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">💬 Story Replies</span>
            <span className="settings-preference-desc">Notify me when someone replies to my stories.</span>
          </div>
          <NotificationToggle
            id="storyReplies"
            checked={preferences.storyReplies}
            onChange={() => handleToggle('storyReplies')}
            disabled={updatingKeys['storyReplies']}
          />
        </div>

        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">📍 Story Mentions</span>
            <span className="settings-preference-desc">Notify me when someone mentions me in their story.</span>
          </div>
          <NotificationToggle
            id="storyMentions"
            checked={preferences.storyMentions}
            onChange={() => handleToggle('storyMentions')}
            disabled={updatingKeys['storyMentions']}
          />
        </div>

        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">🏷 Tags & Mentions</span>
            <span className="settings-preference-desc">Notify me when someone tags or mentions me.</span>
          </div>
          <NotificationToggle
            id="tags"
            checked={preferences.tags}
            onChange={() => handleToggle('tags')}
            disabled={updatingKeys['tags']}
          />
        </div>

        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">👥 Followers</span>
            <span className="settings-preference-desc">Notify me when someone starts following me.</span>
          </div>
          <NotificationToggle
            id="followers"
            checked={preferences.followers}
            onChange={() => handleToggle('followers')}
            disabled={updatingKeys['followers']}
          />
        </div>

        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">🤝 Friend Requests</span>
            <span className="settings-preference-desc">Notify me when someone sends me a follow/friend request.</span>
          </div>
          <NotificationToggle
            id="friendRequests"
            checked={preferences.friendRequests}
            onChange={() => handleToggle('friendRequests')}
            disabled={updatingKeys['friendRequests']}
          />
        </div>

        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">✅ Friend Request Accepted</span>
            <span className="settings-preference-desc">Notify me when someone accepts my follow/friend request.</span>
          </div>
          <NotificationToggle
            id="friendRequestAccepted"
            checked={preferences.friendRequestAccepted}
            onChange={() => handleToggle('friendRequestAccepted')}
            disabled={updatingKeys['friendRequestAccepted']}
          />
        </div>
      </div>

      {/* Messages Section */}
      <div className="settings-group-card">
        <h3 className="settings-group-title">💬 Messages</h3>
        <p className="settings-group-desc">Manage chat notifications and direct message requests.</p>
        
        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">💬 Messages</span>
            <span className="settings-preference-desc">Notify me when I receive a direct message.</span>
          </div>
          <NotificationToggle
            id="messages"
            checked={preferences.messages}
            onChange={() => handleToggle('messages')}
            disabled={updatingKeys['messages']}
          />
        </div>
      </div>

      {/* Reminders Section */}
      <div className="settings-group-card">
        <h3 className="settings-group-title">🎂 Reminder Notifications</h3>
        <p className="settings-group-desc">Stay updated with friends' birthdays and active streak events.</p>
        
        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">🎂 Birthday Reminder</span>
            <span className="settings-preference-desc">Notify me about birthdays of mutual friends.</span>
          </div>
          <NotificationToggle
            id="birthdayReminders"
            checked={preferences.birthdayReminders}
            onChange={() => handleToggle('birthdayReminders')}
            disabled={updatingKeys['birthdayReminders']}
          />
        </div>

        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">🎉 Birthday Wishes</span>
            <span className="settings-preference-desc">Notify me when someone wishes me happy birthday or sends gifts.</span>
          </div>
          <NotificationToggle
            id="birthdayWishes"
            checked={preferences.birthdayWishes}
            onChange={() => handleToggle('birthdayWishes')}
            disabled={updatingKeys['birthdayWishes']}
          />
        </div>

        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">🔥 Login Streak Reminder</span>
            <span className="settings-preference-desc">Notify me when my daily login streak is about to expire.</span>
          </div>
          <NotificationToggle
            id="loginStreakReminder"
            checked={preferences.loginStreakReminder}
            onChange={() => handleToggle('loginStreakReminder')}
            disabled={updatingKeys['loginStreakReminder']}
          />
        </div>

        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">🔥 Friend Streak Reminder</span>
            <span className="settings-preference-desc">Notify me about active interaction streaks with friends.</span>
          </div>
          <NotificationToggle
            id="friendStreakReminder"
            checked={preferences.friendStreakReminder}
            onChange={() => handleToggle('friendStreakReminder')}
            disabled={updatingKeys['friendStreakReminder']}
          />
        </div>
      </div>

      {/* Platform Notifications Section */}
      <div className="settings-group-card">
        <h3 className="settings-group-title">📢 Platform Notifications</h3>
        <p className="settings-group-desc">Receive announcements and system feature updates.</p>
        
        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">📢 Admin Announcements</span>
            <span className="settings-preference-desc">Notify me of announcements broadcasted by site administrators.</span>
          </div>
          <NotificationToggle
            id="adminAnnouncements"
            checked={preferences.adminAnnouncements}
            onChange={() => handleToggle('adminAnnouncements')}
            disabled={updatingKeys['adminAnnouncements']}
          />
        </div>

        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">🚀 Platform Updates</span>
            <span className="settings-preference-desc">Notify me of new updates and platform release details.</span>
          </div>
          <NotificationToggle
            id="platformUpdates"
            checked={preferences.platformUpdates}
            onChange={() => handleToggle('platformUpdates')}
            disabled={updatingKeys['platformUpdates']}
          />
        </div>
      </div>

      {/* Push Notifications Section */}
      <div className="settings-group-card">
        <h3 className="settings-group-title">🔔 Push Notifications</h3>
        <p className="settings-group-desc">Enable or disable browser and device push alerts.</p>
        
        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">Master Switch</span>
            <span className="settings-preference-desc">Flipping this OFF immediately silences push alerts. In-app alerts remain active.</span>
          </div>
          <NotificationToggle
            id="pushNotifications"
            checked={preferences.pushNotifications}
            onChange={() => handleToggle('pushNotifications')}
            disabled={updatingKeys['pushNotifications']}
          />
        </div>
      </div>

      {/* Email Notifications Section */}
      <div className="settings-group-card">
        <h3 className="settings-group-title">📧 Email Notifications</h3>
        <p className="settings-group-desc">Control emails delivered directly to your inbox.</p>
        
        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">Master Switch</span>
            <span className="settings-preference-desc">Enable or disable ConnectHub email notification delivery.</span>
          </div>
          <NotificationToggle
            id="emailNotifications"
            checked={preferences.emailNotifications}
            onChange={() => handleToggle('emailNotifications')}
            disabled={updatingKeys['emailNotifications']}
          />
        </div>
      </div>

      {/* Security Section */}
      <div className="settings-group-card">
        <h3 className="settings-group-title">🛡️ Security Notifications</h3>
        <p className="settings-group-desc">Essential account alerts that help protect your credentials and data privacy.</p>
        
        <div className="settings-preference-row">
          <div className="settings-preference-info">
            <span className="settings-preference-title">🛡️ Account Alerts</span>
            <span className="settings-preference-desc">Suspicious logins, password changes, verification status, and other security logs.</span>
          </div>
          <div className="security-always-enabled">
            <span className="security-badge-icon">✓</span> Always Enabled
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
