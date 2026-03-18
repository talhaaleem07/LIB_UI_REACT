import { useState, useEffect, useCallback } from 'react';
import Navbar from '../Common/Navbar';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { chatService } from '../../services/chatService';
import { useChat } from '../../contexts/ChatContext';

const ChatPage = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const { refreshUnreadCount, setActiveChatId } = useChat();

  const loadChats = useCallback(async () => {
    try {
      const data = await chatService.getChats();
      setChats(data.data || []);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Clear active chat when leaving the page
  useEffect(() => {
    return () => setActiveChatId(null);
  }, [setActiveChatId]);

  const handleSelectChat = useCallback(async (chat) => {
    setSelectedChat(chat);
    // Tell ChatContext this chat is now open — suppresses badge increment for it
    setActiveChatId(chat._id.toString());
    // Mark as read and refresh badge
    try {
      await chatService.markAsRead(chat._id);
      setChats((prev) =>
        prev.map((c) => (c._id === chat._id ? { ...c, unreadCount: 0 } : c))
      );
      refreshUnreadCount();
    } catch { /* silent */ }
  }, [refreshUnreadCount, setActiveChatId]);

  // Called by ChatWindow when a new message arrives for the selected (open) chat
  const handleNewMessage = useCallback((message) => {
    setChats((prev) => {
      const updated = prev.map((c) => {
        if (c._id === message.chatId) {
          return { ...c, lastMessage: message, unreadCount: 0 };
        }
        return c;
      });
      const idx = updated.findIndex((c) => c._id === message.chatId);
      if (idx > 0) {
        const [item] = updated.splice(idx, 1);
        updated.unshift(item);
      }
      return [...updated];
    });
  }, []);

  // Called by ChatWindow when a message arrives for a DIFFERENT (not open) chat
  const handleIncomingMessage = useCallback((message) => {
    setChats((prev) => {
      const updated = prev.map((c) => {
        if (c._id === message.chatId) {
          return {
            ...c,
            lastMessage: message,
            unreadCount: (c.unreadCount || 0) + 1,
          };
        }
        return c;
      });
      const idx = updated.findIndex((c) => c._id === message.chatId);
      if (idx > 0) {
        const [item] = updated.splice(idx, 1);
        updated.unshift(item);
      }
      return [...updated];
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 h-screen flex flex-col">
        <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full px-4 py-4 gap-4">
          {/* Left panel – chat list */}
          <div className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <ChatList
              chats={chats}
              selectedChatId={selectedChat?._id}
              loading={loading}
              onSelectChat={handleSelectChat}
              onChatsUpdated={loadChats}
            />
          </div>

          {/* Right panel – chat window */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            {selectedChat ? (
              <ChatWindow
                chat={selectedChat}
                onNewMessage={handleNewMessage}
                onIncomingMessage={handleIncomingMessage}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col text-gray-400">
                <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium text-gray-500">Select a conversation</p>
                <p className="text-sm text-gray-400 mt-1">Choose from your existing chats or start a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;