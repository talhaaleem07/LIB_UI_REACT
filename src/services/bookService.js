import api from './api';

export const bookService = {
  // Get all books for user with filters, search, pagination
  getAllBooks: async (params = {}) => {
    const response = await api.get('/books', { params });
    return response.data;
  },

  // Get book by ID
  getBookById: async (id) => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  // Add new book
  addBook: async (bookData) => {
    const response = await api.post('/books', bookData);
    return response.data;
  },

  // Update book
  updateBook: async (id, bookData) => {
    const response = await api.patch(`/books/${id}`, bookData);
    return response.data;
  },

  // Delete book
  deleteBook: async (id) => {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  },

  // Upload book image
  uploadBookImage: async (bookId, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('bookId', bookId);
    
    const response = await api.post('/books/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Search books by title AND author
  searchBooks: async (searchQuery) => {
    const response = await api.get('/search', { 
      params: { 
        title: searchQuery,    // Send search query as title parameter
        author: searchQuery    // Also send as author parameter - backend will search both
      } 
    });
    return response.data;
  },
};