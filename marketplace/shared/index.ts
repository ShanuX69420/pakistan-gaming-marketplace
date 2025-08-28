// Shared TypeScript types for Pakistan Gaming Marketplace
// This file will contain common interfaces and types used across frontend and backend

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  verified: boolean;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  SUPPORT = 'SUPPORT'
}

// More types will be added as development progresses