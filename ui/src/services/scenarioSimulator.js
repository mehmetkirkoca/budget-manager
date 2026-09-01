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
  if (mode === 'ignore') return { total: 0, items: [] };

  const items = [];
  let total = 0;

  payments.forEach(payment => {
    if (payment.isActive === false) return;

    const startsOn = payment.startDate;
    const endsOn = payment.endDate;

    if (startsOn) {
      const start = new Date(startsOn);
      const startYear = start.getFullYear();
      const startMonth = start.getMonth();
      const currentYear = monthDate.getFullYear();
      const currentMonth = monthDate.getMonth();
      if ((currentYear - startYear) * 12 + (currentMonth - startMonth) < 0) {
        return;
      }
    }

    if (endsOn) {
      const end = new Date(endsOn);
      if (end < monthDate) {
        return;
      }
    }

    const rawAmount = toNumber(payment.amountInfo?.effectiveAmount || payment.calculatedAmount || payment.amount);
    let itemAmount = 0;

    if (mode === 'monthlyEquivalent') {
      itemAmount = flatAverages && flatAverages[payment._id] !== undefined
        ? flatAverages[payment._id]
        : getMonthlyEquivalentForPayment(payment, rawAmount);
    } else {
      // mode === 'dueMonth'
      if (payment.frequency === 'weekly') {
        itemAmount = rawAmount * 4.33;
      } else {
        const isDue = isPaymentDueInMonth(payment, monthDate);
        itemAmount = isDue ? rawAmount : 0;
      }
    }

    if (itemAmount > 0) {
      total += itemAmount;
      items.push({
        id: payment._id,
        name: payment.name,
        categoryName: payment.category?.name || '',
        amount: itemAmount,
        frequency: payment.frequency,
      });
    }
  });

  return { total, items };
};

