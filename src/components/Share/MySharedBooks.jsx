import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../Common/Navbar';
import { shareService } from '../../services/shareService';
import ShareBook from './ShareBook';
import Loading from '../Common/Loading';

const MySharedBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSharedBooks = async () => {
    // Wait for user to be loaded
    if (!user?._id) {
      console.log('MySharedBooks: Waiting for user to load...');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('MySharedBooks: Fetching shared books for user:', user._id);
      console.log('MySharedBooks: API endpoint:', `/users/${user._id}/shared-books`);
      
      const response = await shareService.getSharedBooks(user._id);
      console.log('MySharedBooks: Full response:', response);
      
      // FIXED: Handle the correct response format from backend
      // Backend returns { message: "...", sharedBooks: [...] }
      const booksData = response.sharedBooks || response.books || response.data || response || [];
      console.log('MySharedBooks: Extracted books data:', booksData);
      console.log('MySharedBooks: Number of shared books:', Array.isArray(booksData) ? booksData.length : 0);
      
      setBooks(Array.isArray(booksData) ? booksData : []);
    } catch (error) {
      console.error('MySharedBooks: Error fetching shared books:', error);
      console.error('MySharedBooks: Error response:', error.response);
      console.error('MySharedBooks: Error data:', error.response?.data);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to fetch shared books');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedBooks();
  }, [user?._id]); // Only depend on user._id

  const handleUnshare = async (shareId) => {
    if (!window.confirm('Are you sure you want to unshare this book?')) {
      return;
    }

    try {
      await shareService.deleteShare(shareId);
      toast.success('Book unshared successfully!');
      fetchSharedBooks();
    } catch (error) {
      console.error('Error unsharing book:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to unshare book');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Loading />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Shared By Me</h1>
              <p className="text-gray-600">Books you've shared with others</p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg shadow p-4 mb-6 border-l-4 border-blue-600">
            <p className="text-sm text-gray-600">Books I've Shared</p>
            <p className="text-2xl font-bold text-gray-900">{books.length}</p>
          </div>

          {/* Books Grid */}
          {loading ? (
            <Loading />
          ) : books.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Shared Books</h3>
              <p className="text-gray-600">
                You haven't shared any books yet. Share a book from your library!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((item, index) => (
                <ShareBook
                  key={item._id || index}
                  shareData={item}
                  type="shared"
                  onUnshare={handleUnshare}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MySharedBooks;