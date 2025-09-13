const {
  exportAllData,
  exportCollection,
  exportByDateRange,
  getExportSummary
} = require('../controllers/exportController');

async function exportRoutes(fastify, options) {
  // Get export summary
  fastify.get('/export/summary', getExportSummary);

  // Export all data
  fastify.get('/export/all', exportAllData);

  // Export specific collection
  fastify.get('/export/collection/:collection', {
    schema: {
      params: {
        type: 'object',
        properties: {
          collection: {
            type: 'string',
            enum: ['categories', 'expenses', 'incomes', 'assets', 'recurring-payments', 'credit-cards', 'installments']
          }
        },
        required: ['collection']
      },
      querystring: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['json', 'csv'],
            default: 'json'
          }
        }
      }
    }
  }, exportCollection);

  // Export by date range
  fastify.get('/export/date-range', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            format: 'date'
          },
          endDate: {
            type: 'string',
            format: 'date'
          }
        },
        required: ['startDate', 'endDate']
      }
    }
  }, exportByDateRange);
}

module.exports = exportRoutes;