const projectInstallments = (installments, monthDate) =>
  installments.reduce((sum, installment) => {
    if (installment.paymentStatus && installment.paymentStatus !== 'active') return sum;
    const dateRaw = installment.nextPaymentDate || installment.firstPaymentDate;
    if (!dateRaw || !installment.remainingInstallments) return sum;

    let parsedDate;
    if (typeof dateRaw === 'string') {
      const datePart = dateRaw.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      if (year && month) {
        parsedDate = new Date(year, month - 1, day || 1);
      } else {
        parsedDate = new Date(dateRaw);
      }
    } else {
      parsedDate = new Date(dateRaw);
    }

    const firstPayment = startOfMonth(parsedDate);
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

export const normalizeLoans = (settings = {}) => {
  if (Array.isArray(settings?.loans)) {
    return settings.loans;
  }
  if (settings?.loan && typeof settings.loan === 'object' && settings.loan.enabled) {
    return [{
      id: 'legacy-loan',
      name: 'Kredi Senaryosu',
      enabled: settings.loan.enabled !== false,
      amount: toNumber(settings.loan.amount),
      termMonths: toNumber(settings.loan.termMonths) || 12,
      monthlyRate: toNumber(settings.loan.monthlyRate) || 0.0389,
      startMonth: settings.loan.startMonth || settings.startMonth,
    }];
  }
  return [];
};

export const loansEffectForMonth = (loans = [], monthDate) => {
  let totalInflow = 0;
  let totalPayment = 0;
  const breakdown = [];

  (loans || []).forEach(loan => {
    if (loan.enabled === false) return;
    const start = loan.startMonth ? new Date(`${loan.startMonth}-01T00:00:00`) : monthDate;
    const term = Math.max(1, Math.round(toNumber(loan.termMonths) || 12));
    const payment = monthlyLoanPayment(loan.amount, loan.monthlyRate, term);

    if (monthDate < start) return;
    const monthsSinceStart = (monthDate.getFullYear() - start.getFullYear()) * 12 + monthDate.getMonth() - start.getMonth();
    
    const inflow = monthsSinceStart === 0 ? toNumber(loan.amount) : 0;
    const isPaying = monthsSinceStart >= 0 && monthsSinceStart < term;
    const currentPayment = isPaying ? payment : 0;

    totalInflow += inflow;
    totalPayment += currentPayment;

    if (inflow > 0 || currentPayment > 0) {
      breakdown.push({
        id: loan.id,
        name: loan.name || 'Kredi',
        inflow,
        payment: currentPayment,
        monthIndex: monthsSinceStart + 1,
        term,
      });
    }
  });

  return {
    inflow: totalInflow,
    payment: totalPayment,
    breakdown,
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

  const loans = normalizeLoans(settings);
  const startMonthStr = monthKey(startDate);
  
  // Initial cash: add principal of loans starting in startMonth (index 0)
  const initialLoansAmount = loans
    .filter(l => l.enabled !== false && (l.startMonth ? l.startMonth === startMonthStr : true))
    .reduce((sum, l) => sum + toNumber(l.amount), 0);

  const startingCash = initialCash + initialLoansAmount;
  let cash = startingCash;
  const rows = [];

  const mode = settings.recurringPaymentsMode || 'monthlyEquivalent';
  const flatAverages = {};
  if (mode === 'monthlyEquivalent') {
    recurringPayments.forEach(payment => {
      flatAverages[payment._id] = calculateFlatAverage(payment, settings);
    });
  }

  // Calculate weighted monthly contractual interest rate from cards or use TCMB default (4.25%)
  const totalCardBalanceForRate = creditCards.reduce((sum, c) => sum + toNumber(c.currentBalance), 0);
  const averageMonthlyCardRate = totalCardBalanceForRate > 0
    ? creditCards.reduce((sum, c) => sum + (toNumber(c.currentBalance) * (toNumber(c.interestRate?.monthly) || 0.0425)), 0) / totalCardBalanceForRate
    : (creditCards.map(c => toNumber(c.interestRate?.monthly)).find(r => r > 0) || 0.0425);

  // Track individual card balances per card
  const cardStates = creditCards.map(c => ({
    id: c._id,
    name: c.name,
    bankName: c.bankName,
    balance: toNumber(c.currentBalance),
    rate: toNumber(c.interestRate?.monthly) || 0.0425,
    minRate: toNumber(c.minimumPaymentRate) || 0.03,
  }));

  for (let index = 0; index < horizonMonths; index += 1) {
    const date = addMonths(startDate, index);
    const income = projectIncomes(incomes, date);
    const recurringRes = projectRecurringPayments(recurringPayments, date, settings, flatAverages);
    const recurring = typeof recurringRes === 'object' ? recurringRes.total : recurringRes;
    const recurringItems = typeof recurringRes === 'object' ? recurringRes.items : [];
    const installment = projectInstallments(installments, date);
    
    // Per-card credit card calculations
    const strategy = settings.creditCardStrategy || 'minimum';
    let creditCardPayment = 0;
    let statementBalance = 0;
    let cardInterest = 0;
    let cardRemaining = 0;
    const creditCardBreakdown = [];

    cardStates.forEach(card => {
      const cardStatement = card.balance;
      let cardPayment = 0;

      if (strategy !== 'none' && cardStatement > 0) {
        if (strategy === 'full') {
          cardPayment = cardStatement;
        } else if (strategy === 'fixed') {
          const fixedPerCard = toNumber(settings.fixedCreditCardPayment) / Math.max(1, cardStates.length);
          cardPayment = Math.min(fixedPerCard, cardStatement);
        } else {
          // strategy === 'minimum'
          const rateToUse = (settings.minimumPaymentRate && Number(settings.minimumPaymentRate) > 0)
            ? toNumber(settings.minimumPaymentRate)
            : card.minRate;
          cardPayment = cardStatement * rateToUse;
        }
      }

      const cardUnpaid = Math.max(0, cardStatement - cardPayment);
      let cardInterestAmt = 0;
      if (cardUnpaid > 0 && strategy !== 'full') {
        const effectiveRate = card.rate * 1.20;
        cardInterestAmt = cardUnpaid * effectiveRate;
      }

      card.balance = cardUnpaid + cardInterestAmt;

      creditCardPayment += cardPayment;
      statementBalance += cardStatement;
      cardInterest += cardInterestAmt;
      cardRemaining += card.balance;

      creditCardBreakdown.push({
        id: card.id,
        name: card.name,
        bankName: card.bankName,
        statement: cardStatement,
        payment: cardPayment,
        interest: cardInterestAmt,
        remaining: card.balance,
      });
    });

    const planned = projectPlannedTransactions(plannedTransactions, date);
    const loanEffect = loansEffectForMonth(loans, date);
    // For loans starting in future months (index > 0), their inflow is added to that month's cash flow
    const futureLoanInflow = index > 0 ? loanEffect.inflow : 0;
    const net = income + planned + futureLoanInflow - recurring - creditCardPayment - loanEffect.payment;
    cash += net;

    rows.push({
      key: monthKey(date),
      date,
      income,
      recurring,
      recurringItems,
      installment,
      creditCard: creditCardPayment,
      creditCardStatement: statementBalance,
      creditCardInterest: cardInterest,
      creditCardRemaining: cardRemaining,
      creditCardBreakdown,
      planned,
      loanInflow: loanEffect.inflow,
      loanPayment: loanEffect.payment,
      loanBreakdown: loanEffect.breakdown,
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

export const summarizeLoans = (loans = []) => {
  const allLoans = Array.isArray(loans) ? loans : [];
  const activeLoans = allLoans.filter(l => l.enabled !== false && toNumber(l.amount) > 0);
  const loanDetails = allLoans.map(loan => {
    const summary = summarizeLoan(loan);
    return {
      id: loan.id,
      name: loan.name || 'Kredi',
      ...summary,
      startMonth: loan.startMonth,
      enabled: loan.enabled !== false,
    };
  });

  const activeLoanDetails = loanDetails.filter(l => l.enabled);
  const totalPrincipal = activeLoanDetails.reduce((s, l) => s + l.amount, 0);
  const totalMonthlyPayment = activeLoanDetails.reduce((s, l) => s + l.monthlyPayment, 0);
  const totalPayment = activeLoanDetails.reduce((s, l) => s + l.totalPayment, 0);
  const totalInterest = activeLoanDetails.reduce((s, l) => s + l.totalInterest, 0);

  return {
    count: activeLoans.length,
    totalPrincipal,
    totalMonthlyPayment,
    totalPayment,
    totalInterest,
    loanDetails,
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
    loans: [],
  };
};
