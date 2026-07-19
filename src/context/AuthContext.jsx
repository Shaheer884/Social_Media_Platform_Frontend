import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res.success) {
      const { token: userToken, ...userData } = res.data;
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(userToken);
      setCurrentUser(userData);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    if (res.success) {
      const { token: userToken, ...registeredData } = res.data;
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(registeredData));
      setToken(userToken);
      setCurrentUser(registeredData);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
  };

  const updateLocalUser = (updatedData) => {
    setCurrentUser((prev) => {
      const updated = {
        ...prev,
        fullName: updatedData.fullName,
        profilePicture: updatedData.profilePicture,
        coverPhoto: updatedData.coverPhoto
      };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateLocalUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
