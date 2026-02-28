import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, User } from '@/services/api';
import { setMasterResume } from '@/utils/storage';

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

// Helper: Load incoming resume from backend after login
async function loadAndSaveIncomingResume(): Promise<void> {
  try {
    const incomingResume = await apiClient.getIncomingResume();
    if (incomingResume && incomingResume.extracted_data) {
      await setMasterResume(incomingResume.extracted_data);
      console.log('[Auth] ✓ Loaded incoming resume from backend');
    }
  } catch (err) {
    // No incoming resume found or error loading it - that's OK
    console.warn('[Auth] Could not load incoming resume:', err instanceof Error ? err.message : String(err));
  }
}

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

      const token = response.data.access_token;
      const userId = response.data.user._id;

      // Store token in localStorage
      localStorage.setItem('auth_token', token);

      // Also save to chrome.storage.sync for extension
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({
          'resumematch_auth_token': token,
          'resumematch_user_id': userId,
        }, () => {
          if (chrome.runtime.lastError) {
            console.warn('[Auth] Could not save credentials to chrome.storage:', chrome.runtime.lastError);
          } else {
            console.log('[Auth] ✓ Credentials saved to chrome.storage.sync');
          }
        });
      }

      setUser(response.data.user);

      // Load incoming resume from backend if available
      await loadAndSaveIncomingResume();
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

      const token = response.data.access_token;
      const userId = response.data.user._id;

      // Store token in localStorage
      localStorage.setItem('auth_token', token);

      // Also save to chrome.storage.sync for extension
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({
          'resumematch_auth_token': token,
          'resumematch_user_id': userId,
        }, () => {
          if (chrome.runtime.lastError) {
            console.warn('[Auth] Could not save credentials to chrome.storage:', chrome.runtime.lastError);
          } else {
            console.log('[Auth] ✓ Credentials saved to chrome.storage.sync');
          }
        });
      }

      setUser(response.data.user);

      // Load incoming resume from backend if available
      await loadAndSaveIncomingResume();
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
    localStorage.removeItem('resumematch_master_resume'); // Don't keep offline resume
    setUser(null);
    setError(null);

    // Clear from chrome.storage.sync
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.remove(['resumematch_auth_token', 'resumematch_user_id'], () => {
        if (!chrome.runtime.lastError) {
          console.log('[Auth] ✓ Credentials cleared from chrome.storage.sync');
        }
      });
    }
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

    // Also save to chrome.storage.sync for extension
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({
        'resumematch_auth_token': token,
        'resumematch_user_id': userData._id,
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn('[Auth] Could not save credentials to chrome.storage:', chrome.runtime.lastError);
        } else {
          console.log('[Auth] ✓ Credentials saved to chrome.storage.sync');
        }
      });
    }

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
