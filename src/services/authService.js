import api from './api';

export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/register', userData);
    return response.data;
  },

  // Login user
  // login: async (credentials) => {
  //   const response = await api.post('/login', credentials);
  //   if (response.data.token) {
  //     localStorage.setItem('token', response.data.token);
  //     if (response.data.userId) {
  //       localStorage.setItem('userId', response.data.userId);
  //     }
  //     if (response.data.user) {
  //       localStorage.setItem('user', JSON.stringify(response.data.user));
  //     }
  //   }
  //   return response.data;
  // },

  login: async (credentials) => {
  const response = await api.post('/login', credentials);
  if (response.data.accessToken) {
    localStorage.setItem('token', response.data.accessToken);      // keep key as 'token' so api.js still works
    localStorage.setItem('refreshToken', response.data.refreshToken);
    if (response.data.userId) {
      localStorage.setItem('userId', response.data.userId);
    }
  }
  return response.data;
},

  // Logout user
  // logout: () => {
  //   localStorage.removeItem('token');
  //   localStorage.removeItem('userId');
  //   localStorage.removeItem('user');
  // },

  logout: async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await api.post('/logout', { refreshToken });  // tells backend to delete token from DB
    }
  } catch (e) {
    // even if API call fails, still clear local storage
    console.error('Logout API error:', e);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
  }
},

//
refreshToken: async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token');
  const response = await api.post('/refresh-token', { refreshToken });
  localStorage.setItem('token', response.data.accessToken);
  return response.data.accessToken;
},

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/password/forgot', { email });
    return response.data;
  },

  // Verify reset token
  verifyResetToken: async (token) => {
    const response = await api.get(`/password/reset/${token}`);
    return response.data;
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/password/reset', { token, newPassword });
    return response.data;
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};
