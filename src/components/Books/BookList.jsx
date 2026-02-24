import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../Common/Navbar';
import BreadcrumbNav from '../Common/BreadcrumbNav';
import Loading from '../Common/Loading';
import { bookService } from '../../services/bookService';
import { shareService } from '../../services/shareService';
import BookCard from './BookCard';
import BookForm from './BookForm';
import BookDetail from './BookDetail';
import ShareBookModal from './ShareBookModal';

const BookList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // Filter states - these won't trigger auto-fetch
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Applied filters - these trigger fetch
  const [appliedFilters, setAppliedFilters] = useState({
    status: 'all',
    rating: 'all',
    genre: 'all',
    sort: 'newest'
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  
  // Ref to prevent multiple simultaneous calls
  const fetchingRef = useRef(false);

  // Standard genres list - matching BookForm and BookDetail
  const STANDARD_GENRES = [
    'Fantasy',
    'Sci-Fi',
    'Mystery',
    'Romance',
    'Thriller',
  ];

  // Check if navigated from Dashboard with openAddModal state
  useEffect(() => {
    if (location.state?.openAddModal) {
      setShowAddModal(true);
      // Clear the state so it doesn't reopen on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Fetch books with filters - only when applied filters change
  const fetchBooks = async () => {
    if (fetchingRef.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }
    
    try {
      fetchingRef.current = true;
      setLoading(true);
      
      let response;
      
      // Use search API if there's a search query
      if (searchQuery && searchQuery.trim()) {
        console.log('Searching books with query:', searchQuery);
        response = await bookService.searchBooks(searchQuery.trim());
        console.log('Search response:', response);
        
        const booksData = response.books || response.data || response || [];
        let filteredBooks = Array.isArray(booksData) ? booksData : [];
        
        // Apply additional filters on search results
        if (appliedFilters.status && appliedFilters.status !== 'all') {
          filteredBooks = filteredBooks.filter(book => book.status === appliedFilters.status);
        }
        if (appliedFilters.rating && appliedFilters.rating !== 'all') {
          const minRating = parseInt(appliedFilters.rating);
          filteredBooks = filteredBooks.filter(book => book.rating >= minRating);
        }
        if (appliedFilters.genre && appliedFilters.genre !== 'all') {
          filteredBooks = filteredBooks.filter(book => book.genre === appliedFilters.genre);
        }
        
        // Apply sorting
        filteredBooks = applySorting(filteredBooks, appliedFilters.sort);
        
        setBooks(filteredBooks);
        setTotalBooks(filteredBooks.length);
        setTotalPages(Math.ceil(filteredBooks.length / 12));
      } else {
        // Use regular getAllBooks API with filters
        const params = {
          page: currentPage,
          limit: 12,
        };
        
        if (appliedFilters.status && appliedFilters.status !== 'all') {
          params.status = appliedFilters.status;
        }
        if (appliedFilters.rating && appliedFilters.rating !== 'all') {
          params.rating = appliedFilters.rating;
        }
        if (appliedFilters.genre && appliedFilters.genre !== 'all') {
          params.genre = appliedFilters.genre;
        }
        
        // Convert frontend sort value to backend format (field:order)
        params.sortBy = convertSortToBackendFormat(appliedFilters.sort);

        console.log('Fetching books with params:', params);
        response = await bookService.getAllBooks(params);
        console.log('Books response:', response);
        
        const booksData = response.books || response.data || response || [];
        const total = response.totalBooks || response.total || booksData.length;
        const pages = response.totalPages || response.pages || Math.ceil(total / 12);
        
        setBooks(Array.isArray(booksData) ? booksData : []);
        setTotalPages(pages);
        setTotalBooks(total);
      }
      
    } catch (error) {
      console.error('Error fetching books:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.message || 'Failed to fetch books');
      setBooks([]);
      setTotalBooks(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // Convert frontend sort values to backend format
  const convertSortToBackendFormat = (sortValue) => {
    const sortMap = {
      'newest': 'createdAt:desc',
      'oldest': 'createdAt:asc',
      'title': 'title:asc',
      'rating': 'rating:desc'
    };
    return sortMap[sortValue] || 'createdAt:desc';
  };

  // Apply sorting to an array of books (for search results)
  const applySorting = (booksArray, sortValue) => {
    const sorted = [...booksArray];
    
    switch (sortValue) {
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  // Fetch books only when applied filters or page changes
  useEffect(() => {
    fetchBooks();
  }, [currentPage, searchQuery, appliedFilters]);

  // Handle search form submit
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  // Handle apply filters button
  const handleApplyFilters = () => {
    setAppliedFilters({
      status: statusFilter,
      rating: ratingFilter,
      genre: genreFilter,
      sort: sortBy
    });
    setCurrentPage(1);
  };

  // Reset all filters
  const resetFilters = () => {
    setStatusFilter('all');
    setRatingFilter('all');
    setGenreFilter('all');
    setSortBy('newest');
    setSearchInput('');
    setSearchQuery('');
    setAppliedFilters({
      status: 'all',
      rating: 'all',
      genre: 'all',
      sort: 'newest'
    });
    setCurrentPage(1);
  };

  // Handle add book
  const handleAddBook = async (bookData, imageFile) => {
    try {
      const response = await bookService.addBook(bookData);
      const newBookId = response.book?._id || response._id;
      
      if (imageFile && newBookId) {
        await bookService.uploadBookImage(newBookId, imageFile);
      }
      
      toast.success('Book added successfully!');
      setShowAddModal(false);
      fetchBooks();
    } catch (error) {
      console.error('Error adding book:', error);
      toast.error(error.response?.data?.message || 'Failed to add book');
      throw error;
    }
  };

  // Handle view book
  const handleViewBook = async (book) => {
    try {
      const response = await bookService.getBookById(book._id);
      const bookData = response.book || response.data || response;
      setSelectedBook(bookData);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching book details:', error);
      toast.error('Failed to load book details');
    }
  };

  // Handle edit book
  const handleEditBook = async (bookId, bookData) => {
    try {
      await bookService.updateBook(bookId, bookData);
      toast.success('Book updated successfully!');
      setShowViewModal(false);
      setSelectedBook(null);
      fetchBooks();
    } catch (error) {
      console.error('Error updating book:', error);
      toast.error(error.response?.data?.message || 'Failed to update book');
      throw error;
    }
  };

  // Handle image upload
  const handleImageUpload = async (bookId, imageFile) => {
    try {
      await bookService.uploadBookImage(bookId, imageFile);
      toast.success('Book cover updated successfully!');
      
      // Refresh the book details
      const response = await bookService.getBookById(bookId);
      const updatedBook = response.book || response.data || response;
      setSelectedBook(updatedBook);
      fetchBooks();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
      throw error;
    }
  };

  // Handle share book
  const handleShareBook = (book) => {
    setSelectedBook(book);
    setShowShareModal(true);
  };

  // Handle share submit
  const handleShareSubmit = async (userId) => {
    if (!selectedBook) return;
    
    try {
      await shareService.shareBook(selectedBook._id, userId);
      toast.success('Book shared successfully!');
      setShowShareModal(false);
      setSelectedBook(null);
    } catch (error) {
      console.error('Error sharing book:', error);
      toast.error(error.response?.data?.message || 'Failed to share book');
      throw error;
    }
  };

  // Handle delete book
  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) {
      return;
    }

    try {
      await bookService.deleteBook(bookId);
      toast.success('Book deleted successfully!');
      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error(error.response?.data?.message || 'Failed to delete book. Please check if the book is shared. Unshare the book before deleting it.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <BreadcrumbNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Books</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and organize your personal library
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Book</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search books by title or author..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Search
              </button>
              {(searchQuery || searchInput) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="text-gray-600 hover:text-gray-800 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="reading">Reading</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                  </select>
                </div>

                {/* Genre Filter - Standard genres only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                  <select
                    value={genreFilter}
                    onChange={(e) => setGenreFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Genres</option>
                    {STANDARD_GENRES.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title (A-Z)</option>
                    <option value="rating">Highest Rating</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing {books.length} of {totalBooks} books
                  {currentPage > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyFilters}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={resetFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Books Grid */}
          {loading ? (
            <Loading />
          ) : books.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Books Found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== 'all' || ratingFilter !== 'all' || genreFilter !== 'all'
                  ? 'No books match your current filters. Try adjusting your search.'
                  : 'Start building your library by adding your first book!'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Add Your First Book
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map(book => (
                  <BookCard
                    key={book._id}
                    book={book}
                    onView={handleViewBook}
                    onShare={handleShareBook}
                    onDelete={handleDeleteBook}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-1">
                    {[...Array(Math.min(totalPages, 10))].map((_, index) => {
                      const pageNumber = index + 1;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-4 py-2 rounded-lg transition ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    {totalPages > 10 && (
                      <span className="px-4 py-2 text-gray-500">...</span>
                    )}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <BookForm
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddBook}
        />
      )}

      {showViewModal && selectedBook && (
        <BookDetail
          book={selectedBook}
          onClose={() => {
            setShowViewModal(false);
            setSelectedBook(null);
          }}
          onEdit={handleEditBook}
          onImageUpload={handleImageUpload}
        />
      )}

      {showShareModal && selectedBook && (
        <ShareBookModal
          book={selectedBook}
          onClose={() => {
            setShowShareModal(false);
            setSelectedBook(null);
          }}
          onShare={handleShareSubmit}
        />
      )}
    </div>
  );
};

export default BookList;