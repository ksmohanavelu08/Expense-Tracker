const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const { CATEGORIES } = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// All transaction routes are protected
router.use(protect);

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/transactions
// @desc    Get all transactions with pagination, search, and filters
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = '',
      category = '',
      type = '',
      startDate = '',
      endDate = '',
      minAmount = '',
      maxAmount = '',
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    // Build query filter — always scoped to current user
    const filter = { userId: req.user._id };

    // Text search on title and notes
    if (search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { notes: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      filter.category = category;
    }

    // Type filter (income/expense)
    if (type && type !== 'All') {
      filter.type = type;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        // Include the full end date day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Cap at 50 per page
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const validSortFields = ['date', 'amount', 'title', 'category', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'date';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitNum)
        .lean(), // lean() for better performance (returns plain JS objects)
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        limit: limitNum,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/transactions/summary
// @desc    Get dashboard summary stats (totals, category breakdown)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    if (period === 'week') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(0); // All time
    }

    // Aggregate pipeline for summary stats
    const [summary] = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalExpenses: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
          },
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
          },
          transactionCount: { $sum: 1 },
          expenseCount: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, 1, 0] },
          },
        },
      },
    ]);

    // Category breakdown for expenses
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Recent 5 transactions
    const recentTransactions = await Transaction.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyTrend = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        summary: summary || {
          totalExpenses: 0,
          totalIncome: 0,
          transactionCount: 0,
          expenseCount: 0,
        },
        categoryBreakdown,
        recentTransactions,
        monthlyTrend,
        period,
      },
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/transactions/:id
// @desc    Get a single transaction by ID
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id, // Ensure user owns this transaction
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number'),
    body('category').notEmpty().withMessage('Category is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('type')
      .optional()
      .isIn(['expense', 'income'])
      .withMessage('Type must be expense or income'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    try {
      const { title, amount, category, date, notes, type, tags } = req.body;

      const transaction = await Transaction.create({
        userId: req.user._id,
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        notes: notes?.trim() || '',
        type: type || 'expense',
        tags: tags || [],
      });

      res.status(201).json({
        success: true,
        message: 'Transaction added successfully!',
        data: transaction,
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/transactions/:id
// @desc    Update an existing transaction
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('date').optional().isISO8601().withMessage('Valid date is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }

    try {
      // Ensure user owns this transaction
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found.' });
      }

      const { title, amount, category, date, notes, type, tags } = req.body;

      // Only update provided fields
      if (title !== undefined) transaction.title = title.trim();
      if (amount !== undefined) transaction.amount = parseFloat(amount);
      if (category !== undefined) transaction.category = category;
      if (date !== undefined) transaction.date = new Date(date);
      if (notes !== undefined) transaction.notes = notes.trim();
      if (type !== undefined) transaction.type = type;
      if (tags !== undefined) transaction.tags = tags;

      await transaction.save();

      res.json({
        success: true,
        message: 'Transaction updated successfully!',
        data: transaction,
      });
    } catch (error) {
      console.error('Update transaction error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ success: false, message: 'Transaction not found.' });
      }
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id, // Verify ownership before deleting
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    res.json({ success: true, message: 'Transaction deleted successfully!' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/transactions/meta/categories
// @desc    Get list of available categories
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/meta/categories', (req, res) => {
  res.json({ success: true, data: CATEGORIES });
});

module.exports = router;
