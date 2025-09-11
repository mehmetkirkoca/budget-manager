const RecurringPayment = require('../models/RecurringPayment');
const Expense = require('../models/Expense');

class RecurringPaymentProcessor {
  constructor() {
    this.lastProcessedDate = null;
    this.processingLock = false;
  }

  /**
   * Check if we need to process payments today
   */
  shouldProcessToday() {
    const today = new Date().toDateString();
    return this.lastProcessedDate !== today && !this.processingLock;
  }

  /**
   * Get due payments using efficient MongoDB aggregate pipeline
   */
  async getDuePaymentsAggregate() {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    return await RecurringPayment.aggregate([
      // Stage 1: Filter active recurring payments that are due and have autoCreate enabled
      {
        $match: {
          isActive: true,
          autoCreate: true,
          nextDue: { $lte: today }
        }
      },

      // Stage 2: Join with categories to get category info
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },

      // Stage 3: Check if expense already exists for this payment and date
      {
        $lookup: {
          from: 'expenses',
          let: { 
            paymentName: '$name', 
            paymentAmount: '$amount',
            dueDate: '$nextDue',
            categoryId: '$category'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$category', '$$categoryId'] },
                    { $eq: ['$amount', '$$paymentAmount'] },
                    { $gte: ['$date', { $dateSubtract: { startDate: '$$dueDate', unit: 'day', amount: 1 } }] },
                    { $lte: ['$date', { $dateAdd: { startDate: '$$dueDate', unit: 'day', amount: 1 } }] },
                    { $regexMatch: { input: '$description', regex: '$$paymentName', options: 'i' } }
                  ]
                }
              }
            }
          ],
          as: 'existingExpenses'
        }
      },

      // Stage 4: Only include payments that don't have existing expenses
      {
        $match: {
          existingExpenses: { $size: 0 }
        }
      },

      // Stage 5: Project the final structure we need
      {
        $project: {
          _id: 1,
          name: 1,
          amount: 1,
          description: 1,
          nextDue: 1,
          frequency: 1,
          category: 1,
          categoryName: { $arrayElemAt: ['$categoryInfo.name', 0] },
          categoryColor: { $arrayElemAt: ['$categoryInfo.color', 0] }
        }
      },

      // Stage 6: Sort by due date
      {
        $sort: { nextDue: 1 }
      }
    ]);
  }

  /**
   * Process due payments and create expenses
   */
  async processDuePayments() {
    if (!this.shouldProcessToday()) {
      return { processed: 0, skipped: true, message: 'Already processed today' };
    }

    this.processingLock = true;
    const results = {
      processed: 0,
      created: [],
      errors: []
    };

    try {
      console.log('🔄 Starting recurring payment processing...');
      
      // Get due payments using aggregate pipeline
      const duePayments = await this.getDuePaymentsAggregate();
      
      if (duePayments.length === 0) {
        console.log('✅ No due payments to process');
        this.lastProcessedDate = new Date().toDateString();
        return { processed: 0, message: 'No due payments found' };
      }

      console.log(`📋 Found ${duePayments.length} due payments to process`);

      // Process each payment
      for (const payment of duePayments) {
        try {
          // Create expense
          const expense = new Expense({
            category: payment.category,
            amount: payment.amount,
            description: `${payment.name} - Auto-created from recurring payment`,
            date: payment.nextDue,
            status: 'Gerçekleşti',
            recurringPaymentId: payment._id // Add reference for tracking
          });

          await expense.save();

          // Update recurring payment
          const updatedPayment = await RecurringPayment.findById(payment._id);
          if (updatedPayment) {
            updatedPayment.lastProcessed = payment.nextDue;
            updatedPayment.nextDue = updatedPayment.calculateNextDue();
            await updatedPayment.save();
          }

          results.processed++;
          results.created.push({
            paymentName: payment.name,
            amount: payment.amount,
            expenseId: expense._id,
            nextDue: updatedPayment?.nextDue
          });

          console.log(`✅ Processed: ${payment.name} (${payment.amount} TRY)`);

        } catch (error) {
          console.error(`❌ Error processing ${payment.name}:`, error.message);
          results.errors.push({
            paymentName: payment.name,
            error: error.message
          });
        }
      }

      // Mark as processed for today
      this.lastProcessedDate = new Date().toDateString();
      
      console.log(`🎉 Processing complete! Created ${results.processed} expenses`);
      
      return results;

    } catch (error) {
      console.error('❌ Recurring payment processing failed:', error);
      results.errors.push({
        general: error.message
      });
      return results;
    } finally {
      this.processingLock = false;
    }
  }

  /**
   * Get processing status
   */
  getProcessingStatus() {
    return {
      lastProcessedDate: this.lastProcessedDate,
      isProcessing: this.processingLock,
      shouldProcessToday: this.shouldProcessToday()
    };
  }

  /**
   * Force reset processing status (for testing/manual override)
   */
  resetProcessingStatus() {
    this.lastProcessedDate = null;
    this.processingLock = false;
  }
}

// Export singleton instance
module.exports = new RecurringPaymentProcessor();