const mongoose = require('mongoose');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Asset = require('../models/Asset');
const RecurringPayment = require('../models/RecurringPayment');
const CreditCard = require('../models/CreditCard');
const CreditCardInstallment = require('../models/CreditCardInstallment');

// Import all data from JSON
const importAllData = async (request, reply) => {
  try {
    const { data, options = {} } = request.body;

    if (!data || !data.data) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid import data format'
      });
    }

    const importOptions = {
      mode: 'merge', // 'merge', 'replace', 'append'
      skipDuplicates: true,
      validateData: true,
      collections: ['all'],
      ...options
    };

    const results = {
      success: true,
      imported: {},
      errors: [],
      summary: {}
    };

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Import categories
      if (shouldImportCollection('categories', importOptions.collections) && data.data.categories) {
        const categoryResult = await importCategories(data.data.categories, importOptions, session);
        results.imported.categories = categoryResult;
      }

      // Import expenses
      if (shouldImportCollection('expenses', importOptions.collections) && data.data.expenses) {
        const expenseResult = await importExpenses(data.data.expenses, importOptions, session);
        results.imported.expenses = expenseResult;
      }

      // Import incomes
      if (shouldImportCollection('incomes', importOptions.collections) && data.data.incomes) {
        const incomeResult = await importIncomes(data.data.incomes, importOptions, session);
        results.imported.incomes = incomeResult;
      }

      // Import assets
      if (shouldImportCollection('assets', importOptions.collections) && data.data.assets) {
        const assetResult = await importAssets(data.data.assets, importOptions, session);
        results.imported.assets = assetResult;
      }

      // Import recurring payments
      if (shouldImportCollection('recurringPayments', importOptions.collections) && data.data.recurringPayments) {
        const recurringResult = await importRecurringPayments(data.data.recurringPayments, importOptions, session);
        results.imported.recurringPayments = recurringResult;
      }

      // Import credit cards
      if (shouldImportCollection('creditCards', importOptions.collections) && data.data.creditCards) {
        const creditCardResult = await importCreditCards(data.data.creditCards, importOptions, session);
        results.imported.creditCards = creditCardResult;
      }

      // Import installments
      if (shouldImportCollection('creditCardInstallments', importOptions.collections) && data.data.creditCardInstallments) {
        const installmentResult = await importInstallments(data.data.creditCardInstallments, importOptions, session);
        results.imported.creditCardInstallments = installmentResult;
      }

      await session.commitTransaction();

      // Calculate summary
      results.summary = {
        totalRecords: Object.values(results.imported).reduce((sum, r) => sum + (r.imported || 0), 0),
        importDate: new Date().toISOString(),
        mode: importOptions.mode
      };

      reply.send(results);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to import data: ' + error.message
    });
  }
};

// Import specific collection
const importCollection = async (request, reply) => {
  try {
    const { collection } = request.params;
    const { data, options = {} } = request.body;

    if (!data) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'No data provided for import'
      });
    }

    const importOptions = {
      mode: 'merge',
      skipDuplicates: true,
      validateData: true,
      ...options
    };

    let result;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      switch (collection) {
        case 'categories':
          result = await importCategories(data, importOptions, session);
          break;
        case 'expenses':
          result = await importExpenses(data, importOptions, session);
          break;
        case 'incomes':
          result = await importIncomes(data, importOptions, session);
          break;
        case 'assets':
          result = await importAssets(data, importOptions, session);
          break;
        case 'recurringPayments':
          result = await importRecurringPayments(data, importOptions, session);
          break;
        case 'creditCards':
          result = await importCreditCards(data, importOptions, session);
          break;
        case 'creditCardInstallments':
          result = await importInstallments(data, importOptions, session);
          break;
        default:
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid collection name'
          });
      }

      await session.commitTransaction();
      reply.send({
        success: true,
        collection,
        result,
        importDate: new Date().toISOString()
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to import collection: ' + error.message
    });
  }
};

// Validate import data
const validateImportData = async (request, reply) => {
  try {
    const importData = request.body;

    if (!importData || !importData.data) {
      return reply.status(400).send({
        valid: false,
        errors: ['Invalid import data format - missing data object']
      });
    }

    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      summary: {}
    };

    // Validate each collection
    const collections = ['categories', 'expenses', 'incomes', 'assets', 'recurringPayments', 'creditCards', 'creditCardInstallments'];

    for (const collection of collections) {
      if (importData.data[collection]) {
        const collectionValidation = validateCollection(collection, importData.data[collection]);
        validation.summary[collection] = {
          count: importData.data[collection].length,
          valid: collectionValidation.valid,
          errors: collectionValidation.errors,
          warnings: collectionValidation.warnings
        };

        if (!collectionValidation.valid) {
          validation.valid = false;
          validation.errors.push(...collectionValidation.errors);
        }
        validation.warnings.push(...collectionValidation.warnings);
      }
    }

    reply.send(validation);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to validate import data'
    });
  }
};

