'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const { user, isAuthenticated, isVerifying, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isVerifying && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isVerifying, router]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

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
            <CardTitle>Welcome, {user.username}!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Balance:</strong> ${user.balance}</p>
              <p><strong>Verified:</strong> {user.verified ? 'Yes' : 'No'}</p>
              <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <p className="text-blue-800">
                🎉 <strong>Phase 16 Complete!</strong> This is a placeholder dashboard. 
                The full dashboard will be implemented in later phases.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}