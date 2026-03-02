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
  setAuthData: (user: User, token: string) => Promise<void>;
  updateCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: Send credentials to extension via window.postMessage (for web app context)
function sendCredentialsToExtension(token: string, userId: string): void {
  try {
    window.postMessage(
      {
        source: 'resumematch-web-app',
        action: 'saveAuthCredentials',
        authToken: token,
        userId: userId,
      },
      '*'
    );
    console.log('[Auth] ✓ Auth credentials sent to extension via postMessage');
  } catch (e) {
    console.warn('[Auth] Could not send credentials to extension:', e);
  }
}

// Helper: Notify extension of logout via window.postMessage
function notifyExtensionOfLogout(): void {
  try {
    window.postMessage(
      {
        source: 'resumematch-web-app',
        action: 'clearAuthCredentials',
      },
      '*'
    );
    console.log('[Auth] ✓ Logout notification sent to extension via postMessage');
  } catch (e) {
    console.warn('[Auth] Could not notify extension of logout:', e);
  }
}

// Helper: Save credentials to chrome.storage.sync (returns a Promise)
async function saveCredentialsToSync(token: string, userId: string): Promise<void> {
  // Step 1: Try to send to extension via postMessage (works when extension is installed)
  sendCredentialsToExtension(token, userId);

  // Step 2: Try direct chrome.storage.sync.set() (won't work in regular web app context, but we try anyway)
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.set(
        {
          'resumematch_auth_token': token,
          'resumematch_user_id': userId,
        },
        () => {
          if (chrome.runtime.lastError) {
            console.warn('[Auth] Could not save credentials to chrome.storage:', chrome.runtime.lastError);
            resolve(); // Resolve anyway to not block auth flow
          } else {
            console.log('[Auth] ✓ Credentials saved to chrome.storage.sync (direct)');
            // Verify it was actually saved
            chrome.storage.sync.get(['resumematch_auth_token'], (result) => {
              if (result['resumematch_auth_token']) {
                console.log('[Auth] ✓ Verified: auth_token is now in chrome.storage.sync');
              } else {
                console.warn('[Auth] ✗ WARNING: auth_token was not saved!');
              }
              resolve();
            });
          }
        }
      );
    });
  } else {
    console.log('[Auth] chrome.storage.sync not directly available (normal for web app context)');
    return Promise.resolve();
  }
}

// Helper: Load incoming resume from backend after login
async function loadAndSaveIncomingResume(): Promise<void> {
  try {
    console.log('[Auth] Attempting to load incoming resume from backend...');
    const incomingResume = await apiClient.getIncomingResume();
    if (incomingResume && incomingResume.extracted_data) {
      console.log('[Auth] ✓ Received incoming resume from backend');
      await setMasterResume(incomingResume.extracted_data);
      console.log('[Auth] ✓ Incoming resume saved to chrome.storage.sync and localStorage');
    } else {
      console.log('[Auth] No incoming resume available from backend');
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

      // Save to chrome.storage.sync for extension (AWAIT this to ensure it completes)
      await saveCredentialsToSync(token, userId);

      // Load incoming resume from backend BEFORE setting user (so Dashboard gets the resume)
      await loadAndSaveIncomingResume();

      // Now set the user - this will trigger Dashboard to load the resume
      setUser(response.data.user);

      console.log('[Auth] ✓ Login complete: credentials and incoming resume synced');
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

      // Save to chrome.storage.sync for extension (AWAIT this to ensure it completes)
      await saveCredentialsToSync(token, userId);

      // Load incoming resume from backend BEFORE setting user (so Dashboard gets the resume)
      await loadAndSaveIncomingResume();

      // Now set the user - this will trigger Dashboard to load the resume
      setUser(response.data.user);

      console.log('[Auth] ✓ Registration complete: credentials and incoming resume synced');
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

    // Notify extension of logout via postMessage
    notifyExtensionOfLogout();

    // Clear from chrome.storage.sync
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.remove([
        'resumematch_auth_token',
        'resumematch_user_id',
        'resumematch_master_resume' // Also remove cached resume
      ], () => {
        if (!chrome.runtime.lastError) {
          console.log('[Auth] ✓ All data cleared from chrome.storage.sync');
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

  const setAuthData = async (userData: User, token: string) => {
    localStorage.setItem('auth_token', token);

    // Save to chrome.storage.sync for extension (AWAIT this to ensure it completes)
    await saveCredentialsToSync(token, userData._id);

    // Load incoming resume from backend BEFORE setting user (so Dashboard gets the resume)
    await loadAndSaveIncomingResume();

    // Now set the user and clear any errors - this will trigger Dashboard to load the resume
    setUser(userData);
    setError(null);

    console.log('[Auth] ✓ setAuthData complete: credentials and incoming resume synced');
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
