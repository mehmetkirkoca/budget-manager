const mongoose = require('mongoose');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Asset = require('../models/Asset');
const RecurringPayment = require('../models/RecurringPayment');
const CreditCard = require('../models/CreditCard');
const CreditCardInstallment = require('../models/CreditCardInstallment');

// Export all data as JSON
const exportAllData = async (request, reply) => {
  try {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {}
    };

    // Export categories
    const categories = await Category.find({ isActive: true }).lean();
    exportData.data.categories = categories;

    // Export expenses
    const expenses = await Expense.find().lean();
    exportData.data.expenses = expenses;

    // Export incomes
    const incomes = await Income.find().lean();
    exportData.data.incomes = incomes;

    // Export assets
    const assets = await Asset.find().lean();
    exportData.data.assets = assets;

    // Export recurring payments
    const recurringPayments = await RecurringPayment.find({ isActive: true })
      .populate('category', 'name').lean();
    exportData.data.recurringPayments = recurringPayments;

    // Export credit cards
    const creditCards = await CreditCard.find({ isActive: true }).lean();
    exportData.data.creditCards = creditCards;

    // Export credit card installments
    const installments = await CreditCardInstallment.find()
      .populate('creditCard', 'name bankName')
      .populate('category', 'name')
      .lean();
    exportData.data.creditCardInstallments = installments;

    // Calculate summary statistics
    exportData.summary = {
      categoriesCount: categories.length,
      expensesCount: expenses.length,
      incomesCount: incomes.length,
      assetsCount: assets.length,
      recurringPaymentsCount: recurringPayments.length,
      creditCardsCount: creditCards.length,
      installmentsCount: installments.length,
      totalExpenseAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      totalIncomeAmount: incomes.reduce((sum, inc) => sum + inc.amount, 0),
      totalAssetValue: assets.reduce((sum, asset) => sum + asset.currentAmount, 0)
    };

    // Set response headers for file download
    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="budget-export-${new Date().toISOString().split('T')[0]}.json"`);
    
    reply.send(exportData);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to export data' 
    });
  }
};

// Export specific collection
const exportCollection = async (request, reply) => {
  try {
    const { collection } = request.params;
    const { format = 'json' } = request.query;

    let data;
    let filename;

    switch (collection) {
      case 'categories':
        data = await Category.find({ isActive: true }).lean();
        filename = 'categories';
        break;
      case 'expenses':
        data = await Expense.find().lean();
        filename = 'expenses';
        break;
      case 'incomes':
        data = await Income.find().lean();
        filename = 'incomes';
        break;
      case 'assets':
        data = await Asset.find().lean();
        filename = 'assets';
        break;
      case 'recurring-payments':
        data = await RecurringPayment.find({ isActive: true })
          .populate('category', 'name').lean();
        filename = 'recurring-payments';
        break;
      case 'credit-cards':
        data = await CreditCard.find({ isActive: true }).lean();
        filename = 'credit-cards';
        break;
      case 'installments':
        data = await CreditCardInstallment.find()
          .populate('creditCard', 'name bankName')
          .populate('category', 'name')
          .lean();
        filename = 'installments';
        break;
      default:
        return reply.status(400).send({ 
          error: 'Bad Request', 
          message: 'Invalid collection name' 
        });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(data);
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`);
      reply.send(csvData);
    } else {
      // JSON format
      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.json"`);
      reply.send({
        collection,
        exportDate: new Date().toISOString(),
        count: data.length,
        data
      });
    }
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to export collection' 
    });
  }
};

// Export data within date range
const exportByDateRange = async (request, reply) => {
  try {
    const { startDate, endDate } = request.query;
    
    if (!startDate || !endDate) {
      return reply.status(400).send({ 
        error: 'Bad Request', 
        message: 'Start date and end date are required' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return reply.status(400).send({ 
        error: 'Bad Request', 
        message: 'Start date cannot be after end date' 
      });
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      dateRange: { startDate: start, endDate: end },
      data: {}
    };

    // Export expenses in date range
    const expenses = await Expense.find({
      date: { $gte: start, $lte: end }
    }).lean();
    exportData.data.expenses = expenses;

    // Export incomes in date range
    const incomes = await Income.find({
      date: { $gte: start, $lte: end }
    }).lean();
    exportData.data.incomes = incomes;

    // Export recurring payments that were active in the period
    const recurringPayments = await RecurringPayment.find({
      startDate: { $lte: end },
      $or: [
        { endDate: null },
        { endDate: { $gte: start } }
      ]
    }).populate('category', 'name').lean();
    exportData.data.recurringPayments = recurringPayments;

    // Export installment payments in date range
    const installments = await CreditCardInstallment.find({
      'paymentHistory.date': { $gte: start, $lte: end }
    })
    .populate('creditCard', 'name bankName')
    .populate('category', 'name')
    .lean();
    exportData.data.creditCardInstallments = installments;

    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="budget-export-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.json"`);
    
    reply.send(exportData);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to export data by date range' 
    });
  }
};

// Get export summary
const getExportSummary = async (request, reply) => {
  try {
    const summary = {
      database: 'budget-manager',
      collections: {},
      totalDocuments: 0,
      lastUpdated: new Date().toISOString()
    };

    // Count documents in each collection
    const collections = [
      { name: 'categories', model: Category, filter: { isActive: true } },
      { name: 'expenses', model: Expense, filter: {} },
      { name: 'incomes', model: Income, filter: {} },
      { name: 'assets', model: Asset, filter: {} },
      { name: 'recurringPayments', model: RecurringPayment, filter: { isActive: true } },
      { name: 'creditCards', model: CreditCard, filter: { isActive: true } },
      { name: 'creditCardInstallments', model: CreditCardInstallment, filter: {} }
    ];

    for (const collection of collections) {
      const count = await collection.model.countDocuments(collection.filter);
      summary.collections[collection.name] = {
        count,
        available: count > 0
      };
      summary.totalDocuments += count;
    }

    reply.send(summary);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ 
      error: 'Internal Server Error', 
      message: 'Failed to get export summary' 
    });
  }
};

// Helper function to convert JSON to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Get all unique keys from all objects
  const allKeys = new Set();
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (typeof item[key] !== 'object' || item[key] === null || item[key] instanceof Date) {
        allKeys.add(key);
      }
    });
  });

  const headers = Array.from(allKeys);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      if (value instanceof Date) return value.toISOString();
      return String(value);
    });
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
};

module.exports = {
  exportAllData,
  exportCollection,
  exportByDateRange,
  getExportSummary
};