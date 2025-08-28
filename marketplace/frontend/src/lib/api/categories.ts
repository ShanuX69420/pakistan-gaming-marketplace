import { apiClient, ApiResponse } from './client';

export interface Category {
  id: string;
  gameId: string;
  name: string;
  slug: string;
  commissionRate: number;
  fieldsConfig?: any;
  active: boolean;
  listingsCount?: number;
}

export interface CategoriesResponse {
  categories: Category[];
}

export const categoriesApi = {
  // Get categories for a game
  getGameCategories: async (gameSlug: string): Promise<ApiResponse<CategoriesResponse>> => {
    return apiClient.getPublic<CategoriesResponse>(`/api/games/${gameSlug}/categories`);
  },

  // Get single category
  getCategory: async (gameSlug: string, categorySlug: string): Promise<ApiResponse<Category>> => {
    return apiClient.getPublic<Category>(`/api/games/${gameSlug}/categories/${categorySlug}`);
  },
};