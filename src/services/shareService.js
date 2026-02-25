import api from './api';

export const shareService = {
  // Share a book with another user
  shareBook: async (bookId, userId) => {
    const response = await api.post('/share', { bookId, userId });
    return response.data;
  },

  // Get books shared by user
  getSharedBooks: async (userId) => {
    const response = await api.get(`/users/${userId}/shared-books`);
    return response.data;
  },

  // Get books received by user
  getReceivedBooks: async (userId) => {
    const response = await api.get(`/users/${userId}/received-books`);
    return response.data;
  },

  // Delete a share
  deleteShare: async (shareId) => {
    const response = await api.delete(`/share/${shareId}`);
    return response.data;
  },

  getSharedUsers: async (bookId) => {
  const response = await api.get(`/books/${bookId}/shared-users`);
  return response.data;
},
};
