require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const connectDB = require('./config/database');
const { autoProcessMiddleware } = require('./middleware/autoProcessMiddleware');

const expenseRoutes = require('./routes/expense');
const assetRoutes = require('./routes/asset');
const summaryRoutes = require('./routes/summary');
const categoryRoutes = require('./routes/category');
const incomeRoutes = require('./routes/income');
const recurringPaymentRoutes = require('./routes/recurringPayment');
const autoProcessRoutes = require('./routes/autoProcess');
const creditCardRoutes = require('./routes/creditCard');
const creditCardInstallmentRoutes = require('./routes/creditCardInstallment');
const exportRoutes = require('./routes/export');
const importRoutes = require('./routes/import');

// Connect to MongoDB
connectDB();

// Register CORS plugin
fastify.register(require('@fastify/cors'), {
  origin: '*', // Allow all origins for now
});

// Register auto-process middleware
fastify.addHook('preHandler', autoProcessMiddleware);

// Register routes
fastify.register(expenseRoutes, { prefix: '/api' });
fastify.register(assetRoutes, { prefix: '/api' });
fastify.register(summaryRoutes, { prefix: '/api' });
fastify.register(categoryRoutes, { prefix: '/api' });
fastify.register(incomeRoutes, { prefix: '/api' });
fastify.register(recurringPaymentRoutes, { prefix: '/api' });
fastify.register(autoProcessRoutes, { prefix: '/api' });
fastify.register(creditCardRoutes, { prefix: '/api' });
fastify.register(creditCardInstallmentRoutes, { prefix: '/api' });
fastify.register(exportRoutes, { prefix: '/api' });
fastify.register(importRoutes, { prefix: '/api/import' });

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