// Get import preview
const getImportPreview = async (request, reply) => {
  try {
    const importData = request.body;

    if (!importData || !importData.data) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid import data format'
      });
    }

    const preview = {
      exportDate: importData.exportDate,
      version: importData.version,
      summary: {}
    };

    // Count items in each collection
    const collections = ['categories', 'expenses', 'incomes', 'assets', 'recurringPayments', 'creditCards', 'creditCardInstallments'];

    for (const collection of collections) {
      if (importData.data[collection]) {
        preview.summary[collection] = importData.data[collection].length;
      } else {
        preview.summary[collection] = 0;
      }
    }

    // Add totals from original summary if available
    if (importData.summary) {
      preview.originalSummary = importData.summary;
    }

    reply.send(preview);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to generate import preview'
    });
  }
};

// Helper functions
const shouldImportCollection = (collection, collections) => {
  return collections.includes('all') || collections.includes(collection);
};

const importCategories = async (categories, options, session) => {
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const categoryData of categories) {
    try {
      // Remove MongoDB specific fields
      const cleanData = { ...categoryData };
      delete cleanData._id;
      delete cleanData.__v;

      if (options.mode === 'replace') {
        await Category.deleteMany({}, { session });
      }

      // Check for existing category
      const existing = await Category.findOne({ name: cleanData.name }, null, { session });

      if (existing) {
        if (options.skipDuplicates && options.mode !== 'replace') {
          skipped++;
          continue;
        }

        // Update existing
        await Category.findByIdAndUpdate(existing._id, cleanData, { session });
        updated++;
      } else {
        // Create new
        await Category.create([cleanData], { session });
        imported++;
      }
    } catch (error) {
      console.error('Error importing category:', error);
    }
  }

  return { imported, updated, skipped };
};

const importExpenses = async (expenses, options, session) => {
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const expenseData of expenses) {
    try {
      const cleanData = { ...expenseData };
      delete cleanData._id;
      delete cleanData.__v;

      if (options.mode === 'replace') {
        await Expense.deleteMany({}, { session });
      }

      // Check for existing expense (by amount, date, and description)
      const existing = await Expense.findOne({
        amount: cleanData.amount,
        date: cleanData.date,
        description: cleanData.description
      }, null, { session });

      if (existing) {
        if (options.skipDuplicates && options.mode !== 'replace') {
          skipped++;
          continue;
        }

        await Expense.findByIdAndUpdate(existing._id, cleanData, { session });
        updated++;
      } else {
        await Expense.create([cleanData], { session });
        imported++;
      }
    } catch (error) {
      console.error('Error importing expense:', error);
    }
  }

  return { imported, updated, skipped };
};

const importIncomes = async (incomes, options, session) => {
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const incomeData of incomes) {
    try {
      const cleanData = { ...incomeData };
      delete cleanData._id;
      delete cleanData.__v;

      if (options.mode === 'replace') {
        await Income.deleteMany({}, { session });
      }

      const existing = await Income.findOne({
        source: cleanData.source,
        amount: cleanData.amount,
        date: cleanData.date
      }, null, { session });

      if (existing) {
        if (options.skipDuplicates && options.mode !== 'replace') {
          skipped++;
          continue;
        }

        await Income.findByIdAndUpdate(existing._id, cleanData, { session });
        updated++;
      } else {
        await Income.create([cleanData], { session });
        imported++;
      }
    } catch (error) {
      console.error('Error importing income:', error);
    }
  }

  return { imported, updated, skipped };
};

const importAssets = async (assets, options, session) => {
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const assetData of assets) {
    try {
      const cleanData = { ...assetData };
      delete cleanData._id;
      delete cleanData.__v;

      if (options.mode === 'replace') {
        await Asset.deleteMany({}, { session });
      }

      const existing = await Asset.findOne({ name: cleanData.name }, null, { session });

      if (existing) {
        if (options.skipDuplicates && options.mode !== 'replace') {
          skipped++;
          continue;
        }

        await Asset.findByIdAndUpdate(existing._id, cleanData, { session });
        updated++;
      } else {
        await Asset.create([cleanData], { session });
        imported++;
      }
    } catch (error) {
      console.error('Error importing asset:', error);
    }
  }

  return { imported, updated, skipped };
};

