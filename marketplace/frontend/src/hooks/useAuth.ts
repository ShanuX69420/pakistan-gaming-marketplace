'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, User, LoginRequest, RegisterRequest } from '@/lib/api/auth';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth store using Zustand
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user: User, token: string) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  // Verify token on app load
  const { data: meData, isLoading: isVerifying } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      if (!token) throw new Error('No token available');
      const response = await authApi.me(token);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    enabled: !!token && !user,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await authApi.login(credentials);
      if (!response.success) {
        throw new Error(response.error || 'Login failed');
      }
      return response.data;
    },
    onSuccess: (data) => {
      if (data) {
        setAuth(data.user, data.token);
        authApi.setToken(data.token);
        authApi.setStoredUser(data.user);
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterRequest) => {
      const response = await authApi.register(userData);
      if (!response.success) {
        throw new Error(response.error || 'Registration failed');
      }
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.user) {
        console.log('Registration successful:', data.user);
        // Note: The auto-login will be handled by the register page
        // This just logs success for debugging
      }
    },
    onError: (error) => {
      console.error('Registration error:', error);
    },
  });

  // Logout function
  const logout = () => {
    clearAuth();
    authApi.clearAuth();
    queryClient.clear();
    router.push('/');
  };

  // Auto-login if verified user data is available
  if (meData?.user && !user) {
    setAuth(meData.user, token!);
  }

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    isVerifying,

    // Actions
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,

    // Mutation states
    loginError: loginMutation.error?.message,
    registerError: registerMutation.error?.message,
    loginSuccess: loginMutation.isSuccess,
    registerSuccess: registerMutation.isSuccess,

    // Reset errors
    resetErrors: () => {
      loginMutation.reset();
      registerMutation.reset();
    },
  };
}