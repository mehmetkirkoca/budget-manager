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
    
    // Recalculate nextDue if frequency or timing fields changed
    const payment = await RecurringPayment.findById(id);
    if (!payment) {
      return reply.status(404).send({ error: 'Recurring payment not found' });
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
    const { createExpense = false } = request.body;
    
    const payment = await RecurringPayment.findById(id).populate('category');
    if (!payment) {
      return reply.status(404).send({ error: 'Recurring payment not found' });
    }
    
    // Create expense if requested
    if (createExpense) {
      const expense = new Expense({
        category: payment.category._id,
        amount: payment.amount,
        description: `${payment.name} - Recurring payment`,
        date: payment.nextDue,
        status: 'Gerçekleşti'
      });
      await expense.save();
    }
    
    // Update payment with next due date
    payment.lastProcessed = payment.nextDue;
    payment.nextDue = payment.calculateNextDue();
    await payment.save();
    
    reply.send({ 
      message: 'Payment marked as paid',
      nextDue: payment.nextDue,
      expenseCreated: createExpense
    });
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
};