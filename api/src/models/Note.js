const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['personal', 'finance', 'business', 'todo', 'important'],
    default: 'personal'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  reminderDate: {
    type: Date,
    default: null
  },
  color: {
    type: String,
    enum: ['blue', 'green', 'yellow', 'red', 'purple', 'gray'],
    default: 'blue'
  }
}, {
  timestamps: true
});

// Index for better search performance
noteSchema.index({ title: 'text', content: 'text' });
noteSchema.index({ category: 1, isArchived: 1 });
noteSchema.index({ reminderDate: 1 });

module.exports = mongoose.model('Note', noteSchema);