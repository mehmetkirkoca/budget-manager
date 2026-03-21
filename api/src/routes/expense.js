const expenseController = require('../controllers/expenseController');

const postExpenseSchema = {
  body: {
    type: 'object',
    required: ['category', 'amount', 'date'],
    properties: {
      category: { type: 'string' },
      description: { type: 'string' },
      amount: { type: 'number' },
      date: { type: 'string', format: 'date-time' },
      status: { type: 'string', enum: ['pending', 'completed'] },
    },
  },
};

const getExpensesSchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
      status: { type: 'string', enum: ['pending', 'completed'] }
    }
  }
};

async function expenseRoutes(fastify, options) {
  fastify.get('/expenses', { schema: getExpensesSchema }, expenseController.getAllExpenses);
  fastify.post('/expenses', { schema: postExpenseSchema }, expenseController.createExpense);
  fastify.put('/expenses/:id', expenseController.updateExpense);
  fastify.delete('/expenses/:id', expenseController.deleteExpense);
  fastify.get('/expenses/by-category', {
    schema: { querystring: { type: 'object', properties: { month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' } } } }
  }, expenseController.getExpensesByCategory);
}

module.exports = expenseRoutes;
