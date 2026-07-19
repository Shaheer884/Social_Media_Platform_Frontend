import React, { createContext, useState, useContext, useCallback } from 'react';
import postService from '../services/postService';

const PostsContext = createContext();

export const PostsProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const res = await postService.getFeed(pageNum, 5);
      if (res.success) {
        setPosts((prev) => (append ? [...prev, ...res.data] : res.data));
        setPage(res.pagination.page);
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const publishPost = async (postData) => {
    const res = await postService.createPost(postData);
    if (res.success) {
      // Prepend newly created post
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
    try {
      if (isLiked) {
        await postService.unlikePost(postId);
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? { ...p, isLiked: false, likesCount: Math.max(0, p.likesCount - 1) }
              : p
          )
        );
      } else {
        await postService.likePost(postId);
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, isLiked: true, likesCount: p.likesCount + 1 } : p
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updatePostCommentCount = (postId, diff) => {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId ? { ...p, commentCount: Math.max(0, p.commentCount + diff) } : p
      )
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
        fetchFeed,
        publishPost,
        removePost,
        toggleLike,
        updatePostCommentCount
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => useContext(PostsContext);
export default PostsContext;
