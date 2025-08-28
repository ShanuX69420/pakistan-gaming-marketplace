import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

const prisma = new PrismaClient();

// Registration validation schema
const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Invalid email format')
    .toLowerCase(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
});

// Login validation schema
const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase(),
  password: z.string()
    .min(1, 'Password is required')
});

interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export default async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/register
  fastify.post('/register', async (
    request: FastifyRequest<{ Body: RegisterBody }>, 
    reply: FastifyReply
  ) => {
    try {
      // Validate request body
      const validationResult = registerSchema.safeParse(request.body);
      
      if (!validationResult.success) {
        reply.status(400);
        return {
          success: false,
          error: validationResult.error.issues[0].message
        };
      }

      const { username, email, password } = validationResult.data;

      // Check for existing user with same email or username
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email },
            { username: username }
          ]
        }
      });

      if (existingUser) {
        reply.status(409);
        return {
          success: false,
          error: existingUser.email === email ? 'Email already exists' : 'Username already exists'
        };
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          role: 'USER',
          verified: false,
          balance: 0
        }
      });

      // Return user data (excluding password hash)
      reply.status(201);
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          verified: user.verified,
          balance: Number(user.balance),
          createdAt: user.createdAt
        }
      };

    } catch (error) {
      fastify.log.error(`Registration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });

  // POST /api/auth/login
  fastify.post('/login', async (
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply
  ) => {
    try {
      // Validate request body
      const validationResult = loginSchema.safeParse(request.body);
      
      if (!validationResult.success) {
        reply.status(400);
        return {
          success: false,
          error: validationResult.error.issues[0].message
        };
      }

      const { email, password } = validationResult.data;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        reply.status(401);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        reply.status(401);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Generate JWT token
      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Return success response
      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          verified: user.verified,
          balance: Number(user.balance),
          createdAt: user.createdAt
        }
      };

    } catch (error) {
      fastify.log.error(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });

  // GET /api/auth/me - Get current user info (protected route)
  fastify.get('/me', requireAuth(), async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // User is already attached to request by authentication middleware
      const user = (request as any).user;
      
      if (!user) {
        reply.status(401);
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          verified: user.verified,
          balance: user.balance,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      };

    } catch (error) {
      fastify.log.error(`Get user info error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.status(500);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  });
}