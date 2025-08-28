'use client';

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { user, isAuthenticated, isVerifying } = useAuth();

  // Test API connection
  const { data: apiStatus, isLoading, error } = useQuery({
    queryKey: ['api-status'],
    queryFn: async () => {
      const response = await apiClient.get('/');
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        
        {/* API Status Test */}
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">API Connection Test</h2>
          {isLoading ? (
            <p className="text-blue-600">Testing API connection...</p>
          ) : error ? (
            <p className="text-red-600">❌ API Error: {(error as Error).message}</p>
          ) : apiStatus ? (
            <p className="text-green-600">✅ API Connected: {apiStatus.message}</p>
          ) : (
            <p className="text-gray-600">No API response</p>
          )}
        </div>

        {/* Auth Status Test */}
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Auth System Test</h2>
          {isVerifying ? (
            <p className="text-blue-600">Verifying authentication...</p>
          ) : isAuthenticated && user ? (
            <p className="text-green-600">✅ Authenticated as: {user.username} ({user.role})</p>
          ) : (
            <p className="text-gray-600">Not authenticated</p>
          )}
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Button variant="default" size="lg">
            Pakistan Gaming Marketplace
          </Button>
          <Button variant="outline" size="lg">
            API Client Ready!
          </Button>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
