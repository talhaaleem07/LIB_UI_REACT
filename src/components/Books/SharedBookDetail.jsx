import { useState, useEffect } from 'react';

const SharedBookDetail = ({ book, onClose }) => {
  const [imageError, setImageError] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(book?.image || null);

  useEffect(() => {
    if (book?.image) {
      const img = new Image();
      img.src = book.image;
      img.onload = () => setCurrentImageUrl(book.image);
      img.onerror = () => setImageError(true);
    }
  }, [book?.image]);

  const defaultBookImage =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"%3E%3Crect width="400" height="600" fill="%234F46E5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" fill="white"%3EBook%3C/text%3E%3C/svg%3E';

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-6 h-6 fill-current text-yellow-500" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-6 h-6 text-yellow-500" viewBox="0 0 20 20">
            <defs>
              <linearGradient id="half-shared-detail">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#d1d5db" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path fill="url(#half-shared-detail)" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-6 h-6 fill-current text-gray-300" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      }
    }
    return stars;
  };

  if (!book) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">Book Details</h2>
            {/* Read-only badge so the receiver clearly knows they can't edit */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Shared with you
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content — view-only, no edit form */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

            {/* Book cover */}
            <div className="md:col-span-1">
              <img
                src={imageError ? defaultBookImage : (currentImageUrl || defaultBookImage)}
                alt={book.title}
                onError={() => setImageError(true)}
                className="w-full rounded-lg shadow-lg"
              />
            </div>

            {/* Book info */}
            <div className="md:col-span-2">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h3>
              <p className="text-xl text-gray-600 mb-4">by {book.author}</p>

              <div className="space-y-3">
                {book.genre && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 w-32">Genre:</span>
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {book.genre}
                    </span>
                  </div>
                )}

                {book.publishedYear && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 w-32">Published:</span>
                    <span className="text-gray-900">{book.publishedYear}</span>
                  </div>
                )}

                {book.rating && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 w-32">Rating:</span>
                    <div className="flex items-center space-x-1">
                      {renderStars(book.rating)}
                      <span className="ml-2 text-gray-600">({book.rating}/5)</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 w-32">Status:</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    book.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {book.status === 'completed' ? 'Completed' : 'Reading'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Review */}
          {book.review && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Review</h4>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{book.review}</p>
            </div>
          )}

          {/* Read-only notice instead of Edit button */}
          <div className="flex justify-end">
            <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              View only — you cannot edit shared books
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedBookDetail;