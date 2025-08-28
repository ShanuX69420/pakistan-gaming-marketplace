import { apiClient, ApiResponse } from './client';

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
}

export interface GamesResponse {
  games: Game[];
}

export const gamesApi = {
  // Get all games
  getGames: async (): Promise<ApiResponse<GamesResponse>> => {
    return apiClient.getPublic<GamesResponse>('/api/games');
  },

  // Get single game by slug
  getGameBySlug: async (slug: string): Promise<ApiResponse<Game>> => {
    return apiClient.getPublic<Game>(`/api/games/${slug}`);
  },
};