const mongoose = require('mongoose');

const CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Housing & Rent',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Travel',
  'Utilities',
  'Investments',
  'Income',
  'Other',
];

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index for faster queries
    },
    title: {
      type: String,
      required: [true, 'Transaction title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      // Positive = income, Negative = expense (but we handle this on frontend)
    },
    type: {
      type: String,
      enum: ['expense', 'income'],
      default: 'expense',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: CATEGORIES,
      default: 'Other',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user + date (common query pattern)
transactionSchema.index({ userId: 1, date: -1 });
// Text index for search
transactionSchema.index({ title: 'text', notes: 'text' });

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.CATEGORIES = CATEGORIES;
