import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import PostCard from '../../components/PostCard/PostCard';
import PostSkeleton from '../../components/Loader/PostSkeleton';
import postService from '../../services/postService';
import { usePosts } from '../../context/PostsContext';

const Saved = () => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { posts } = usePosts();

  const fetchSavedPosts = async () => {
    try {
      const res = await postService.getSavedPosts();
      if (res.success) {
        setSavedPosts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch saved posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  // Sync state if posts are liked/unsaved in other places
  useEffect(() => {
    setSavedPosts((prev) =>
      prev
        .map((savedPost) => {
          const contextPost = posts.find((p) => p._id === savedPost._id);
          return contextPost ? { ...savedPost, ...contextPost } : savedPost;
        })
        .filter((savedPost) => savedPost.isSaved !== false)
    );
  }, [posts]);

  return (
    <Layout>
      <div className="feed-header">
        <h2 className="feed-title">Saved Posts</h2>
      </div>

      <div className="feed-container">
        {loading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : savedPosts.length === 0 ? (
          <div className="card empty-state-container" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="empty-state-icon" style={{ fontSize: '3rem', marginBottom: '16px' }}>🔖</div>
            <h3 className="empty-state-title" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>No Saved Posts Yet</h3>
            <p className="empty-state-desc" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>
              Bookmark posts by clicking the save icon at the bottom of any post to read them later.
            </p>
          </div>
        ) : (
          savedPosts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </div>
    </Layout>
  );
};

export default Saved;
