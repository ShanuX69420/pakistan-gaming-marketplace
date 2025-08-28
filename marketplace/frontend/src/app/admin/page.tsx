'use client';

import { useRequireAuth } from '@/components/auth/ProtectedRoute';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminPage() {
  const { user, isAuthenticated, isVerifying, hasRequiredRole } = useRequireAuth('ADMIN');

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                You don&apos;t have permission to access the admin panel. 
                This area is restricted to administrators only.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Your current role: <strong>{user.role}</strong>
              </p>
              <Link href="/dashboard">
                <Button>Return to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">
                  <strong>🔒 Admin Access Granted</strong>
                </p>
                <p className="text-red-600 text-sm mt-1">
                  Welcome to the admin panel, {user.username}!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-600">Manage user accounts and permissions</p>
                </div>
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium text-gray-900">Games & Categories</h3>
                  <p className="text-sm text-gray-600">Manage games and their categories</p>
                </div>
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium text-gray-900">Order Management</h3>
                  <p className="text-sm text-gray-600">Monitor and manage orders</p>
                </div>
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium text-gray-900">Analytics</h3>
                  <p className="text-sm text-gray-600">View platform analytics</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-md">
                <p className="text-yellow-800 text-sm">
                  ⚠️ <strong>Note:</strong> This admin panel is a placeholder for Phase 17. 
                  Full admin functionality will be implemented in later phases.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}