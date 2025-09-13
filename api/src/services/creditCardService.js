const CreditCard = require('../models/CreditCard');
const CreditCardInstallment = require('../models/CreditCardInstallment');

class CreditCardService {
  // Calculate compound interest for installments
  static calculateCompoundInterest(principal, monthlyRate, months) {
    if (monthlyRate === 0) return principal;
    
    const compoundAmount = principal * Math.pow(1 + monthlyRate, months);
    return compoundAmount - principal;
  }

  // Calculate equal monthly installment (EMI)
  static calculateEMI(principal, monthlyRate, months) {
    if (monthlyRate === 0) return principal / months;
    
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / 
                (Math.pow(1 + monthlyRate, months) - 1);
    
    return Math.round(emi * 100) / 100;
  }

  // Calculate installment with different payment types
  static calculateInstallmentDetails(options) {
    const {
      originalAmount,
      totalInstallments,
      interestRate = 0,
      installmentType = 'equal',
      isPromotional = false,
      promotionalPeriod = 0,
      promotionalRate = 0
    } = options;

    let result = {
      originalAmount,
      totalInstallments,
      interestRate,
      totalInterest: 0,
      totalAmountWithInterest: originalAmount,
      installmentAmount: 0,
      schedule: []
    };

    // Apply promotional rate if applicable
    const effectiveRate = isPromotional && promotionalPeriod > 0 ? promotionalRate : interestRate;
    
    switch (installmentType) {
      case 'equal':
        result = this.calculateEqualInstallments(originalAmount, totalInstallments, effectiveRate);
        break;
      case 'balloon':
        result = this.calculateBalloonInstallments(originalAmount, totalInstallments, effectiveRate);
        break;
      case 'interest_first':
        result = this.calculateInterestFirstInstallments(originalAmount, totalInstallments, effectiveRate);
        break;
      case 'principal_first':
        result = this.calculatePrincipalFirstInstallments(originalAmount, totalInstallments, effectiveRate);
        break;
      default:
        result = this.calculateEqualInstallments(originalAmount, totalInstallments, effectiveRate);
    }

    // Apply promotional adjustments
    if (isPromotional && promotionalPeriod > 0 && promotionalPeriod < totalInstallments) {
      result = this.applyPromotionalTerms(result, interestRate, promotionalPeriod);
    }

    return result;
  }

  // Calculate equal installments (most common)
  static calculateEqualInstallments(principal, months, monthlyRate) {
    const installmentAmount = this.calculateEMI(principal, monthlyRate, months);
    const totalAmountWithInterest = installmentAmount * months;
    const totalInterest = totalAmountWithInterest - principal;

    let remainingBalance = principal;
    const schedule = [];

    for (let i = 1; i <= months; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = installmentAmount - interestPayment;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);

      schedule.push({
        installmentNumber: i,
        installmentAmount: Math.round(installmentAmount * 100) / 100,
        principalAmount: Math.round(principalPayment * 100) / 100,
        interestAmount: Math.round(interestPayment * 100) / 100,
        remainingBalance: Math.round(remainingBalance * 100) / 100
      });
    }

    return {
      originalAmount: principal,
      totalInstallments: months,
      interestRate: monthlyRate,
      installmentAmount: Math.round(installmentAmount * 100) / 100,
      totalAmountWithInterest: Math.round(totalAmountWithInterest * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      schedule
    };
  }

