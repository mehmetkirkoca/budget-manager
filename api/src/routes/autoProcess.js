const { getProcessingStatus, manualTrigger, resetProcessingStatus } = require('../middleware/autoProcessMiddleware');

async function autoProcessRoutes(fastify, options) {
  // Get current auto-processing status
  fastify.get('/auto-process/status', async (request, reply) => {
    try {
      const status = getProcessingStatus();
      reply.send(status);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Manual trigger for processing (admin/testing purposes)
  fastify.post('/auto-process/trigger', async (request, reply) => {
    try {
      const results = await manualTrigger();
      reply.send({
        message: 'Manual processing triggered',
        results
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Reset processing status (testing purposes)
  fastify.post('/auto-process/reset', async (request, reply) => {
    try {
      resetProcessingStatus();
      reply.send({
        message: 'Processing status reset successfully'
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Get today's processed payments summary
  fastify.get('/auto-process/today-summary', async (request, reply) => {
    try {
      const status = getProcessingStatus();
      
      // If processed today, get expenses created from recurring payments
      let todaysExpenses = [];
      if (status.lastProcessedDate === new Date().toDateString()) {
        const Expense = require('../models/Expense');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        todaysExpenses = await Expense.find({
          recurringPaymentId: { $ne: null },
          createdAt: {
            $gte: today,
            $lt: tomorrow
          }
        }).populate('category').populate('recurringPaymentId');
      }

      reply.send({
        processedToday: status.lastProcessedDate === new Date().toDateString(),
        lastProcessedDate: status.lastProcessedDate,
        todaysExpenses: todaysExpenses,
        count: todaysExpenses.length,
        totalAmount: todaysExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });
}

module.exports = autoProcessRoutes;