const importRecurringPayments = async (recurringPayments, options, session) => {
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const paymentData of recurringPayments) {
    try {
      const cleanData = { ...paymentData };
      delete cleanData._id;
      delete cleanData.__v;

      // Handle category reference
      if (cleanData.category && cleanData.category._id) {
        cleanData.category = cleanData.category._id;
      }

      if (options.mode === 'replace') {
        await RecurringPayment.deleteMany({}, { session });
      }

      const existing = await RecurringPayment.findOne({ name: cleanData.name }, null, { session });

      if (existing) {
        if (options.skipDuplicates && options.mode !== 'replace') {
          skipped++;
          continue;
        }

        await RecurringPayment.findByIdAndUpdate(existing._id, cleanData, { session });
        updated++;
      } else {
        await RecurringPayment.create([cleanData], { session });
        imported++;
      }
    } catch (error) {
      console.error('Error importing recurring payment:', error);
    }
  }

  return { imported, updated, skipped };
};

const importCreditCards = async (creditCards, options, session) => {
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const cardData of creditCards) {
    try {
      const cleanData = { ...cardData };
      delete cleanData._id;
      delete cleanData.__v;

      if (options.mode === 'replace') {
        await CreditCard.deleteMany({}, { session });
      }

      const existing = await CreditCard.findOne({ name: cleanData.name }, null, { session });

      if (existing) {
        if (options.skipDuplicates && options.mode !== 'replace') {
          skipped++;
          continue;
        }

        await CreditCard.findByIdAndUpdate(existing._id, cleanData, { session });
        updated++;
      } else {
        await CreditCard.create([cleanData], { session });
        imported++;
      }
    } catch (error) {
      console.error('Error importing credit card:', error);
    }
  }

  return { imported, updated, skipped };
};

const importInstallments = async (installments, options, session) => {
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const installmentData of installments) {
    try {
      const cleanData = { ...installmentData };
      delete cleanData._id;
      delete cleanData.__v;

      // Handle references
      if (cleanData.creditCard && cleanData.creditCard._id) {
        cleanData.creditCard = cleanData.creditCard._id;
      }
      if (cleanData.category && cleanData.category._id) {
        cleanData.category = cleanData.category._id;
      }

      if (options.mode === 'replace') {
        await CreditCardInstallment.deleteMany({}, { session });
      }

      // For installments, we'll always create new ones unless exact match
      const existing = await CreditCardInstallment.findOne({
        totalAmount: cleanData.totalAmount,
        description: cleanData.description,
        startDate: cleanData.startDate
      }, null, { session });

      if (existing) {
        if (options.skipDuplicates && options.mode !== 'replace') {
          skipped++;
          continue;
        }

        await CreditCardInstallment.findByIdAndUpdate(existing._id, cleanData, { session });
        updated++;
      } else {
        await CreditCardInstallment.create([cleanData], { session });
        imported++;
      }
    } catch (error) {
      console.error('Error importing installment:', error);
    }
  }

  return { imported, updated, skipped };
};

const validateCollection = (collectionName, data) => {
  const validation = {
    valid: true,
    errors: [],
    warnings: []
  };

  if (!Array.isArray(data)) {
    validation.valid = false;
    validation.errors.push(`${collectionName} must be an array`);
    return validation;
  }

  // Basic validation for each collection type
  data.forEach((item, index) => {
    switch (collectionName) {
      case 'categories':
        if (!item.name) {
          validation.errors.push(`Category at index ${index} missing required field: name`);
          validation.valid = false;
        }
        break;
      case 'expenses':
        if (!item.amount || !item.date) {
          validation.errors.push(`Expense at index ${index} missing required fields: amount or date`);
          validation.valid = false;
        }
        break;
      case 'incomes':
        if (!item.source || !item.amount) {
          validation.errors.push(`Income at index ${index} missing required fields: source or amount`);
          validation.valid = false;
        }
        break;
      case 'assets':
        if (!item.name || item.currentAmount === undefined) {
          validation.errors.push(`Asset at index ${index} missing required fields: name or currentAmount`);
          validation.valid = false;
        }
        break;
    }
  });

  return validation;
};

module.exports = {
  importAllData,
  importCollection,
  validateImportData,
  getImportPreview
};