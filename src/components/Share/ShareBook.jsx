import { useState } from 'react';

const ShareBook = ({ shareData, type, onUnshare }) => {
  const [imageError, setImageError] = useState(false);
  
  // Extract book data - handle different API response structures
  const book = shareData.book || shareData.bookId || shareData;
  // FIXED: Use correct property name from backend (sharedTo, not sharedWith)
  const sharedTo = shareData.sharedTo;
  const sharedBy = shareData.sharedBy;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-4 h-4 fill-current text-yellow-500" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-500" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`half-shared-${shareData._id}`}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#d1d5db" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path fill={`url(#half-shared-${shareData._id})`} d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-4 h-4 fill-current text-gray-300" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      }
    }
    return stars;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reading':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const defaultBookImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"%3E%3Crect width="200" height="300" fill="%234F46E5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="white"%3EBook%3C/text%3E%3C/svg%3E';

  // FIXED: Support both 'image' and 'imageUrl' properties from backend
  const bookImage = book?.image || book?.imageUrl || defaultBookImage;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      {/* Book Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-500 to-pink-600 overflow-hidden">
        <img
          src={imageError ? defaultBookImage : bookImage}
          alt={book?.title}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          {book?.status && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(book.status)}`}>
              {book.status === 'reading' ? 'Reading' : 'Completed'}
            </span>
          )}
        </div>
        {/* Share indicator badge */}
        <div className="absolute top-2 left-2">
          <span className="px-3 py-1 bg-white bg-opacity-90 rounded-full text-xs font-semibold text-gray-800 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Shared
          </span>
        </div>
      </div>

      {/* Book Details */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate" title={book?.title}>
          {book?.title || 'Untitled'}
        </h3>
        <p className="text-sm text-gray-600 mb-2 truncate" title={book?.author}>
          by {book?.author || 'Unknown Author'}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            {book?.rating && renderStars(book.rating)}
            {book?.rating && (
              <span className="text-sm text-gray-600 ml-1">({book.rating})</span>
            )}
          </div>
          {book?.publishedYear && (
            <span className="text-xs text-gray-500">{book.publishedYear}</span>
          )}
        </div>

        {book?.genre && (
          <div className="mb-3">
            <span className="inline-block bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded">
              {book.genre}
            </span>
          </div>
        )}

        {/* Shared info - FIXED: Use correct property names */}
        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            {type === 'shared' ? (
              <>
                Shared with <span className="font-semibold text-gray-900">{sharedTo?.username || sharedTo?.email || 'User'}</span>
              </>
            ) : (
              <>
                Shared by <span className="font-semibold text-gray-900">{sharedBy?.username || sharedBy?.email || 'User'}</span>
              </>
            )}
          </p>
        </div>

        {book?.review && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2" title={book.review}>
            {book.review}
          </p>
        )}

        {/* Action Buttons */}
        {type === 'shared' && onUnshare && (
          <button
            onClick={() => onUnshare(shareData._id)}
            className="w-full flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Unshare
          </button>
        )}
      </div>
    </div>
  );
};

export default ShareBook;