import api from './api';

export const notificationService = {
  // Fetch all notifications for the logged-in user
  // Backend route: GET /getAll
  getNotifications: async () => {
    const response = await api.get('/getAll');
    return response.data; // { data: [...] }
  },

  // Mark a single notification as read
  // Backend route: PATCH /:id/read
  markAsRead: async (id) => {
    const response = await api.patch(`/${id}/read`);
    return response.data;
  },

  // Get unread notifications count
  // Backend route: GET /unread-count
  getUnreadCount: async () => {
    const response = await api.get('/unread-count');
    return response.data; // { count: number }
  },
};