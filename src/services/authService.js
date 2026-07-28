import api from './api';

const authService = {
  register(userData) {
    return api.post('/auth/register', userData);
  },
  login(credentials) {
    return api.post('/auth/login', credentials);
  },
  verify(code) {
    return api.post('/auth/verify', { code });
  },
  resendVerification() {
    return api.post('/auth/resend-verification');
  }
};

export default authService;
