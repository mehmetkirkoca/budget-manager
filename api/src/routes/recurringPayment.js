const recurringPaymentController = require('../controllers/recurringPaymentController');

const postRecurringPaymentSchema = {
  body: {
    type: 'object',
    required: ['name', 'category', 'amount', 'frequency', 'startDate'],
    properties: {
      name: { type: 'string' },
      category: { type: 'string' },
      amount: { type: 'number', minimum: 0 },
      description: { type: 'string' },
      frequency: { type: 'string', enum: ['weekly', 'monthly', 'quarterly', 'yearly'] },
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
      dayOfMonth: { type: 'number', minimum: 1, maximum: 31 },
      dayOfWeek: { type: 'number', minimum: 0, maximum: 6 },
      monthOfYear: { type: 'number', minimum: 1, maximum: 12 },
      autoCreate: { type: 'boolean' },
      reminderDays: { type: 'number', minimum: 0, maximum: 30 },
    },
  },
};

const putRecurringPaymentSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      category: { type: 'string' },
      amount: { type: 'number', minimum: 0 },
      description: { type: 'string' },
      frequency: { type: 'string', enum: ['weekly', 'monthly', 'quarterly', 'yearly'] },
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
      dayOfMonth: { type: 'number', minimum: 1, maximum: 31 },
      dayOfWeek: { type: 'number', minimum: 0, maximum: 6 },
      monthOfYear: { type: 'number', minimum: 1, maximum: 12 },
      autoCreate: { type: 'boolean' },
      reminderDays: { type: 'number', minimum: 0, maximum: 30 },
      isActive: { type: 'boolean' },
    },
  },
};

async function recurringPaymentRoutes(fastify, options) {
  fastify.get('/recurring-payments', recurringPaymentController.getAllRecurringPayments);
  fastify.post('/recurring-payments', { schema: postRecurringPaymentSchema }, recurringPaymentController.createRecurringPayment);
  fastify.put('/recurring-payments/:id', { schema: putRecurringPaymentSchema }, recurringPaymentController.updateRecurringPayment);
  fastify.delete('/recurring-payments/:id', recurringPaymentController.deleteRecurringPayment);
  fastify.get('/recurring-payments/upcoming', recurringPaymentController.getUpcomingPayments);
  fastify.get('/recurring-payments/calendar', recurringPaymentController.getCalendarEvents);
  fastify.post('/recurring-payments/:id/mark-paid', recurringPaymentController.markAsPaid);
}

module.exports = recurringPaymentRoutes;