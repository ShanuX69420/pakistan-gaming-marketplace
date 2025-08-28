'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

// Zod schema for form validation
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { 
    login, 
    isLoading, 
    loginError, 
    isAuthenticated,
    resetErrors 
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const successMessage = searchParams.get('message');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Reset auth errors when component mounts
  useEffect(() => {
    resetErrors();
  }, [resetErrors]);

  const onSubmit = (data: LoginFormData) => {
    // Clear any previous errors
    resetErrors();
    
    login(data, {
      onSuccess: () => {
        router.push('/dashboard');
      },
      onError: (error) => {
        // Set form-level error for display
        setError('root', { 
          type: 'server', 
          message: error.message || 'Login failed. Please try again.' 
        });
      }
    });
  };

  // Show loading while checking authentication
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your Pakistan Gaming Marketplace account
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Display success message from registration */}
            {successMessage && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                {decodeURIComponent(successMessage)}
              </div>
            )}
            
            {/* Display server errors */}
            {(errors.root || loginError) && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {errors.root?.message || loginError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className={errors.email ? 'border-red-500' : ''}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className={errors.password ? 'border-red-500' : ''}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || isSubmitting}
            >
              {(isLoading || isSubmitting) ? 'Signing in...' : 'Sign In'}
            </Button>
            
            <div className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}