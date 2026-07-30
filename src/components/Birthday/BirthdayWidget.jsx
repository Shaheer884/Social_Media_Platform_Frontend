import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import birthdayService from '../../services/birthdayService';
import { getUploadUrl } from '../../utils/mediaHelper';

const BirthdayWidget = () => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState({ today: [], tomorrow: [], upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [wishInputUserId, setWishInputUserId] = useState(null);
  const [wishMessage, setWishMessage] = useState('');
  const [sendingWish, setSendingWish] = useState(false);
  const [successUserId, setSuccessUserId] = useState(null);

  const fetchReminders = async () => {
    try {
      const res = await birthdayService.getReminders();
      if (res.success) {
        setReminders(res.data);
      }
    } catch (err) {
      console.error('Error fetching birthday reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleSendWish = async (userId) => {
    if (!wishMessage.trim()) return;
    setSendingWish(true);
    try {
      const res = await birthdayService.postWish(userId, wishMessage.trim());
      if (res.success) {
        setSuccessUserId(userId);
        setWishInputUserId(null);
        setWishMessage('');
        setTimeout(() => setSuccessUserId(null), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to send wish');
    } finally {
      setSendingWish(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '1.2rem' }}>🎂</span>
          <h3 className="section-card-title" style={{ margin: 0 }}>Birthday Reminders</h3>
        </div>
        <div style={{ textAlign: 'center', padding: '12px' }}>
          <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
        </div>
      </div>
    );
  }

  const hasToday = reminders.today.length > 0;
  const hasTomorrow = reminders.tomorrow.length > 0;
  const hasUpcoming = reminders.upcoming.length > 0;

  if (!hasToday && !hasTomorrow && !hasUpcoming) {
    return null; // Don't show the widget if there are no birthdays
  }

  return (
    <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <span style={{ fontSize: '1.2rem' }}>🎂</span>
        <h3 className="section-card-title" style={{ margin: 0 }}>Birthday Reminders</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Today's Birthdays */}
        {hasToday && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '8px' }}>
              <span>🎉</span> Today
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reminders.today.map((user) => (
                <div key={user._id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={getUploadUrl(user.profilePicture || '/uploads/default-avatar.png')}
                      alt={user.fullName}
                      onClick={() => navigate(`/profile/${user.username}`)}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '2px solid var(--purple)' }}
                    />
                    <div style={{ flex: 1, lineHeight: '1.3' }}>
                      <div
                        onClick={() => navigate(`/profile/${user.username}`)}
                        style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-main)' }}
                        className="hover-underline"
                      >
                        {user.fullName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Turns {user.age} Today
                      </div>
                    </div>
                    {successUserId === user._id ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>Sent! ✓</span>
                    ) : (
                      wishInputUserId !== user._id && (
                        <button
                          onClick={() => setWishInputUserId(user._id)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            background: 'var(--purple)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Wish
                        </button>
                      )
                    )}
                  </div>
                  {wishInputUserId === user._id && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="text"
                        placeholder={`Wish ${user.fullName.split(' ')[0]}...`}
                        value={wishMessage}
                        onChange={(e) => setWishMessage(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          fontSize: '0.8rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--input-bg)',
                          color: 'var(--text-main)',
                          boxSizing: 'border-box'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => { setWishInputUserId(null); setWishMessage(''); }}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSendWish(user._id)}
                          disabled={sendingWish || !wishMessage.trim()}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            background: 'var(--purple)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          {sendingWish ? '...' : 'Send'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tomorrow's Birthdays */}
        {hasTomorrow && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', marginBottom: '8px' }}>
              <span>📅</span> Tomorrow
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {reminders.tomorrow.map((user) => (
                <div key={user._id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={getUploadUrl(user.profilePicture || '/uploads/default-avatar.png')}
                    alt={user.fullName}
                    onClick={() => navigate(`/profile/${user.username}`)}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, lineHeight: '1.3' }}>
                    <div
                      onClick={() => navigate(`/profile/${user.username}`)}
                      style={{ fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-main)' }}
                      className="hover-underline"
                    >
                      {user.fullName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Turns {user.age}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next 7 Days */}
        {hasUpcoming && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              <span>📅</span> Next 7 Days
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {reminders.upcoming.map((user) => (
                <div key={user._id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={getUploadUrl(user.profilePicture || '/uploads/default-avatar.png')}
                    alt={user.fullName}
                    onClick={() => navigate(`/profile/${user.username}`)}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, lineHeight: '1.3' }}>
                    <div
                      onClick={() => navigate(`/profile/${user.username}`)}
                      style={{ fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-main)' }}
                      className="hover-underline"
                    >
                      {user.fullName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Turns {user.age} • {user.daysRemaining} days remaining
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BirthdayWidget;
