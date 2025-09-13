const mongoose = require('mongoose');

const creditCardInstallmentSchema = new mongoose.Schema({
  creditCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreditCard',
    required: true
  },
  purchaseDescription: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  merchant: {
    type: String,
    trim: true
  },
  originalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  totalInstallments: {
    type: Number,
    required: true,
    min: 1,
    max: 36
  },
  installmentAmount: {
    type: Number,
    required: true,
    min: 0
  },
  completedInstallments: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingInstallments: {
    type: Number,
    required: true,
    min: 0
  },
  interestRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  interestAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmountWithInterest: {
    type: Number,
    required: true,
    min: 0
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  firstPaymentDate: {
    type: Date,
    required: true
  },
  nextPaymentDate: {
    type: Date,
    required: true
  },
  lastPaymentDate: {
    type: Date,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['active', 'completed', 'paused', 'defaulted'],
    default: 'active'
  },
  installmentType: {
    type: String,
    enum: ['equal', 'balloon', 'interest_first', 'principal_first'],
    default: 'equal'
  },
  earlyPaymentOption: {
    type: Boolean,
    default: true
  },
  earlyPaymentDiscount: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  autoPayment: {
    type: Boolean,
    default: false
  },
  isPromotional: {
    type: Boolean,
    default: false
  },
  promotionalPeriod: {
    type: Number,
    default: 0,
    min: 0
  },
  promotionalRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  paymentHistory: [{
    installmentNumber: {
      type: Number,
      required: true
    },
    paymentDate: {
      type: Date,
      required: true
    },
    paidAmount: {
      type: Number,
      required: true,
      min: 0
    },
    principalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    interestAmount: {
      type: Number,
      required: true,
      min: 0
    },
    remainingBalance: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['auto', 'manual', 'early'],
      default: 'manual'
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
creditCardInstallmentSchema.index({ creditCard: 1, paymentStatus: 1 });
creditCardInstallmentSchema.index({ nextPaymentDate: 1, paymentStatus: 1 });
creditCardInstallmentSchema.index({ category: 1, paymentStatus: 1 });
creditCardInstallmentSchema.index({ purchaseDate: -1 });

// Virtual for remaining amount
creditCardInstallmentSchema.virtual('remainingAmount').get(function() {
  return this.installmentAmount * this.remainingInstallments;
});

// Virtual for paid amount
creditCardInstallmentSchema.virtual('paidAmount').get(function() {
  return this.installmentAmount * this.completedInstallments;
});

// Virtual for completion percentage
creditCardInstallmentSchema.virtual('completionPercentage').get(function() {
  if (this.totalInstallments === 0) return 0;
  return ((this.completedInstallments / this.totalInstallments) * 100).toFixed(2);
});

// Virtual for days until next payment
creditCardInstallmentSchema.virtual('daysUntilPayment').get(function() {
  if (this.paymentStatus !== 'active') return null;
  const today = new Date();
  const nextPayment = new Date(this.nextPaymentDate);
  const diffTime = nextPayment.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to calculate derived fields
creditCardInstallmentSchema.pre('save', function(next) {
  // Calculate remaining installments
  this.remainingInstallments = this.totalInstallments - this.completedInstallments;
  
  // Calculate total amount with interest
  if (this.interestRate > 0) {
    this.interestAmount = this.originalAmount * this.interestRate * (this.totalInstallments / 12);
    this.totalAmountWithInterest = this.originalAmount + this.interestAmount;
  } else {
    this.totalAmountWithInterest = this.originalAmount;
  }
  
  // Calculate installment amount
  this.installmentAmount = this.totalAmountWithInterest / this.totalInstallments;
  
  // Update payment status
  if (this.completedInstallments >= this.totalInstallments) {
    this.paymentStatus = 'completed';
  } else if (this.completedInstallments > 0 && this.paymentStatus === 'active') {
    // Keep active status
  }
  
  next();
});

// Method to process payment
creditCardInstallmentSchema.methods.processPayment = function(paymentAmount, paymentMethod = 'manual') {
  if (this.paymentStatus !== 'active') {
    throw new Error('Cannot process payment for inactive installment plan');
  }
  
  if (this.remainingInstallments <= 0) {
    throw new Error('All installments have been paid');
  }
  
  // Calculate principal and interest portions
  const monthlyInterestRate = this.interestRate / 12;
  const remainingBalance = this.remainingAmount;
  const interestPortion = remainingBalance * monthlyInterestRate;
  const principalPortion = Math.max(0, paymentAmount - interestPortion);
  
  // Add to payment history
  this.paymentHistory.push({
    installmentNumber: this.completedInstallments + 1,
    paymentDate: new Date(),
    paidAmount: paymentAmount,
    principalAmount: principalPortion,
    interestAmount: interestPortion,
    remainingBalance: remainingBalance - principalPortion,
    paymentMethod: paymentMethod
  });
  
  // Update installment counts
  this.completedInstallments += 1;
  this.remainingInstallments = this.totalInstallments - this.completedInstallments;
  
  // Calculate next payment date
  if (this.remainingInstallments > 0) {
    const nextPayment = new Date(this.nextPaymentDate);
    nextPayment.setMonth(nextPayment.getMonth() + 1);
    this.nextPaymentDate = nextPayment;
  } else {
    this.paymentStatus = 'completed';
  }
  
  return this.save();
};

// Method to calculate early payment amount
creditCardInstallmentSchema.methods.calculateEarlyPaymentAmount = function() {
  if (!this.earlyPaymentOption) {
    return null;
  }
  
  const remainingAmount = this.remainingAmount;
  const discount = remainingAmount * this.earlyPaymentDiscount;
  
  return {
    remainingAmount: remainingAmount,
    discountAmount: discount,
    earlyPaymentAmount: remainingAmount - discount,
    savings: discount + (this.interestAmount * (this.remainingInstallments / this.totalInstallments))
  };
};

// Method to calculate monthly payment schedule
creditCardInstallmentSchema.methods.getPaymentSchedule = function() {
  const schedule = [];
  let currentDate = new Date(this.firstPaymentDate);
  let remainingBalance = this.totalAmountWithInterest;
  
  for (let i = 1; i <= this.totalInstallments; i++) {
    const isCompleted = i <= this.completedInstallments;
    const monthlyInterest = remainingBalance * (this.interestRate / 12);
    const principalPayment = this.installmentAmount - monthlyInterest;
    
    schedule.push({
      installmentNumber: i,
      paymentDate: new Date(currentDate),
      installmentAmount: this.installmentAmount,
      principalAmount: principalPayment,
      interestAmount: monthlyInterest,
      remainingBalance: Math.max(0, remainingBalance - principalPayment),
      isCompleted: isCompleted,
      isPaid: isCompleted
    });
    
    remainingBalance -= principalPayment;
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return schedule;
};

// Static method to get upcoming payments
creditCardInstallmentSchema.statics.getUpcomingPayments = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    paymentStatus: 'active',
    nextPaymentDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  })
  .populate('creditCard', 'name bankName cardNumber')
  .populate('category', 'name color')
  .sort({ nextPaymentDate: 1 });
};

// Static method to get installment summary by credit card
creditCardInstallmentSchema.statics.getSummaryByCard = function() {
  return this.aggregate([
    {
      $match: { paymentStatus: { $in: ['active', 'completed'] } }
    },
    {
      $group: {
        _id: '$creditCard',
        totalInstallments: { $sum: '$totalInstallments' },
        completedInstallments: { $sum: '$completedInstallments' },
        remainingInstallments: { $sum: '$remainingInstallments' },
        totalOriginalAmount: { $sum: '$originalAmount' },
        totalRemainingAmount: { 
          $sum: { 
            $multiply: ['$installmentAmount', '$remainingInstallments'] 
          } 
        },
        totalInterestAmount: { $sum: '$interestAmount' },
        activeInstallmentCount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'active'] }, 1, 0]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'creditcards',
        localField: '_id',
        foreignField: '_id',
        as: 'cardInfo'
      }
    },
    {
      $unwind: '$cardInfo'
    },
    {
      $project: {
        _id: 1,
        cardName: '$cardInfo.name',
        bankName: '$cardInfo.bankName',
        totalInstallments: 1,
        completedInstallments: 1,
        remainingInstallments: 1,
        totalOriginalAmount: 1,
        totalRemainingAmount: 1,
        totalInterestAmount: 1,
        activeInstallmentCount: 1,
        completionRate: {
          $multiply: [
            { $divide: ['$completedInstallments', '$totalInstallments'] },
            100
          ]
        }
      }
    }
  ]);
};

module.exports = mongoose.model('CreditCardInstallment', creditCardInstallmentSchema);