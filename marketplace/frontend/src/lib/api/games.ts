import { apiClient, ApiResponse } from './client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  commissionRate: number;
  fieldsConfig?: any;
  active: boolean;
  listingsCount?: number;
}

export interface Game {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  platformTypes: string[];
  orderIndex: number;
  createdAt: string;
  categoriesCount?: number;
  listingsCount?: number;
  categories?: Category[];
}

export interface GamesResponse {
  games: Game[];
}

export interface GameWithCategoriesResponse {
  game: Game;
}

export const gamesApi = {
  // Get all games
  getGames: async (): Promise<ApiResponse<GamesResponse>> => {
    return apiClient.getPublic<GamesResponse>('/api/games');
  },

  // Get single game by slug
  getGameBySlug: async (slug: string): Promise<ApiResponse<GameWithCategoriesResponse>> => {
    return apiClient.getPublic<GameWithCategoriesResponse>(`/api/games/${slug}`);
  },
};