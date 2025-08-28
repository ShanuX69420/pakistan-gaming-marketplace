import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();

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

export default async function categoriesRoutes(fastify: FastifyInstance) {
  // PUT /api/admin/categories/:id - Update category (admin only)
  fastify.put('/admin/:id', {
    preHandler: [requireAuth().preHandler, requireAdmin]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const id = (request as any).params.id;

      // Validate request body
      const validationResult = updateCategorySchema.safeParse((request as any).body);
      
      if (!validationResult.success) {
        reply.status(400);
        return {
          success: false,
          error: validationResult.error.issues[0].message
        };
      }

      const updateData = validationResult.data;

      // Check if category exists
      const existingCategory = await prisma.category.findUnique({
        where: { id },
        include: {
          game: true
        }
      });

      if (!existingCategory) {
        reply.status(404);
        return {
          success: false,
          error: 'Category not found'
        };
      }

      // Check if slug is being updated and already exists for this game
      if (updateData.slug && updateData.slug !== existingCategory.slug) {
        const slugExists = await prisma.category.findUnique({
          where: {
            gameId_slug: {
              gameId: existingCategory.gameId,
              slug: updateData.slug
            }
          }
        });

        if (slugExists) {
          reply.status(409);
          return {
            success: false,
            error: 'Category slug already exists for this game'
          };
        }
      }

      // Update category
      const category = await prisma.category.update({
        where: { id },
        data: updateData,
        include: {
          game: {
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
        category: {
          id: category.id,
          gameId: category.gameId,
          name: category.name,
          slug: category.slug,
          commissionRate: Number(category.commissionRate),
          fieldsConfig: category.fieldsConfig,
          active: category.active,
          game: category.game
        }
      };

    } catch (error) {
      fastify.log.error(`Update category error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });

  // DELETE /api/admin/categories/:id - Delete/deactivate category (admin only)
  fastify.delete('/admin/:id', {
    preHandler: [requireAuth().preHandler, requireAdmin]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const id = (request as any).params.id;

      // Check if category exists
      const existingCategory = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              listings: { where: { active: true } }
            }
          },
          game: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      if (!existingCategory) {
        reply.status(404);
        return {
          success: false,
          error: 'Category not found'
        };
      }

      // If category has active listings, just deactivate it
      if (existingCategory._count.listings > 0) {
        const category = await prisma.category.update({
          where: { id },
          data: { active: false }
        });

        return {
          success: true,
          message: 'Category deactivated (had active listings)',
          deactivated: true,
          category: {
            id: category.id,
            gameId: category.gameId,
            name: category.name,
            slug: category.slug,
            active: category.active,
            game: existingCategory.game
          }
        };
      } else {
        // If no active listings, can be safely deleted
        await prisma.category.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Category deleted successfully',
          deleted: true,
          category: {
            id: existingCategory.id,
            gameId: existingCategory.gameId,
            name: existingCategory.name,
            slug: existingCategory.slug,
            game: existingCategory.game
          }
        };
      }

    } catch (error) {
      fastify.log.error(`Delete category error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });
}