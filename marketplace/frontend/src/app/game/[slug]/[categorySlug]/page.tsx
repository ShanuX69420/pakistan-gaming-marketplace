'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Filter, Search, Star, Clock, Package, User } from 'lucide-react';
import { listingsApi, Listing } from '@/lib/api/listings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function CategoryListingsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const gameSlug = params.slug as string;
  const categorySlug = params.categorySlug as string;

  // State for filters
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc'>('newest');
  const [deliveryFilter, setDeliveryFilter] = useState<'INSTANT' | 'MANUAL' | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Ref for search input to maintain focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    setIsTyping(true); // User started typing
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page when search changes
      setIsTyping(false); // User finished typing
    }, 500); // Increased to 500ms for better UX

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch listings data
  const { data: listingsResponse, isLoading, error, isFetching } = useQuery({
    queryKey: ['categoryListings', gameSlug, categorySlug, currentPage, sortBy, deliveryFilter, debouncedSearchQuery],
    queryFn: () => listingsApi.getCategoryListings(gameSlug, categorySlug, {
      page: currentPage,
      limit: 20,
      sort: sortBy,
      deliveryType: deliveryFilter || undefined,
      search: debouncedSearchQuery || undefined,
    }),
    enabled: !!(gameSlug && categorySlug),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by debouncing, just prevent form submission
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setCurrentPage(1);
    if (filterType === 'sort') setSortBy(value);
    if (filterType === 'delivery') setDeliveryFilter(value);
    // No need to refetch manually - React Query will handle it automatically
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-96 bg-gray-300 rounded mb-4"></div>
            <div className="h-16 w-full bg-gray-300 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listingsResponse?.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-4">The category you're looking for doesn't exist or has been removed.</p>
          <Link href={`/game/${gameSlug}`} className="text-blue-600 hover:text-blue-800">
            ← Back to Game
          </Link>
        </div>
      </div>
    );
  }

  const { game, category, listings, pagination } = listingsResponse;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-700">
            Home
          </Link>
          <ChevronRight size={16} />
          <Link href={`/game/${gameSlug}`} className="hover:text-gray-700">
            {game.name}
          </Link>
          <ChevronRight size={16} />
          <span className="text-gray-800 font-medium">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {category.name} - {game.name}
              </h1>
              <p className="text-gray-600">
                {pagination.total} {pagination.total === 1 ? 'listing' : 'listings'} available
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                Commission: {category.commissionRate}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {isFetching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
                  </div>
                )}
              </div>
            </form>

            {/* Sort and Filter Controls */}
            <div className="flex flex-wrap gap-2">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>

              {/* Delivery Type Filter */}
              <select
                value={deliveryFilter}
                onChange={(e) => handleFilterChange('delivery', e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Delivery Types</option>
                <option value="INSTANT">Instant Delivery</option>
                <option value="MANUAL">Manual Delivery</option>
              </select>

              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter size={16} />
              </Button>
            </div>
          </div>

          {/* Additional filters for mobile */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t lg:hidden">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Type</label>
                  <select
                    value={deliveryFilter}
                    onChange={(e) => handleFilterChange('delivery', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="INSTANT">Instant</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Listings Grid */}
        {listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} listings
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={!pagination.hasPrev}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-2 text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={!pagination.hasNext}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Listings Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || deliveryFilter 
                ? "No listings match your search criteria. Try adjusting your filters."
                : "There are currently no listings in this category."}
            </p>
            {(searchQuery || deliveryFilter) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setDeliveryFilter('');
                  setCurrentPage(1);
                  // React Query will automatically refetch when the dependencies change
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Listing Card Component
function ListingCard({ listing }: { listing: Listing }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Link href={`/listing/${listing.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        {/* Listing Image */}
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          {listing.images && listing.images.length > 0 ? (
            <Image
              src={listing.images[0]}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <Package size={32} className="text-gray-400" />
            </div>
          )}
          
          {/* Delivery Type Badge */}
          <div className="absolute top-2 right-2">
            <Badge 
              variant={listing.deliveryType === 'INSTANT' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {listing.deliveryType === 'INSTANT' ? (
                <>
                  <Clock size={12} className="mr-1" />
                  Instant
                </>
              ) : (
                <>
                  <User size={12} className="mr-1" />
                  Manual
                </>
              )}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Title and Price */}
          <div className="mb-3">
            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
              {listing.title}
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {formatPrice(listing.price)}
            </p>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {listing.description}
          </p>

          {/* Seller Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <div className="flex items-center gap-1">
              <User size={12} />
              <span>{listing.seller.username}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={12} />
              <span>{listing.completedOrders} sales</span>
            </div>
          </div>

          {/* Stock and Date */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              {listing.stockType === 'LIMITED' && listing.quantity !== null ? (
                <span>Stock: {listing.quantity}</span>
              ) : (
                <span>Unlimited Stock</span>
              )}
            </div>
            <span>{formatDate(listing.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}