const Income = require('../models/Income');

const getAllIncomes = async (request, reply) => {
  try {
    const incomes = await Income.find({ isActive: true }).sort({ createdAt: -1 });
    reply.send(incomes);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const createIncome = async (request, reply) => {
  try {
    const { source, amount, description, date, isRecurring, frequency } = request.body;
    const newIncome = new Income({
      source,
      amount,
      description,
      date: date || new Date(),
      isRecurring: isRecurring || false,
      frequency: frequency || 'monthly',
      isActive: true
    });
    
    await newIncome.save();
    reply.status(201).send(newIncome);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const updateIncome = async (request, reply) => {
  try {
    const { id } = request.params;
    const { source, amount, description, date, isRecurring, frequency, isActive } = request.body;
    
    const income = await Income.findByIdAndUpdate(
      id,
      { source, amount, description, date, isRecurring, frequency, isActive },
      { new: true, runValidators: true }
    );
    
    if (!income) {
      return reply.status(404).send({ error: 'Income not found' });
    }
    
    reply.send(income);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const deleteIncome = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const income = await Income.findByIdAndDelete(id);
    
    if (!income) {
      return reply.status(404).send({ error: 'Income not found' });
    }
    
    reply.send({ message: 'Income deleted successfully' });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const getMonthlyIncomeTotal = async (request, reply) => {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Get one-time incomes for current month
    const monthlyOneTimeResult = await Income.aggregate([
      {
        $match: {
          isActive: true,
          isRecurring: false,
          date: {
            $gte: currentMonth,
            $lt: nextMonth
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get recurring incomes (calculate monthly equivalent)
    const recurringIncomes = await Income.find({ 
      isActive: true, 
      isRecurring: true 
    });

    let recurringTotal = 0;
    recurringIncomes.forEach(income => {
      switch(income.frequency) {
        case 'weekly':
          recurringTotal += income.amount * 4.33; // Average weeks per month
          break;
        case 'monthly':
          recurringTotal += income.amount;
          break;
        case 'yearly':
          recurringTotal += income.amount / 12;
          break;
        default:
          recurringTotal += income.amount; // Default to monthly
      }
    });

    const oneTimeTotal = monthlyOneTimeResult.length > 0 ? monthlyOneTimeResult[0].total : 0;
    const totalMonthlyIncome = oneTimeTotal + recurringTotal;

    reply.send({
      oneTimeIncome: oneTimeTotal,
      recurringIncome: recurringTotal,
      totalMonthlyIncome: Math.round(totalMonthlyIncome * 100) / 100 // Round to 2 decimals
    });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

module.exports = {
  getAllIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
  getMonthlyIncomeTotal,
};