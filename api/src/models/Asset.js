const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['savings', 'investment', 'realEstate', 'crypto']
  },
  currentAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    default: 'TRY',
    trim: true
  },
  assetType: {
    type: String,
    enum: ['currency', 'gold', 'silver', 'crypto', 'stock'],
    default: 'currency'
  },
  goldKarat: {
    type: Number,
    min: 8,
    max: 24,
    required: function() { return this.assetType === 'gold'; }
  }
}, {
  timestamps: true
});

// Virtual for progress percentage
assetSchema.virtual('progress').get(function() {
  return this.targetAmount > 0 ? Math.round((this.currentAmount / this.targetAmount) * 100) : 0;
});

// Ensure virtual fields are serialized
assetSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Asset', assetSchema);