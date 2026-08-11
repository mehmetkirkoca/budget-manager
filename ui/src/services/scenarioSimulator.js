const toNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const startOfMonth = date => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const monthKey = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const isSameMonth = (left, right) =>
  left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();

const isWithinMonth = (dateValue, monthDate) => {
  if (!dateValue) return false;
  return isSameMonth(new Date(dateValue), monthDate);
};

const monthlyEquivalent = item => {
  const amount = toNumber(item.amount);
  switch (item.frequency) {
    case 'weekly':
      return amount * 4.33;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
    case 'monthly':
    default:
      return amount;
  }
};

const occursInMonth = (item, monthDate, dateField = 'date') => {
  const startsOn = item.startDate || item[dateField] || item.nextDue;
  const endsOn = item.endDate;
  if (startsOn && new Date(startsOn) > addMonths(monthDate, 1)) return false;
  if (endsOn && new Date(endsOn) < monthDate) return false;
  return true;
};

const projectIncomes = (incomes, monthDate) =>
  incomes.reduce((sum, income) => {
    if (income.isActive === false) return sum;
    if (income.isRecurring) {
      return occursInMonth(income, monthDate) ? sum + monthlyEquivalent(income) : sum;
    }
    return isWithinMonth(income.date, monthDate) ? sum + toNumber(income.amount) : sum;
  }, 0);

const getMonthlyEquivalentForPayment = (payment, amount) => {
  switch (payment.frequency) {
    case 'weekly':
      return amount * 4.33;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
    case 'monthly':
    default:
      return amount;
  }
};

const isPaymentDueInMonth = (payment, monthDate) => {
  const startsOn = payment.startDate || payment.nextDue || payment.date;
  if (!startsOn) return true;

  const start = new Date(startsOn);
  const startYear = start.getFullYear();
  const startMonth = start.getMonth();

  const currentYear = monthDate.getFullYear();
  const currentMonth = monthDate.getMonth();

  const diffMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth);

  if (diffMonths < 0) return false;

  switch (payment.frequency) {
    case 'weekly':
      return true;
    case 'monthly':
      return true;
    case 'quarterly':
      return diffMonths % 3 === 0;
    case 'yearly':
      return diffMonths % 12 === 0;
    default:
      return true;
  }
};

export const calculateFlatAverage = (payment, settings = {}) => {
  const startDate = settings.startMonth
    ? new Date(`${settings.startMonth}-01T00:00:00`)
    : startOfMonth(new Date());
  const horizonMonths = Math.max(1, Math.round(toNumber(settings.horizonMonths) || 12));

  let totalAmountPaid = 0;
  const amount = toNumber(payment.amountInfo?.effectiveAmount || payment.calculatedAmount || payment.amount);

  for (let i = 0; i < horizonMonths; i++) {
    const monthDate = addMonths(startDate, i);
    const startsOn = payment.startDate;
    const endsOn = payment.endDate;

    if (startsOn) {
      const start = new Date(startsOn);
      const startYear = start.getFullYear();
      const startMonth = start.getMonth();
      const currentYear = monthDate.getFullYear();
      const currentMonth = monthDate.getMonth();
      if ((currentYear - startYear) * 12 + (currentMonth - startMonth) < 0) {
        continue;
      }
    }

    if (endsOn) {
      const end = new Date(endsOn);
      if (end < monthDate) {
        continue;
      }
    }

    if (payment.frequency === 'weekly') {
      totalAmountPaid += amount * 4.33;
    } else if (payment.frequency === 'monthly') {
      totalAmountPaid += amount;
    } else {
      if (isPaymentDueInMonth(payment, monthDate)) {
        totalAmountPaid += amount;
      }
    }
  }

  return totalAmountPaid / horizonMonths;
};

