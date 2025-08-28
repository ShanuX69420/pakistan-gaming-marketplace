import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Authentication middleware function
export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Check if Authorization header exists
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401);
      return reply.send({
        success: false,
        error: 'Access token required'
      });
    }

    // Extract token from header
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token using Fastify's JWT plugin
    const decoded = request.server.jwt.verify(token) as any;

    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      reply.status(401);
      return reply.send({
        success: false,
        error: 'Invalid token - user not found'
      });
    }

    // Attach user to request object
    (request as any).user = {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      verified: user.verified,
      balance: Number(user.balance),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

  } catch (error) {
    reply.status(401);
    return reply.send({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}

// Helper function to create protected routes
export function requireAuth() {
  return {
    preHandler: authenticateToken
  };
}