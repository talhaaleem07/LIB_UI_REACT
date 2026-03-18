import { API_BASE_URL } from '../config';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const chatService = {
  /** Get all chats for current user */
  getChats: () =>
    fetch(`${API_BASE_URL}/api/chats`, { headers: getAuthHeaders() }).then(handleResponse),

  /** Get or create a chat with another user */
  getOrCreateChat: (otherUserId) =>
    fetch(`${API_BASE_URL}/api/chats`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ otherUserId }),
    }).then(handleResponse),

  /** Total unread message count */
  getTotalUnreadCount: () =>
    fetch(`${API_BASE_URL}/api/chats/unread-count`, { headers: getAuthHeaders() }).then(handleResponse),

  /** Users the current user can chat with */
  getChatableUsers: () =>
    fetch(`${API_BASE_URL}/api/chats/chatable-users`, { headers: getAuthHeaders() }).then(handleResponse),

  /** Load messages for a chat */
  getMessages: (chatId) =>
    fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, { headers: getAuthHeaders() }).then(handleResponse),

  /** Send a message */
  sendMessage: (chatId, message, receiverId) =>
    fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, receiverId }),
    }).then(handleResponse),

  /** Mark all messages in a chat as read */
  markAsRead: (chatId) =>
    fetch(`${API_BASE_URL}/api/chats/${chatId}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    }).then(handleResponse),
};