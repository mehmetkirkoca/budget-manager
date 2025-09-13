const mongoose = require('mongoose');

const creditCardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  cardType: {
    type: String,
    enum: ['visa', 'mastercard', 'americanexpress', 'troy'],
    required: true
  },
  cardNumber: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{4}$/.test(v); // Only store last 4 digits for security
      },
      message: 'Card number should contain only last 4 digits'
    }
  },
  totalLimit: {
    type: Number,
    required: true,
    min: 0
  },
  availableLimit: {
    type: Number,
    required: true,
    min: 0
  },
  currentBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  minimumPaymentRate: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.03 // 3% default minimum payment rate
  },
  interestRate: {
    monthly: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0.0299 // 2.99% monthly default
    },
    annual: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
      default: 0.359 // 35.9% annual default
    }
  },
  statementDay: {
    type: Number,
    required: true,
    min: 1,
    max: 31,
    default: 1
  },
  paymentDueDay: {
    type: Number,
    required: true,
    min: 1,
    max: 31,
    default: 15
  },
  gracePeriodDays: {
    type: Number,
    default: 45,
    min: 0
  },
  cashAdvanceRate: {
    type: Number,
    default: 0.04, // 4% monthly for cash advance
    min: 0,
    max: 1
  },
  fees: {
    annualFee: {
      type: Number,
      default: 0
    },
    latePaymentFee: {
      type: Number,
      default: 50
    },
    overlimitFee: {
      type: Number,
      default: 100
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastStatementDate: {
    type: Date,
    default: null
  },
  nextPaymentDue: {
    type: Date,
    default: null
  },
  minimumPaymentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDebt: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
creditCardSchema.index({ bankName: 1, cardNumber: 1 });
creditCardSchema.index({ isActive: 1, nextPaymentDue: 1 });

// Virtual for used limit
creditCardSchema.virtual('usedLimit').get(function() {
  return this.totalLimit - this.availableLimit;
});

// Virtual for utilization rate
creditCardSchema.virtual('utilizationRate').get(function() {
  if (this.totalLimit === 0) return 0;
  return (this.usedLimit / this.totalLimit * 100).toFixed(2);
});

// Method to calculate next statement date
creditCardSchema.methods.calculateNextStatementDate = function() {
  const today = new Date();
  const nextStatement = new Date(today.getFullYear(), today.getMonth(), this.statementDay);
  
  if (nextStatement <= today) {
    nextStatement.setMonth(nextStatement.getMonth() + 1);
  }
  
  return nextStatement;
};

// Method to calculate next payment due date
creditCardSchema.methods.calculateNextPaymentDue = function() {
  const today = new Date();
  const nextPayment = new Date(today.getFullYear(), today.getMonth(), this.paymentDueDay);
  
  if (nextPayment <= today) {
    nextPayment.setMonth(nextPayment.getMonth() + 1);
  }
  
  return nextPayment;
};

// Method to calculate minimum payment
creditCardSchema.methods.calculateMinimumPayment = function() {
  const balance = this.currentBalance;
  const minimumFromRate = balance * this.minimumPaymentRate;
  const minimumFixed = 50; // Minimum 50 TL payment
  
  return Math.max(minimumFromRate, minimumFixed);
};

// Method to update available limit
creditCardSchema.methods.updateAvailableLimit = function() {
  this.availableLimit = this.totalLimit - this.currentBalance;
  return this.save();
};

// Static method to get cards requiring payment soon
creditCardSchema.statics.getUpcomingPayments = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    isActive: true,
    nextPaymentDue: {
      $gte: new Date(),
      $lte: futureDate
    },
    currentBalance: { $gt: 0 }
  }).sort({ nextPaymentDue: 1 });
};

// Static method to get utilization summary
creditCardSchema.statics.getUtilizationSummary = function() {
  return this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: null,
        totalLimit: { $sum: '$totalLimit' },
        totalUsed: { $sum: { $subtract: ['$totalLimit', '$availableLimit'] } },
        totalDebt: { $sum: '$totalDebt' },
        cardCount: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        totalLimit: 1,
        totalUsed: 1,
        totalDebt: 1,
        cardCount: 1,
        utilizationRate: {
          $multiply: [
            { $divide: ['$totalUsed', '$totalLimit'] },
            100
          ]
        }
      }
    }
  ]);
};

module.exports = mongoose.model('CreditCard', creditCardSchema);