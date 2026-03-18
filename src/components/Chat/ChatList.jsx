import { useState, useEffect } from 'react';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config';

const Avatar = ({ user, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const imageUrl = user?.image
    ? (user.image.startsWith('http') ? user.image : `${API_BASE_URL}${user.image}`)
    : null;

  return imageUrl ? (
    <img src={imageUrl} alt={user?.username} className={`${sizeClass} rounded-full object-cover`} />
  ) : (
    <div className={`${sizeClass} rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-600`}>
      {user?.username?.charAt(0).toUpperCase() || '?'}
    </div>
  );
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString();
};

const ChatList = ({ chats, selectedChatId, loading, onSelectChat, onChatsUpdated }) => {
  const { user } = useAuth();
  const [showNewChat, setShowNewChat] = useState(false);
  const [chatableUsers, setChatableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');

  const openNewChat = async () => {
    setShowNewChat(true);
    setLoadingUsers(true);
    try {
      const data = await chatService.getChatableUsers();
      setChatableUsers(data.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const startChat = async (otherUser) => {
    try {
      const data = await chatService.getOrCreateChat(otherUser._id);
      setShowNewChat(false);
      onChatsUpdated();
      // Build a fake chat object so the window opens immediately
      onSelectChat({
        _id: data.data._id,
        otherUser,
        lastMessage: null,
        unreadCount: 0,
      });
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  const filtered = chatableUsers.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        <button
          onClick={openNewChat}
          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
          title="New chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* New chat modal overlay */}
      {showNewChat && (
        <div className="absolute inset-0 bg-white z-10 flex flex-col rounded-xl">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center space-x-3">
            <button onClick={() => setShowNewChat(false)} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="font-semibold text-gray-900">New Message</h3>
          </div>
          <div className="px-4 py-2 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {chatableUsers.length === 0
                  ? 'Share books with users to start chatting'
                  : 'No matching users'}
              </div>
            ) : (
              filtered.map((u) => (
                <button
                  key={u._id}
                  onClick={() => startChat(u)}
                  className="w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <Avatar user={u} />
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium text-gray-900">{u.username}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-10 px-4">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Click + to start chatting</p>
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat._id}
              onClick={() => onSelectChat(chat)}
              className={`w-full flex items-center px-4 py-3 transition-colors border-b border-gray-50 ${
                selectedChatId === chat._id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="relative flex-shrink-0">
                <Avatar user={chat.otherUser} />
                {chat.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                  </span>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0 text-left">
                <div className="flex justify-between items-baseline">
                  <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                    {chat.otherUser?.username}
                  </p>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                    {formatTime(chat.lastMessage?.createdAt || chat.updatedAt)}
                  </span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${chat.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                  {chat.lastMessage
                    ? (chat.lastMessage.senderId?._id === user?._id ||
                       chat.lastMessage.senderId === user?._id
                        ? `You: ${chat.lastMessage.message}`
                        : chat.lastMessage.message)
                    : 'No messages yet'}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;