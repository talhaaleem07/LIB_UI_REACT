import { Link, useLocation } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';

const MessageBadge = () => {
  const { totalUnread } = useChat();
  const location = useLocation();
  const isActive = location.pathname === '/chat';

  return (
    <Link
      to="/chat"
      className={`relative p-2 rounded-full transition-colors ${
        isActive
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
      }`}
      aria-label="Messages"
      title="Messages"
    >
      {/* Chat bubble icon */}
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>

      {/* Unread badge */}
      {totalUnread > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
          {totalUnread > 99 ? '99+' : totalUnread}
        </span>
      )}
    </Link>
  );
};

export default MessageBadge;