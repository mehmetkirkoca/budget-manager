const summaryController = require('../controllers/summaryController');

async function summaryRoutes(fastify, options) {
  fastify.get('/summary', summaryController.getSummary);
}

module.exports = summaryRoutes;