const projectRecurringPayments = (payments, monthDate, settings = {}, flatAverages = null) => {
  const mode = settings.recurringPaymentsMode || 'monthlyEquivalent';
  if (mode === 'ignore') return 0;

  if (mode === 'monthlyEquivalent' && flatAverages) {
    const total = payments.reduce((sum, payment) => {
      if (payment.isActive === false) return sum;
      return sum + (flatAverages[payment._id] || 0);
    }, 0);
    return total;
  }

  const total = payments.reduce((sum, payment) => {
    if (payment.isActive === false) return sum;

    const startsOn = payment.startDate;
    const endsOn = payment.endDate;

    if (startsOn) {
      const start = new Date(startsOn);
      const startYear = start.getFullYear();
      const startMonth = start.getMonth();
      const currentYear = monthDate.getFullYear();
      const currentMonth = monthDate.getMonth();
      if ((currentYear - startYear) * 12 + (currentMonth - startMonth) < 0) {
        return sum;
      }
    }

    if (endsOn) {
      const end = new Date(endsOn);
      if (end < monthDate) {
        return sum;
      }
    }

    const amount = toNumber(payment.amountInfo?.effectiveAmount || payment.calculatedAmount || payment.amount);

    if (mode === 'monthlyEquivalent') {
      return sum + getMonthlyEquivalentForPayment(payment, amount);
    } else {
      // mode === 'dueMonth'
      if (payment.frequency === 'weekly') {
        return sum + (amount * 4.33); // Weekly occurs every month, use its monthly equivalent
      }
      const isDue = isPaymentDueInMonth(payment, monthDate);
      return isDue ? sum + amount : sum;
    }
  }, 0);

  console.log(`[scenarioSimulator.js] projectRecurringPayments: Ay = ${monthDate.toISOString().substring(0, 7)}, Mod = ${mode}, Toplam = ${total}`);
  return total;
};

const projectInstallments = (installments, monthDate) =>
  installments.reduce((sum, installment) => {
    if (installment.paymentStatus && installment.paymentStatus !== 'active') return sum;
    if (!installment.nextPaymentDate || !installment.remainingInstallments) return sum;

    const firstPayment = startOfMonth(new Date(installment.nextPaymentDate));
    for (let i = 0; i < toNumber(installment.remainingInstallments); i += 1) {
      if (isSameMonth(addMonths(firstPayment, i), monthDate)) {
        return sum + toNumber(installment.installmentAmount);
      }
    }
    return sum;
  }, 0);

const cardPaymentForMonth = (cards, settings, monthIndex) => {
  const strategy = settings.creditCardStrategy || 'minimum';
  if (strategy === 'none') return 0;

  const initialBalance = cards.reduce((sum, card) => sum + toNumber(card.currentBalance), 0);
  if (initialBalance <= 0) return 0;

  if (strategy === 'full') {
    return monthIndex === 0 ? initialBalance : 0;
  }

  if (strategy === 'fixed') {
    const fixed = toNumber(settings.fixedCreditCardPayment);
    const remainingBeforePayment = Math.max(0, initialBalance - fixed * monthIndex);
    return Math.min(fixed, remainingBeforePayment);
  }

  const minimumRate = toNumber(settings.minimumPaymentRate) || 0.03;
  const decayedBalance = initialBalance * Math.pow(Math.max(0, 1 - minimumRate), monthIndex);
  return Math.max(0, decayedBalance * minimumRate);
};

const projectPlannedTransactions = (transactions, monthDate) =>
  transactions.reduce((sum, transaction) => {
    if (!transaction.enabled) return sum;
    const amount = toNumber(transaction.amount);
    if (amount <= 0) return sum;

    if (transaction.repeats) {
      const start = transaction.startMonth ? new Date(`${transaction.startMonth}-01T00:00:00`) : monthDate;
      const end = transaction.endMonth ? new Date(`${transaction.endMonth}-01T00:00:00`) : null;
      if (monthDate < start || (end && monthDate > end)) return sum;
      return sum + (transaction.direction === 'income' ? amount : -amount);
    }

    if (transaction.month !== monthKey(monthDate)) return sum;
    return sum + (transaction.direction === 'income' ? amount : -amount);
  }, 0);

