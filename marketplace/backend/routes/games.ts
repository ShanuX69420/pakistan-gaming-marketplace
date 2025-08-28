import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();

// Create game validation schema
const createGameSchema = z.object({
  name: z.string().min(1, 'Game name is required').max(100, 'Game name must be less than 100 characters'),
  slug: z.string().min(1, 'Game slug is required').max(100, 'Game slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Game slug can only contain lowercase letters, numbers, and hyphens'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  platformTypes: z.array(z.string()).min(1, 'At least one platform type is required'),
  orderIndex: z.number().int().min(0).default(0)
});

// Update game validation schema
const updateGameSchema = z.object({
  name: z.string().min(1, 'Game name is required').max(100, 'Game name must be less than 100 characters').optional(),
  slug: z.string().min(1, 'Game slug is required').max(100, 'Game slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Game slug can only contain lowercase letters, numbers, and hyphens').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  platformTypes: z.array(z.string()).min(1, 'At least one platform type is required').optional(),
  orderIndex: z.number().int().min(0).optional(),
  active: z.boolean().optional()
});

// Create category validation schema
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name must be less than 100 characters'),
  slug: z.string().min(1, 'Category slug is required').max(100, 'Category slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Category slug can only contain lowercase letters, numbers, and hyphens'),
  commissionRate: z.number().min(0).max(100).default(10),
  fieldsConfig: z.any().optional()
});

// Update category validation schema
const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name must be less than 100 characters').optional(),
  slug: z.string().min(1, 'Category slug is required').max(100, 'Category slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Category slug can only contain lowercase letters, numbers, and hyphens').optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  fieldsConfig: z.any().optional(),
  active: z.boolean().optional()
});

// Middleware to check admin role
async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    reply.status(403);
    return reply.send({
      success: false,
      error: 'Admin access required'
    });
  }
}

