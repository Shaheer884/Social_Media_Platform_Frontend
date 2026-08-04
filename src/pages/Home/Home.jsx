import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { usePosts } from '../../context/PostsContext';
import { useDialog } from '../../context/CustomDialogContext';
import PostCard from '../../components/PostCard/PostCard';
import PostSkeleton from '../../components/Loader/PostSkeleton';
import { getUploadUrl } from '../../utils/mediaHelper';
import Spinner from '../../components/Loader/Spinner';
import userService from '../../services/userService';
import Stories from '../../components/Stories/Stories';
import BirthdayReminderCard from '../../components/Birthday/BirthdayReminderCard';
import BirthdayConfetti from '../../components/Birthday/BirthdayConfetti';
import BirthdayModal from '../../components/Birthday/BirthdayModal';
import CreatePostModal from '../../components/Modal/CreatePostModal';

const Home = () => {
  const { currentUser } = useAuth();
  const { posts, loading, page, totalPages, fetchFeed } = usePosts();
  const { showAlert } = useDialog();
  const navigate = useNavigate();

  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [initialModalScreen, setInitialModalScreen] = useState('main');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Birthday modal and confetti state
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
  const [showBirthdayConfetti, setShowBirthdayConfetti] = useState(false);

  // Initial feed fetching
  useEffect(() => {
    fetchFeed(1, false);
  }, [fetchFeed]);

  // Trigger birthday celebration once a day
  useEffect(() => {
    if (currentUser && currentUser.birthday) {
      const today = new Date();
      const birthDate = new Date(currentUser.birthday);
      
      if (birthDate.getMonth() === today.getMonth() && birthDate.getDate() === today.getDate()) {
        const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        const storageKey = `seenBirthdayConfetti_${currentUser._id}_${dateString}`;
        const hasSeen = localStorage.getItem(storageKey);
        
        if (!hasSeen) {
          setShowBirthdayConfetti(true);
          setBirthdayModalOpen(true);
          localStorage.setItem(storageKey, 'true');
        }
      }
    }
  }, [currentUser]);

  // Fetch suggestions when the feed is empty
  useEffect(() => {
    if (posts.length === 0 && !loading) {
      const loadSuggestions = async () => {
        setSuggestionsLoading(true);
        try {
          const res = await userService.getSuggestions();
          if (res.success) {
            setSuggestions(res.data);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setSuggestionsLoading(false);
        }
      };
      loadSuggestions();
    }
  }, [posts.length, loading]);

  const handleFollowClick = async (e, userId) => {
    e.stopPropagation();
    try {
      setSuggestions((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, relationshipStatus: 'following' } : u))
      );
      await userService.followUser(userId);
      await fetchFeed(1, false);
      
      setTimeout(async () => {
        try {
          const res = await userService.getSuggestions();
          if (res.success) {
            setSuggestions(res.data);
          }
        } catch (err) {
          console.error(err);
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      try {
        const res = await userService.getSuggestions();
        if (res.success) {
          setSuggestions(res.data);
        }
      } catch (e2) {
        console.error(e2);
      }
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchFeed(page + 1, true);
    }
  };

  return (
    <Layout>
      <Stories />
      <BirthdayReminderCard />
      {/* Quick Post Card Design */}
      <div className="quick-post-card">
        <img
          src={getUploadUrl(currentUser?.profilePicture || '/uploads/default-avatar.png')}
          className="quick-post-avatar"
          alt="My Avatar"
        />
        <button
          className="quick-post-trigger-btn"
          onClick={() => {
            setInitialModalScreen('main');
            setCreatePostModalOpen(true);
          }}
        >
          What's on your mind, {currentUser?.fullName?.split(' ')[0] || 'User'}?
        </button>
        <div className="quick-post-actions-list">
          {/* Video Icon */}
          <button
            className="quick-post-action-item"
            onClick={() => {
              setInitialModalScreen('main');
              setCreatePostModalOpen(true);
            }}
            title="Photo/Video"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#f02849">
              <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l5 3v-9l-5 3z"/>
            </svg>
          </button>
          
          {/* Photo/Video Icon */}
          <button
            className="quick-post-action-item"
            onClick={() => {
              setInitialModalScreen('main');
              setCreatePostModalOpen(true);
            }}
            title="Photo/Video"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#45bd62">
              <path d="M22 16V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14a2 2 0 0 0 2 2h14v-2H4V6H2z"/>
            </svg>
          </button>

          {/* Feeling/Activity Icon */}
          <button
            className="quick-post-action-item"
            onClick={() => {
              setInitialModalScreen('feeling');
              setCreatePostModalOpen(true);
            }}
            title="Feeling/Activity"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f7b928" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
              <circle cx="9" cy="9.5" r="1.5" fill="#f7b928" />
              <circle cx="15" cy="9.5" r="1.5" fill="#f7b928" />
            </svg>
          </button>
        </div>
      </div>

      <div className="feed-header">
        <h2 className="feed-title">Home Feed</h2>
      </div>

      <div id="posts-feed-container">
        {loading && posts.length === 0 ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          <div className="card empty-state-container">
            <div className="empty-state-icon">👋</div>
            <h3 className="empty-state-title">Welcome to ConnectHub!</h3>
            <p className="empty-state-desc" style={{ marginBottom: '16px' }}>
              Your feed is looking empty. Follow recommended creators below or write your first post to get started!
            </p>
            
            <div className="empty-state-suggestions">
              <h4 className="empty-state-suggestions-title">People you may know</h4>
              {suggestionsLoading ? (
                <div className="empty-state-suggestions-loading">
                  <Spinner size="20px" />
                </div>
              ) : suggestions.length === 0 ? (
                <p className="empty-state-suggestions-empty">No suggestions available at the moment.</p>
              ) : (
                <div className="empty-state-suggestions-list">
                  {suggestions.slice(0, 5).map((u) => (
                    <div key={u._id} className="suggested-user-item">
                      <div className="suggested-user-info" onClick={() => navigate(`/profile/${u.username}`)}>
                        <img
                          src={getUploadUrl(u.profilePicture || '/uploads/default-avatar.png')}
                          className="suggested-user-avatar"
                          alt={u.fullName}
                        />
                        <div style={{ lineHeight: '1.2', textAlign: 'left' }}>
                          <div className="suggested-user-name">{u.fullName}</div>
                          <div className="suggested-user-username">@{u.username}</div>
                        </div>
                      </div>
                      {u.relationshipStatus === 'following' || u.relationshipStatus === 'friends' ? (
                        <button className="follow-btn-sm following" disabled>
                          Following
                        </button>
                      ) : (
                        <button className="follow-btn-sm" onClick={(e) => handleFollowClick(e, u._id)}>
                          Follow
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post._id} post={post} />)
        )}
      </div>

      {page < totalPages && (
        <div style={{ textAlign: 'center', margin: '24px 0' }} id="load-more-container">
          <button className="btn btn-secondary" onClick={handleLoadMore} disabled={loading}>
            {loading ? <Spinner size="16px" /> : 'Load More'}
          </button>
        </div>
      )}

      <CreatePostModal
        isOpen={createPostModalOpen}
        onClose={() => setCreatePostModalOpen(false)}
        initialScreen={initialModalScreen}
      />

      {showBirthdayConfetti && <BirthdayConfetti />}
      {birthdayModalOpen && (
        <BirthdayModal
          isOpen={birthdayModalOpen}
          onClose={() => setBirthdayModalOpen(false)}
          userName={currentUser?.fullName}
        />
      )}
    </Layout>
  );
};

export default Home;
