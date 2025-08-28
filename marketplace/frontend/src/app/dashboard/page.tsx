'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Link from 'next/link';

function DashboardContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.username}!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {user?.role}</p>
              <p><strong>Balance:</strong> ${user?.balance}</p>
              <p><strong>Verified:</strong> {user?.verified ? 'Yes' : 'No'}</p>
              <p><strong>Member since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            
            <div className="mt-6 flex gap-4">
              <Link href="/profile">
                <Button variant="outline">View Profile</Button>
              </Link>
              {user?.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                    Admin Panel
                  </Button>
                </Link>
              )}
            </div>
            
            <div className="mt-6 p-4 bg-green-50 rounded-md">
              <p className="text-green-800">
                🎉 <strong>Phase 17 Complete!</strong> Protected routes are now implemented with authentication guards. 
                The dashboard is only accessible to authenticated users.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}