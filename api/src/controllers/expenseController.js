const Expense = require('../models/Expense');

const getAllExpenses = async (request, reply) => {
  try {
    const expenses = await Expense.find().populate('category', 'name').sort({ date: -1 });
    reply.send(expenses);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const createExpense = async (request, reply) => {
  try {
    const { category, description, amount, date, status } = request.body;
    const newExpense = new Expense({
      category,
      description,
      amount,
      date: new Date(date),
      status,
    });

    await newExpense.save();
    await newExpense.populate('category', 'name');
    reply.status(201).send(newExpense);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const updateExpense = async (request, reply) => {
  try {
    const { id } = request.params;
    const { category, description, amount, date, status } = request.body;

    const expense = await Expense.findByIdAndUpdate(
      id,
      { category, description, amount, date: new Date(date), status },
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!expense) {
      return reply.status(404).send({ error: 'Expense not found' });
    }

    reply.send(expense);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const deleteExpense = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const expense = await Expense.findByIdAndDelete(id);
    
    if (!expense) {
      return reply.status(404).send({ error: 'Expense not found' });
    }
    
    reply.send({ message: 'Expense deleted successfully' });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

const getExpensesByCategory = async (request, reply) => {
  try {
    const expensesByCategory = await Expense.aggregate([
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          category: '$_id',
          totalAmount: 1,
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    reply.send(expensesByCategory);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

module.exports = {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByCategory,
};