  // Calculate balloon payment installments (smaller payments + large final payment)
  static calculateBalloonInstallments(principal, months, monthlyRate, balloonPercentage = 0.3) {
    const balloonAmount = principal * balloonPercentage;
    const remainingPrincipal = principal - balloonAmount;
    const regularInstallment = this.calculateEMI(remainingPrincipal, monthlyRate, months - 1);
    
    let remainingBalance = principal;
    const schedule = [];

    // Regular payments
    for (let i = 1; i < months; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = regularInstallment - interestPayment;
      remainingBalance -= principalPayment;

      schedule.push({
        installmentNumber: i,
        installmentAmount: Math.round(regularInstallment * 100) / 100,
        principalAmount: Math.round(principalPayment * 100) / 100,
        interestAmount: Math.round(interestPayment * 100) / 100,
        remainingBalance: Math.round(remainingBalance * 100) / 100
      });
    }

    // Balloon payment
    const finalInterest = remainingBalance * monthlyRate;
    const finalPayment = remainingBalance + finalInterest;

    schedule.push({
      installmentNumber: months,
      installmentAmount: Math.round(finalPayment * 100) / 100,
      principalAmount: Math.round(remainingBalance * 100) / 100,
      interestAmount: Math.round(finalInterest * 100) / 100,
      remainingBalance: 0,
      isBalloonPayment: true
    });

    const totalAmount = (regularInstallment * (months - 1)) + finalPayment;
    const totalInterest = totalAmount - principal;

    return {
      originalAmount: principal,
      totalInstallments: months,
      interestRate: monthlyRate,
      installmentAmount: Math.round(regularInstallment * 100) / 100,
      balloonAmount: Math.round(finalPayment * 100) / 100,
      totalAmountWithInterest: Math.round(totalAmount * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      schedule
    };
  }

  // Calculate interest-first installments (pay interest first, then principal)
  static calculateInterestFirstInstallments(principal, months, monthlyRate) {
    const totalInterest = principal * monthlyRate * months;
    const interestPerMonth = totalInterest / months;
    const schedule = [];
    
    let remainingPrincipal = principal;
    let remainingInterest = totalInterest;

    for (let i = 1; i <= months; i++) {
      let interestPayment, principalPayment;

      if (remainingInterest > 0) {
        // Pay interest first
        interestPayment = Math.min(interestPerMonth, remainingInterest);
        principalPayment = 0;
        remainingInterest -= interestPayment;
      } else {
        // Then pay principal
        interestPayment = 0;
        principalPayment = remainingPrincipal / (months - i + 1);
        remainingPrincipal -= principalPayment;
      }

      schedule.push({
        installmentNumber: i,
        installmentAmount: Math.round((interestPayment + principalPayment) * 100) / 100,
        principalAmount: Math.round(principalPayment * 100) / 100,
        interestAmount: Math.round(interestPayment * 100) / 100,
        remainingBalance: Math.round(remainingPrincipal * 100) / 100
      });
    }

    const installmentAmount = (principal + totalInterest) / months;

    return {
      originalAmount: principal,
      totalInstallments: months,
      interestRate: monthlyRate,
      installmentAmount: Math.round(installmentAmount * 100) / 100,
      totalAmountWithInterest: Math.round((principal + totalInterest) * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      schedule
    };
  }

  // Calculate principal-first installments (pay principal first, then interest)
  static calculatePrincipalFirstInstallments(principal, months, monthlyRate) {
    const principalPerMonth = principal / months;
    const schedule = [];
    
    let remainingBalance = principal;

    for (let i = 1; i <= months; i++) {
      const principalPayment = principalPerMonth;
      const interestPayment = remainingBalance * monthlyRate;
      remainingBalance -= principalPayment;

      schedule.push({
        installmentNumber: i,
        installmentAmount: Math.round((principalPayment + interestPayment) * 100) / 100,
        principalAmount: Math.round(principalPayment * 100) / 100,
        interestAmount: Math.round(interestPayment * 100) / 100,
        remainingBalance: Math.round(remainingBalance * 100) / 100
      });
    }

    const totalInterest = schedule.reduce((sum, payment) => sum + payment.interestAmount, 0);
    const totalAmount = principal + totalInterest;
    const avgInstallment = totalAmount / months;

    return {
      originalAmount: principal,
      totalInstallments: months,
      interestRate: monthlyRate,
      installmentAmount: Math.round(avgInstallment * 100) / 100,
      totalAmountWithInterest: Math.round(totalAmount * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      schedule
    };
  }

  // Apply promotional terms to existing calculation
  static applyPromotionalTerms(baseCalculation, regularRate, promotionalPeriod) {
    const { schedule } = baseCalculation;
    const newSchedule = [...schedule];

    // Recalculate interest for remaining periods after promotional period
    for (let i = promotionalPeriod; i < newSchedule.length; i++) {
      const payment = newSchedule[i];
      const newInterest = payment.remainingBalance * regularRate;
      const principalPayment = payment.installmentAmount - newInterest;

      newSchedule[i] = {
        ...payment,
        interestAmount: Math.round(newInterest * 100) / 100,
        principalAmount: Math.round(principalPayment * 100) / 100
      };
    }

    const totalInterest = newSchedule.reduce((sum, payment) => sum + payment.interestAmount, 0);

    return {
      ...baseCalculation,
      schedule: newSchedule,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalAmountWithInterest: Math.round((baseCalculation.originalAmount + totalInterest) * 100) / 100
    };
  }

  // Calculate credit card utilization analytics
  static async calculateUtilizationAnalytics() {
    const cards = await CreditCard.find({ isActive: true });
    const installments = await CreditCardInstallment.find({ paymentStatus: 'active' })
      .populate('creditCard');

    const analytics = {
      totalCards: cards.length,
      totalLimit: 0,
      totalUsed: 0,
      totalAvailable: 0,
      totalDebt: 0,
      totalMonthlyPayments: 0,
      averageUtilization: 0,
      cardAnalytics: []
    };

    cards.forEach(card => {
      analytics.totalLimit += card.totalLimit;
      analytics.totalUsed += (card.totalLimit - card.availableLimit);
      analytics.totalAvailable += card.availableLimit;
      analytics.totalDebt += card.currentBalance;

      const cardInstallments = installments.filter(
        inst => inst.creditCard._id.toString() === card._id.toString()
      );
      
      const monthlyPayment = cardInstallments.reduce(
        (sum, inst) => sum + inst.installmentAmount, 0
      );

      analytics.totalMonthlyPayments += monthlyPayment;
      analytics.cardAnalytics.push({
        cardId: card._id,
        cardName: card.name,
        bankName: card.bankName,
        utilization: card.utilizationRate,
        monthlyPayment,
        activeInstallments: cardInstallments.length
      });
    });

    analytics.averageUtilization = analytics.totalLimit > 0 ? 
      (analytics.totalUsed / analytics.totalLimit * 100).toFixed(2) : 0;

    return analytics;
  }

  // Generate payment forecast
  static async generatePaymentForecast(months = 12) {
    const activeInstallments = await CreditCardInstallment.find({ paymentStatus: 'active' })
      .populate('creditCard', 'name bankName paymentDueDay');

    const forecast = [];
    const today = new Date();

    for (let month = 0; month < months; month++) {
      const forecastDate = new Date(today.getFullYear(), today.getMonth() + month, 1);
      const monthlyPayments = [];
      let totalAmount = 0;

      activeInstallments.forEach(installment => {
        if (installment.remainingInstallments > month) {
          const paymentDate = new Date(
            forecastDate.getFullYear(), 
            forecastDate.getMonth(), 
            installment.creditCard.paymentDueDay
          );

          monthlyPayments.push({
            installmentId: installment._id,
            purchaseDescription: installment.purchaseDescription,
            creditCard: installment.creditCard,
            amount: installment.installmentAmount,
            paymentDate,
            installmentNumber: installment.completedInstallments + month + 1,
            remainingAfterThis: installment.remainingInstallments - month - 1
          });

          totalAmount += installment.installmentAmount;
        }
      });

      forecast.push({
        month: forecastDate,
        totalAmount: Math.round(totalAmount * 100) / 100,
        paymentCount: monthlyPayments.length,
        payments: monthlyPayments.sort((a, b) => a.paymentDate - b.paymentDate)
      });
    }

    return forecast;
  }

  // Calculate debt-to-income ratio impact
  static calculateDebtImpact(monthlyIncome, creditCardPayments) {
    const debtToIncomeRatio = monthlyIncome > 0 ? 
      (creditCardPayments / monthlyIncome * 100).toFixed(2) : 0;

    let riskLevel = 'low';
    if (debtToIncomeRatio > 30) riskLevel = 'high';
    else if (debtToIncomeRatio > 20) riskLevel = 'medium';

    return {
      monthlyIncome,
      creditCardPayments,
      debtToIncomeRatio: parseFloat(debtToIncomeRatio),
      riskLevel,
      recommendedMaxPayment: monthlyIncome * 0.2, // 20% of income
      availableCapacity: Math.max(0, (monthlyIncome * 0.2) - creditCardPayments)
    };
  }

  // Optimize payment strategy
  static optimizePaymentStrategy(cards, extraPaymentAmount = 0) {
    if (extraPaymentAmount <= 0) return null;

    // Sort cards by interest rate (highest first) - avalanche method
    const sortedCards = cards
      .filter(card => card.currentBalance > 0)
      .sort((a, b) => b.interestRate.monthly - a.interestRate.monthly);

    const strategy = {
      method: 'avalanche',
      totalExtraPayment: extraPaymentAmount,
      recommendations: []
    };

    let remainingExtra = extraPaymentAmount;

    sortedCards.forEach(card => {
      if (remainingExtra > 0) {
        const allocation = Math.min(remainingExtra, card.currentBalance);
        
        strategy.recommendations.push({
          cardId: card._id,
          cardName: card.name,
          bankName: card.bankName,
          currentBalance: card.currentBalance,
          interestRate: card.interestRate.monthly,
          recommendedExtraPayment: allocation,
          reason: 'Highest interest rate priority'
        });

        remainingExtra -= allocation;
      }
    });

    return strategy;
  }
}

module.exports = CreditCardService;