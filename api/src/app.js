require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const connectDB = require('./config/database');

const expenseRoutes = require('./routes/expense');
const assetRoutes = require('./routes/asset');
const summaryRoutes = require('./routes/summary');
const categoryRoutes = require('./routes/category');

// Connect to MongoDB
connectDB();

// Register CORS plugin
fastify.register(require('@fastify/cors'), {
  origin: '*', // Allow all origins for now
});

// Register routes
fastify.register(expenseRoutes, { prefix: '/api' });
fastify.register(assetRoutes, { prefix: '/api' });
fastify.register(summaryRoutes, { prefix: '/api' });
fastify.register(categoryRoutes, { prefix: '/api' });

// Health check route
fastify.get('/', async (request, reply) => {
  return { message: 'Budget Manager API is running!' };
});

// Function to start the server
const start = async () => {
  try {
    await fastify.listen({ 
      port: process.env.PORT || 3000, 
      host: '0.0.0.0' 
    });
    fastify.log.info(`🚀 Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
