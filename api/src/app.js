require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const { PrismaClient } = require('@prisma/client');
const expenseRoutes = require('./routes/expense');
const assetRoutes = require('./routes/asset');
const summaryRoutes = require('./routes/summary');

const prisma = new PrismaClient();

// Decorate Fastify with Prisma
fastify.decorate('prisma', prisma);

// Register CORS plugin
fastify.register(require('@fastify/cors'), {
  origin: '*', // Allow all origins for now
});

// Register routes
fastify.register(expenseRoutes, { prefix: '/api' });
fastify.register(assetRoutes, { prefix: '/api' });
fastify.register(summaryRoutes, { prefix: '/api' });

// Function to start the server
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000 });
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
