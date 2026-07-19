import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import postService from '../../services/postService';
import userService from '../../services/userService';
import PostCard from '../../components/PostCard/PostCard';
import Spinner from '../../components/Loader/Spinner';
import Modal from '../../components/Modal/Modal';
import { getUploadUrl } from '../../utils/mediaHelper';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // Likes modal state
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [likedUsers, setLikedUsers] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  const fetchPostDetails = async () => {
    try {
      const res = await postService.getPost(id);
      if (res.success) {
        setPost(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [id]);

  const openLikesModal = async () => {
    setLikesModalOpen(true);
    setLoadingLikes(true);
    try {
      // Re-fetch post details to get populated likes array
      const res = await postService.getPost(id);
      if (res.success) {
        setLikedUsers(res.data.likes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLikes(false);
    }
  };

  const handleModalFollowClick = async (e, userId, currentStatus) => {
    e.stopPropagation();
    const isFollowing = currentStatus === 'following' || currentStatus === 'friends';
    try {
      if (isFollowing) {
        await userService.unfollowUser(userId);
      } else {
        await userService.followUser(userId);
      }
      // Re-fetch likes list
      openLikesModal();
      // Re-fetch post details to sync counts
      fetchPostDetails();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Spinner />
          <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading post details...</p>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
          <h3>Post not found</h3>
          <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginTop: '16px' }}>
            Go Back Home
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PostCard
        post={post}
        isDetailPage={true}
        onLikesCountClick={openLikesModal}
      />

      {/* Liked By List Dialog Modal */}
      <Modal isOpen={likesModalOpen} onClose={() => setLikesModalOpen(false)} title="Liked By">
        <div className="modal-body" id="likes-modal-body">
          {loadingLikes ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <Spinner />
            </div>
          ) : likedUsers.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No likes yet
            </div>
          ) : (
            likedUsers.map((user) => {
              const showButton = user._id !== currentUser?._id;
              let btnClass = 'follow-btn-sm modal-follow-btn';
              let btnText = 'Follow';

              if (user.relationshipStatus === 'friends') {
                btnClass = 'follow-btn-sm friends modal-follow-btn';
                btnText = 'Friends';
              } else if (user.relationshipStatus === 'following') {
                btnClass = 'follow-btn-sm following modal-follow-btn';
                btnText = 'Following';
              }

              return (
                <div key={user._id} className="suggested-user-item" style={{ marginBottom: '12px' }}>
                  <div className="suggested-user-info" onClick={() => { setLikesModalOpen(false); navigate(`/profile/${user.username}`); }}>
                    <img src={getUploadUrl(user.profilePicture || '/uploads/default-avatar.png')} className="suggested-user-avatar" alt="Avatar" />
                    <div>
                      <div className="suggested-user-name">{user.fullName}</div>
                      <div className="suggested-user-username">@{user.username}</div>
                    </div>
                  </div>
                  {showButton && (
                    <button
                      className={btnClass}
                      onClick={(e) => handleModalFollowClick(e, user._id, user.relationshipStatus)}
                    >
                      <span className="btn-text">{btnText}</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </Layout>
  );
};

export default PostDetail;
