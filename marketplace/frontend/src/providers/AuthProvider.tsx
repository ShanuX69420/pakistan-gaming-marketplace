'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/hooks/useAuth';
import { authApi } from '@/lib/api/auth';

interface AuthContextType {
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isInitialized: false,
});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { token, user, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from localStorage on app start
    const initializeAuth = async () => {
      try {
        const storedToken = authApi.getToken();
        const storedUser = authApi.getStoredUser();

        if (storedToken && storedUser && !user) {
          // Verify token with server
          const response = await authApi.me(storedToken);
          if (response.success && response.data?.user) {
            setAuth(response.data.user, storedToken);
          } else {
            // Token is invalid, clear stored auth
            clearAuth();
            authApi.clearAuth();
          }
        } else if (!storedToken && user) {
          // No stored token but user exists in state, clear it
          clearAuth();
        }
      } catch (error) {
        // Token verification failed, clear auth
        console.error('Auth initialization failed:', error);
        clearAuth();
        authApi.clearAuth();
      }
    };

    initializeAuth();
  }, []); // Only run once on mount

  // Sync token with API client whenever it changes
  useEffect(() => {
    if (token) {
      authApi.setToken(token);
    }
  }, [token]);

  // Clean up auth data when user logs out
  useEffect(() => {
    if (!user && !token) {
      authApi.clearAuth();
    }
  }, [user, token]);

  return (
    <AuthContext.Provider value={{ isInitialized: true }}>
      {children}
    </AuthContext.Provider>
  );
}