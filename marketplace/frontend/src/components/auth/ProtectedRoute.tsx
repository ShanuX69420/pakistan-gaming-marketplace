'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  fallback, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isVerifying, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isVerifying && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isVerifying, router, redirectTo]);

  // Show loading while verifying authentication
  if (isVerifying) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show redirect message while redirecting unauthenticated users
  if (!isAuthenticated || !user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}

// Higher-order component version for easier use
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook for role-based protection
export function useRequireAuth(requiredRole?: string) {
  const { isAuthenticated, user, isVerifying } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isVerifying && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requiredRole && user && user.role !== requiredRole) {
      router.push('/dashboard'); // Redirect to dashboard if wrong role
      return;
    }
  }, [isAuthenticated, isVerifying, user, requiredRole, router]);

  return {
    isAuthenticated,
    user,
    isVerifying,
    hasRequiredRole: !requiredRole || (user && user.role === requiredRole),
  };
}