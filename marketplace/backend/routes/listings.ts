import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();

// Create listing validation schema
const createListingSchema = z.object({
  gameId: z.string().min(1, 'Game ID is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  price: z.number().min(0.01, 'Price must be at least 0.01').max(999999.99, 'Price too high'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description too long'),
  deliveryType: z.enum(['INSTANT', 'MANUAL']).default('MANUAL'),
  stockType: z.enum(['LIMITED', 'UNLIMITED']).default('LIMITED'),
  quantity: z.number().int().min(0).optional(),
  images: z.array(z.string().url()).max(10, 'Maximum 10 images allowed').default([]),
  customFields: z.any().optional()
});

// Update listing validation schema
const updateListingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  price: z.number().min(0.01).max(999999.99).optional(),
  description: z.string().min(1).max(5000).optional(),
  deliveryType: z.enum(['INSTANT', 'MANUAL']).optional(),
  stockType: z.enum(['LIMITED', 'UNLIMITED']).optional(),
  quantity: z.number().int().min(0).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  customFields: z.any().optional(),
  active: z.boolean().optional(),
  hidden: z.boolean().optional()
});

// Query parameters validation schema
const listingsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'oldest']).optional().default('newest'),
  deliveryType: z.enum(['INSTANT', 'MANUAL']).optional(),
  stockType: z.enum(['LIMITED', 'UNLIMITED']).optional(),
  search: z.string().optional()
});

