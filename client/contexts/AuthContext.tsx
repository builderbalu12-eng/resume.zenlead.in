import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, User } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
  getGoogleAuthUrl: () => Promise<string>;
  setAuthData: (user: User, token: string) => void;
  updateCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const currentUser = await apiClient.getCurrentUser();
          setUser(currentUser);
        } catch (err) {
          // Token is invalid or expired
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.login({ email, password });
      
      // Store token
      localStorage.setItem('auth_token', response.data.access_token);
      setUser(response.data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.register({
        firstName,
        lastName,
        email,
        password,
      });

      // Store token
      localStorage.setItem('auth_token', response.data.access_token);
      setUser(response.data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const getGoogleAuthUrl = async (): Promise<string> => {
    try {
      const response = await apiClient.getGoogleAuthUrl();
      return response.auth_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get Google auth URL';
      setError(message);
      throw err;
    }
  };

  const setAuthData = (userData: User, token: string) => {
    localStorage.setItem('auth_token', token);
    setUser(userData);
    setError(null);
  };

  const updateCurrentUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        error,
        clearError,
        getGoogleAuthUrl,
        setAuthData,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
