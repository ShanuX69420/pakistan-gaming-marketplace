'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Users, Package, Star } from 'lucide-react';
import { gamesApi } from '@/lib/api/games';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function GameDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Fetch game details (includes categories)
  const { data: gameResponse, isLoading: gameLoading, error: gameError } = useQuery({
    queryKey: ['game', slug],
    queryFn: () => gamesApi.getGameBySlug(slug),
    enabled: !!slug,
  });

  if (gameLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-300 rounded mb-4"></div>
          <div className="h-64 w-full bg-gray-300 rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameError || !gameResponse?.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Game Not Found</h1>
          <p className="text-gray-600 mb-4">The game you're looking for doesn't exist or has been removed.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Games
          </Link>
        </div>
      </div>
    );
  }

  const game = gameResponse.data.game;
  const categories = game.categories || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-700">
            Home
          </Link>
          <ChevronRight size={16} />
          <span className="text-gray-800 font-medium">{game.name}</span>
        </nav>

        {/* Game Header */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Game Image */}
            <div className="flex-shrink-0">
              {game.imageUrl ? (
                <Image
                  src={game.imageUrl}
                  alt={game.name}
                  width={200}
                  height={200}
                  className="rounded-lg border"
                />
              ) : (
                <div className="w-48 h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border flex items-center justify-center">
                  <Package size={48} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Game Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{game.name}</h1>
              
              {/* Platform Types */}
              <div className="flex flex-wrap gap-2 mb-4">
                {game.platformTypes.map((platform) => (
                  <Badge key={platform} variant="secondary" className="text-sm">
                    {platform}
                  </Badge>
                ))}
              </div>

              {/* Game Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-gray-400" />
                  <span className="text-gray-600">
                    {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-400" />
                  <span className="text-gray-600">
                    {categories.reduce((total, cat) => total + (cat.listingsCount || 0), 0)} Active Listings
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Browse Categories</h2>
          
          {gameLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <Card className="h-32">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/game/${slug}/${category.slug}`}
                  className="group"
                >
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group-hover:border-blue-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Commission Rate</span>
                          <Badge variant="outline" className="text-xs">
                            {category.commissionRate}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Active Listings</span>
                          <span className="font-medium">
                            {category.listingsCount || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Categories Available</h3>
              <p className="text-gray-600">
                Categories for this game haven't been set up yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}