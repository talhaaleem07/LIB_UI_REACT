import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';

const ShareBookModal = ({ book, onClose, onShare }) => {
  const { user: currentUser } = useAuth(); // Get current logged-in user
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      const allUsers = response.users || response || [];
      
      // FILTER OUT CURRENT USER - prevent sharing with self
      const otherUsers = allUsers.filter(user => user._id !== currentUser?._id);
      
      setUsers(otherUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    // Double-check: prevent sharing with self
    if (selectedUserId === currentUser?._id) {
      setError('You cannot share a book with yourself');
      return;
    }

    setIsSubmitting(true);
    try {
      await onShare(selectedUserId);
    } catch (error) {
      console.error('Error sharing book:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to share book');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Share Book</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Book Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-1">{book.title}</h3>
            <p className="text-sm text-gray-600">by {book.author}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Search Users */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* User List */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User to Share With
              </label>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>
                    {searchQuery 
                      ? 'No users found matching your search' 
                      : 'No other users available to share with'}
                  </p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
                  {filteredUsers.map(user => (
                    <label
                      key={user._id}
                      className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0 ${
                        selectedUserId === user._id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedUser"
                        value={user._id}
                        checked={selectedUserId === user._id}
                        onChange={(e) => {
                          setSelectedUserId(e.target.value);
                          setError('');
                        }}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.username}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
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