export default async function gamesRoutes(fastify: FastifyInstance) {
  // GET /api/games - List all active games
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const games = await prisma.game.findMany({
        where: { active: true },
        orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          platformTypes: true,
          orderIndex: true,
          createdAt: true,
          _count: {
            select: {
              categories: { where: { active: true } },
              listings: { where: { active: true } }
            }
          }
        }
      });

      return {
        success: true,
        games: games.map(game => ({
          id: game.id,
          name: game.name,
          slug: game.slug,
          imageUrl: game.imageUrl,
          platformTypes: game.platformTypes,
          orderIndex: game.orderIndex,
          createdAt: game.createdAt,
          categoriesCount: game._count.categories,
          listingsCount: game._count.listings
        }))
      };

    } catch (error) {
      fastify.log.error(`Get games error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });

  // GET /api/games/:slug - Get single game with categories
  fastify.get('/:slug', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const slug = (request as any).params.slug;

      const game = await prisma.game.findUnique({
        where: { slug, active: true },
        include: {
          categories: {
            where: { active: true },
            orderBy: { name: 'asc' },
            select: {
              id: true,
              name: true,
              slug: true,
              commissionRate: true,
              fieldsConfig: true,
              _count: {
                select: {
                  listings: { where: { active: true } }
                }
              }
            }
          },
          _count: {
            select: {
              listings: { where: { active: true } }
            }
          }
        }
      });

      if (!game) {
        reply.status(404);
        return {
          success: false,
          error: 'Game not found'
        };
      }

      return {
        success: true,
        game: {
          id: game.id,
          name: game.name,
          slug: game.slug,
          imageUrl: game.imageUrl,
          platformTypes: game.platformTypes,
          orderIndex: game.orderIndex,
          createdAt: game.createdAt,
          listingsCount: game._count.listings,
          categories: game.categories.map(category => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            commissionRate: Number(category.commissionRate),
            fieldsConfig: category.fieldsConfig,
            listingsCount: category._count.listings
          }))
        }
      };

    } catch (error) {
      fastify.log.error(`Get game error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });

  // POST /api/games/admin - Create game (admin only)
  fastify.post('/admin', {
    preHandler: [requireAuth().preHandler, requireAdmin]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const validationResult = createGameSchema.safeParse((request as any).body);
      
      if (!validationResult.success) {
        reply.status(400);
        return {
          success: false,
          error: validationResult.error.issues[0].message
        };
      }

      const gameData = validationResult.data;

      // Check if slug already exists
      const existingGame = await prisma.game.findUnique({
        where: { slug: gameData.slug }
      });

      if (existingGame) {
        reply.status(409);
        return {
          success: false,
          error: 'Game slug already exists'
        };
      }

      // Create game
      const game = await prisma.game.create({
        data: {
          name: gameData.name,
          slug: gameData.slug,
          imageUrl: gameData.imageUrl,
          platformTypes: gameData.platformTypes,
          orderIndex: gameData.orderIndex,
          active: true
        }
      });

      reply.status(201);
      return {
        success: true,
        game: {
          id: game.id,
          name: game.name,
          slug: game.slug,
          imageUrl: game.imageUrl,
          platformTypes: game.platformTypes,
          orderIndex: game.orderIndex,
          active: game.active,
          createdAt: game.createdAt
        }
      };

    } catch (error) {
      fastify.log.error(`Create game error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });

  // PUT /api/games/admin/:id - Update game (admin only)
  fastify.put('/admin/:id', {
    preHandler: [requireAuth().preHandler, requireAdmin]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const id = (request as any).params.id;

      // Validate request body
      const validationResult = updateGameSchema.safeParse((request as any).body);
      
      if (!validationResult.success) {
        reply.status(400);
        return {
          success: false,
          error: validationResult.error.issues[0].message
        };
      }

      const updateData = validationResult.data;

      // Check if game exists
      const existingGame = await prisma.game.findUnique({
        where: { id }
      });

      if (!existingGame) {
        reply.status(404);
        return {
          success: false,
          error: 'Game not found'
        };
      }

      // Check if slug is being updated and already exists
      if (updateData.slug && updateData.slug !== existingGame.slug) {
        const slugExists = await prisma.game.findUnique({
          where: { slug: updateData.slug }
        });

        if (slugExists) {
          reply.status(409);
          return {
            success: false,
            error: 'Game slug already exists'
          };
        }
      }

      // Update game
      const game = await prisma.game.update({
        where: { id },
        data: updateData
      });

      return {
        success: true,
        game: {
          id: game.id,
          name: game.name,
          slug: game.slug,
          imageUrl: game.imageUrl,
          platformTypes: game.platformTypes,
          orderIndex: game.orderIndex,
          active: game.active,
          createdAt: game.createdAt
        }
      };

    } catch (error) {
      fastify.log.error(`Update game error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });

  // DELETE /api/games/admin/:id - Delete/deactivate game (admin only)
  fastify.delete('/admin/:id', {
    preHandler: [requireAuth().preHandler, requireAdmin]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const id = (request as any).params.id;

      // Check if game exists
      const existingGame = await prisma.game.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              listings: { where: { active: true } }
            }
          }
        }
      });

      if (!existingGame) {
        reply.status(404);
        return {
          success: false,
          error: 'Game not found'
        };
      }

      // If game has active listings, just deactivate it
      if (existingGame._count.listings > 0) {
        await prisma.game.update({
          where: { id },
          data: { active: false }
        });

        return {
          success: true,
          message: 'Game deactivated (had active listings)',
          deactivated: true
        };
      } else {
        // If no active listings, can be safely deleted
        await prisma.game.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Game deleted successfully',
          deleted: true
        };
      }

    } catch (error) {
      fastify.log.error(`Delete game error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });

  // GET /api/games/:gameSlug/categories - List categories for game
  fastify.get('/:gameSlug/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const gameSlug = (request as any).params.gameSlug;

      // First check if the game exists and is active
      const game = await prisma.game.findUnique({
        where: { slug: gameSlug, active: true }
      });

      if (!game) {
        reply.status(404);
        return {
          success: false,
          error: 'Game not found'
        };
      }

      // Get categories for this game
      const categories = await prisma.category.findMany({
        where: { 
          gameId: game.id,
          active: true 
        },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              listings: { where: { active: true } }
            }
          }
        }
      });

      return {
        success: true,
        game: {
          id: game.id,
          name: game.name,
          slug: game.slug
        },
        categories: categories.map(category => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          commissionRate: Number(category.commissionRate),
          fieldsConfig: category.fieldsConfig,
          active: category.active,
          listingsCount: category._count.listings
        }))
      };

    } catch (error) {
      fastify.log.error(`Get categories error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });

  // POST /api/games/admin/:gameId/categories - Create category (admin only)
  fastify.post('/admin/:gameId/categories', {
    preHandler: [requireAuth().preHandler, requireAdmin]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const gameId = (request as any).params.gameId;

      // Validate request body
      const validationResult = createCategorySchema.safeParse((request as any).body);
      
      if (!validationResult.success) {
        reply.status(400);
        return {
          success: false,
          error: validationResult.error.issues[0].message
        };
      }

      const categoryData = validationResult.data;

      // Check if game exists
      const game = await prisma.game.findUnique({
        where: { id: gameId }
      });

      if (!game) {
        reply.status(404);
        return {
          success: false,
          error: 'Game not found'
        };
      }

      // Check if category slug already exists for this game
      const existingCategory = await prisma.category.findUnique({
        where: {
          gameId_slug: {
            gameId: gameId,
            slug: categoryData.slug
          }
        }
      });

      if (existingCategory) {
        reply.status(409);
        return {
          success: false,
          error: 'Category slug already exists for this game'
        };
      }

      // Create category
      const category = await prisma.category.create({
        data: {
          gameId: gameId,
          name: categoryData.name,
          slug: categoryData.slug,
          commissionRate: categoryData.commissionRate,
          fieldsConfig: categoryData.fieldsConfig,
          active: true
        }
      });

      reply.status(201);
      return {
        success: true,
        category: {
          id: category.id,
          gameId: category.gameId,
          name: category.name,
          slug: category.slug,
          commissionRate: Number(category.commissionRate),
          fieldsConfig: category.fieldsConfig,
          active: category.active
        }
      };

    } catch (error) {
      fastify.log.error(`Create category error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });
}