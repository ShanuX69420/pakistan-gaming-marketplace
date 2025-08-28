import { apiClient, ApiResponse } from './client';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR' | 'SUPPORT';
  verified: boolean;
  balance: number;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: User;
}

export const authApi = {
  // Login user
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return apiClient.post<LoginResponse>('/api/auth/login', credentials);
  },

  // Register user
  register: async (userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> => {
    return apiClient.post<RegisterResponse>('/api/auth/register', userData);
  },

  // Get current user (verify token)
  me: async (token: string): Promise<ApiResponse<{ user: User }>> => {
    return apiClient.get<{ user: User }>('/api/auth/me', token);
  },

  // Logout (client-side only - remove token)
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },

  // Get stored token
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },

  // Store token
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  },

  // Get stored user
  getStoredUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
  },

  // Store user
  setStoredUser: (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  },

  // Clear all stored auth data
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },
};