const incomeController = require('../controllers/incomeController');

const postIncomeSchema = {
  body: {
    type: 'object',
    required: ['source', 'amount'],
    properties: {
      source: { type: 'string' },
      amount: { type: 'number', minimum: 0 },
      description: { type: 'string' },
      date: { type: 'string', format: 'date-time' },
      isRecurring: { type: 'boolean' },
      frequency: { type: 'string', enum: ['weekly', 'monthly', 'yearly'] },
    },
  },
};

const putIncomeSchema = {
  body: {
    type: 'object',
    properties: {
      source: { type: 'string' },
      amount: { type: 'number', minimum: 0 },
      description: { type: 'string' },
      date: { type: 'string', format: 'date-time' },
      isRecurring: { type: 'boolean' },
      frequency: { type: 'string', enum: ['weekly', 'monthly', 'yearly'] },
      isActive: { type: 'boolean' },
    },
  },
};

async function incomeRoutes(fastify, options) {
  fastify.get('/incomes', incomeController.getAllIncomes);
  fastify.post('/incomes', { schema: postIncomeSchema }, incomeController.createIncome);
  fastify.put('/incomes/:id', { schema: putIncomeSchema }, incomeController.updateIncome);
  fastify.delete('/incomes/:id', incomeController.deleteIncome);
  fastify.get('/incomes/monthly-total', incomeController.getMonthlyIncomeTotal);
}

module.exports = incomeRoutes;