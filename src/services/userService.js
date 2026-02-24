import api from './api';

export const userService = {
  // Get all users
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    console.log('Fetching user profile...');
    try {
      const response = await api.get('/users/me');
      console.log('Profile API response status:', response.status);
      console.log('Profile API response data:', response.data);
      
      // Handle nested response format where user data is inside response.data.user
      if (response.data.user) {
        console.log('Returning nested user object:', response.data.user);
        return response.data.user;  // Return the nested user object
      }
      
      // Handle direct response format
      return response.data;
    } catch (error) {
      console.error('Profile API error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.patch('/users/me', userData);
    return response.data;
  },

  // Upload profile image
  uploadImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    console.log('Uploading image:', imageFile.name, 'Size:', imageFile.size, 'Type:', imageFile.type);

    try {
      const response = await api.post('/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload API response status:', response.status);
      console.log('Upload API response data:', response.data);
      
      // Handle nested response format
      if (response.data.user) {
        console.log('Returning nested user object from upload:', response.data.user);
        return response.data.user;  // Return the nested user object
      }
      
      return response.data;
    } catch (error) {
      console.error('Upload API error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  // Delete profile image
  deleteImage: async () => {
    const response = await api.delete('/image');
    return response.data;
  },
};
