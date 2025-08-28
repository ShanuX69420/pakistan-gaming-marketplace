'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Time before refetching data in the background
            staleTime: 5 * 60 * 1000, // 5 minutes
            // Time before removing from cache
            gcTime: 10 * 60 * 1000, // 10 minutes
            // Retry failed requests
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors (client errors)
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
            // Don't refetch on window focus by default
            refetchOnWindowFocus: false,
            // Don't refetch on reconnect by default
            refetchOnReconnect: false,
          },
          mutations: {
            // Show error notifications for failed mutations
            onError: (error: any) => {
              console.error('Mutation error:', error);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}