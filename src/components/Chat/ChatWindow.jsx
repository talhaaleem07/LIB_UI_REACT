import { useState, useEffect, useRef, useCallback } from 'react';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { API_BASE_URL } from '../../config';
import MessageInput from './MessageInput';

const Avatar = ({ user, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const imageUrl = user?.image
    ? (user.image.startsWith('http') ? user.image : `${API_BASE_URL}${user.image}`)
    : null;
  return imageUrl ? (
    <img src={imageUrl} alt={user?.username} className={`${sizeClass} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`${sizeClass} rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-600 flex-shrink-0`}>
      {user?.username?.charAt(0).toUpperCase() || '?'}
    </div>
  );
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const ChatWindow = ({ chat, onNewMessage, onIncomingMessage }) => {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const chatIdRef = useRef(chat._id);

  // Keep ref in sync so the WS callback always has the current chatId
  useEffect(() => {
    chatIdRef.current = chat._id;
  }, [chat._id]);

  // Load message history
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    chatService.getMessages(chat._id)
      .then((data) => setMessages(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [chat._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to incoming WebSocket messages
  useEffect(() => {
    const unsub = subscribe('receive_message', (data) => {
      const msg = data.message;
      if (msg.chatId === chatIdRef.current) {
        // Message belongs to the open chat — append and mark read
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        chatService.markAsRead(chatIdRef.current).catch(() => {});
        onNewMessage(msg);
      } else {
        // Message for a different chat — bubble up to increment unread
        onIncomingMessage(msg);
      }
    });

    // Also handle messages_read events — update tick indicators
    const unsubRead = subscribe('messages_read', (data) => {
      if (data.chatId === chatIdRef.current) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    });

    return () => { unsub(); unsubRead(); };
  }, [subscribe, onNewMessage, onIncomingMessage]);

  const handleSend = useCallback(async (text) => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const data = await chatService.sendMessage(chat._id, text.trim(), chat.otherUser._id);
      const msg = data.data;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      onNewMessage(msg);
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  }, [chat._id, chat.otherUser._id, sending, onNewMessage]);

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const date = formatDate(msg.createdAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  const isMe = (msg) => {
    const sid = msg.senderId?._id || msg.senderId;
    return sid?.toString() === user?._id?.toString();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center space-x-3 bg-white">
        <Avatar user={chat.otherUser} size="md" />
        <div>
          <p className="font-semibold text-gray-900 text-sm">{chat.otherUser?.username}</p>
          <p className="text-xs text-gray-400">{chat.otherUser?.email}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-12 h-12 mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center justify-center my-4">
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{date}</span>
              </div>

              {msgs.map((msg, idx) => {
                const mine = isMe(msg);
                const prevMsg = msgs[idx - 1];
                const sameSenderAsPrev = prevMsg && (prevMsg.senderId?._id || prevMsg.senderId)?.toString() === (msg.senderId?._id || msg.senderId)?.toString();

                return (
                  <div key={msg._id} className={`flex items-end space-x-2 mb-1 ${mine ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar — only show for first msg in a group */}
                    {!mine && (
                      <div className="w-8 flex-shrink-0">
                        {!sameSenderAsPrev && <Avatar user={chat.otherUser} size="sm" />}
                      </div>
                    )}

                    <div className={`max-w-xs lg:max-w-md ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`px-4 py-2 rounded-2xl text-sm ${
                        mine
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'
                      }`}>
                        {msg.message}
                      </div>
                      <div className={`flex items-center space-x-1 mt-0.5 px-1 ${mine ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                        {mine && (
                          <span className="flex items-center">
                            {msg.isRead ? (
                              /* Double tick — blue (read) */
                              <svg className="w-4 h-4 text-blue-400" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 5.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M5 5.5L8.5 9L14 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : (
                              /* Single tick — grey (sent, unread) */
                              <svg className="w-4 h-4 text-gray-300" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 5.5L6.5 9L13 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message input */}
      <MessageInput onSend={handleSend} sending={sending} />
    </div>
  );
};

export default ChatWindow;