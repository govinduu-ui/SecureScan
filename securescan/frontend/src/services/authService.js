import api from './api';

const authService = {
  login(email, password) {
    return api.post('/api/auth/login', { email, password });
  },

  register(name, email, password) {
    return api.post('/api/auth/register', { name, email, password });
  },

  getMe() {
    return api.get('/api/auth/me');
  },
};

export default authService;
