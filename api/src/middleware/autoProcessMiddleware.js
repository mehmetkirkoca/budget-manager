const recurringPaymentProcessor = require('../services/recurringPaymentProcessor');

/**
 * Middleware to automatically process due recurring payments
 * Triggers on the first API call of each day
 */
const autoProcessMiddleware = async (request, reply) => {
  try {
    // Only process on specific routes to avoid unnecessary overhead
    const shouldProcess = [
      '/api/summary',
      '/api/expenses',
      '/api/recurring-payments',
      '/' // Dashboard route
    ].some(route => request.url.startsWith(route));

    if (shouldProcess && recurringPaymentProcessor.shouldProcessToday()) {
      console.log('🚀 Auto-processing middleware triggered');
      
      // Process in background without blocking the request
      setImmediate(async () => {
        try {
          const results = await recurringPaymentProcessor.processDuePayments();
          
          if (results.processed > 0) {
            console.log(`✅ Auto-processed ${results.processed} recurring payments`);
            
            // Optionally log detailed results
            if (results.created.length > 0) {
              console.log('📝 Created expenses:');
              results.created.forEach(expense => {
                console.log(`  - ${expense.paymentName}: ${expense.amount} TRY`);
              });
            }
            
            if (results.errors.length > 0) {
              console.log('❌ Processing errors:');
              results.errors.forEach(error => {
                console.log(`  - ${error.paymentName || 'General'}: ${error.error}`);
              });
            }
          }
        } catch (error) {
          console.error('❌ Auto-processing middleware error:', error);
        }
      });
    }
  } catch (error) {
    console.error('❌ Auto-processing middleware failed:', error);
    // Continue with request even if processing fails
  }
};

/**
 * Get current processing status
 */
const getProcessingStatus = () => {
  return recurringPaymentProcessor.getProcessingStatus();
};

/**
 * Manual trigger for processing (for testing or admin purposes)
 */
const manualTrigger = async () => {
  return await recurringPaymentProcessor.processDuePayments();
};

/**
 * Reset processing status (for testing)
 */
const resetProcessingStatus = () => {
  recurringPaymentProcessor.resetProcessingStatus();
};

module.exports = {
  autoProcessMiddleware,
  getProcessingStatus,
  manualTrigger,
  resetProcessingStatus
};