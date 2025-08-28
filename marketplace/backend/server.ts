import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import gamesRoutes from './routes/games';
import categoriesRoutes from './routes/categories';
import listingsRoutes from './routes/listings';

const prisma = new PrismaClient();

const fastify = Fastify({
  logger: true
});

// Register CORS
fastify.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'], // Frontend URL
  credentials: true
});

// Register JWT
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'pakistan-gaming-marketplace-super-secret-key-2024',
  sign: {
    expiresIn: '7d' // Token expires in 7 days
  }
});

// Register API routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(gamesRoutes, { prefix: '/api/games' });
fastify.register(categoriesRoutes, { prefix: '/api/categories' });
fastify.register(listingsRoutes, { prefix: '/api' });

// Basic health check route
fastify.get('/', async (request, reply) => {
  return { 
    message: 'Pakistan Gaming Marketplace API',
    status: 'running',
    timestamp: new Date().toISOString()
  };
});

// Hello World route for testing
fastify.get('/hello', async (request, reply) => {
  return { message: 'Hello World from Pakistan Gaming Marketplace!' };
});

// Database connection test route
fastify.get('/db-test', async (request, reply) => {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return { 
      message: 'Database connection successful',
      status: 'connected',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    reply.status(500);
    return { 
      message: 'Database connection failed',
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
});

const start = async () => {
  try {
    const port = process.env.PORT || 8000;
    await fastify.listen({ port: Number(port), host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();