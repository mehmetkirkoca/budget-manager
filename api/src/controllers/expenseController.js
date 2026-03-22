const Expense = require('../models/Expense');

const getAllExpenses = async (request, reply) => {
  try {
    const { page = 1, limit = 25, status, startDate, endDate } = request.query;
    const query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate)   query.date.$lte = new Date(endDate);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [expenses, total] = await Promise.all([
      Expense.find(query).populate('category', 'name').sort({ date: 1 }).skip(skip).limit(parseInt(limit)),
      Expense.countDocuments(query)
    ]);
    reply.send({
      expenses,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
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
    const { month } = request.query; // format: YYYY-MM
    const matchStage = {};
    if (month) {
      const [year, mon] = month.split('-').map(Number);
      matchStage.date = {
        $gte: new Date(year, mon - 1, 1),
        $lt: new Date(year, mon, 1)
      };
    }

    const pipeline = [
      ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
      { $group: { _id: '$category', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      { $project: { category: { _id: '$_id', name: { $ifNull: ['$categoryInfo.name', 'Unknown'] }, color: { $ifNull: ['$categoryInfo.color', '#8884d8'] } }, totalAmount: 1, count: 1, _id: 0 } },
      { $sort: { totalAmount: -1 } }
    ];

    const expensesByCategory = await Expense.aggregate(pipeline);
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
