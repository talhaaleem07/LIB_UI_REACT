import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { shareService } from '../../services/shareService';

const ShareBookModal = ({ book, onClose, onShare }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [alreadySharedIds, setAlreadySharedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, sharedResponse] = await Promise.all([
        userService.getAllUsers(),
        shareService.getSharedUsers(book._id),
      ]);

      const allUsers = usersResponse.users || usersResponse || [];
      const otherUsers = allUsers.filter(user => user._id !== currentUser?._id);
      setUsers(otherUsers);

      const sharedUsers = sharedResponse.sharedUsers || [];
      setAlreadySharedIds(new Set(sharedUsers.map(u => u._id)));
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) { setError('Please select a user'); return; }
    if (selectedUserId === currentUser?._id) { setError('You cannot share a book with yourself'); return; }

    setIsSubmitting(true);
    try {
      await onShare(selectedUserId);
    } catch (error) {
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to share book');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return user.username?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Share Book</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-1">{book.title}</h3>
            <p className="text-sm text-gray-600">by {book.author}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select User to Share With</label>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{searchQuery ? 'No users found matching your search' : 'No other users available to share with'}</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
                  {filteredUsers.map(user => {
                    const isAlreadyShared = alreadySharedIds.has(user._id);
                    return (
                      <label
                        key={user._id}
                        title={isAlreadyShared ? `This book is already shared with ${user.username}` : ''}
                        className={`flex items-center p-3 border-b border-gray-200 last:border-b-0 ${
                          isAlreadyShared
                            ? 'opacity-50 cursor-not-allowed bg-gray-100'
                            : 'hover:bg-gray-50 cursor-pointer'
                        } ${selectedUserId === user._id ? 'bg-blue-50' : ''}`}
                      >
                        <input
                          type="radio"
                          name="selectedUser"
                          value={user._id}
                          checked={selectedUserId === user._id}
                          disabled={isAlreadyShared}
                          onChange={(e) => {
                            setSelectedUserId(e.target.value);
                            setError('');
                          }}
                          className="mr-3 cursor-not-allowed"
                          style={isAlreadyShared ? { cursor: 'not-allowed' } : {}}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user.username}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {isAlreadyShared && (
                            <p className="text-xs text-amber-600 mt-0.5 font-medium">
                              This book is already shared with {user.username}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !selectedUserId}
              >
                {isSubmitting ? 'Sharing...' : 'Share Book'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShareBookModal;