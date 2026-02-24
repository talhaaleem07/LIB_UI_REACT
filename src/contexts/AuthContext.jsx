import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Fetch full user profile from API
          const profile = await userService.getProfile();
          setUser(profile);
        } catch (error) {
          // If token is invalid, clear it
          console.error('Failed to fetch user profile:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    
    // Fetch full user profile after login
    try {
      const profile = await userService.getProfile();
      setUser(profile);
    } catch (error) {
      // Fallback to basic user data
      setUser(data.user || { email: credentials.email });
    }
    
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    return data;
  };

  // const logout = () => {
  //   authService.logout();
  //   setUser(null);
  // };

  const logout = async () => {
  await authService.logout();
  setUser(null);
};

  const forgotPassword = async (email) => {
    return await authService.forgotPassword(email);
  };

  const verifyResetToken = async (token) => {
    return await authService.verifyResetToken(token);
  };

  const resetPassword = async (token, newPassword) => {
    return await authService.resetPassword(token, newPassword);
  };

  const updateUser = (updatedUserData) => {
    const newUser = { ...user, ...updatedUserData };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    verifyResetToken,
    resetPassword,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
