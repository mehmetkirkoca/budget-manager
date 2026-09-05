const Expense = require('../models/Expense');
const Asset = require('../models/Asset');
const Income = require('../models/Income');
const CreditCard = require('../models/CreditCard');
const RecurringPayment = require('../models/RecurringPayment');
const assetConversionService = require('../services/assetConversionService');

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

    // Get all assets and convert to TRY
    const allAssets = await Asset.find({});
    const assetConversions = await assetConversionService.convertAssetsToTRY(allAssets);

    const totalCurrentAssets = assetConversions.totalCurrentTRY;
    const totalTargetAssets = assetConversions.totalTargetTRY;

    // Get total credit card debts (used limit: totalLimit - availableLimit, or currentBalance if larger)
    const creditCards = await CreditCard.find({ isActive: true });
    const totalCreditCardDebt = creditCards.reduce((sum, card) => {
      const usedLimit = (card.totalLimit !== undefined && card.availableLimit !== undefined)
        ? Math.max(0, card.totalLimit - card.availableLimit)
        : 0;
      return sum + Math.max(card.currentBalance || 0, usedLimit);
    }, 0);
    const totalStatementBalance = creditCards.reduce((sum, card) => sum + (card.currentBalance || 0), 0);

    // Get total bank loan recurring payments (total overall remaining loan liabilities)
    const recurringPayments = await RecurringPayment.find({ isActive: true }).populate('category');
    const loanPayments = recurringPayments.filter(p => {
      const catName = (p.category?.name || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return (catName.includes('kredi') || name.includes('kredi')) && !catName.includes('kredi kartı') && !name.includes('kredi kartı');
    });
    
    const getLoanTotalDebt = p => {
      if (p.totalAmount && p.totalAmount > 0) return p.totalAmount;
      if (p.remainingInstallments !== undefined && p.remainingInstallments > 0) {
        return (p.amount || 0) * p.remainingInstallments;
      }
      if (p.endDate) {
        const now = new Date();
        const end = new Date(p.endDate);
        const remainingMonths = Math.max(1, (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()));
        return (p.amount || 0) * remainingMonths;
      }
      return (p.amount || 0) * 12; // Fallback to 12 months if duration not set
    };
    const totalLoanDebt = loanPayments.reduce((sum, p) => sum + getLoanTotalDebt(p), 0);

    // Calculate monthly income from Income model
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
    const monthlyIncome = Math.round((oneTimeTotal + recurringTotal) * 100) / 100;
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    const summary = {
      totalBalance: totalCurrentAssets - totalCreditCardDebt - totalLoanDebt,
      monthlyIncome,
      monthlyExpenses,
      savingsRate: Math.max(0, savingsRate),
      totalExpenses,
      totalAssets: totalCurrentAssets,
      totalTargetAssets,
      totalCreditCardDebt,
      totalStatementBalance,
      totalLoanDebt,
      netWorth: totalCurrentAssets - totalCreditCardDebt - totalLoanDebt - totalExpenses,
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
