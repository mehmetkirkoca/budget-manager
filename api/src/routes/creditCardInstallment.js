const {
  getAllInstallments,
  getInstallmentById,
  createInstallment,
  processPayment,
  calculateEarlyPayment,
  getPaymentSchedule,
  getUpcomingPayments,
  getInstallmentSummary,
  updateInstallment,
  deleteInstallment,
  getMonthlyReport
} = require('../controllers/creditCardInstallmentController');

async function creditCardInstallmentRoutes(fastify, options) {
  // Get all installments with filtering and pagination
  fastify.get('/credit-card-installments', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          creditCard: { type: 'string' },
          status: { 
            type: 'string', 
            enum: ['active', 'completed', 'paused', 'defaulted'] 
          },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          page: { type: 'integer', minimum: 1, default: 1 }
        }
      }
    }
  }, getAllInstallments);
  
  // Get upcoming payments
  fastify.get('/credit-card-installments/upcoming', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'integer', minimum: 1, maximum: 365, default: 7 }
        }
      }
    }
  }, getUpcomingPayments);
  
  // Get installment summary by card
  fastify.get('/credit-card-installments/summary', getInstallmentSummary);
  
  // Get monthly report
  fastify.get('/credit-card-installments/monthly-report', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          year: { type: 'integer', minimum: 2020, maximum: 2030 },
          month: { type: 'integer', minimum: 1, maximum: 12 }
        }
      }
    }
  }, getMonthlyReport);
  
  // Get installment by ID
  fastify.get('/credit-card-installments/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, getInstallmentById);
  
  // Get payment schedule for installment
  fastify.get('/credit-card-installments/:id/schedule', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, getPaymentSchedule);
  
  // Calculate early payment amount
  fastify.get('/credit-card-installments/:id/early-payment', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, calculateEarlyPayment);
  
  // Create new installment
  fastify.post('/credit-card-installments', {
    schema: {
      body: {
        type: 'object',
        required: ['creditCard', 'purchaseDescription', 'category', 'originalAmount', 'totalInstallments', 'purchaseDate'],
        properties: {
          creditCard: { type: 'string' },
          purchaseDescription: { type: 'string', minLength: 1 },
          category: { type: 'string' },
          merchant: { type: 'string' },
          originalAmount: { type: 'number', minimum: 1 },
          totalInstallments: { type: 'integer', minimum: 1, maximum: 36 },
          interestRate: { type: 'number', minimum: 0, maximum: 1 },
          purchaseDate: { type: 'string', format: 'date' },
          installmentType: { 
            type: 'string', 
            enum: ['equal', 'balloon', 'interest_first', 'principal_first'],
            default: 'equal'
          },
          earlyPaymentOption: { type: 'boolean', default: true },
          earlyPaymentDiscount: { type: 'number', minimum: 0, maximum: 1, default: 0 },
          autoPayment: { type: 'boolean', default: false },
          isPromotional: { type: 'boolean', default: false },
          promotionalPeriod: { type: 'integer', minimum: 0, default: 0 },
          promotionalRate: { type: 'number', minimum: 0, maximum: 1, default: 0 },
          tags: { 
            type: 'array', 
            items: { type: 'string' } 
          },
          notes: { type: 'string' }
        }
      }
    }
  }, createInstallment);
  
  // Process installment payment
  fastify.post('/credit-card-installments/:id/payment', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['paymentAmount'],
        properties: {
          paymentAmount: { type: 'number', minimum: 0.01 },
          paymentMethod: { 
            type: 'string', 
            enum: ['auto', 'manual', 'early'],
            default: 'manual'
          }
        }
      }
    }
  }, processPayment);
  
  // Update installment
  fastify.put('/credit-card-installments/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          purchaseDescription: { type: 'string', minLength: 1 },
          category: { type: 'string' },
          merchant: { type: 'string' },
          earlyPaymentOption: { type: 'boolean' },
          earlyPaymentDiscount: { type: 'number', minimum: 0, maximum: 1 },
          autoPayment: { type: 'boolean' },
          paymentStatus: { 
            type: 'string', 
            enum: ['active', 'completed', 'paused', 'defaulted'] 
          },
          tags: { 
            type: 'array', 
            items: { type: 'string' } 
          },
          notes: { type: 'string' }
        }
      }
    }
  }, updateInstallment);
  
  // Delete installment
  fastify.delete('/credit-card-installments/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, deleteInstallment);
}

module.exports = creditCardInstallmentRoutes;