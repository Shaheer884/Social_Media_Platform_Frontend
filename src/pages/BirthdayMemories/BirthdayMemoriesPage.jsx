import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Spinner from '../../components/Loader/Spinner';
import { useAuth } from '../../context/AuthContext';
import birthdayService from '../../services/birthdayService';
import { getUploadUrl } from '../../utils/mediaHelper';

const BirthdayMemoriesPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState({});

  useEffect(() => {
    if (currentUser?._id) {
      fetchMemories();
    }
  }, [currentUser]);

  const fetchMemories = async () => {
    try {
      const res = await birthdayService.getMemories(currentUser._id);
      if (res.success) {
        setMemories(res.data);
        // Expand the most recent year by default if entries exist
        if (res.data.length > 0) {
          setExpandedYears({ [res.data[0].year]: true });
        }
      }
    } catch (err) {
      console.error('Failed to fetch birthday memories:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleYear = (year) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  const formatWishDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <Layout>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navigate(`/profile/${currentUser?.username}`)}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.9rem' }}
        >
          ← Back to Profile
        </button>
        <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🎂 Birthday Memories
        </h2>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner />
        </div>
      ) : memories.length === 0 ? (
        <div className="card" style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📸</div>
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)' }}>No Memories Yet</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>
            Your birthday memories will automatically compile here year-by-year as your friends post wishes and gifts on your birthday!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {memories.map((group) => {
            const isExpanded = expandedYears[group.year];
            return (
              <div
                key={group.year}
                className="card"
                style={{
                  padding: '0',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'all 0.3s'
                }}
              >
                {/* Year Header Accordion Trigger */}
                <div
                  onClick={() => toggleYear(group.year)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isExpanded ? 'rgba(124, 58, 237, 0.04)' : 'transparent',
                    borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {group.year}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{
                        background: 'rgba(124, 58, 237, 0.1)',
                        color: 'var(--purple)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '9999px'
                      }}>
                        {group.wishesCount} {group.wishesCount === 1 ? 'Wish' : 'Wishes'}
                      </span>
                      <span style={{
                        background: 'rgba(236, 72, 153, 0.1)',
                        color: 'var(--pink)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '9999px'
                      }}>
                        {group.giftsCount} {group.giftsCount === 1 ? 'Gift' : 'Gifts'}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '1.2rem',
                    color: 'var(--text-muted)',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}>
                    ▼
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Virtual Gifts in expanded year */}
                    {group.gifts.length > 0 && (
                      <div>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🎁 Virtual Gifts Received
                        </h4>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {group.gifts.map((g) => (
                            <div
                              key={g._id}
                              style={{
                                background: 'var(--input-bg)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '10px',
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                              title={g.message ? `"${g.message}"` : null}
                            >
                              <span style={{ fontSize: '1.3rem' }}>
                                {g.giftType === 'Cake' ? '🎂' :
                                 g.giftType === 'Gift Box' ? '🎁' :
                                 g.giftType === 'Flowers' ? '🌹' :
                                 g.giftType === 'Balloons' ? '🎈' :
                                 g.giftType === 'Chocolate' ? '🍫' : '☕'}
                              </span>
                              <div style={{ lineHeight: 1.2 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>{g.giftType}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>From {g.sender?.fullName.split(' ')[0]}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Wishes list in expanded year */}
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🎂 Birthday Wishes Wall
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {group.wishes.map((wish) => (
                          <div
                            key={wish._id}
                            style={{
                              border: '1px solid var(--border-color)',
                              background: 'var(--card-bg)',
                              borderRadius: '12px',
                              padding: '14px',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <img
                                src={getUploadUrl(wish.sender?.profilePicture || '/uploads/default-avatar.png')}
                                alt=""
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div>
                                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                      {wish.sender?.fullName}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                                      @{wish.sender?.username}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {formatWishDate(wish.createdAt)}
                                  </span>
                                </div>
                                <p style={{ margin: '6px 0', fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                  {wish.message}
                                </p>

                                {/* Meta display: likes and replies */}
                                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    ❤️ {wish.likes.length} {wish.likes.length === 1 ? 'Like' : 'Likes'}
                                  </span>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    💬 {wish.replies.length} {wish.replies.length === 1 ? 'Reply' : 'Replies'}
                                  </span>
                                </div>

                                {/* Historical replies rendering */}
                                {wish.replies.length > 0 && (
                                  <div style={{ marginTop: '10px', borderLeft: '2px solid var(--border-color)', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {wish.replies.map((rep) => (
                                      <div key={rep._id} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                        <img
                                          src={getUploadUrl(rep.sender?.profilePicture || '/uploads/default-avatar.png')}
                                          alt=""
                                          style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                        <div style={{ flex: 1, background: 'var(--input-bg)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{rep.sender?.fullName}</span>
                                          <p style={{ margin: '1px 0 0 0', color: 'var(--text-main)' }}>{rep.message}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default BirthdayMemoriesPage;
