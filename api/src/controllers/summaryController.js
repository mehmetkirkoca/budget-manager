const Expense = require('../models/Expense');
const Asset = require('../models/Asset');

const getSummary = async (request, reply) => {
  try {
    // Get total expenses
    const expensesResult = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalExpenses = expensesResult.length > 0 ? expensesResult[0].total : 0;

    // Get monthly expenses (current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthlyExpensesResult = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: currentMonth,
            $lt: nextMonth
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyExpenses = monthlyExpensesResult.length > 0 ? monthlyExpensesResult[0].total : 0;

    // Get asset totals
    const assetsResult = await Asset.aggregate([
      {
        $group: {
          _id: null,
          totalCurrent: { $sum: '$currentAmount' },
          totalTarget: { $sum: '$targetAmount' }
        }
      }
    ]);
    
    const totalCurrentAssets = assetsResult.length > 0 ? assetsResult[0].totalCurrent : 0;
    const totalTargetAssets = assetsResult.length > 0 ? assetsResult[0].totalTarget : 0;

    // Calculate savings rate (assuming some monthly income)
    const monthlyIncome = 5000; // This should come from user settings or income tracking
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    const summary = {
      totalBalance: totalCurrentAssets - totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      savingsRate: Math.max(0, savingsRate),
      totalExpenses,
      totalAssets: totalCurrentAssets,
      totalTargetAssets,
      remainingToTarget: Math.max(0, totalTargetAssets - totalCurrentAssets),
    };

    reply.send(summary);
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
};

module.exports = {
  getSummary,
};