const monthlyLoanPayment = (principal, monthlyRate, termMonths) => {
  const amount = toNumber(principal);
  const baseRate = toNumber(monthlyRate);
  const term = Math.max(1, Math.round(toNumber(termMonths)));
  if (amount <= 0) return 0;
  if (baseRate <= 0) return amount / term;
  
  // Apply legal consumer loan taxes: 15% KKDF + 15% BSMV = 30% tax factor (rate * 1.30)
  const effectiveRate = baseRate * 1.30;
  const factor = Math.pow(1 + effectiveRate, term);
  return amount * effectiveRate * factor / (factor - 1);
};

const loanEffectForMonth = (loan, monthDate) => {
  if (!loan?.enabled) return { inflow: 0, payment: 0 };
  const start = loan.startMonth ? new Date(`${loan.startMonth}-01T00:00:00`) : monthDate;
  const term = Math.max(1, Math.round(toNumber(loan.termMonths)));
  const payment = monthlyLoanPayment(loan.amount, loan.monthlyRate, term);

  if (monthDate < start) return { inflow: 0, payment: 0 };
  const monthsSinceStart = (monthDate.getFullYear() - start.getFullYear()) * 12 + monthDate.getMonth() - start.getMonth();
  return {
    inflow: monthsSinceStart === 0 ? toNumber(loan.amount) : 0,
    payment: monthsSinceStart >= 0 && monthsSinceStart < term ? payment : 0,
  };
};

