const RecurringPayment = require('../models/RecurringPayment');
const Expense = require('../models/Expense');

const getAllRecurringPayments = async (request, reply) => {
  try {
    const payments = await RecurringPayment.find({ isActive: true })
      .populate('category')
      .sort({ nextDue: 1 });
    reply.send(payments);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const createRecurringPayment = async (request, reply) => {
  try {
    const { 
      name, 
      category, 
      amount, 
      description, 
      frequency, 
      startDate, 
      endDate,
      dayOfMonth, 
      dayOfWeek, 
      monthOfYear,
      autoCreate,
      reminderDays
    } = request.body;
    
    // Calculate initial next due date
    const start = new Date(startDate);
    let nextDue = new Date(start);
    
    // Adjust to correct day based on frequency
    if (frequency === 'monthly' && dayOfMonth) {
      nextDue.setDate(dayOfMonth);
      if (nextDue < start) {
        nextDue.setMonth(nextDue.getMonth() + 1);
      }
    } else if (frequency === 'weekly' && dayOfWeek !== undefined) {
      const daysUntilTarget = (dayOfWeek - nextDue.getDay() + 7) % 7;
      nextDue.setDate(nextDue.getDate() + daysUntilTarget);
      if (nextDue < start) {
        nextDue.setDate(nextDue.getDate() + 7);
      }
    } else if (frequency === 'yearly' && monthOfYear && dayOfMonth) {
      nextDue.setMonth(monthOfYear - 1, dayOfMonth);
      if (nextDue < start) {
        nextDue.setFullYear(nextDue.getFullYear() + 1);
      }
    }
    
    const newPayment = new RecurringPayment({
      name,
      category,
      amount,
      description,
      frequency,
      startDate: start,
      endDate: endDate ? new Date(endDate) : null,
      dayOfMonth,
      dayOfWeek,
      monthOfYear,
      nextDue,
      autoCreate: autoCreate || false,
      reminderDays: reminderDays || 3,
      isActive: true
    });
    
    await newPayment.save();
    await newPayment.populate('category');
    reply.status(201).send(newPayment);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const updateRecurringPayment = async (request, reply) => {
  try {
    const { id } = request.params;
    const updateData = { ...request.body };

    const payment = await RecurringPayment.findById(id);
    if (!payment) {
      return reply.status(404).send({ error: 'Recurring payment not found' });
    }

    // Recalculate nextDue if timing fields changed
    const timingChanged = ['frequency', 'dayOfMonth', 'dayOfWeek', 'monthOfYear']
      .some(f => updateData[f] !== undefined && String(updateData[f]) !== String(payment[f]));

    if (timingChanged) {
      const frequency = updateData.frequency || payment.frequency;
      const dayOfMonth = updateData.dayOfMonth ?? payment.dayOfMonth;
      const dayOfWeek = updateData.dayOfWeek ?? payment.dayOfWeek;
      const monthOfYear = updateData.monthOfYear ?? payment.monthOfYear;
      const now = new Date();
      let nextDue;

      if (frequency === 'monthly' || frequency === 'quarterly') {
        nextDue = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
        if (nextDue <= now) {
          const step = frequency === 'quarterly' ? 3 : 1;
          nextDue.setMonth(nextDue.getMonth() + step);
        }
      } else if (frequency === 'weekly') {
        nextDue = new Date(now);
        const diff = (dayOfWeek - now.getDay() + 7) % 7 || 7;
        nextDue.setDate(now.getDate() + diff);
      } else if (frequency === 'yearly') {
        nextDue = new Date(now.getFullYear(), monthOfYear - 1, dayOfMonth);
        if (nextDue <= now) nextDue.setFullYear(nextDue.getFullYear() + 1);
      }

      if (nextDue) updateData.nextDue = nextDue;
    }

    const updatedPayment = await RecurringPayment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category');

    reply.send(updatedPayment);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const deleteRecurringPayment = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const payment = await RecurringPayment.findByIdAndDelete(id);
    
    if (!payment) {
      return reply.status(404).send({ error: 'Recurring payment not found' });
    }
    
    reply.send({ message: 'Recurring payment deleted successfully' });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const getUpcomingPayments = async (request, reply) => {
  try {
    const { startDate, endDate, days = 30, includeCalculatedAmounts = true } = request.query;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Use calculated amounts by default for better UX
    const shouldIncludeCalculatedAmounts = includeCalculatedAmounts === 'true' || includeCalculatedAmounts === true;

    let payments;
    if (shouldIncludeCalculatedAmounts) {
      payments = await RecurringPayment.getUpcomingWithCalculatedAmounts(start, end);
    } else {
      payments = await RecurringPayment.getUpcoming(start, end);
      // Convert to plain objects for consistent response format
      payments = payments.map(payment => payment.toObject());
    }

    reply.send(payments);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const getCalendarEvents = async (request, reply) => {
  try {
    const { year, month } = request.query;
    
    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()), 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    const payments = await RecurringPayment.getUpcoming(startDate, endDate);
    
    // Generate all occurrences for the month
    const events = [];
    payments.forEach(payment => {
      let currentDate = new Date(Math.max(payment.nextDue, startDate));
      
      while (currentDate <= endDate) {
        if (currentDate >= startDate && currentDate <= endDate) {
          events.push({
            id: payment._id,
            name: payment.name,
            amount: payment.amount,
            category: payment.category,
            date: new Date(currentDate),
            type: 'recurring-payment',
            daysUntil: Math.ceil((currentDate - new Date()) / (24 * 60 * 60 * 1000))
          });
        }
        
        // Calculate next occurrence
        const nextPayment = { ...payment.toObject(), nextDue: currentDate };
        currentDate = RecurringPayment.prototype.calculateNextDue.call(nextPayment);
        
        // Break if we're beyond the month or if payment has ended
        if (payment.endDate && currentDate > payment.endDate) break;
        if (currentDate.getMonth() !== startDate.getMonth()) break;
      }
    });
    
    reply.send(events.sort((a, b) => a.date - b.date));
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const markAsPaid = async (request, reply) => {
  try {
    const { id } = request.params;
    const { createExpense = true, assetId } = request.body || {};
    
    const payment = await RecurringPayment.findById(id).populate('category');
    if (!payment) {
      return reply.status(404).send({ error: 'Recurring payment not found' });
    }

    const Asset = require('../models/Asset');
    let assetObj = null;

    // Deduct from selected asset if provided
    if (assetId) {
      assetObj = await Asset.findById(assetId);
      if (assetObj) {
        assetObj.currentAmount = Math.max(0, (assetObj.currentAmount || 0) - payment.amount);
        await assetObj.save();
      }
    }
    
    // Create expense if requested
    if (createExpense) {
      const Category = require('../models/Category');
      let expCategory = payment.category?._id || payment.category;
      if (!expCategory) {
        const defaultCat = await Category.findOne({ isActive: true });
        expCategory = defaultCat?._id;
      }

      const expense = new Expense({
        category: expCategory,
        amount: payment.amount,
        description: `${payment.name} - Ödeme Yapıldı${assetObj ? ` (${assetObj.name})` : ''}`,
        date: payment.nextDue || new Date(),
        status: 'completed'
      });
      await expense.save();
    }

    // Decrement remaining installments if present
    if (payment.remainingInstallments !== undefined && payment.remainingInstallments > 0) {
      payment.remainingInstallments = Math.max(0, payment.remainingInstallments - 1);
      if (payment.remainingInstallments === 0) {
        payment.isActive = false;
      }
    }

    // Decrement total amount if present
    if (payment.totalAmount !== undefined && payment.totalAmount > 0) {
      payment.totalAmount = Math.max(0, payment.totalAmount - payment.amount);
      if (payment.totalAmount === 0) {
        payment.isActive = false;
      }
    }
    
    // Update payment with next due date
    payment.lastProcessed = payment.nextDue || new Date();
    if (payment.isActive) {
      payment.nextDue = payment.calculateNextDue();
    }
    await payment.save();
    
    reply.send({ 
      message: 'Payment marked as paid',
      nextDue: payment.nextDue,
      remainingInstallments: payment.remainingInstallments,
      totalAmount: payment.totalAmount,
      expenseCreated: createExpense,
      assetUpdated: assetObj ? assetObj.name : null
    });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const getPendingDuePayments = async (request, reply) => {
  try {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Get active recurring payments / bank loans
    const recurringPayments = await RecurringPayment.find({
      isActive: { $ne: false }
    }).populate('category');

    const formattedRecurring = recurringPayments
      .filter(p => {
        const dueDate = new Date(p.nextDue || p.startDate || new Date());
        return dueDate <= endOfToday;
      })
      .map(p => ({
        id: p._id,
        type: 'recurring',
        name: p.name,
        categoryName: p.category?.name || 'Ödeme',
        categoryColor: p.category?.color || '#3b82f6',
        amount: p.amount,
        dueDate: p.nextDue || p.startDate || new Date(),
        remainingInstallments: p.remainingInstallments,
        totalAmount: p.totalAmount,
        frequency: p.frequency
      }));

    // 2. Get active credit cards
    const CreditCard = require('../models/CreditCard');
    const Asset = require('../models/Asset');

    const creditCards = await CreditCard.find({
      isActive: { $ne: false }
    });
    const formattedCards = [];
    const now = new Date();

    creditCards.forEach(c => {
      const usedLimit = (c.totalLimit !== undefined && c.availableLimit !== undefined)
        ? Math.max(0, c.totalLimit - c.availableLimit)
        : 0;
      const debt = Math.max(c.currentBalance || 0, usedLimit, c.minimumPaymentAmount || 0);

      if (debt > 0) {
        let dueDate = c.nextPaymentDue;
        if (!dueDate) {
          dueDate = new Date(now.getFullYear(), now.getMonth(), c.paymentDueDay || 15);
        }
        const dueDateTime = new Date(dueDate);

        if (dueDateTime <= endOfToday) {
          const balance = c.currentBalance || debt || 0;
          let minAmount = c.minimumPaymentAmount;

          // If stored minimumPaymentAmount is invalid, zero, or equal/greater than full balance (100%), calculate BDDK rate
          if (!minAmount || minAmount <= 0 || minAmount >= balance * 0.95) {
            let rate = c.minimumPaymentRate;
            if (!rate || rate <= 0.05 || rate >= 0.99) {
              rate = (c.totalLimit && c.totalLimit >= 50000) ? 0.40 : 0.20;
            }
            minAmount = Math.round(balance * rate * 100) / 100;
          }

          formattedCards.push({
            id: c._id,
            type: 'creditCard',
            name: `${c.bankName} - ${c.name}`,
            categoryName: 'Kredi Kartı',
            categoryColor: '#ef4444',
            amount: balance,
            minimumPaymentAmount: minAmount,
            dueDate: dueDate,
            bankName: c.bankName
          });
        }
      }
    });

    // 3. Get all active liquid assets for dropdown
    const assets = await Asset.find({});

    reply.send({
      pendingPayments: [...formattedRecurring, ...formattedCards],
      assets
    });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const confirmDuePayment = async (request, reply) => {
  try {
    const { id, type, assetId, amount } = request.body || {};

    if (!id || !type) {
      return reply.status(400).send({ error: 'Missing payment id or type' });
    }

    const Asset = require('../models/Asset');
    const CreditCard = require('../models/CreditCard');

    let assetObj = null;
    if (assetId) {
      assetObj = await Asset.findById(assetId);
    }

    let processedAmount = Number(amount) || 0;

    if (type === 'recurring') {
      const payment = await RecurringPayment.findById(id).populate('category');
      if (!payment) {
        return reply.status(404).send({ error: 'Recurring payment not found' });
      }

      processedAmount = processedAmount || payment.amount;

      // 1. Deduct from selected asset balance
      if (assetObj) {
        assetObj.currentAmount = Math.max(0, (assetObj.currentAmount || 0) - processedAmount);
        await assetObj.save();
      }

      // 2. Create Expense record
      const Category = require('../models/Category');
      let expCategory = payment.category?._id || payment.category;
      if (!expCategory) {
        const defaultCat = await Category.findOne({ isActive: true });
        expCategory = defaultCat?._id;
      }

      const expense = new Expense({
        category: expCategory,
        amount: processedAmount,
        description: `${payment.name} - Ödendi${assetObj ? ` (${assetObj.name})` : ''}`,
        date: new Date(),
        status: 'completed'
      });
      await expense.save();

      // 3. Decrement remaining installments / total amount if present
      if (payment.remainingInstallments !== undefined && payment.remainingInstallments > 0) {
        payment.remainingInstallments = Math.max(0, payment.remainingInstallments - 1);
        if (payment.remainingInstallments === 0) {
          payment.isActive = false;
        }
      }
      if (payment.totalAmount !== undefined && payment.totalAmount > 0) {
        payment.totalAmount = Math.max(0, payment.totalAmount - processedAmount);
        if (payment.totalAmount === 0) {
          payment.isActive = false;
        }
      }

      payment.lastProcessed = new Date();
      if (payment.isActive) {
        payment.nextDue = payment.calculateNextDue();
      }
      await payment.save();

      return reply.send({
        message: 'Payment confirmed and asset updated successfully',
        payment,
        asset: assetObj
      });
    } else if (type === 'creditCard') {
      const card = await CreditCard.findById(id);
      if (!card) {
        return reply.status(404).send({ error: 'Credit card not found' });
      }

      processedAmount = processedAmount || card.currentBalance;

      // 1. Deduct from asset
      if (assetObj) {
        assetObj.currentAmount = Math.max(0, (assetObj.currentAmount || 0) - processedAmount);
        await assetObj.save();
      }

      // 2. Reduce card current balance / update available limit & update next payment due date
      card.currentBalance = Math.max(0, (card.currentBalance || 0) - processedAmount);
      if (card.availableLimit !== undefined && card.totalLimit !== undefined) {
        card.availableLimit = Math.min(card.totalLimit, card.availableLimit + processedAmount);
      }
      if (typeof card.calculateNextPaymentDue === 'function') {
        if (card.lastStatementDate && card.statementDay) {
          const lastSt = new Date(card.lastStatementDate);
          card.lastStatementDate = new Date(lastSt.getFullYear(), lastSt.getMonth() + 1, Math.min(card.statementDay, 28));
        }
        card.nextPaymentDue = card.calculateNextPaymentDue();
      }
      await card.save();

      // 3. Create Expense record
      const Category = require('../models/Category');
      let defaultCategory = await Category.findOne({ name: { $regex: /kredi kart/i } });
      if (!defaultCategory) {
        defaultCategory = await Category.findOne({ isActive: true });
      }

      const expense = new Expense({
        category: defaultCategory?._id,
        amount: processedAmount,
        description: `${card.bankName} - ${card.name} Kredi Kartı Ödemesi Yapıldı${assetObj ? ` (${assetObj.name})` : ''}`,
        date: new Date(),
        status: 'completed'
      });
      await expense.save();

      return reply.send({
        message: 'Credit card payment confirmed and asset updated successfully',
        card,
        asset: assetObj
      });
    }

    reply.status(400).send({ error: 'Invalid payment type' });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

module.exports = {
  getAllRecurringPayments,
  createRecurringPayment,
  updateRecurringPayment,
  deleteRecurringPayment,
  getUpcomingPayments,
  getCalendarEvents,
  markAsPaid,
  getPendingDuePayments,
  confirmDuePayment
};