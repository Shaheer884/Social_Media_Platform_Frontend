import React, { createContext, useState, useContext, useCallback } from 'react';
import postService from '../services/postService';

const PostsContext = createContext();

export const PostsProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCachedData, setIsCachedData] = useState(false);

  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const res = await postService.getFeed(pageNum, 5);
      if (res.success) {
        setPosts((prev) => {
          const newPosts = append ? [...prev, ...res.data] : res.data;
          // Cache the first page of feed (non-sensitive information)
          if (pageNum === 1) {
            localStorage.setItem('connecthub_cached_feed', JSON.stringify(newPosts.slice(0, 15)));
          }
          return newPosts;
        });
        setPage(res.pagination.page);
        setTotalPages(res.pagination.totalPages);
        setIsCachedData(false);
      }
    } catch (err) {
      console.error(err);
      // Offline fallback: load cached feed if requesting page 1
      if (pageNum === 1) {
        const cached = localStorage.getItem('connecthub_cached_feed');
        if (cached) {
          try {
            const cachedPosts = JSON.parse(cached);
            setPosts(cachedPosts);
            setPage(1);
            setTotalPages(1);
            setIsCachedData(true);
            console.log('Loaded offline cached feed');
            return;
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
      
      // If offline and request failed, dispatch the offline error to trigger fallback page
      if (!navigator.onLine && err.message !== 'OFFLINE_QUEUED') {
        window.dispatchEvent(new Event('api-offline-error'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const publishPost = async (postData) => {
    // If offline, creating a post can queue, but since postData might contain images/videos
    // that are too large or require multipart upload, we run it normally.
    // If offline, the api interceptor will throw OFFLINE_QUEUED for simple requests.
    const res = await postService.createPost(postData);
    if (res.success) {
      setPosts((prev) => [res.data, ...prev]);
    }
    return res;
  };

  const removePost = async (postId) => {
    const res = await postService.deletePost(postId);
    if (res.success) {
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    }
    return res;
  };

  const toggleLike = async (postId, isLiked) => {
    // Optimistic UI Update
    const originalPosts = [...posts];
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? { ...p, isLiked: !isLiked, likesCount: isLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1 }
          : p
      )
    );

    try {
      if (isLiked) {
        await postService.unlikePost(postId);
      } else {
        await postService.likePost(postId);
      }
    } catch (err) {
      if (err.message === 'OFFLINE_QUEUED') {
        console.log('Like operation queued offline.');
        return; // Retain optimistic state
      }
      console.error(err);
      // Rollback if request failed for other reasons
      setPosts(originalPosts);
    }
  };

  const toggleSave = async (postId, isSaved) => {
    // Optimistic UI Update
    const originalPosts = [...posts];
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId ? { ...p, isSaved: !isSaved } : p
      )
    );

    try {
      if (isSaved) {
        await postService.unsavePost(postId);
      } else {
        await postService.savePost(postId);
      }
    } catch (err) {
      if (err.message === 'OFFLINE_QUEUED') {
        console.log('Save operation queued offline.');
        return; // Retain optimistic state
      }
      console.error(err);
      // Rollback
      setPosts(originalPosts);
    }
  };

  const updatePostCommentCount = (postId, diff) => {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId ? { ...p, commentCount: Math.max(0, p.commentCount + diff) } : p
      )
    );
  };

  const updatePostInFeed = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? { ...p, ...updatedPost } : p))
    );
  };

  return (
    <PostsContext.Provider
      value={{
        posts,
        setPosts,
        loading,
        page,
        totalPages,
        isCachedData,
        fetchFeed,
        publishPost,
        removePost,
        toggleLike,
        toggleSave,
        updatePostCommentCount,
        updatePostInFeed
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => useContext(PostsContext);
export default PostsContext;
