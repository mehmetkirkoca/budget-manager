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
      status: { type: 'string', enum: ['Beklenen', 'Gerçekleşti'] },
    },
  },
};

async function expenseRoutes(fastify, options) {
  fastify.get('/expenses', expenseController.getAllExpenses);
  fastify.post('/expenses', { schema: postExpenseSchema }, expenseController.createExpense);
  fastify.put('/expenses/:id', expenseController.updateExpense);
  fastify.delete('/expenses/:id', expenseController.deleteExpense);
  fastify.get('/expenses/by-category', expenseController.getExpensesByCategory);
}

module.exports = expenseRoutes;
