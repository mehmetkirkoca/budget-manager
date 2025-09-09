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

// Method to get upcoming payments for a date range
recurringPaymentSchema.statics.getUpcoming = function(startDate, endDate) {
  return this.find({
    isActive: true,
    nextDue: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('category').sort({ nextDue: 1 });
};

module.exports = mongoose.model('RecurringPayment', recurringPaymentSchema);