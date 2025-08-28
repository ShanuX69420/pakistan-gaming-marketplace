import { apiClient } from './client';

export interface ListingSeller {
  id: string;
  username: string;
  memberSince: string;
  totalListings?: number;
}

export interface ListingGame {
  id: string;
  name: string;
  slug: string;
}

export interface ListingCategory {
  id: string;
  name: string;
  slug: string;
  commissionRate?: number;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  description: string;
  deliveryType: 'INSTANT' | 'MANUAL';
  stockType: 'LIMITED' | 'UNLIMITED';
  quantity: number | null;
  images: string[];
  customFields?: any;
  boostedAt?: string;
  createdAt: string;
  seller: ListingSeller;
  game?: ListingGame;
  category?: ListingCategory;
  completedOrders: number;
}

export interface ListingsPaginatedResponse {
  success: boolean;
  game: ListingGame;
  category: ListingCategory;
  listings: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SingleListingResponse {
  success: boolean;
  listing: Listing;
}

export interface ListingsQueryParams {
  page?: number;
  limit?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
  deliveryType?: 'INSTANT' | 'MANUAL';
  stockType?: 'LIMITED' | 'UNLIMITED';
  search?: string;
}

export const listingsApi = {
  // Get listings for a specific category
  getCategoryListings: async (
    gameSlug: string, 
    categorySlug: string, 
    params?: ListingsQueryParams
  ): Promise<ListingsPaginatedResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sort) searchParams.append('sort', params.sort);
    if (params?.deliveryType) searchParams.append('deliveryType', params.deliveryType);
    if (params?.stockType) searchParams.append('stockType', params.stockType);
    if (params?.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const url = `/api/games/${gameSlug}/${categorySlug}/listings${queryString ? '?' + queryString : ''}`;
    
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get single listing by ID
  getListing: async (id: string): Promise<SingleListingResponse> => {
    const response = await apiClient.get(`/api/listings/${id}`);
    return response.data;
  },

  // Create new listing
  createListing: async (listingData: {
    gameId: string;
    categoryId: string;
    title: string;
    price: number;
    description: string;
    deliveryType?: 'INSTANT' | 'MANUAL';
    stockType?: 'LIMITED' | 'UNLIMITED';
    quantity?: number;
    images?: string[];
    customFields?: any;
  }): Promise<SingleListingResponse> => {
    const response = await apiClient.post('/api/listings', listingData);
    return response.data;
  },

  // Update existing listing
  updateListing: async (id: string, updateData: {
    title?: string;
    price?: number;
    description?: string;
    deliveryType?: 'INSTANT' | 'MANUAL';
    stockType?: 'LIMITED' | 'UNLIMITED';
    quantity?: number;
    images?: string[];
    customFields?: any;
    active?: boolean;
    hidden?: boolean;
  }): Promise<SingleListingResponse> => {
    const response = await apiClient.put(`/api/listings/${id}`, updateData);
    return response.data;
  },

  // Delete listing
  deleteListing: async (id: string): Promise<{ success: boolean; message: string; deleted?: boolean; deactivated?: boolean }> => {
    const response = await apiClient.delete(`/api/listings/${id}`);
    return response.data;
  }
};