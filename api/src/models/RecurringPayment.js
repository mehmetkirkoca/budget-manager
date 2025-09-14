const mongoose = require('mongoose');

const recurringPaymentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  frequency: {
    type: String,
    required: true,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date // Optional, if payment has an end date
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31,
    required: function() {
      return this.frequency === 'monthly' || this.frequency === 'quarterly';
    }
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6, // 0 = Sunday, 6 = Saturday
    required: function() {
      return this.frequency === 'weekly';
    }
  },
  monthOfYear: {
    type: Number,
    min: 1,
    max: 12,
    required: function() {
      return this.frequency === 'yearly';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastProcessed: {
    type: Date,
    default: null
  },
  nextDue: {
    type: Date,
    required: true
  },
  autoCreate: {
    type: Boolean,
    default: false // If true, automatically create expense when due
  },
  reminderDays: {
    type: Number,
    default: 3,
    min: 0,
    max: 30
  },
  // Dynamic amount calculation fields
  isDynamicAmount: {
    type: Boolean,
    default: false // If true, amount will be calculated dynamically
  },
  linkedCreditCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreditCard',
    required: function() {
      return this.isDynamicAmount && this.name && this.name.toLowerCase().includes('kredi kartı');
    }
  },
  calculatedAmount: {
    type: Number,
    default: 0 // Runtime calculated amount
  },
  lastCalculatedAt: {
    type: Date,
    default: null
  },
  calculationMetadata: {
    currentBalance: { type: Number, default: 0 },
    monthlyInstallments: { type: Number, default: 0 },
    isEstimated: { type: Boolean, default: true },
    cardName: { type: String, default: '' },
    bankName: { type: String, default: '' }
  }
}, {
  timestamps: true
});

// Index for efficient querying
recurringPaymentSchema.index({ nextDue: 1, isActive: 1 });
recurringPaymentSchema.index({ category: 1 });

// Method to calculate next due date
recurringPaymentSchema.methods.calculateNextDue = function() {
  const current = this.nextDue || this.startDate;
  let nextDue = new Date(current);
  
  switch (this.frequency) {
    case 'weekly':
      nextDue.setDate(nextDue.getDate() + 7);
      break;
    case 'monthly':
      nextDue.setMonth(nextDue.getMonth() + 1);
      break;
    case 'quarterly':
      nextDue.setMonth(nextDue.getMonth() + 3);
      break;
    case 'yearly':
      nextDue.setFullYear(nextDue.getFullYear() + 1);
      break;
  }
  
  return nextDue;
};

// Method to calculate dynamic amount
recurringPaymentSchema.methods.calculateDynamicAmount = async function() {
  if (!this.isDynamicAmount) {
    return this.amount;
  }

  try {
    const creditCardAmountCalculator = require('../services/creditCardAmountCalculator');

    // If linkedCreditCard is set, use it directly
    if (this.linkedCreditCard) {
      const calculation = await creditCardAmountCalculator.calculateCreditCardPaymentAmount(this.linkedCreditCard);

      // Update calculation metadata
      this.calculatedAmount = calculation.estimatedAmount;
      this.lastCalculatedAt = new Date();
      this.calculationMetadata = {
        currentBalance: calculation.currentBalance,
        monthlyInstallments: calculation.monthlyInstallments,
        isEstimated: calculation.isEstimated,
        cardName: calculation.cardName,
        bankName: calculation.bankName
      };

      return calculation.estimatedAmount;
    }

    // Otherwise, try to find credit card by name pattern
    const calculation = await creditCardAmountCalculator.calculateRecurringPaymentAmount(this.name);

    if (calculation.found) {
      // Update linkedCreditCard for future use
      this.linkedCreditCard = calculation.creditCard.id;
      this.calculatedAmount = calculation.estimatedAmount;
      this.lastCalculatedAt = new Date();
      this.calculationMetadata = {
        currentBalance: calculation.currentBalance,
        monthlyInstallments: calculation.monthlyInstallments,
        isEstimated: calculation.isEstimated,
        cardName: calculation.creditCard.name,
        bankName: calculation.creditCard.bankName
      };

      return calculation.estimatedAmount;
    }

    // If no credit card found, return original amount
    return this.amount;

  } catch (error) {
    console.error('Error calculating dynamic amount for payment:', this.name, error);
    return this.amount; // Fallback to original amount
  }
};

// Virtual for effective amount (dynamic or static)
recurringPaymentSchema.virtual('effectiveAmount').get(function() {
  if (this.isDynamicAmount && this.calculatedAmount > 0) {
    return this.calculatedAmount;
  }
  return this.amount;
});

// Virtual for amount display info
recurringPaymentSchema.virtual('amountInfo').get(function() {
  return {
    originalAmount: this.amount,
    effectiveAmount: this.effectiveAmount,
    isDynamic: this.isDynamicAmount,
    isCalculated: this.isDynamicAmount && this.calculatedAmount > 0,
    lastCalculatedAt: this.lastCalculatedAt,
    metadata: this.calculationMetadata
  };
});

// Method to get upcoming payments for a date range
recurringPaymentSchema.statics.getUpcoming = function(startDate, endDate) {
  return this.find({
    isActive: true,
    nextDue: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('category').populate('linkedCreditCard', 'name bankName').sort({ nextDue: 1 });
};

// Method to get upcoming payments with calculated amounts
recurringPaymentSchema.statics.getUpcomingWithCalculatedAmounts = async function(startDate, endDate) {
  const payments = await this.getUpcoming(startDate, endDate);

  // Calculate dynamic amounts for payments that need it
  const paymentsWithAmounts = await Promise.all(
    payments.map(async (payment) => {
      const paymentObj = payment.toObject();

      if (payment.isDynamicAmount) {
        try {
          const calculatedAmount = await payment.calculateDynamicAmount();
          paymentObj.effectiveAmount = calculatedAmount;
          paymentObj.amountInfo = {
            originalAmount: payment.amount,
            effectiveAmount: calculatedAmount,
            isDynamic: true,
            isCalculated: true,
            lastCalculatedAt: payment.lastCalculatedAt,
            metadata: payment.calculationMetadata
          };
        } catch (error) {
          console.error('Error calculating amount for payment:', payment.name, error);
          paymentObj.effectiveAmount = payment.amount;
          paymentObj.amountInfo = {
            originalAmount: payment.amount,
            effectiveAmount: payment.amount,
            isDynamic: true,
            isCalculated: false,
            error: error.message
          };
        }
      } else {
        paymentObj.effectiveAmount = payment.amount;
        paymentObj.amountInfo = {
          originalAmount: payment.amount,
          effectiveAmount: payment.amount,
          isDynamic: false,
          isCalculated: false
        };
      }

      return paymentObj;
    })
  );

  return paymentsWithAmounts;
};

// Ensure virtual fields are serialized
recurringPaymentSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('RecurringPayment', recurringPaymentSchema);