import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import birthdayService from '../../services/birthdayService';
import { getUploadUrl } from '../../utils/mediaHelper';

const BirthdayReminderCard = () => {
  const navigate = useNavigate();
  const [todayBirthdays, setTodayBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const res = await birthdayService.getReminders();
        if (res.success && res.data?.today) {
          setTodayBirthdays(res.data.today);
        }
      } catch (err) {
        console.error('Error fetching today birthdays:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchToday();
  }, []);

  if (loading || todayBirthdays.length === 0) return null;

  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
        color: '#ffffff',
        padding: '20px',
        borderRadius: '16px',
        marginBottom: '20px',
        boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative balloon shapes */}
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '5rem', opacity: 0.15, pointerEvents: 'none' }}>🎈</div>
      <div style={{ position: 'absolute', bottom: '-25px', left: '-25px', fontSize: '6rem', opacity: 0.12, pointerEvents: 'none' }}>🎂</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '2.5rem' }}>🎉</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.5px' }}>
            Birthdays Today!
          </h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.9, lineHeight: '1.4' }}>
            {todayBirthdays.map((u, index) => {
              const name = u.fullName;
              if (index === 0) return `${name} (turns ${u.age})`;
              if (index === todayBirthdays.length - 1) return ` and ${name} (turns ${u.age})`;
              return `, ${name} (turns ${u.age})`;
            })}
            {todayBirthdays.length === 1 ? ' is ' : ' are '} celebrating their birthday today. Write a wish on their wall!
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {todayBirthdays.slice(0, 4).map((u, i) => (
            <img
              key={u._id}
              src={getUploadUrl(u.profilePicture || '/uploads/default-avatar.png')}
              alt={u.fullName}
              title={u.fullName}
              onClick={() => navigate(`/profile/${u.username}`)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '2px solid #ffffff',
                objectFit: 'cover',
                marginLeft: i > 0 ? '-10px' : '0',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-3px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            />
          ))}
          {todayBirthdays.length > 4 && (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                border: '2px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                marginLeft: '-10px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              +{todayBirthdays.length - 4}
            </div>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          {todayBirthdays.map((u) => (
            <button
              key={u._id}
              onClick={() => navigate(`/profile/${u.username}?wish=true`)}
              className="btn"
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--purple)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                padding: '6px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              Wish {u.fullName.split(' ')[0]} 🎂
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BirthdayReminderCard;
