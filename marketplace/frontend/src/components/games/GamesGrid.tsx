'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gamesApi } from '@/lib/api/games';
import { GameCard } from './GameCard';
import { GamesGridSkeleton } from './GameCardSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, SortAsc } from 'lucide-react';

interface GamesGridProps {
  searchQuery?: string;
}

export function GamesGrid({ searchQuery: externalSearchQuery }: GamesGridProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'listings' | 'categories'>('name');
  
  // Use external search query if provided, otherwise use local state
  const activeSearchQuery = externalSearchQuery || localSearchQuery;

  const { data, isLoading, error } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await gamesApi.getGames();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch games');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const filteredAndSortedGames = data?.games
    ? data.games
        .filter((game) =>
          game.name.toLowerCase().includes(activeSearchQuery.toLowerCase())
        )
        .sort((a, b) => {
          switch (sortBy) {
            case 'listings':
              return (b.listingsCount || 0) - (a.listingsCount || 0);
            case 'categories':
              return (b.categoriesCount || 0) - (a.categoriesCount || 0);
            case 'name':
            default:
              return a.name.localeCompare(b.name);
          }
        })
    : [];

  const handleLocalSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Games...</h2>
          <p className="text-gray-600">Fetching available games from our marketplace</p>
        </div>
        <GamesGridSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Games</h2>
          <p className="text-gray-600 mb-6">
            There was an error loading the games. Please try again.
          </p>
          <p className="text-sm text-red-600 mb-4">
            Error: {(error as Error).message}
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data?.games || data.games.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Games Available</h2>
          <p className="text-gray-600">
            Games will appear here once they are added to the marketplace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Browse Games
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover and trade digital gaming assets from popular games. 
          Find accounts, items, currency, and more from trusted sellers.
        </p>
      </div>

      {/* Search and Filters */}
      {!externalSearchQuery && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleLocalSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search games..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="listings">Sort by Listings</option>
              <option value="categories">Sort by Categories</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {activeSearchQuery ? (
            <>
              Found <strong>{filteredAndSortedGames.length}</strong> games matching &quot;{activeSearchQuery}&quot;
            </>
          ) : (
            <>
              Showing <strong>{filteredAndSortedGames.length}</strong> games
            </>
          )}
        </p>
        
        {activeSearchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocalSearchQuery('')}
          >
            Clear Search
          </Button>
        )}
      </div>

      {/* Games Grid */}
      {filteredAndSortedGames.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No games found</h3>
          <p className="text-gray-600">
            Try adjusting your search query or browse all games.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}