import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../services/chatService';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { subscribe } = useSocket();
  const [totalUnread, setTotalUnread] = useState(0);

  // Both of these are refs so the single subscriber always reads
  // the latest values without ever needing to re-register.
  const activeChatIdRef = useRef(null);
  const currentUserIdRef = useRef(null);

  // Keep currentUserIdRef in sync with the user object
  useEffect(() => {
    currentUserIdRef.current = user?._id?.toString() ?? null;
  }, [user?._id]);

  const setActiveChatId = useCallback((chatId) => {
    activeChatIdRef.current = chatId ? chatId.toString() : null;
  }, []);

  // Fetch initial unread count on login
  useEffect(() => {
    if (!isAuthenticated) { setTotalUnread(0); return; }
    chatService.getTotalUnreadCount()
      .then((data) => setTotalUnread(data.count))
      .catch(console.error);
  }, [isAuthenticated]);

  // Register ONE subscriber for the lifetime of the authenticated session.
  // It reads activeChatIdRef and currentUserIdRef via closure so it never
  // needs to be torn down and re-created when those values change.
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsub = subscribe('receive_message', (data) => {
      const msg = data.message;
      const incomingChatId = msg?.chatId?.toString();
      const senderId = (msg?.senderId?._id ?? msg?.senderId)?.toString();

      // Never count messages sent by the current user
      if (senderId && senderId === currentUserIdRef.current) return;

      // Never count messages for the chat that is currently open
      if (incomingChatId && incomingChatId === activeChatIdRef.current) return;

      setTotalUnread((prev) => prev + 1);
    });

    return unsub;
  }, [isAuthenticated, subscribe]); // ← no user._id dependency = registered exactly once

  const refreshUnreadCount = useCallback(async () => {
    try {
      const data = await chatService.getTotalUnreadCount();
      setTotalUnread(data.count);
    } catch { /* silent */ }
  }, []);

  return (
    <ChatContext.Provider value={{ totalUnread, setTotalUnread, refreshUnreadCount, setActiveChatId }}>
      {children}
    </ChatContext.Provider>
  );
};