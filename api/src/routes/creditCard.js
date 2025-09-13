const {
  getAllCreditCards,
  getCreditCardById,
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  getCreditCardSummary,
  getCreditCardDetails,
  updateCreditCardBalance,
  getPaymentCalendar
} = require('../controllers/creditCardController');

async function creditCardRoutes(fastify, options) {
  // Get all credit cards
  fastify.get('/credit-cards', getAllCreditCards);
  
  // Get credit card summary
  fastify.get('/credit-cards/summary', getCreditCardSummary);
  
  // Get payment calendar
  fastify.get('/credit-cards/payment-calendar', getPaymentCalendar);
  
  // Get credit card by ID
  fastify.get('/credit-cards/:id', getCreditCardById);
  
  // Get credit card details with installments
  fastify.get('/credit-cards/:id/details', getCreditCardDetails);
  
  // Create new credit card
  fastify.post('/credit-cards', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'bankName', 'cardType', 'cardNumber', 'totalLimit', 'availableLimit', 'statementDay', 'paymentDueDay'],
        properties: {
          name: { type: 'string', minLength: 1 },
          bankName: { type: 'string', minLength: 1 },
          cardType: { 
            type: 'string', 
            enum: ['visa', 'mastercard', 'americanexpress', 'troy'] 
          },
          cardNumber: { 
            type: 'string', 
            pattern: '^\\d{4}$' 
          },
          totalLimit: { type: 'number', minimum: 0 },
          availableLimit: { type: 'number', minimum: 0 },
          currentBalance: { type: 'number', minimum: 0, default: 0 },
          minimumPaymentRate: { type: 'number', minimum: 0, maximum: 1, default: 0.03 },
          interestRate: {
            type: 'object',
            properties: {
              monthly: { type: 'number', minimum: 0, maximum: 1, default: 0.0299 },
              annual: { type: 'number', minimum: 0, maximum: 10, default: 0.359 }
            }
          },
          statementDay: { type: 'number', minimum: 1, maximum: 31 },
          paymentDueDay: { type: 'number', minimum: 1, maximum: 31 },
          gracePeriodDays: { type: 'number', minimum: 0, default: 45 },
          cashAdvanceRate: { type: 'number', minimum: 0, maximum: 1, default: 0.04 },
          fees: {
            type: 'object',
            properties: {
              annualFee: { type: 'number', minimum: 0, default: 0 },
              latePaymentFee: { type: 'number', minimum: 0, default: 50 },
              overlimitFee: { type: 'number', minimum: 0, default: 100 }
            }
          }
        }
      }
    }
  }, createCreditCard);
  
  // Update credit card
  fastify.put('/credit-cards/:id', {
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
          name: { type: 'string', minLength: 1 },
          bankName: { type: 'string', minLength: 1 },
          cardType: { 
            type: 'string', 
            enum: ['visa', 'mastercard', 'americanexpress', 'troy'] 
          },
          totalLimit: { type: 'number', minimum: 0 },
          availableLimit: { type: 'number', minimum: 0 },
          currentBalance: { type: 'number', minimum: 0 },
          minimumPaymentRate: { type: 'number', minimum: 0, maximum: 1 },
          interestRate: {
            type: 'object',
            properties: {
              monthly: { type: 'number', minimum: 0, maximum: 1 },
              annual: { type: 'number', minimum: 0, maximum: 10 }
            }
          },
          statementDay: { type: 'number', minimum: 1, maximum: 31 },
          paymentDueDay: { type: 'number', minimum: 1, maximum: 31 },
          gracePeriodDays: { type: 'number', minimum: 0 },
          cashAdvanceRate: { type: 'number', minimum: 0, maximum: 1 },
          fees: {
            type: 'object',
            properties: {
              annualFee: { type: 'number', minimum: 0 },
              latePaymentFee: { type: 'number', minimum: 0 },
              overlimitFee: { type: 'number', minimum: 0 }
            }
          }
        }
      }
    }
  }, updateCreditCard);
  
  // Update credit card balance
  fastify.patch('/credit-cards/:id/balance', {
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
          currentBalance: { type: 'number', minimum: 0 },
          availableLimit: { type: 'number', minimum: 0 }
        }
      }
    }
  }, updateCreditCardBalance);
  
  // Delete credit card (soft delete)
  fastify.delete('/credit-cards/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, deleteCreditCard);
}

module.exports = creditCardRoutes;