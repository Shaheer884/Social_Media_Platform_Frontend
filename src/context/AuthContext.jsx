import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const isPWA = () => {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://');
  };

  const [currentUser, setCurrentUser] = useState(() => {
    let savedUser = sessionStorage.getItem('user');
    if (!savedUser && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone)) {
      savedUser = localStorage.getItem('user');
      if (savedUser) {
        sessionStorage.setItem('user', savedUser);
      }
    }
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    let savedToken = sessionStorage.getItem('token');
    if (!savedToken && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone)) {
      savedToken = localStorage.getItem('token');
      if (savedToken) {
        sessionStorage.setItem('token', savedToken);
      }
    }
    return savedToken;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runningInPWA = isPWA();
    let savedToken = sessionStorage.getItem('token');
    let savedUser = sessionStorage.getItem('user');

    if (runningInPWA) {
      const savedAdminToken = localStorage.getItem('adminToken');
      const savedAdminUser = localStorage.getItem('adminUser');
      if (savedAdminToken && savedAdminUser) {
        if (!sessionStorage.getItem('adminToken')) {
          sessionStorage.setItem('adminToken', savedAdminToken);
        }
        if (!sessionStorage.getItem('adminUser')) {
          sessionStorage.setItem('adminUser', savedAdminUser);
        }
      }
    }

    if (savedToken && savedUser) {
      const userObj = JSON.parse(savedUser);
      setToken(savedToken);
      setCurrentUser(userObj);
      if (userObj && userObj.role === 'admin') {
        if (!sessionStorage.getItem('adminToken')) {
          sessionStorage.setItem('adminToken', savedToken);
        }
        if (!sessionStorage.getItem('adminUser')) {
          sessionStorage.setItem('adminUser', savedUser);
        }
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res.success) {
      const { token: userToken, ...userData } = res.data;
      sessionStorage.setItem('token', userToken);
      sessionStorage.setItem('user', JSON.stringify(userData));

      if (isPWA()) {
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
      }

      setToken(userToken);
      setCurrentUser(userData);
      if (userData.role === 'admin') {
        sessionStorage.setItem('adminToken', userToken);
        sessionStorage.setItem('adminUser', JSON.stringify(userData));
        if (isPWA()) {
          localStorage.setItem('adminToken', userToken);
          localStorage.setItem('adminUser', JSON.stringify(userData));
        }
      }
    }
    return res;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    if (res.success) {
      const { token: userToken, ...registeredData } = res.data;
      sessionStorage.setItem('token', userToken);
      sessionStorage.setItem('user', JSON.stringify(registeredData));

      if (isPWA()) {
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(registeredData));
      }

      setToken(userToken);
      setCurrentUser(registeredData);
    }
    return res;
  };

  const verify = async (code) => {
    const res = await authService.verify(code);
    if (res.success) {
      const userData = res.data;
      sessionStorage.setItem('user', JSON.stringify(userData));

      if (isPWA()) {
        localStorage.setItem('user', JSON.stringify(userData));
      }

      setCurrentUser(userData);
      if (userData.role === 'admin') {
        const currentToken = token || sessionStorage.getItem('token') || (isPWA() ? localStorage.getItem('token') : null);
        if (currentToken) {
          sessionStorage.setItem('adminToken', currentToken);
          sessionStorage.setItem('adminUser', JSON.stringify(userData));
          if (isPWA()) {
            localStorage.setItem('adminToken', currentToken);
            localStorage.setItem('adminUser', JSON.stringify(userData));
          }
        }
      }
    }
    return res;
  };

  const resendVerification = async () => {
    return await authService.resendVerification();
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');

    setToken(null);
    setCurrentUser(null);
  };

  const updateLocalUser = (updatedData) => {
    setCurrentUser((prev) => {
      const updated = {
        ...prev,
        username: updatedData.username,
        fullName: updatedData.fullName,
        profilePicture: updatedData.profilePicture,
        coverPhoto: updatedData.coverPhoto
      };
      sessionStorage.setItem('user', JSON.stringify(updated));
      if (isPWA()) {
        localStorage.setItem('user', JSON.stringify(updated));
      }
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
        verify,
        resendVerification,
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