export default async function listingsRoutes(fastify: FastifyInstance) {
  // GET /api/games/:gameSlug/:categorySlug/listings - List category listings
  fastify.get('/games/:gameSlug/:categorySlug/listings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const gameSlug = (request as any).params.gameSlug;
      const categorySlug = (request as any).params.categorySlug;
      
      // Validate query parameters
      const queryResult = listingsQuerySchema.safeParse((request as any).query);
      if (!queryResult.success) {
        reply.status(400);
        return {
          success: false,
          error: queryResult.error.issues[0].message
        };
      }

      const { page, limit, sort, deliveryType, stockType, search } = queryResult.data;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Find the game and category
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

      const category = await prisma.category.findUnique({
        where: {
          gameId_slug: {
            gameId: game.id,
            slug: categorySlug
          },
          active: true
        }
      });

      if (!category) {
        reply.status(404);
        return {
          success: false,
          error: 'Category not found'
        };
      }

      // Build where clause
      const where: any = {
        gameId: game.id,
        categoryId: category.id,
        active: true,
        hidden: false
      };

      if (deliveryType) {
        where.deliveryType = deliveryType;
      }
      if (stockType) {
        where.stockType = stockType;
      }
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Build orderBy clause
      let orderBy: any = {};
      switch (sort) {
        case 'price_asc':
          orderBy = { price: 'asc' };
          break;
        case 'price_desc':
          orderBy = { price: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        default: // newest
          orderBy = { createdAt: 'desc' };
      }

      // Get listings and total count
      const [listings, total] = await Promise.all([
        prisma.listing.findMany({
          where,
          orderBy,
          skip,
          take: limitNum,
          include: {
            seller: {
              select: {
                id: true,
                username: true,
                createdAt: true
              }
            },
            _count: {
              select: {
                orders: { where: { status: 'COMPLETED' } }
              }
            }
          }
        }),
        prisma.listing.count({ where })
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return {
        success: true,
        game: {
          id: game.id,
          name: game.name,
          slug: game.slug
        },
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug
        },
        listings: listings.map(listing => ({
          id: listing.id,
          title: listing.title,
          price: Number(listing.price),
          description: listing.description,
          deliveryType: listing.deliveryType,
          stockType: listing.stockType,
          quantity: listing.quantity,
          images: listing.images,
          customFields: listing.customFields,
          createdAt: listing.createdAt,
          seller: {
            id: listing.seller.id,
            username: listing.seller.username,
            memberSince: listing.seller.createdAt
          },
          completedOrders: listing._count.orders
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      };

    } catch (error) {
      fastify.log.error(`Get listings error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });

  // GET /api/listings/:id - Get single listing
  fastify.get('/listings/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const id = (request as any).params.id;

      const listing = await prisma.listing.findUnique({
        where: { id, active: true, hidden: false },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              createdAt: true,
              _count: {
                select: {
                  listings: { where: { active: true } }
                }
              }
            }
          },
          game: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              commissionRate: true
            }
          },
          _count: {
            select: {
              orders: { where: { status: 'COMPLETED' } }
            }
          }
        }
      });

      if (!listing) {
        reply.status(404);
        return {
          success: false,
          error: 'Listing not found'
        };
      }

      return {
        success: true,
        listing: {
          id: listing.id,
          title: listing.title,
          price: Number(listing.price),
          description: listing.description,
          deliveryType: listing.deliveryType,
          stockType: listing.stockType,
          quantity: listing.quantity,
          images: listing.images,
          customFields: listing.customFields,
          boostedAt: listing.boostedAt,
          createdAt: listing.createdAt,
          game: listing.game,
          category: {
            ...listing.category,
            commissionRate: Number(listing.category.commissionRate)
          },
          seller: {
            id: listing.seller.id,
            username: listing.seller.username,
            memberSince: listing.seller.createdAt,
            totalListings: listing.seller._count.listings
          },
          completedOrders: listing._count.orders
        }
      };

    } catch (error) {
      fastify.log.error(`Get listing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });

  // POST /api/listings - Create listing (auth required)
  fastify.post('/listings', {
    preHandler: requireAuth().preHandler
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;

      // Validate request body
      const validationResult = createListingSchema.safeParse((request as any).body);
      
      if (!validationResult.success) {
        reply.status(400);
        return {
          success: false,
          error: validationResult.error.issues[0].message
        };
      }

      const listingData = validationResult.data;

      // Verify game exists and is active
      const game = await prisma.game.findUnique({
        where: { id: listingData.gameId, active: true }
      });

      if (!game) {
        reply.status(404);
        return {
          success: false,
          error: 'Game not found'
        };
      }

      // Verify category exists and belongs to the game
      const category = await prisma.category.findUnique({
        where: { 
          id: listingData.categoryId,
          gameId: listingData.gameId,
          active: true
        }
      });

      if (!category) {
        reply.status(404);
        return {
          success: false,
          error: 'Category not found'
        };
      }

      // Create listing
      const listing = await prisma.listing.create({
        data: {
          sellerId: user.id,
          gameId: listingData.gameId,
          categoryId: listingData.categoryId,
          title: listingData.title,
          price: listingData.price,
          description: listingData.description,
          deliveryType: listingData.deliveryType,
          stockType: listingData.stockType,
          quantity: listingData.quantity,
          images: listingData.images,
          customFields: listingData.customFields,
          active: true,
          hidden: false
        },
        include: {
          game: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      reply.status(201);
      return {
        success: true,
        listing: {
          id: listing.id,
          title: listing.title,
          price: Number(listing.price),
          description: listing.description,
          deliveryType: listing.deliveryType,
          stockType: listing.stockType,
          quantity: listing.quantity,
          images: listing.images,
          customFields: listing.customFields,
          active: listing.active,
          hidden: listing.hidden,
          createdAt: listing.createdAt,
          game: listing.game,
          category: listing.category
        }
      };

    } catch (error) {
      fastify.log.error(`Create listing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });

  // PUT /api/listings/:id - Update listing (owner only)
  fastify.put('/listings/:id', {
    preHandler: requireAuth().preHandler
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const id = (request as any).params.id;

      // Validate request body
      const validationResult = updateListingSchema.safeParse((request as any).body);
      
      if (!validationResult.success) {
        reply.status(400);
        return {
          success: false,
          error: validationResult.error.issues[0].message
        };
      }

      const updateData = validationResult.data;

      // Check if listing exists and user is owner
      const existingListing = await prisma.listing.findUnique({
        where: { id },
        include: {
          game: true,
          category: true
        }
      });

      if (!existingListing) {
        reply.status(404);
        return {
          success: false,
          error: 'Listing not found'
        };
      }

      if (existingListing.sellerId !== user.id) {
        reply.status(403);
        return {
          success: false,
          error: 'You can only update your own listings'
        };
      }

      // Update listing
      const listing = await prisma.listing.update({
        where: { id },
        data: updateData,
        include: {
          game: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      return {
        success: true,
        listing: {
          id: listing.id,
          title: listing.title,
          price: Number(listing.price),
          description: listing.description,
          deliveryType: listing.deliveryType,
          stockType: listing.stockType,
          quantity: listing.quantity,
          images: listing.images,
          customFields: listing.customFields,
          active: listing.active,
          hidden: listing.hidden,
          createdAt: listing.createdAt,
          game: listing.game,
          category: listing.category
        }
      };

    } catch (error) {
      fastify.log.error(`Update listing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });

  // DELETE /api/listings/:id - Delete listing (owner only)
  fastify.delete('/listings/:id', {
    preHandler: requireAuth().preHandler
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const id = (request as any).params.id;

      // Check if listing exists and user is owner
      const existingListing = await prisma.listing.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              orders: { 
                where: { 
                  status: { 
                    in: ['PENDING', 'PAID', 'DELIVERED'] 
                  } 
                } 
              }
            }
          }
        }
      });

      if (!existingListing) {
        reply.status(404);
        return {
          success: false,
          error: 'Listing not found'
        };
      }

      if (existingListing.sellerId !== user.id) {
        reply.status(403);
        return {
          success: false,
          error: 'You can only delete your own listings'
        };
      }

      // If listing has pending orders, deactivate instead of delete
      if (existingListing._count.orders > 0) {
        await prisma.listing.update({
          where: { id },
          data: { active: false }
        });

        return {
          success: true,
          message: 'Listing deactivated (had pending orders)',
          deactivated: true
        };
      } else {
        // Safe to delete
        await prisma.listing.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Listing deleted successfully',
          deleted: true
        };
      }

    } catch (error) {
      fastify.log.error(`Delete listing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });
}