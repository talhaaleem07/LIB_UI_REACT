import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'react-toastify';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { subscribe } = useSocket();

  // Fetch count from DB on mount — handles offline notifications
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // Subscribe to real-time WebSocket notifications
  // Empty deps [] = runs once on mount only
  // subscribe is a stable ref so this is safe
  useEffect(() => {
    console.log('[Bell] 🔔 Registering notification subscriber');

    const unsubscribe = subscribe('notification', (data) => {
      console.log('[Bell] ⚡ Real-time notification arrived! Incrementing badge...', data);

      // Increment badge — unconditional, always fires
      setUnreadCount((prev) => {
        console.log(`[Bell] Badge: ${prev} → ${prev + 1}`);
        return prev + 1;
      });
      
      toast.info(`📚 ${data.message}`, { position: 'top-right', autoClose: 3000, toastId: data._id, });

      // Normalise the real-time payload: the socket sends `notificationType`
      // (e.g. 'BOOK_SHARED') separately to avoid overwriting the top-level
      // `type: 'notification'` field. Map it back to `type` so it matches
      // the shape returned by the REST API.
      const normalised = { ...data, type: data.notificationType ?? data.type };

      // Add to list only if already loaded
      setNotifications((prev) => {
        if (prev.length === 0) return prev;
        if (prev.some((n) => n._id === normalised._id)) return prev;
        return [normalised, ...prev];
      });

      // Native browser notification (optional, needs user permission)
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Book Library 📚', { body: data.message });
      }
    });

    console.log('[Bell] ✅ Subscriber registered');
    return () => {
      console.log('[Bell] Subscriber removed');
      unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.count);
    } catch (err) {
      console.error('[Bell] Failed to fetch unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.data || []);
    } catch (err) {
      console.error('[Bell] Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) fetchNotifications();
    setIsOpen((prev) => !prev);
  };

//   const handleNotificationClick = async (notification) => {
//     try {
//       if (!notification.isRead) {
//         await notificationService.markAsRead(notification._id);
//         setNotifications((prev) =>
//           prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
//         );
//         setUnreadCount((prev) => Math.max(0, prev - 1));
//       }
//     } catch (err) {
//       console.error('[Bell] Failed to mark as read:', err);
//     }
//     setIsOpen(false);
//     navigate('/shared-with-me');
//   };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await notificationService.markAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('[Bell] Failed to mark as read:', err);
    }
    setIsOpen(false);

    // For BOOK_SHARED notifications, pass the book ID so the page can highlight it
    if (notification.type === 'BOOK_SHARED' && notification.book?._id) {
      navigate(`/shared-with-me?highlight=${notification.book._id}`);
    } else {
      navigate('/shared-with-me');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const diffMs = Date.now() - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeStyle = (type) => {
    if (type === 'BOOK_UNSHARED') {
      return { unreadBg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600', dot: 'bg-red-500' };
    }
    return { unreadBg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', dot: 'bg-blue-500' };
  };

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002
               6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6
               8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6
               0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-blue-600 font-medium">{unreadCount} unread</span>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0
                       00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0
                       .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const style = getTypeStyle(notification.type);
                return (
                  <button
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      !notification.isRead ? style.unreadBg : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
                        !notification.isRead ? style.iconBg : 'bg-gray-100'
                      }`}>
                        <svg className={`w-4 h-4 ${!notification.isRead ? style.iconColor : 'text-gray-500'}`}
                          fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
                        </svg>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.isRead ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        {notification.book?.title && (
                          <p className="text-xs text-blue-600 mt-0.5 truncate">📖 {notification.book.title}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>
                      </div>

                      {!notification.isRead && (
                        <div className={`flex-shrink-0 w-2 h-2 ${style.dot} rounded-full mt-2`} />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 text-center">
              <button
                onClick={() => { setIsOpen(false); navigate('/shared-with-me'); }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View all shared books →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;