export const buildScenario = ({
  assets = [],
  incomes = [],
  recurringPayments = [],
  creditCards = [],
  installments = [],
  settings = {},
}) => {
  const startDate = settings.startMonth
    ? new Date(`${settings.startMonth}-01T00:00:00`)
    : startOfMonth(new Date());
  const horizonMonths = Math.max(1, Math.round(toNumber(settings.horizonMonths) || 12));
  const plannedTransactions = settings.plannedTransactions || [];
  const initialCash = settings.initialCashMode === 'manual'
    ? toNumber(settings.initialCash)
    : assets
      .filter(asset => settings.liquidAssetIds?.includes(asset._id))
      .reduce((sum, asset) => sum + toNumber(asset.currentValueTRY || asset.currentAmount), 0);

  const loanAmount = settings.loan && settings.loan.enabled !== false ? toNumber(settings.loan.amount) : 0;
  const startingCash = initialCash + loanAmount;
  let cash = startingCash;
  const rows = [];

  const mode = settings.recurringPaymentsMode || 'monthlyEquivalent';
  const flatAverages = {};
  if (mode === 'monthlyEquivalent') {
    recurringPayments.forEach(payment => {
      flatAverages[payment._id] = calculateFlatAverage(payment, settings);
    });
  }

  const initialCardBalance = creditCards.reduce((sum, card) => sum + toNumber(card.currentBalance), 0);
  let cardBalance = initialCardBalance;

  // Calculate weighted monthly contractual interest rate from cards or use TCMB default (4.25%)
  const totalCardBalanceForRate = creditCards.reduce((sum, c) => sum + toNumber(c.currentBalance), 0);
  const averageMonthlyCardRate = totalCardBalanceForRate > 0
    ? creditCards.reduce((sum, c) => sum + (toNumber(c.currentBalance) * (toNumber(c.interestRate?.monthly) || 0.0425)), 0) / totalCardBalanceForRate
    : (creditCards.map(c => toNumber(c.interestRate?.monthly)).find(r => r > 0) || 0.0425);

  for (let index = 0; index < horizonMonths; index += 1) {
    const date = addMonths(startDate, index);
    const income = projectIncomes(incomes, date);
    const recurring = projectRecurringPayments(recurringPayments, date, settings, flatAverages);
    const installment = projectInstallments(installments, date);
    
    // Credit card statement and payment calculations
    let creditCardPayment = 0;
    const statementBalance = cardBalance + installment;
    const strategy = settings.creditCardStrategy || 'minimum';

    if (strategy !== 'none' && statementBalance > 0) {
      if (strategy === 'full') {
        creditCardPayment = statementBalance;
      } else if (strategy === 'fixed') {
        const fixed = toNumber(settings.fixedCreditCardPayment);
        creditCardPayment = Math.min(fixed, statementBalance);
      } else {
        // strategy === 'minimum'
        const minimumRate = toNumber(settings.minimumPaymentRate) || 0.03;
        creditCardPayment = statementBalance * minimumRate;
      }
    }

    const unpaidBalance = Math.max(0, statementBalance - creditCardPayment);
    let cardInterest = 0;
    if (unpaidBalance > 0 && strategy !== 'full') {
      // Contractual interest + 15% KKDF + 5% BSMV = averageMonthlyCardRate * 1.20
      const effectiveRate = averageMonthlyCardRate * 1.20;
      cardInterest = unpaidBalance * effectiveRate;
    }

    cardBalance = unpaidBalance + cardInterest;

    const planned = projectPlannedTransactions(plannedTransactions, date);
    const loan = loanEffectForMonth(settings.loan, date);
    // Loan inflow is added directly to starting cash, so only subtract payments from monthly cash flow
    const net = income + planned - recurring - creditCardPayment - loan.payment;
    cash += net;

    rows.push({
      key: monthKey(date),
      date,
      income,
      recurring,
      installment,
      creditCard: creditCardPayment,
      creditCardStatement: statementBalance,
      creditCardInterest: cardInterest,
      creditCardRemaining: cardBalance,
      planned,
      loanInflow: 0,
      loanPayment: loan.payment,
      net,
      cash,
    });
  }

  const minCash = rows.reduce((min, row) => Math.min(min, row.cash), startingCash);
  const financingNeed = Math.max(0, -minCash);
  const endingCash = rows.length ? rows[rows.length - 1].cash : startingCash;
  const firstNegative = rows.find(row => row.cash < 0);
  const totalCardInterest = rows.reduce((sum, r) => sum + (r.creditCardInterest || 0), 0);

  return {
    rows,
    summary: {
      initialCash: startingCash,
      endingCash,
      minCash,
      financingNeed,
      firstNegativeMonth: firstNegative?.key || null,
      averageMonthlyCardRate,
      effectiveCardRate: averageMonthlyCardRate * 1.20,
      totalCardInterest,
      firstMonthInterest: rows[0]?.creditCardInterest || 0,
    },
  };
};

export const summarizeLoan = loan => {
  const term = Math.max(1, Math.round(toNumber(loan?.termMonths) || 12));
  const amount = toNumber(loan?.amount);
  const baseRate = toNumber(loan?.monthlyRate);
  const monthlyPayment = monthlyLoanPayment(amount, baseRate, term);
  const effectiveMonthlyRate = baseRate * 1.30;

  return {
    amount,
    termMonths: term,
    baseRate,
    effectiveMonthlyRate,
    monthlyPayment,
    totalPayment: monthlyPayment * term,
    totalInterest: monthlyPayment * term - amount,
  };
};

export const getDefaultScenarioSettings = ({ assets = [] } = {}) => {
  const today = startOfMonth(new Date());
  const liquidAssetIds = assets
    .filter(asset => ['currency', 'savings'].includes(asset.assetType) || asset.type === 'savings')
    .map(asset => asset._id);

  return {
    startMonth: monthKey(today),
    horizonMonths: 12,
    initialCashMode: 'assets',
    initialCash: 0,
    liquidAssetIds,
    creditCardStrategy: 'minimum',
    recurringPaymentsMode: 'monthlyEquivalent',
    minimumPaymentRate: 0.40,
    fixedCreditCardPayment: 0,
    plannedTransactions: [],
    loan: {
      enabled: false,
      amount: 0,
      termMonths: 12,
      monthlyRate: 0.03,
      startMonth: monthKey(today),
    },
  };
};
