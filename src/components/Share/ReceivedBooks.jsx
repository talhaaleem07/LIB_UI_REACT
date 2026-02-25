import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import Navbar from '../Common/Navbar';
import { shareService } from '../../services/shareService';
import ShareBook from './ShareBook';
import Loading from '../Common/Loading';

const ReceivedBooks = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const highlightedRef = useRef(null);

  // Extract the book ID to highlight from the URL query param
  const highlightBookId = new URLSearchParams(location.search).get('highlight');

  const fetchSharedBooks = async () => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await shareService.getReceivedBooks(user._id);
      const booksData = response.receivedBooks || response.books || response.data || response || [];
      setBooks(Array.isArray(booksData) ? booksData : []);
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to fetch shared books');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedBooks();
  }, [user?._id]);

  // Scroll to highlighted book after books load
  useEffect(() => {
    if (!loading && highlightBookId && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loading, highlightBookId]);

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Shared With Me</h1>
              <p className="text-gray-600">Books that others have shared with you</p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg shadow p-4 mb-6 border-l-4 border-purple-600">
            <p className="text-sm text-gray-600">Books Shared With Me</p>
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
              <p className="text-gray-600">No one has shared any books with you yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((item, index) => {
                const bookId = item.book?._id || item.book;
                const isHighlighted = highlightBookId && bookId?.toString() === highlightBookId;

                return (
                  <div
                    key={item._id || index}
                    ref={isHighlighted ? highlightedRef : null}
                  >
                    <ShareBook
                      shareData={item}
                      type="received"
                      isHighlighted={isHighlighted}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceivedBooks;